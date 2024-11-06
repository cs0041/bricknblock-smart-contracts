// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./interface/IPropertyToken.sol";
import "./interface/IPropertyGovernance.sol";

contract RealEstateFundraisingDao is ReentrancyGuard {
    IERC20 public immutable usdt;
    IPropertyToken public immutable propertyToken;
    IPropertyGovernance public immutable propertyGovernance;

    struct Offer {
        address propertyToken;
        uint256 proposalID;
        uint256 goalAmount;
        uint256 minInvestment;
        uint256 maxInvestment;
        uint256 deadline;
        uint256 totalRaised;
        bool isCompleted;
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

    modifier onlyVoteSupportPropertyToken() {
        require(
            propertyGovernance.canInvest(
                address(propertyToken),
                offer.proposalID,
                msg.sender
            ),
            "Only Vote Support PropertyToken"
        );
        _;
    }

    constructor(
        address _usdt,
        address _propertyToken,
        address _propertyGovernancen,
        uint256 _proposalID,
        uint256 _goalAmount,
        uint256 _minInvestment,
        uint256 _maxInvestment,
        uint256 _durationDays
    ) {
        require(_goalAmount > 0, "Goal amount must be greater than 0");
        require(_minInvestment > 0, "Min investment must be greater than 0");
        require(
            _maxInvestment >= _minInvestment,
            "Max investment must be >= min investment"
        );
        require(_durationDays > 0, "Duration must be greater than 0");

        usdt = IERC20(_usdt);
        propertyToken = IPropertyToken(_propertyToken);
        propertyGovernance = IPropertyGovernance(_propertyGovernancen);

        offer = Offer({
            propertyToken: _propertyToken,
            proposalID: _proposalID,
            goalAmount: _goalAmount,
            minInvestment: _minInvestment,
            maxInvestment: _maxInvestment,
            deadline: block.timestamp + (_durationDays * 1 days),
            totalRaised: 0,
            isCompleted: false
        });
    }

    function extendDeadline(
        uint256 additionalDays
    ) external onlyVoteSupportPropertyToken {
        require(!offer.isCompleted, "Fundraising is completed");
        require(additionalDays > 0, "Days must be greater than 0");

        uint256 newDeadline = offer.deadline + (additionalDays * 1 days);

        offer.deadline = newDeadline;
        emit DeadlineExtended(newDeadline);
    }

    function invest(
        uint256 amount
    ) external nonReentrant onlyVoteSupportPropertyToken {
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

    function withdrawInvestment()
        external
        nonReentrant
        onlyVoteSupportPropertyToken
    {
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

    function withdrawPartial(
        uint256 amount
    ) external nonReentrant onlyVoteSupportPropertyToken {
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

    // function updateGoalAmount(uint256 newGoalAmount) external  {
    //     require(!offer.isCompleted, "Fundraising already completed");
    //     require(newGoalAmount >= offer.totalRaised, "New goal cannot be less than raised amount");
    //     require(newGoalAmount < offer.goalAmount, "Can only reduce goal amount");

    //     offer.goalAmount = newGoalAmount;
    //     emit GoalAmountUpdated(newGoalAmount);

    //     if (offer.totalRaised >= newGoalAmount) {
    //         _completeFundraising();
    //     }
    // }

    // function acceptCurrentRaised() external {
    //     require(!offer.isCompleted, "Fundraising already completed");
    //     require(offer.totalRaised > 0, "No investments made");

    //     emit EarlyComplete(offer.totalRaised);
    //     _completeFundraising();
    // }

    function _completeFundraising() internal {
        offer.isCompleted = true;

        // Transfer USDT to NFT owner
        require(
            usdt.transfer(offer.propertyToken, offer.totalRaised),
            "USDT transfer failed"
        );

        emit FundraisingCompleted(offer.totalRaised);
    }

    function claimTokens() external nonReentrant onlyVoteSupportPropertyToken {
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
}
