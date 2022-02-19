pragma solidity ^0.8.8;

contract ProveTest{

bytes32 public prove;
string public theURL;
event Hash(bytes32 hash);

    function setURL(string memory url) external {
        require(keccak256(abi.encodePacked(bytes(url))) == prove, "wrong uri");
        theURL = url;
    }

    function setHash(string memory cid) external {
        prove = keccak256(abi.encodePacked(bytes(getHash(cid))));
        emit Hash(prove);
    }

    function getHash(string memory cid) external returns(string memory){
        prove = keccak256(abi.encodePacked(bytes(hash)));
        return prove;
    }
}