// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Tuvyy — Cross-VM Hybrid DAO on QoreChain
/// @notice Proposals and votes live on EVM. Execution pays the EVM beneficiary
///         and, in the same atomic transaction, calls an allowlisted QoreChain
///         Native contract through the CrossVM bridge precompile (0x…0901).
///         Execute requires an ML-DSA-87 signature checked on-chain with
///         pqcVerify, so a leaked classical ECDSA key alone cannot release funds.
contract TuvyyGovernor {
    // ── QoreChain precompiles (diana testnet) ──────────────────────────────
    address public constant CROSSVM_BRIDGE = 0x0000000000000000000000000000000000000901;
    address public constant PQC_VERIFY = 0x0000000000000000000000000000000000000a01;
    address public constant PQC_KEY_STATUS = 0x0000000000000000000000000000000000000a02;
    uint8 public constant TARGET_QORECHAIN_NATIVE = 1;

    // Allowlisted WDT cw20 on qorechain-diana (bridge_allowed_targets).
    string public constant DEFAULT_NATIVE_TARGET =
        "qor14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s93uuqt";

    bytes32 public constant DOMAIN = keccak256("tuvyy-governor-v1");

    struct Proposal {
        address proposer;
        string description;
        address evmRecipient;
        string nativeBeneficiary; // qor1… CosmWasm bech32
        string nativeTarget; // allowlisted Native contract
        uint256 amount;
        uint256 yesVotes;
        uint256 noVotes;
        uint64 deadline;
        bool executed;
        bool canceled;
    }

    address public chair; // EVM address whose registered ML-DSA key must sign execute
    uint256 public votingPeriod; // seconds
    uint256 public quorum; // minimum yes votes
    uint256 public proposalCount;
    string public nativeTarget;

    mapping(address => bool) public isMember;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public nonces;

    event MemberJoined(address indexed member);
    event ProposalCreated(
        uint256 indexed id,
        address indexed proposer,
        address evmRecipient,
        string nativeBeneficiary,
        uint256 amount,
        uint64 deadline
    );
    event Voted(uint256 indexed id, address indexed voter, bool support);
    event Executed(uint256 indexed id, address indexed evmRecipient, uint256 amount, bytes nativeReply);
    event Canceled(uint256 indexed id);
    event NativeTargetUpdated(string target);
    event Funded(address indexed from, uint256 amount);

    error NotChair();
    error NotMember();
    error BadProposal();
    error AlreadyVoted();
    error VotingOpen();
    error VotingClosed();
    error NotPassed();
    error AlreadyExecuted();
    error CanceledProposal();
    error InsufficientTreasury();
    error CrossVmFailed();
    error CrossVmInactive();
    error BadPqc();
    error TransferFailed();

    modifier onlyChair() {
        if (msg.sender != chair) revert NotChair();
        _;
    }

    constructor(address chair_, uint256 votingPeriod_, uint256 quorum_) {
        require(chair_ != address(0), "chair");
        require(votingPeriod_ > 0, "period");
        chair = chair_;
        votingPeriod = votingPeriod_;
        quorum = quorum_;
        nativeTarget = DEFAULT_NATIVE_TARGET;
        isMember[chair_] = true;
        emit MemberJoined(chair_);
    }

    receive() external payable {
        emit Funded(msg.sender, msg.value);
    }

    function join() external {
        isMember[msg.sender] = true;
        emit MemberJoined(msg.sender);
    }

    function setNativeTarget(string calldata target) external onlyChair {
        nativeTarget = target;
        emit NativeTargetUpdated(target);
    }

    function setQuorum(uint256 quorum_) external onlyChair {
        quorum = quorum_;
    }

    function propose(
        string calldata description,
        address evmRecipient,
        string calldata nativeBeneficiary,
        uint256 amount
    ) external returns (uint256 id) {
        if (!isMember[msg.sender]) revert NotMember();
        if (evmRecipient == address(0) || amount == 0) revert BadProposal();
        if (bytes(nativeBeneficiary).length < 10) revert BadProposal();

        id = ++proposalCount;
        uint64 deadline = uint64(block.timestamp + votingPeriod);
        proposals[id] = Proposal({
            proposer: msg.sender,
            description: description,
            evmRecipient: evmRecipient,
            nativeBeneficiary: nativeBeneficiary,
            nativeTarget: nativeTarget,
            amount: amount,
            yesVotes: 0,
            noVotes: 0,
            deadline: deadline,
            executed: false,
            canceled: false
        });
        emit ProposalCreated(id, msg.sender, evmRecipient, nativeBeneficiary, amount, deadline);
    }

    function vote(uint256 id, bool support) external {
        if (!isMember[msg.sender]) revert NotMember();
        Proposal storage p = proposals[id];
        if (p.proposer == address(0)) revert BadProposal();
        if (p.canceled) revert CanceledProposal();
        if (p.executed) revert AlreadyExecuted();
        if (block.timestamp > p.deadline) revert VotingClosed();
        if (hasVoted[id][msg.sender]) revert AlreadyVoted();

        hasVoted[id][msg.sender] = true;
        if (support) p.yesVotes += 1;
        else p.noVotes += 1;
        emit Voted(id, msg.sender, support);
    }

    /// @notice Execute a passed proposal. Requires the chair's ML-DSA-87 signature
    ///         over the execution digest. Relayers may submit; msg.sender is not
    ///         used for authorisation. The CrossVM Native call and the EVM payout
    ///         are atomic: if either fails, both revert.
    function execute(uint256 id, bytes calldata mlDsaSignature) external {
        Proposal storage p = proposals[id];
        if (p.proposer == address(0)) revert BadProposal();
        if (p.canceled) revert CanceledProposal();
        if (p.executed) revert AlreadyExecuted();
        if (block.timestamp <= p.deadline) revert VotingOpen();
        if (p.yesVotes < quorum || p.yesVotes <= p.noVotes) revert NotPassed();
        if (address(this).balance < p.amount) revert InsufficientTreasury();

        bytes32 digest = executionDigest(id);
        _requireChairMlDsa(digest, mlDsaSignature);

        p.executed = true;

        // 1) Atomic Native leg — increase_allowance on allowlisted WDT cw20.
        //    Sender seen by Native is this contract's mapped qor1 address.
        bytes memory nativeMsg = bytes(
            string.concat(
                '{"increase_allowance":{"spender":"',
                p.nativeBeneficiary,
                '","amount":"',
                _uToString(p.amount),
                '"}}'
            )
        );
        bytes memory reply = _crossVmCall(p.nativeTarget, nativeMsg);

        // 2) EVM payout
        (bool ok, ) = p.evmRecipient.call{value: p.amount}("");
        if (!ok) revert TransferFailed();

        emit Executed(id, p.evmRecipient, p.amount, reply);
    }

    function cancel(uint256 id) external {
        Proposal storage p = proposals[id];
        if (p.proposer == address(0)) revert BadProposal();
        if (msg.sender != p.proposer && msg.sender != chair) revert NotChair();
        if (p.executed) revert AlreadyExecuted();
        p.canceled = true;
        emit Canceled(id);
    }

    function executionDigest(uint256 id) public view returns (bytes32) {
        Proposal storage p = proposals[id];
        return keccak256(
            abi.encode(
                DOMAIN,
                block.chainid,
                address(this),
                id,
                p.evmRecipient,
                keccak256(bytes(p.nativeBeneficiary)),
                keccak256(bytes(p.nativeTarget)),
                p.amount,
                nonces[chair]
            )
        );
    }

    function treasury() external view returns (uint256) {
        return address(this).balance;
    }

    // ── Internals ──────────────────────────────────────────────────────────

    function _requireChairMlDsa(bytes32 digest, bytes calldata signature) internal {
        // IQorePQC.pqcKeyStatus(address) → (bool registered, uint8 algorithmId, bytes pubkey)
        (bool statusOk, bytes memory statusRet) = PQC_KEY_STATUS.staticcall(
            abi.encodeWithSignature("pqcKeyStatus(address)", chair)
        );
        if (!statusOk || statusRet.length == 0) revert BadPqc();

        (bool registered, uint8 algorithmId, bytes memory pubkey) =
            abi.decode(statusRet, (bool, uint8, bytes));
        // ML-DSA-87 algorithm id on QoreChain is non-zero when registered.
        if (!registered || algorithmId == 0 || pubkey.length == 0) revert BadPqc();

        // IQorePQC.pqcVerify(bytes pubkey, bytes signature, bytes message) → bool
        bytes memory message = abi.encodePacked(digest);
        (bool verifyOk, bytes memory verifyRet) = PQC_VERIFY.staticcall(
            abi.encodeWithSignature("pqcVerify(bytes,bytes,bytes)", pubkey, signature, message)
        );
        if (!verifyOk || verifyRet.length == 0) revert BadPqc();
        bool valid = abi.decode(verifyRet, (bool));
        if (!valid) revert BadPqc();

        unchecked {
            nonces[chair] += 1;
        }
    }

    function _crossVmCall(string memory target, bytes memory executeMsg)
        internal
        returns (bytes memory)
    {
        bytes memory data = abi.encodeWithSignature(
            "executeCrossVMCall(uint8,string,bytes)",
            TARGET_QORECHAIN_NATIVE,
            target,
            executeMsg
        );
        (bool ok, bytes memory ret) = CROSSVM_BRIDGE.call(data);
        if (!ok) revert CrossVmFailed();
        // Inactive precompile returns success + empty data — treat as failure.
        if (ret.length == 0) revert CrossVmInactive();
        return ret;
    }

    function _uToString(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 temp = v;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (v != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(v % 10)));
            v /= 10;
        }
        return string(buffer);
    }
}
