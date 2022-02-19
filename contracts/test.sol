pragma solidity ^0.8.8;
import "contracts/Strings.sol";
import 'hardhat/console.sol';
contract Test{
using Strings for uint256;
    function getHash() external view returns(uint256){
        uint256 finalval;
        uint256 val = 6906;
        uint256 i;

        for(i=1; i<=9666; i++){
            val = val + i;
            finalval = uint256(keccak256(abi.encodePacked(val.toString())));
        }  

        console.log("finalval =" , finalval);

        return finalval;
    }
}