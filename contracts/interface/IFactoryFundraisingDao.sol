// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IFactoryFundraisingDao {
    function getCreateFromFactoryFundraisingsDao(
        address
    ) external view returns (bool);

    function createFundraisingDao(
        address _usdt,
        address _propertyToken,
        uint256 _proposalID,
        uint256 _goalAmount,
        uint256 _minInvestment,
        uint256 _maxInvestment,
        uint256 _durationDays
    ) external returns (address);
}
