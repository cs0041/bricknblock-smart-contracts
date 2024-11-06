// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interface/IFactoryFundraisingDao.sol";
import "./interface/IPropertyToken.sol";
import "./interface/IFactoryToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PropertyGovernance is Ownable {
    IFactoryToken public factoryToken;
    IERC20 public immutable usdt;
    IFactoryFundraisingDao public factoryFundraisingDao;

    uint256 private _proposalIds;

    // Governance parameters
    uint256 public constant PROPOSAL_THRESHOLD = 1 ether; // 1 tokens needed to create proposal
    uint256 public constant VOTING_PERIOD = 7 days; // 7 days for voting
    uint256 public constant VOTING_DELAY = 1 days; // 1 day delay before voting starts
    uint256 public constant QUORUM_PERCENTAGE = 10; // 10% of total supply needed for quorum

    enum ProposalState {
        Pending, // Created but not yet active
        Active, // Can be voted on
        Defeated, // Failed to reach quorum or more no votes
        Succeeded, // Passed but not yet executed
        Executed // Proposal was executed
    }

    enum ProposalType {
        OffChain,
        OnChain,
        TransferFunds,
        CreateFundraising
    }

    struct Proposal {
        uint256 id; // Unique identifier
        address proposer; // Address that created the proposal
        string description; // Description of the proposal
        uint256 startTime; // When voting begins
        uint256 endTime; // When voting ends
        uint256 forVotes; // Amount of votes for
        uint256 againstVotes; // Amount of votes against
        bool executed; // Whether proposal was executed
        ProposalType proposalType;
        address target; // Contract to call
        address propertyToken; // Contract propertyToken
        bytes callData; // Function call data
        uint256 proposalSnapshot; // Block number when proposal was created
        mapping(address => bool) hasVoted; // Track who has voted
        mapping(address => bool) canInvest; // Track who voted in favor
    }

    // Mapping from propertyToken address to proposerID to proposals
    mapping(address => mapping(uint256 => Proposal)) public proposals;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address indexed propertyToken,
        string description
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        address indexed propertyToken,
        bool support,
        uint256 weight
    );
    event ProposalExecuted(
        address indexed executor,
        uint256 indexed proposalId,
        address indexed propertyToken
    );

    modifier onlyPropertyToken(address propertyToken) {
        require(
            factoryToken.getCreateFromFactoryToken(propertyToken),
            "Only PropertyToken"
        );
        _;
    }

    constructor(address _usdt) Ownable(msg.sender) {
        usdt = IERC20(_usdt);
    }

    function setFactory(
        address _factoryFundraisingDao,
        address _factoryToken
    ) external onlyOwner {
        factoryFundraisingDao = IFactoryFundraisingDao(_factoryFundraisingDao);
        factoryToken = IFactoryToken(_factoryToken);
    }

    function propose(
        address propertyToken,
        string memory description,
        ProposalType proposalType,
        bytes memory callData,
        address target
    ) public onlyPropertyToken(propertyToken) returns (uint256) {
        require(
            IPropertyToken(propertyToken).getVotes(msg.sender) >=
                PROPOSAL_THRESHOLD,
            "Below threshold"
        );

        uint256 proposalId = _proposalIds++;
        Proposal storage proposal = proposals[propertyToken][proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.startTime = block.timestamp + VOTING_DELAY;
        proposal.endTime = proposal.startTime + VOTING_PERIOD;
        proposal.proposalType = proposalType;
        proposal.callData = callData;
        proposal.propertyToken = propertyToken;
        proposal.target = target;
        proposal.proposalSnapshot = block.number;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            propertyToken,
            description
        );
        return proposalId;
    }

    function castVote(
        address propertyToken,
        uint256 proposalId,
        bool support
    ) external onlyPropertyToken(propertyToken) {
        Proposal storage proposal = proposals[propertyToken][proposalId];

        require(block.timestamp >= proposal.startTime, "Not started");
        require(block.timestamp <= proposal.endTime, "Ended");
        require(
            !proposal.executed && !proposal.hasVoted[msg.sender],
            "Cannot vote"
        );

        uint256 votes = IPropertyToken(propertyToken).getPastVotes(
            msg.sender,
            proposal.proposalSnapshot
        );
        require(votes > 0, "No voting power");

        proposal.hasVoted[msg.sender] = true;

        if (support) {
            proposal.forVotes += votes;
            proposal.canInvest[msg.sender] = true;
        } else {
            proposal.againstVotes += votes;
        }

        emit VoteCast(msg.sender, proposalId, propertyToken, support, votes);
    }

    function executeProposal(
        address propertyToken,
        uint256 proposalId
    ) external onlyPropertyToken(propertyToken) {
        require(_canExecute(propertyToken, proposalId), "Cannot execute");

        Proposal storage proposal = proposals[propertyToken][proposalId];
        proposal.executed = true;

        if (proposal.proposalType == ProposalType.OnChain) {
            (bool success, ) = proposal.target.call(proposal.callData);
            require(success, "Call failed");
        }
        if (proposal.proposalType == ProposalType.CreateFundraising) {
            (
                uint256 _goalAmount,
                uint256 _minInvestment,
                uint256 _maxInvestment,
                uint256 _durationDays
            ) = abi.decode(
                    proposal.callData,
                    (uint256, uint256, uint256, uint256)
                );
            factoryFundraisingDao.createFundraisingDao(
                address(usdt),
                address(propertyToken),
                proposalId,
                _goalAmount,
                _minInvestment,
                _maxInvestment,
                _durationDays
            );
        }
        if (proposal.proposalType == ProposalType.TransferFunds) {
            (address token, address to, uint256 amount) = abi.decode(
                proposal.callData,
                (address, address, uint256)
            );
            IPropertyToken(propertyToken).transferDaoFunds(token, to, amount);
        }

        emit ProposalExecuted(msg.sender, proposalId, propertyToken);
    }

    // Add this helper function to skip time (for testing only)
    function skipVotingDelay(
        address propertyToken,
        uint256 proposalId
    ) external {
        Proposal storage proposal = proposals[propertyToken][proposalId];
        proposal.startTime = block.timestamp;
    }

    function skipVotingPeriod(
        address propertyToken,
        uint256 proposalId
    ) external {
        Proposal storage proposal = proposals[propertyToken][proposalId];
        proposal.endTime = block.timestamp;
    }

    function _canExecute(
        address propertyToken,
        uint256 proposalId
    ) internal view returns (bool) {
        Proposal storage proposal = proposals[propertyToken][proposalId];
        if (proposal.executed || block.timestamp <= proposal.endTime)
            return false;

        uint256 quorum = (IPropertyToken(propertyToken).totalSupply() *
            QUORUM_PERCENTAGE) / 100;
        return (proposal.forVotes + proposal.againstVotes >= quorum &&
            proposal.forVotes > proposal.againstVotes);
    }

    function getProposalState(
        address propertyToken,
        uint256 proposalId
    ) public view onlyPropertyToken(propertyToken) returns (ProposalState) {
        Proposal storage proposal = proposals[propertyToken][proposalId];

        if (proposal.executed) {
            return ProposalState.Executed;
        }
        if (block.timestamp <= proposal.startTime) {
            return ProposalState.Pending;
        }
        if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        }
        if (proposal.forVotes <= proposal.againstVotes) {
            return ProposalState.Defeated;
        }
        return ProposalState.Succeeded;
    }

    // View functions
    function getProposal(
        address propertyToken,
        uint256 proposalId
    )
        external
        view
        onlyPropertyToken(propertyToken)
        returns (
            uint256 id,
            address proposer,
            string memory description,
            uint256 startTime,
            uint256 endTime,
            uint256 forVotes,
            uint256 againstVotes,
            bool executed,
            ProposalType proposalType,
            address target
        )
    {
        Proposal storage proposal = proposals[propertyToken][proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.executed,
            proposal.proposalType,
            proposal.target
        );
    }

    function hasVoted(
        address propertyToken,
        uint256 proposalId,
        address account
    ) external view onlyPropertyToken(propertyToken) returns (bool) {
        return proposals[propertyToken][proposalId].hasVoted[account];
    }

    function canInvest(
        address propertyToken,
        uint256 proposalId,
        address account
    ) external view onlyPropertyToken(propertyToken) returns (bool) {
        return proposals[propertyToken][proposalId].canInvest[account];
    }

    function getVotingPowerAtProposal(
        address propertyToken,
        uint256 proposalId,
        address account
    ) external view onlyPropertyToken(propertyToken) returns (uint256) {
        return
            IPropertyToken(propertyToken).getPastVotes(
                account,
                proposals[propertyToken][proposalId].proposalSnapshot
            );
    }
}
