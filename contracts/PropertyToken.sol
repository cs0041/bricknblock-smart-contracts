// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./interface/IFactoryFundraisingDao.sol";

contract PropertyToken is ERC20, ERC20Permit, ERC20Votes {
    address public immutable fundraisingContract;
    address public immutable propertyGovernance;
    IFactoryFundraisingDao public factoryFundraisingDao;

    struct DividendInfo {
        uint256 amount;
        uint256 totalSupplyAtSnapshot;
        uint256 blockNumber;
        address token;
        mapping(address => bool) hasClaimed;
    }

    uint256 public currentDividendIndex;
    mapping(uint256 => DividendInfo) public dividends;

    event DividendDistributed(uint256 indexed dividendIndex, address token, uint256 amount, uint256 blockNumber);
    event DividendClaimed(address indexed user, uint256 indexed dividendIndex, uint256 amount);

    modifier onlyFundraisingContract() {
        require(
            msg.sender == fundraisingContract ||
                factoryFundraisingDao.getCreateFromFactoryFundraisingsDao(
                    msg.sender
                ),
            "Only fundraising contract"
        );
        _;
    }
    modifier onlyPropertyGovernanceContract() {
        require(
            msg.sender == propertyGovernance,
            "Only PropertyGovernance contract"
        );
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address _fundraisingContract,
        address _factoryFundraisingDao,
        address _propertyGovernance
    ) ERC20(name, symbol) ERC20Permit(name) {
        fundraisingContract = _fundraisingContract;
        factoryFundraisingDao = IFactoryFundraisingDao(_factoryFundraisingDao);
        propertyGovernance = _propertyGovernance;
    }

    function mint(address to, uint256 amount) external onlyFundraisingContract {
        _mint(to, amount);
    }

    function transferDaoFunds(
        address token,
        address to,
        uint256 amount
    ) external onlyPropertyGovernanceContract {
        require(to != address(0), "Invalid address");
        IERC20(token).transfer(to, amount);
    }

    function distributeDividends(address token, uint256 amount) external  {
        require(amount > 0, "Amount must be greater than 0");
        require(token != address(0), "Invalid token address");
        
        // Transfer tokens from sender to this contract
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        uint256 dividendIndex = currentDividendIndex;
        DividendInfo storage dividend = dividends[dividendIndex];
        
        dividend.amount = amount;
        dividend.totalSupplyAtSnapshot = totalSupply();
        dividend.blockNumber = block.number;
        dividend.token = token;
        
        emit DividendDistributed(dividendIndex, token, amount, block.number);
        currentDividendIndex++;
    }

    function claimDividend(uint256 dividendIndex) external {
        require(dividendIndex < currentDividendIndex, "Invalid dividend index");
        DividendInfo storage dividend = dividends[dividendIndex];
        
        require(!dividend.hasClaimed[msg.sender], "Already claimed");
        require(getPastVotes(msg.sender, dividend.blockNumber) > 0, "No voting power at snapshot");
        
        uint256 userShare = (dividend.amount * getPastVotes(msg.sender, dividend.blockNumber)) / dividend.totalSupplyAtSnapshot;
        require(userShare > 0, "No dividend to claim");
        
        dividend.hasClaimed[msg.sender] = true;
        
        require(IERC20(dividend.token).transfer(msg.sender, userShare), "Transfer failed");
        
        emit DividendClaimed(msg.sender, dividendIndex, userShare);
    }

    function getDividendInfo(uint256 dividendIndex) external view returns (
        uint256 amount,
        uint256 totalSupplyAtSnapshot,
        uint256 blockNumber,
        address token
    ) {
        require(dividendIndex < currentDividendIndex, "Invalid dividend index");
        DividendInfo storage dividend = dividends[dividendIndex];
        return (
            dividend.amount,
            dividend.totalSupplyAtSnapshot,
            dividend.blockNumber,
            dividend.token
        );
    }

    function canClaimDividend(address user, uint256 dividendIndex) external view returns (bool) {
        if (dividendIndex >= currentDividendIndex) return false;
        DividendInfo storage dividend = dividends[dividendIndex];
        if (dividend.hasClaimed[user]) return false;
        if (getPastVotes(user, dividend.blockNumber) == 0) return false;
        return true;
    }

    // Required overrides
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, amount);
    }

    function nonces(
        address owner
    ) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    function delegate(address delegatee) public virtual override {
        super.delegate(delegatee);
    }
}
