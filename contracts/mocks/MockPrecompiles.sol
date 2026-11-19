// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @dev Local stand-ins for QoreChain precompiles used by Foundry tests.
contract MockPqcKeyStatus {
    mapping(address => bool) public registered;
    mapping(address => bytes) public pubkey;

    function set(address account, bool ok, bytes calldata key) external {
        registered[account] = ok;
        pubkey[account] = key;
    }

    fallback(bytes calldata data) external returns (bytes memory) {
        require(data.length >= 4 + 32, "calldata");
        // pqcKeyStatus(address) — selector + one padded address word.
        address account = address(uint160(uint256(bytes32(data[4:36]))));
        return abi.encode(registered[account], uint8(registered[account] ? 5 : 0), pubkey[account]);
    }
}

contract MockPqcVerify {
    bool public accept = true;

    function setAccept(bool v) external {
        accept = v;
    }

    fallback(bytes calldata) external returns (bytes memory) {
        return abi.encode(accept);
    }
}

contract MockCrossVmBridge {
    bool public fail;
    bool public emptyReply;
    bytes public lastPayload;
    string public lastTarget;

    function setFail(bool v) external {
        fail = v;
    }

    function setEmpty(bool v) external {
        emptyReply = v;
    }

    fallback(bytes calldata data) external returns (bytes memory) {
        if (fail) revert("bridge fail");
        // Decode executeCrossVMCall(uint8,string,bytes) after 4-byte selector.
        (, string memory target, bytes memory payload) =
            abi.decode(data[4:], (uint8, string, bytes));
        lastTarget = target;
        lastPayload = payload;
        if (emptyReply) return "";
        return bytes.concat(hex"01", payload);
    }
}
