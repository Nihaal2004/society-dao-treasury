// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Treasury is Ownable {
    struct Op {
        address payable to;
        uint256 amount;
        string note;
        uint64 eta;      // earliest execution time (unix seconds)
        bool executed;
    }

    Op public op;

    event Deposited(address indexed from, uint256 amount, string note);
    event PayoutScheduled(address indexed to, uint256 amount, uint64 eta, string note);
    event PayoutExecuted(address indexed to, uint256 amount, string note);

    constructor(address initialOwner) Ownable(initialOwner) {}

    receive() external payable {
        emit Deposited(msg.sender, msg.value, "");
    }

    function deposit(string calldata note) external payable {
        require(msg.value > 0, "Zero");
        emit Deposited(msg.sender, msg.value, note);
    }

    // Called by Governor after a successful vote. Sets a timelocked payout.
    function schedulePayout(address payable to, uint256 amount, uint64 eta, string calldata note)
        external
        onlyOwner
    {
        require(eta > block.timestamp, "eta in past");
        require(amount <= address(this).balance, "insufficient");
        op = Op({to: to, amount: amount, note: note, eta: eta, executed: false});
        emit PayoutScheduled(to, amount, eta, note);
    }

    // Anyone can execute after eta.
    function executePayout() external {
        require(!op.executed, "done");
        require(block.timestamp >= op.eta, "timelocked");
        
        // Cache values and mark as executed BEFORE external call (reentrancy protection)
        address payable recipient = op.to;
        uint256 payout = op.amount;
        string memory note = op.note;
        op.executed = true;
        
        (bool ok, ) = recipient.call{value: payout}("");
        require(ok, "transfer failed");
        emit PayoutExecuted(recipient, payout, note);
    }
}
