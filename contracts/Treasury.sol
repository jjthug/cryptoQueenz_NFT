// SPDX-License-Identifier: None
pragma solidity ^0.8.0;

contract Treasury {

    struct Payee{
        address payee;
        uint256 share;
    }

    Payee[] public thePayees;
    uint256 public _numberOfPayees;

    constructor(address[] memory payees, uint256[] memory shares_){
        _numberOfPayees = payees.length;

        require(payees.length == shares_.length, "PaymentSplitter: payees and shares length mismatch");
        require(payees.length > 0, "PaymentSplitter: no payees");
        Payee memory thePayee; 

        for (uint256 i = 0; i < payees.length; i++) {
            thePayee.payee = payees[i];
            thePayee.share = shares_[i];
            thePayees.push(thePayee);
        }
    }

    receive() external payable{
    }

    function withdrawAll() external {

        require(address(this).balance > 0, "No balance to withdraw");

        uint256 noOfPayees = _numberOfPayees;
        for (uint256 i = 0; i < noOfPayees; i++) {
                uint256 share = (thePayees[i].share * address(this).balance) / 100;
                (bool success, ) = payable(thePayees[i].payee).call{value: share}("");
                require(success, "Address: unable to send value, recipient may have reverted");
            }
    }
}