pragma solidity ^0.8.0;

contract ProveTest{

bytes32 public prove;
string public theURL;
event Hash(bytes32 hash);

    function getHash() external view returns(bytes32){
        return prove;
    }

    function setURL(string memory url) external {
        require(keccak256(abi.encodePacked(bytes(url))) == prove, "wrong uri");
        theURL = url;
    }

    function setHash(string memory cidHash) external {
        prove = keccak256(abi.encode(cidHash));
        emit Hash(prove);
    }

}