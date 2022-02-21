const CryptoQueenz = artifacts.require("CryptoQueenz");
const AContract = artifacts.require("JustAnotherContract");
const { expect, assert } = require("chai");
const { ethers, web3 } = require("hardhat");
const truffleAssert = require('truffle-assertions');

describe("CryptoQueenz Public Sale (Dutch Auction)", function () {
  
  let cryptoQueenz, balance;
  let presaleConfig, dutchAuctionConfig, publicSaleConfig;
  let auctionPrice;
  let provider, wallet, theChainId;
  let domain, types, value;

  before(async function () {
    accounts = await web3.eth.getAccounts();
    cryptoQueenz = await CryptoQueenz.new("ipfs://QmezoosjRhhrEG1ZdZRMqD2orFFBGcy7cGe5ervyLxBUdF",
    "0x33b5a37c7ad1c85013b61bf46c645ada6d26e0ff1675c773758e6c33564523bd", "0xc0A0aEa4f8457Caa8C47ED5B5DA410E40EFCbf3c");

    presaleConfig = await cryptoQueenz.presaleConfig();
    dutchAuctionConfig = await cryptoQueenz.dutchAuctionConfig();
    auctionPrice  = await cryptoQueenz.getCurrentAuctionPrice();
    provider = ethers.getDefaultProvider();
    wallet = await ethers.Wallet.createRandom();
    theChainId = await provider.getNetwork();
    console.log("chainId",theChainId.chainId);
    // signer = ethers.getSigner();
    // console.log("provider", signer);
    // console.log("auction price = ", auctionPrice.toString());


    domain = {
      name: 'CryptoQueenz',
      version: '1',
      chainId: theChainId.chainId,
      verifyingContract: cryptoQueenz.address
    };
  
    // The named list of all type definitions
    types = {
        vote: [
          {name: "buyer", type: "address"},
          {name: "limit", type: "uint256"}
        ]
    };
  
    // The data to sign
    value = {
      buyer: wallet.address,
      limit: 1
    };

  });


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
      ethers.utils.parseEther('0.0000001'), ethers.utils.parseEther('0.00000001'), ethers.utils.parseEther('0.000000001'));
    
    dutchAuctionConfig = await cryptoQueenz.dutchAuctionConfig();
    let mintFee;
    let n; //number of nfts

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
    mintFee = (auctionPrice * (n+1)).toString();
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

    await ethers.provider.send('evm_increaseTime', [100000]);
    await ethers.provider.send('evm_mine');

    auctionPrice  = await cryptoQueenz.getCurrentAuctionPrice();
    //Price remains at bottom price after reaching bottom price
    assert.equal(auctionPrice.toString() , dutchAuctionConfig.bottomPrice.toString());

  })

  it("rolls start index", async()=>{
    n = 400;
    auctionPrice  = await cryptoQueenz.getCurrentAuctionPrice();
    mintFee = (auctionPrice * n).toString();
    
    for(let i=0; i<24; i++){
    await truffleAssert.passes( cryptoQueenz.buyPublic(n, {value: mintFee}));
    console.log("done");
    }

    try{
      await cryptoQueenz.randomizedStartIndex();
    }catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'All tokens are not yet minted'");
    }

    let left = await cryptoQueenz.totalLeftToMint()
    auctionPrice  = await cryptoQueenz.getCurrentAuctionPrice();
    mintFee = (auctionPrice * left).toString();
    await truffleAssert.passes( cryptoQueenz.buyPublic(left, {value: mintFee}));


    await cryptoQueenz.rollStartIndex();

    let startIndex = await cryptoQueenz.randomizedStartIndex();
    console.log("randomized start index", startIndex.toNumber());

    try{
      await cryptoQueenz.randomizedStartIndex();
    }catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Index already set'");
    }

  })

  
  it("token uri before setting base uri", async()=>{
    
    await cryptoQueenz.setDummyURL('abcdefg');
    let dummyURI = await cryptoQueenz.dummyURI();
    let tokenUri = await cryptoQueenz.tokenURI(1);
    console.log("token uri of 1 =",tokenUri);

    assert.equal(tokenUri, dummyURI);

  })

  it("sets correct base uri", async()=>{
    
    try{
      await cryptoQueenz.setBaseURI("abcd")
    }catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Doesn't match with the provenance hash'");
    }

    await truffleAssert.passes(await cryptoQueenz.setBaseURI("ipfs://QmarLsVA3caLyS1WhwyPtpsunQJ7P1AgC4dxbmSbmz7N4s/json/"));
  })

  it("token uri after setting base uri", async()=>{
    
    await cryptoQueenz.setDummyURL('abcdefg');
    let dummyURI = await cryptoQueenz.dummyURI();
    let tokenUri = await cryptoQueenz.tokenURI(1);
    console.log("token uri of 1 =",tokenUri);

    assert.notEqual(tokenUri, dummyURI);
  })


})