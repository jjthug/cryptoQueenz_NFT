const CryptoQueenz = artifacts.require("CryptoQueenz");
const AContract = artifacts.require("JustAnotherContract");
const { expect } = require("chai");
const { ethers, web3 } = require("hardhat");
const truffleAssert = require('truffle-assertions');

describe("CryptoQueenz", function () {
  
  let cryptoQueenz, balance;
  let presaleConfig, dutchAuctionConfig, publicSaleConfig;
  let auctionPrice;

  before(async function () {
    accounts = await web3.eth.getAccounts();
    cryptoQueenz = await CryptoQueenz.new("ipfs://QmezoosjRhhrEG1ZdZRMqD2orFFBGcy7cGe5ervyLxBUdF",
    "0x1abbd2457d497fb5054bf780aba3e67de04596e7c6ddec13afbbd57654e74a8f", "0xc0A0aEa4f8457Caa8C47ED5B5DA410E40EFCbf3c");

    presaleConfig = await cryptoQueenz.presaleConfig();
    dutchAuctionConfig = await cryptoQueenz.dutchAuctionConfig();
    publicSaleConfig = await cryptoQueenz.publicSaleConfig();
    auctionPrice  = await cryptoQueenz.getCurrentAuctionPrice();
    console.log("auction price = ", auctionPrice.toString());
  });

  it("auctions correctly", async()=>{
    // console.log("presale = ", presaleConfig.mintPrice.toNumber());
    // console.log("in ether mint price = ",ethers.utils.formatEther(presaleConfig.mintPrice.toNumber()));

    let blockNumBefore = await web3.eth.getBlockNumber();
    let blockBefore = await web3.eth.getBlock(blockNumBefore);
    let timestampBefore = blockBefore.timestamp;
    console.log("timestamp",timestampBefore);
    console.log("start time = ",timestampBefore+10000);
    console.log("end time = ",timestampBefore+20000);

    await cryptoQueenz.configureDutchAuction(timestampBefore + 10000, timestampBefore + 20000, 60,
      dutchAuctionConfig.startPrice.toString(), dutchAuctionConfig.bottomPrice.toString(), dutchAuctionConfig.priceStep.toString());

    let mintFee;
    let n; //number of nfts

    //passes
    n = dutchAuctionConfig.txLimit.toNumber();
    // n=2;
    mintFee = (auctionPrice * n).toString();
    // console.log("mint fee works till here 1", mintFee);
    console.log("auctionPrice", auctionPrice.toString());
    console.log("mintFee", mintFee);
    //sale not active
    await truffleAssert.reverts( cryptoQueenz.buyAuction(n, {value: mintFee}));

    await ethers.provider.send('evm_increaseTime', [10000]);
    await ethers.provider.send('evm_mine');
    
    auctionPrice  = await cryptoQueenz.getCurrentAuctionPrice();
    mintFee = (auctionPrice * n).toString();
    await truffleAssert.passes( cryptoQueenz.buyAuction(n, {value: mintFee}));

    // supply limit exceeded
    n = 6;
    mintFee = (auctionPrice * n).toString();
    // console.log("auctionPrice.toNumber() * n", auctionPrice.toNumber() * n);
    await truffleAssert.reverts( cryptoQueenz.buyAuction(n, {value: mintFee}));

    //insufficient payment
    await truffleAssert.reverts( cryptoQueenz.buyAuction(n, {value: mintFee-1}));

    //contract buy fails
    let aContract = await AContract.new();
    await truffleAssert.reverts(aContract.buyAuction(cryptoQueenz.address, "2", {value: ethers.utils.parseEther('0.0002')}));

    await ethers.provider.send('evm_increaseTime', [9000]);
    await ethers.provider.send('evm_mine');
    
    // blockNumBefore = await web3.eth.getBlockNumber();
    // blockBefore = await web3.eth.getBlock(blockNumBefore);
    // timestampBefore = blockBefore.timestamp;
    // console.log("timestamp",timestampBefore);
    
    auctionPrice  = await cryptoQueenz.getCurrentAuctionPrice();
    n=2;
    mintFee = (auctionPrice * n).toString();
    //still ~1000 seconds left for auction to end
    await truffleAssert.passes( cryptoQueenz.buyAuction(n, {value: mintFee}));
    
    auctionPrice  = await cryptoQueenz.getCurrentAuctionPrice();
    n = dutchAuctionConfig.txLimit.toNumber();
    mintFee = (auctionPrice * n).toString();
    // tx limit exceeded
    await truffleAssert.reverts(cryptoQueenz.buyAuction(n+1, {value: ethers.utils.parseEther('0.0002')}));

    await ethers.provider.send('evm_increaseTime', [1000]);
    //sale not active as auction has ended
    await truffleAssert.reverts( cryptoQueenz.buyAuction(n, {value: mintFee}));



    
    // await truffleAssert.reverts(cryptoQueenz.buyAuction("5")); //tx limit


  })
})
