// SPDX-License-Identifier: None
pragma solidity 0.8.8;
import "./Ownable.sol";

contract Auctionable is Ownable{
struct PresaleConfig {
  uint32 startTime;
  uint32 endTime;
  uint32 supplyLimit;
  uint256 mintPrice;
}

struct DutchAuctionConfig {
  uint32 txLimit;
  uint32 startTime;
  uint32 bottomTime;
  uint32 stepInterval;
  uint256 startPrice;
  uint256 bottomPrice;
  uint256 priceStep;
}

PresaleConfig public presaleConfig;
  event PresaleConfigUpdated();
  event DutchAuctionConfigUpdated();
  DutchAuctionConfig public dutchAuctionConfig;

constructor() Ownable(){
    presaleConfig = PresaleConfig({
      startTime: 1642633200, // Wed Jan 19 2022 23:00:00 GMT+0000
      endTime: 1642719600, //	Thu Jan 20 2022 23:00:00 GMT+0000
      supplyLimit: 8000,
      mintPrice: 0.088 ether
    });

    dutchAuctionConfig = DutchAuctionConfig({
      txLimit: 3,
      startTime: 1642721400, // Thu Jan 20 2022 23:30:00 GMT+0000
      bottomTime: 1642735800, // Fri Jan 21 2022 03:30:00 GMT+0000
      stepInterval: 60, // 1 minute
      startPrice: 1.666 ether,
      bottomPrice: 0.1 ether,
      priceStep: 0.006525 ether
    });
}


  /// @notice Allows the contract owner to update start and end time for the presale
  function configurePresale(uint256 startTime, uint256 endTime)
    external
    onlyOwner
  {
    uint32 _startTime = startTime.toUint32();
    uint32 _endTime = endTime.toUint32();

    require(0 < _startTime, "Invalid time");
    require(_startTime < _endTime, "Invalid time");
    require(_endTime <= dutchAuctionConfig.startTime, "Invalid time");

    presaleConfig.startTime = _startTime;
    presaleConfig.endTime = _endTime;

    emit PresaleConfigUpdated();
  }

  /// @notice Allows the contract owner to update config for the public dutch auction
  function configureDutchAuction(
    uint256 startTime,
    uint256 bottomTime,
    uint256 stepInterval,
    uint256 startPrice,
    uint256 bottomPrice,
    uint256 priceStep
  ) external onlyOwner {
    uint32 _startTime = startTime.toUint32();
    uint32 _bottomTime = bottomTime.toUint32();
    uint32 _stepInterval = stepInterval.toUint32();

    require(presaleConfig.endTime <= _startTime, "Invalid time");
    require(_startTime < _bottomTime, "Invalid time");
    require(0 < stepInterval, "0 step interval");
    require(bottomPrice < startPrice, "Invalid start price");
    require(0 < bottomPrice, "Invalid bottom price");
    require(0 < priceStep && priceStep < startPrice, "Invalid price step");

    dutchAuctionConfig.startTime = _startTime;
    dutchAuctionConfig.bottomTime = _bottomTime;
    dutchAuctionConfig.stepInterval = _stepInterval;
    dutchAuctionConfig.startPrice = startPrice;
    dutchAuctionConfig.bottomPrice = bottomPrice;
    dutchAuctionConfig.priceStep = priceStep;

    emit DutchAuctionConfigUpdated();
  }

    /// @notice Gets the current price for the duction auction, based on current block timestamp
  /// @dev Dutch auction parameters configured via dutchAuctionConfig
  /// @return currentPrice Current mint price per NFT
  function getCurrentAuctionPrice() public view returns (uint256 currentPrice) {
    DutchAuctionConfig memory _config = dutchAuctionConfig;

    uint256 timestamp = block.timestamp;

    if (timestamp < _config.startTime) {
      currentPrice = _config.startPrice;
    } else if (timestamp >= _config.bottomTime) {
      currentPrice = _config.bottomPrice;
    } else {
      uint256 elapsedIntervals = (timestamp - _config.startTime) /
        _config.stepInterval;
      currentPrice =
        _config.startPrice -
        (elapsedIntervals * _config.priceStep);
    }

    return currentPrice;
  }

}