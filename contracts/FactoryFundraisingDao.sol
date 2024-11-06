// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./RealEstateFundraisingDao.sol";
import "./interface/IFactoryToken.sol";

contract FactoryFundraisingDao {
    address public propertyGovernancen;
    // Array to store all fundraisingDao contracts
    address[] public allFundraisingDaoContracts;
    // Mapping from PropertyToken to all fundraising dao contracts
    mapping(address => address[]) public getAllFundraisingsDaoByPropertyToken;

    // Mapping address FundraisingsDao to bool crete from this factory
    mapping(address => bool) public getCreateFromFactoryFundraisingsDao;

    event FundraisingDaoCreated(
        address indexed fundraisingDao,
        uint256 goalAmount,
        uint256 minInvestment,
        uint256 maxInvestment,
        uint256 duration
    );

    modifier onlyPropertyGovernancen() {
        require(propertyGovernancen == msg.sender, "Only PropertyGovernancen");
        _;
    }

    constructor(address _propertyGovernancen) {
        propertyGovernancen = _propertyGovernancen;
    }

    function createFundraisingDao(
        address _usdt,
        address _propertyToken,
        uint256 _proposalID,
        uint256 _goalAmount,
        uint256 _minInvestment,
        uint256 _maxInvestment,
        uint256 _durationDays
    ) external onlyPropertyGovernancen returns (address) {
        bytes32 _salt = keccak256(
            abi.encodePacked(_propertyToken, block.timestamp)
        );
        RealEstateFundraisingDao newRealEstateFundraisingDao = new RealEstateFundraisingDao{
                salt: _salt
            }(
                _usdt,
                _propertyToken,
                propertyGovernancen,
                _proposalID,
                _goalAmount,
                _minInvestment,
                _maxInvestment,
                _durationDays
            );

        address newAddress = address(newRealEstateFundraisingDao);
        require(newAddress != address(0), "Fail_Create");

        // Update state
        allFundraisingDaoContracts.push(newAddress);
        getAllFundraisingsDaoByPropertyToken[_propertyToken].push(newAddress);
        getCreateFromFactoryFundraisingsDao[newAddress] = true;

        emit FundraisingDaoCreated(
            newAddress,
            _goalAmount,
            _minInvestment,
            _maxInvestment,
            _durationDays
        );
        return newAddress;
    }

    function getAllFundraisingsDaoLength() external view returns (uint256) {
        return allFundraisingDaoContracts.length;
    }

    function getAllFundraisingsDaoByPropertyTokenLength(
        address owner
    ) external view returns (uint256) {
        return getAllFundraisingsDaoByPropertyToken[owner].length;
    }
}
