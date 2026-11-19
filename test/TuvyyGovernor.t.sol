// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TuvyyGovernor} from "../contracts/TuvyyGovernor.sol";
import {
    MockPqcKeyStatus,
    MockPqcVerify,
    MockCrossVmBridge
} from "../contracts/mocks/MockPrecompiles.sol";

contract TuvyyGovernorTest is Test {
    address constant CROSSVM = 0x0000000000000000000000000000000000000901;
    address constant PQC_VERIFY = 0x0000000000000000000000000000000000000a01;
    address constant PQC_STATUS = 0x0000000000000000000000000000000000000a02;

    TuvyyGovernor dao;
    MockPqcKeyStatus status;
    MockPqcVerify verify;
    MockCrossVmBridge bridge;

    address chair = address(0xA11CE);
    address alice = address(0xB0B);
    address bob = address(0xC0DE);
    string constant NATIVE_BENEFICIARY = "qor1beneficiary00000000000000000000000000";

    function setUp() public {
        status = new MockPqcKeyStatus();
        verify = new MockPqcVerify();
        bridge = new MockCrossVmBridge();

        vm.etch(PQC_STATUS, address(status).code);
        vm.etch(PQC_VERIFY, address(verify).code);
        vm.etch(CROSSVM, address(bridge).code);

        // Re-bind storage for etched contracts by copying runtime via new deploy state:
        // Foundry etch copies code only; call through the original instances for set().
        status.set(chair, true, hex"abcd");
        // Push the same mapping into etched code by deploying helpers that write via
        // the etched addresses using a small setter script — instead, etch after
        // configuring storage on the mock and copy storage slots is hard.
        // Practical approach: use vm.etch then call set via the etched address with
        // a known selector. We re-deploy setters as the etched contract itself.
        MockPqcKeyStatus(PQC_STATUS).set(chair, true, hex"abcd");
        MockPqcVerify(PQC_VERIFY).setAccept(true);

        dao = new TuvyyGovernor(chair, 1 days, 1);
        vm.deal(address(dao), 10 ether);
        vm.prank(alice);
        dao.join();
        vm.prank(bob);
        dao.join();
    }

    function _propose() internal returns (uint256 id) {
        vm.prank(alice);
        id = dao.propose("Fund research", bob, NATIVE_BENEFICIARY, 1 ether);
    }

    function test_proposeAndVote() public {
        uint256 id = _propose();
        vm.prank(alice);
        dao.vote(id, true);
        vm.prank(bob);
        dao.vote(id, true);

        (
            address proposer,
            ,
            address recipient,
            ,
            ,
            uint256 amount,
            uint256 yesVotes,
            uint256 noVotes,
            ,
            bool executed,
            bool canceled
        ) = dao.proposals(id);

        assertEq(proposer, alice);
        assertEq(recipient, bob);
        assertEq(amount, 1 ether);
        assertEq(yesVotes, 2);
        assertEq(noVotes, 0);
        assertFalse(executed);
        assertFalse(canceled);
    }

    function test_executeAtomicCrossVmAndPayout() public {
        uint256 id = _propose();
        vm.prank(alice);
        dao.vote(id, true);
        vm.warp(block.timestamp + 1 days + 1);

        uint256 bobBefore = bob.balance;
        // Any non-empty signature — mock verify accepts.
        dao.execute(id, hex"deadbeef");

        assertEq(bob.balance, bobBefore + 1 ether);
        (, , , , , , , , , bool executed,) = dao.proposals(id);
        assertTrue(executed);

        // Bridge saw the Native increase_allowance payload.
        assertEq(
            MockCrossVmBridge(CROSSVM).lastTarget(),
            dao.DEFAULT_NATIVE_TARGET()
        );
        bytes memory payload = MockCrossVmBridge(CROSSVM).lastPayload();
        assertGt(payload.length, 20);
    }

    function test_executeRevertsWithoutQuorum() public {
        uint256 id = _propose();
        vm.warp(block.timestamp + 1 days + 1);
        vm.expectRevert(TuvyyGovernor.NotPassed.selector);
        dao.execute(id, hex"aa");
    }

    function test_executeRevertsOnBadPqc() public {
        uint256 id = _propose();
        vm.prank(alice);
        dao.vote(id, true);
        vm.warp(block.timestamp + 1 days + 1);
        MockPqcVerify(PQC_VERIFY).setAccept(false);
        vm.expectRevert(TuvyyGovernor.BadPqc.selector);
        dao.execute(id, hex"aa");
    }

    function test_executeRevertsIfBridgeEmpty() public {
        uint256 id = _propose();
        vm.prank(alice);
        dao.vote(id, true);
        vm.warp(block.timestamp + 1 days + 1);
        MockCrossVmBridge(CROSSVM).setEmpty(true);
        vm.expectRevert(TuvyyGovernor.CrossVmInactive.selector);
        dao.execute(id, hex"aa");
    }

    function test_classicalKeyCannotBypassPq() public {
        // Even the chair's EOA calling execute still needs a valid ML-DSA sig.
        uint256 id = _propose();
        vm.prank(alice);
        dao.vote(id, true);
        vm.warp(block.timestamp + 1 days + 1);
        MockPqcKeyStatus(PQC_STATUS).set(chair, false, "");
        vm.prank(chair);
        vm.expectRevert(TuvyyGovernor.BadPqc.selector);
        dao.execute(id, hex"aa");
    }

    function test_cancelByProposer() public {
        uint256 id = _propose();
        vm.prank(alice);
        dao.cancel(id);
        (, , , , , , , , , , bool canceled) = dao.proposals(id);
        assertTrue(canceled);
    }
}
