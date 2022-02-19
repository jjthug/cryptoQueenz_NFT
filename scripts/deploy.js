// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
let secret = require("../secret");

async function main() {

    const CD = await hre.ethers.getContractFactory("CryptoQueenz");
        
    const cd = await CD.deploy("ipfs://QmezoosjRhhrEG1ZdZRMqD2orFFBGcy7cGe5ervyLxBUdF",
    "0x1abbd2457d497fb5054bf780aba3e67de04596e7c6ddec13afbbd57654e74a8f",
    "0xc0A0aEa4f8457Caa8C47ED5B5DA410E40EFCbf3c"); 
    // const cd = await CD.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3"); 
    await cd.deployed();
    console.log("Deployed to : ", cd.address);   
    // await cd.verify('0x8de2bba38d282749853426ff943055c2cb8261fd4848856776ecea6deb1ad41b6df32789db58154d91abc4f91b45c90a882dda847154bd0376b8a2841faff9fa1b',1);
    // let sign = "0x8de2bba38d282749853426ff943055c2cb8261fd4848856776ecea6deb1ad41b6df32789db58154d91abc4f91b45c90a882dda847154bd0376b8a2841faff9fa1b";
    // await cd.verify("0x8de2bba38d282749853426ff943055c2cb8261fd4848856776ecea6deb1ad41b6df32789db58154d91abc4f91b45c90a882dda847154bd0376b8a2841faff9fa1b",1);

  }


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });