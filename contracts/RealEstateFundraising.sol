// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/INFT.sol";
import "./interface/IPropertyToken.sol";
import "./interface/IFactoryToken.sol";

contract RealEstateFundraising is ReentrancyGuard, Ownable {
    IERC20 public immutable usdt;
    INFT public immutable nft;
    IPropertyToken public propertyToken;
    IFactoryToken public factoryToken;
    struct Offer {
        uint256 nftId;
        uint256 goalAmount;
        uint256 minInvestment;
        uint256 maxInvestment;
        uint256 deadline;
        uint256 totalRaised;
        bool isCompleted;
        address nftOwner;
    }

    struct Investment {
        uint256 amount;
        bool claimed;
    }

    Offer public offer;
    mapping(address => Investment) public investments;

    event GoalAmountUpdated(uint256 newGoalAmount);
    event InvestmentMade(address indexed investor, uint256 amount);
    event FundraisingCompleted(uint256 totalRaised);
    event TokensClaimed(address indexed investor, uint256 amount);
    event EarlyComplete(uint256 totalRaised);
    event DeadlineExtended(uint256 newDeadline);
    event PropertyTokenCreated(address tokenAddress);
    event InvestmentWithdrawn(address indexed investor, uint256 amount);

    constructor(
        address _factoryToken,
        address _usdt,
        address _nft,
        uint256 _nftId,
        uint256 _goalAmount,
        uint256 _minInvestment,
        uint256 _maxInvestment,
        uint256 _durationDays,
        address _owner
    ) Ownable(_owner) {
        require(_goalAmount > 0, "Goal amount must be greater than 0");
        require(_minInvestment > 0, "Min investment must be greater than 0");
        require(
            _maxInvestment >= _minInvestment,
            "Max investment must be >= min investment"
        );
        require(_durationDays > 0, "Duration must be greater than 0");

        factoryToken = IFactoryToken(_factoryToken);
        usdt = IERC20(_usdt);
        nft = INFT(_nft);

        // no need cause it transfer after factory create contract
        // require(IERC721(_nft).ownerOf(_nftId) == msg.sender, "Must be NFT owner");
        // IERC721(_nft).transferFrom(msg.sender, address(this), _nftId);

        offer = Offer({
            nftId: _nftId,
            goalAmount: _goalAmount,
            minInvestment: _minInvestment,
            maxInvestment: _maxInvestment,
            deadline: block.timestamp + (_durationDays * 1 days),
            totalRaised: 0,
            isCompleted: false,
            nftOwner: _owner
        });
    }

    function extendDeadline(uint256 additionalDays) external onlyOwner {
        require(!offer.isCompleted, "Fundraising is completed");
        require(additionalDays > 0, "Days must be greater than 0");

        uint256 newDeadline = offer.deadline + (additionalDays * 1 days);

        offer.deadline = newDeadline;
        emit DeadlineExtended(newDeadline);
    }

    function invest(uint256 amount) external nonReentrant {
        require(!offer.isCompleted, "Fundraising is completed");
        require(block.timestamp < offer.deadline, "Deadline passed");
        require(amount >= offer.minInvestment, "Below minimum investment");
        require(amount <= offer.maxInvestment, "Exceeds maximum investment");

        Investment storage investment = investments[msg.sender];
        require(
            investment.amount + amount <= offer.maxInvestment,
            "Would exceed max investment"
        );

        // Calculate accepted amount
        uint256 remainingToGoal = offer.goalAmount - offer.totalRaised;
        uint256 acceptedAmount = amount;
        if (amount > remainingToGoal) {
            acceptedAmount = remainingToGoal;
        }

        // Transfer USDT from investor
        require(
            usdt.transferFrom(msg.sender, address(this), acceptedAmount),
            "USDT transfer failed"
        );

        // Update investment and offer
        investment.amount += acceptedAmount;
        offer.totalRaised += acceptedAmount;

        emit InvestmentMade(msg.sender, acceptedAmount);

        // Check if goal is reached
        if (offer.totalRaised >= offer.goalAmount) {
            _completeFundraising();
        }
    }

    function withdrawInvestment() external nonReentrant {
        require(!offer.isCompleted, "Fundraising is completed");

        Investment storage investment = investments[msg.sender];
        uint256 withdrawAmount = investment.amount;

        require(withdrawAmount > 0, "No investment to withdraw");

        // Update state before transfer
        investment.amount = 0;
        offer.totalRaised -= withdrawAmount;

        // Transfer USDT back to investor
        require(
            usdt.transfer(msg.sender, withdrawAmount),
            "USDT transfer failed"
        );

        emit InvestmentWithdrawn(msg.sender, withdrawAmount);
    }

    function withdrawPartial(uint256 amount) external nonReentrant {
        require(!offer.isCompleted, "Fundraising is completed");

        Investment storage investment = investments[msg.sender];
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= investment.amount, "Insufficient investment balance");

        // Ensure remaining amount meets minimum investment if not withdrawing all
        uint256 remainingAmount = investment.amount - amount;
        if (remainingAmount > 0) {
            require(
                remainingAmount >= offer.minInvestment,
                "Remaining amount below minimum investment"
            );
        }

        // Update state before transfer
        investment.amount -= amount;
        offer.totalRaised -= amount;

        // Transfer USDT back to investor
        require(usdt.transfer(msg.sender, amount), "USDT transfer failed");

        emit InvestmentWithdrawn(msg.sender, amount);
    }

    function updateGoalAmount(uint256 newGoalAmount) external onlyOwner {
        require(!offer.isCompleted, "Fundraising already completed");
        require(
            newGoalAmount >= offer.totalRaised,
            "New goal cannot be less than raised amount"
        );
        require(
            newGoalAmount < offer.goalAmount,
            "Can only reduce goal amount"
        );

        offer.goalAmount = newGoalAmount;
        emit GoalAmountUpdated(newGoalAmount);

        if (offer.totalRaised >= newGoalAmount) {
            _completeFundraising();
        }
    }

    function acceptCurrentRaised() external onlyOwner {
        require(!offer.isCompleted, "Fundraising already completed");
        require(offer.totalRaised > 0, "No investments made");

        emit EarlyComplete(offer.totalRaised);
        _completeFundraising();
    }

    function _completeFundraising() internal {
        offer.isCompleted = true;

        // Create PropertyToken
        propertyToken = IPropertyToken(
            factoryToken.createToken(
                string(
                    abi.encodePacked("Property Token ", _toString(offer.nftId))
                ),
                string(abi.encodePacked("PROP", _toString(offer.nftId))),
                address(this)
            )
        );
        require(
            address(propertyToken) != address(0),
            "Fail_Create PropertyToken"
        );
        nft.setTokenized(address(propertyToken), offer.nftId);

        // Transfer USDT to NFT owner
        require(
            usdt.transfer(offer.nftOwner, offer.totalRaised),
            "USDT transfer failed"
        );

        emit PropertyTokenCreated(address(propertyToken));
        emit FundraisingCompleted(offer.totalRaised);
    }

    function claimTokens() external nonReentrant {
        require(offer.isCompleted, "Fundraising not completed");
        require(
            address(propertyToken) != address(0),
            "Property token not created"
        );

        Investment storage investment = investments[msg.sender];
        require(investment.amount > 0, "No investment found");
        require(!investment.claimed, "Already claimed");

        investment.claimed = true;

        // Calculate tokens to mint (1:1 ratio with USDT)
        uint256 tokenAmount = investment.amount;
        propertyToken.mint(msg.sender, tokenAmount);

        emit TokensClaimed(msg.sender, tokenAmount);
    }

    function getInvestment(
        address investor
    ) external view returns (Investment memory) {
        return investments[investor];
    }

    function getRemainingTime() external view returns (uint256) {
        if (block.timestamp >= offer.deadline) return 0;
        return offer.deadline - block.timestamp;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
