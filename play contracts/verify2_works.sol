// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "./ECDSA.sol";

contract Verifyy{
  using ECDSA for bytes32;

  struct Data{
    address buyer;
    uint256 limit;
}
event Log(address theadd);
bytes32 private constant DATA_TYPEHASH = keccak256("presale(address buyer,uint256 limit)");

address constant verifyingContract = 0x1AF7A7555263F275433c6Bb0b8FdCD231F89B1D7;
  uint256 chainId = 4;

bytes32 private DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        keccak256(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        keccak256(bytes("BoyGeorge")),
        keccak256(bytes("1")),
        chainId,
        0x1AF7A7555263F275433c6Bb0b8FdCD231F89B1D7
      )
    );


address public whitelistSigner = 0xc0A0aEa4f8457Caa8C47ED5B5DA410E40EFCbf3c;

function verify(bytes memory signature, uint256 approvedLimit) external returns (bool) {
    bytes32 digest = keccak256(
      abi.encodePacked(
        "\x19\x01",
        DOMAIN_SEPARATOR,
        keccak256(abi.encode(DATA_TYPEHASH, 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4, approvedLimit))
      )
    );


    address signer = digest.recover(signature);
    emit Log(signer);
    emit Log(whitelistSigner);
    // require(
    //   signer != address(0) && signer == whitelistSigner,
    //   "Invalid signature"
    // );
    return true;
}

}