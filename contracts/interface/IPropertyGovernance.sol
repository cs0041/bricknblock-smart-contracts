// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPropertyGovernance {
    function canInvest(address, uint256, address) external view returns (bool);
}
