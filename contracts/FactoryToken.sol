// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./PropertyToken.sol";
import "./interface/IFactoryFundraising.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FactoryToken is Ownable {
    address public factoryFundraisingDao;
    address public propertyGovernance;
    IFactoryFundraising public factoryFundraising;

    // Array to store all PropertyToken contracts
    address[] public allPropertyTokenContracts;

    // Mapping address PropertyToken to bool crete from this factory
    mapping(address => bool) public getCreateFromFactoryToken;

    event TokenCreated(address indexed token, address fundraisingContract);

    modifier onlyFundraising() {
        require(
            factoryFundraising.getCreateFromFactoryFundraisings(msg.sender),
            "Only Fundraising"
        );
        _;
    }

    constructor(
        address _factoryFundraisingDao,
        address _propertyGovernance
    ) Ownable(msg.sender) {
        factoryFundraisingDao = _factoryFundraisingDao;
        propertyGovernance = _propertyGovernance;
    }

    function setFactoryFundraising(address _factoryFundraising) external {
        factoryFundraising = IFactoryFundraising(_factoryFundraising);
    }

    function createToken(
        string memory name,
        string memory symbol,
        address _fundraisingContract
    ) external onlyFundraising returns (address token) {
        bytes32 _salt = keccak256(
            abi.encodePacked(_fundraisingContract, block.timestamp)
        );
        PropertyToken newPropertyToken = new PropertyToken{salt: _salt}(
            name,
            symbol,
            _fundraisingContract,
            factoryFundraisingDao,
            propertyGovernance
        );
        address newAddress = address(newPropertyToken);
        require(newAddress != address(0), "Fail_Create");

        // Update state
        getCreateFromFactoryToken[newAddress] = true;
        allPropertyTokenContracts.push(newAddress);

        emit TokenCreated(newAddress, _fundraisingContract);

        return newAddress;
    }

    function getAllPropertyTokenContractsLength()
        external
        view
        returns (uint256)
    {
        return allPropertyTokenContracts.length;
    }
}
