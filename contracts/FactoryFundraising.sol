// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./RealEstateFundraising.sol";

contract FactoryFundraising {
    // USDT token address
    address public immutable usdt;
    // RealEstate NFT contract address
    address public immutable nftContract;
    address public factoryToken;

    // Array to store all fundraising contracts
    address[] public allFundraisingContracts;
    // Mapping from NFT ID to fundraising contract
    mapping(uint256 => address) public getNFTFundraising;
    // Mapping from owner to their fundraising contracts
    mapping(address => address[]) public getOwnerFundraisings;
    // Mapping address Fundraisings to bool crete from this factory
    mapping(address => bool) public getCreateFromFactoryFundraisings;

    event FundraisingCreated(
        address indexed fundraising,
        address indexed owner,
        uint256 indexed nftId,
        uint256 goalAmount,
        uint256 minInvestment,
        uint256 maxInvestment,
        uint256 duration
    );

    constructor(address _usdt, address _nftContract, address _factoryToken) {
        require(_usdt != address(0), "Invalid USDT address");
        require(_nftContract != address(0), "Invalid NFT contract address");
        usdt = _usdt;
        nftContract = _nftContract;
        factoryToken = _factoryToken;
    }

    function createFundraising(
        uint256 nftId,
        uint256 goalAmount,
        uint256 minInvestment,
        uint256 maxInvestment,
        uint256 durationDays
    ) external returns (address) {
        require(
            getNFTFundraising[nftId] == address(0),
            "NFT already has fundraising"
        );
        require(
            IERC721(nftContract).ownerOf(nftId) == msg.sender,
            "Not NFT owner"
        );

        bytes32 _salt = keccak256(
            abi.encodePacked(nftContract, nftId, block.timestamp)
        );
        RealEstateFundraising newRealEstateFundraising = new RealEstateFundraising{
                salt: _salt
            }(
                factoryToken,
                usdt,
                nftContract,
                nftId,
                goalAmount,
                minInvestment,
                maxInvestment,
                durationDays,
                msg.sender
            );
        address newAddress = address(newRealEstateFundraising);
        require(newAddress != address(0), "Fail_Create");

        // Transfer NFT to fundraising contract
        IERC721(nftContract).transferFrom(msg.sender, newAddress, nftId);

        // Update state
        allFundraisingContracts.push(newAddress);
        getNFTFundraising[nftId] = newAddress;
        getOwnerFundraisings[msg.sender].push(newAddress);
        getCreateFromFactoryFundraisings[newAddress] = true;

        emit FundraisingCreated(
            newAddress,
            msg.sender,
            nftId,
            goalAmount,
            minInvestment,
            maxInvestment,
            durationDays
        );
        return newAddress;
    }

    function getAllFundraisingsLength() external view returns (uint256) {
        return allFundraisingContracts.length;
    }

    function getOwnerFundraisingsLength(
        address owner
    ) external view returns (uint256) {
        return getOwnerFundraisings[owner].length;
    }
}
