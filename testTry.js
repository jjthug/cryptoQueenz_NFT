// const CryptoQueenz = artifacts.require("CryptoQueenz");
const AContract = artifacts.require("JustAnotherContract");
const { expect } = require("chai");
const { ethers, web3 } = require("hardhat");
const truffleAssert = require('truffle-assertions');

describe("CryptoQueenz", function () {
  
  let cryptoQueenz, balance;
  let presaleConfig, dutchAuctionConfig, publicSaleConfig;
  let auctionPrice;
  let provider, owner, address1, address2, signer,theChainId;
  let domain, types, value;
  let thesignature;
  let n;
  let mintFee;
  let privateKeyOwner = "d7cf1f0e6a8f85844e74c04a02d9b0e740a081ba4f9fd18f8ce6b8f9a5f5e75e";

  before(async function () {
    let CryptoQueenz = await ethers.getContractFactory("CryptoQueenz");
    cryptoQueenz = await CryptoQueenz.deploy("ipfs://QmezoosjRhhrEG1ZdZRMqD2orFFBGcy7cGe5ervyLxBUdF",
    "0x1abbd2457d497fb5054bf780aba3e67de04596e7c6ddec13afbbd57654e74a8f", "0xc0A0aEa4f8457Caa8C47ED5B5DA410E40EFCbf3c");
    await cryptoQueenz.deployed();

    presaleConfig = await cryptoQueenz.presaleConfig();
    dutchAuctionConfig = await cryptoQueenz.dutchAuctionConfig();
    auctionPrice  = await cryptoQueenz.getCurrentAuctionPrice();

    provider = ethers.getDefaultProvider();
    owner = new ethers.Wallet(privateKeyOwner, provider);
    console.log("owner =", owner.address);
    [address1, address2] = await ethers.getSigners();

    theChainId = await provider.getNetwork();
    console.log("chainId",theChainId.chainId);

    // console.log("provider", signer);
    // console.log("auction price = ", auctionPrice.toString());


    domain = {
      name: 'CryptoQueenz',
      version: '1',
      chainId: theChainId.chainId,
      verifyingContract: '0x92A57b3d30C4F4ed6F89e4bf1d3046c574207261'
    };
  
    // The named list of all type definitions
    types = {
        presale: [
          {name: "buyer", type: "address"},
          {name: "limit", type: "uint256"}
        ]
    };
  
    // The data to sign
    value = {
      buyer: owner.address,
      limit: 1
    };

  });





  it("presales correctly", async()=>{

    let blockNumBefore = await web3.eth.getBlockNumber();
    let blockBefore = await web3.eth.getBlock(blockNumBefore);
    let timestampBefore = blockBefore.timestamp;

    n = await cryptoQueenz.CRYPTO_QUEENZ_SUPPLY();
    let supplyLimit = (n/2);
    
    await cryptoQueenz.configurePresale(timestampBefore + 10000, timestampBefore + 20000,
      ethers.utils.parseEther('0.0000001'), 4000);

      let thelimit = 2;
      value = {
        buyer: address1.address,
        limit: thelimit
      };

      let thesignature = await owner._signTypedData(domain, types, value);

      console.log("thesignature",thesignature);

      let signatureBytes = await ethers.utils.hexlify(thesignature);
      console.log("signatureBytes = ",signatureBytes);
      //presale not active
      // await truffleAssert.reverts( cryptoQueenz.buyPresale( signatureBytes ,1 ,thelimit));

      await ethers.provider.send('evm_increaseTime', [10000]);
      await ethers.provider.send('evm_mine');

      mintFee = (presaleConfig.mintPrice).toString();
      // console.log("mintFee", mintFee);

      await truffleAssert.passes( cryptoQueenz.connect(owner).buyPresale( signatureBytes , 1 ,thelimit, {value: mintFee}));
    
  })









  it("auctions correctly", async()=>{
    // console.log("presale = ", presaleConfig.mintPrice.toNumber());
    // console.log("in ether mint price = ",ethers.utils.formatEther(presaleConfig.mintPrice.toNumber()));

    let blockNumBefore = await web3.eth.getBlockNumber();
    let blockBefore = await web3.eth.getBlock(blockNumBefore);
    let timestampBefore = blockBefore.timestamp;
    // console.log("timestamp",timestampBefore);
    // console.log("start time = ",timestampBefore+10000);
    // console.log("end time = ",timestampBefore+20000);

    await cryptoQueenz.configureDutchAuction(timestampBefore + 10000, 60,
      ethers.utils.parseEther('0.0000001'), ethers.utils.parseEther('0.00000001'), ethers.utils.parseEther('0.00000000001'));    

    //passes
    n=8;
    mintFee = (auctionPrice * n).toString();
    // console.log("mint fee works till here 1", mintFee);
    // console.log("auctionPrice", auctionPrice.toString());
    // console.log("mintFee", mintFee);

    //sale not active
    await truffleAssert.reverts( cryptoQueenz.buyPublic(n, {value: mintFee}));

    await ethers.provider.send('evm_increaseTime', [10000]);
    await ethers.provider.send('evm_mine');
    
    auctionPrice  = await cryptoQueenz.getCurrentAuctionPrice();
    mintFee = (auctionPrice * n).toString();
    console.log("mintfee = ",mintFee);

    await truffleAssert.passes( cryptoQueenz.buyPublic(n, {value: mintFee}));

    auctionPrice  = await cryptoQueenz.getCurrentAuctionPrice();
    mintFee = (auctionPrice * n).toString();
    console.log("mintfee =", mintFee);
    //insufficient payment
    await truffleAssert.reverts( cryptoQueenz.buyPublic(n+1, {value: mintFee}));

    //contract buy fails
    let aContract = await AContract.new();
    await truffleAssert.reverts(aContract.buyAuction(cryptoQueenz.address, "2", {value: ethers.utils.parseEther('1000')}));   

    n = await cryptoQueenz.CRYPTO_QUEENZ_SUPPLY();
    auctionPrice  = await cryptoQueenz.getCurrentAuctionPrice();
    mintFee = (auctionPrice * n).toString();
    //supply maxed out
    await truffleAssert.reverts( cryptoQueenz.buyPublic(n, {value: mintFee}));

  })
})