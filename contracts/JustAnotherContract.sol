pragma solidity ^0.8.8;

interface cryptoQueenz{
    function buyAuction(uint256 numberOfTokens) external payable;
}

contract JustAnotherContract {
    
    function buyAuction(address _contract, uint _num) public payable {
        cryptoQueenz(_contract).buyAuction(_num);
    }
}