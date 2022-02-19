pragma solidity ^0.8.0;

contract ProveTest{

bytes32 public prove;
string public theURL;
event Hash(bytes32 hash);

    function setURL(string memory url) external {
        require(keccak256(abi.encodePacked(bytes(url))) == prove, "wrong uri");
        theURL = url;
    }

    function setHash(string memory cidHash) external {
        prove = keccak256(abi.encodePacked(cidHash));
        emit Hash(prove);
    }

}