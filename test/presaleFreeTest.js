const CryptoQueenz = artifacts.require("CryptoQueenz");
const AContract = artifacts.require("JustAnotherContract");
const { expect } = require("chai");
const { ethers, web3 } = require("hardhat");
const truffleAssert = require('truffle-assertions');

describe("CryptoQueenz Presale Free Mint", function () {
  
  let cryptoQueenz, totalSupply;
  let presaleConfig, dutchAuctionConfig, publicSaleConfig;
  let auctionPrice;
  let provider, owner, notOwner;
//   let domain, types, value;
    let addr1,addr2,addr3;
  before(async function () {

    let CryptoQueenz = await ethers.getContractFactory("CryptoQueenz");  
    cryptoQueenz = await CryptoQueenz.deploy("ipfs://QmezoosjRhhrEG1ZdZRMqD2orFFBGcy7cGe5ervyLxBUdF",
    "0x1abbd2457d497fb5054bf780aba3e67de04596e7c6ddec13afbbd57654e74a8f", "0xc0A0aEa4f8457Caa8C47ED5B5DA410E40EFCbf3c");

    [addr1, addr2, addr3] = await ethers.getSigners();

    presaleConfig = await cryptoQueenz.presaleConfig();
    dutchAuctionConfig = await cryptoQueenz.dutchAuctionConfig();
    // wallet = await ethers.Wallet.createRandom();
    owner = await new ethers.Wallet('d7cf1f0e6a8f85844e74c04a02d9b0e740a081ba4f9fd18f8ce6b8f9a5f5e75e');
    notOwner = await new ethers.Wallet('e7cf1f0e6a8f85844e74c04a02d9b0e740a081ba4f9fd18f8ce6b8f9a5f5e75e');
    totalSupply = await cryptoQueenz.CRYPTO_QUEENZ_SUPPLY();
  });

  it("presale free correctly", async()=>{

    let blockNumBefore = await web3.eth.getBlockNumber();
    let blockBefore = await web3.eth.getBlock(blockNumBefore);
    let timestampBefore = blockBefore.timestamp;
    console.log("timestamp",timestampBefore);
    console.log("start time = ",timestampBefore+10000);
    console.log("end time = ",timestampBefore+20000);

    let n;
    n = await cryptoQueenz.CRYPTO_QUEENZ_SUPPLY();
    let supplyLimit = (n/2);
    
    await cryptoQueenz.configurePresale(timestampBefore + 10000, timestampBefore + 20000,
      ethers.utils.parseEther('0.001'), 4000);

    // let signature = await wallet.signMessage("hello");

    // console.log("signer =",wallet);
    // console.log("signature =",signature);


    let domain = {
    name: 'CryptoQueenz',
    version: '1',
    chainId: 31337 ,
    verifyingContract: cryptoQueenz.address
    };

    // The named list of all type definitions
    let types = {
        freeMint: [
        {name: "buyer", type: "address"},
        {name: "limit", type: "uint256"}
        ]
    };

    // The data to sign
    let value = {
    buyer: addr2.address,
    limit: 3
    };

    console.log("contract address", cryptoQueenz.address);
    console.log("buyer",addr2.address);

    console.log("owner is", owner.address);
    let signature = await owner._signTypedData(domain, types, value);
    // let signatureBytes = await ethers.utils.hexlify(signature);

    presaleConfig = await cryptoQueenz.presaleConfig();
    let mintFee = (presaleConfig.mintPrice).toString();

    // Presale not active
    try{
      await cryptoQueenz.connect(addr2).buyPresaleFree( signature, 1 ,3, {value: mintFee})
    } catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Presale not active'");
    }

    await ethers.provider.send('evm_increaseTime', [10000]);
    await ethers.provider.send('evm_mine');
    
    await truffleAssert.passes( await cryptoQueenz.connect(addr2).buyPresaleFree( signature, 1 ,3));

    let anotherSignature = await notOwner._signTypedData(domain, types, value);

    try{
      // Invalid signature
      await cryptoQueenz.connect(addr2).buyPresaleFree( anotherSignature, 1 ,3);
    } catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Invalid signature'");
    }

    types = {
        presale: [
        {name: "buyer", type: "address"},
        {name: "limit", type: "uint256"}
        ]
    };

     signature = await owner._signTypedData(domain, types, value);

    try{
        // Invalid signature
        await cryptoQueenz.connect(addr2).buyPresaleFree( signature, 1 ,3);
      } catch(e){
        expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Invalid signature'");
      }

    types = {
        freeMint: [
        {name: "buyer", type: "address"},
        {name: "limit", type: "uint256"}
        ]
    };

    signature = await owner._signTypedData(domain, types, value);

    await truffleAssert.passes( await cryptoQueenz.connect(addr2).buyPresaleFree( signature, 1 ,3));
    
    mintFee = (presaleConfig.mintPrice*2).toString();
    try{
      // Mint limit exceeded
      await cryptoQueenz.connect(addr2).buyPresaleFree( signature, 2 ,3, {value: mintFee})
    } catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Mint limit exceeded'");
    }

    try{
      // Total Supply limit reached
      await cryptoQueenz.connect(addr2).buyPresaleFree( signature, totalSupply+1 ,3)
    } catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Total Supply limit reached'");
    }

    try{
      // Presale Supply limit reached
      await cryptoQueenz.connect(addr2).buyPresaleFree( signature, presaleConfig.supplyLimit+1 ,3)
    } catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Presale Supply limit reached'");
    }

  })

})