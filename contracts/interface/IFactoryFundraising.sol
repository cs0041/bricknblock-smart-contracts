// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IFactoryFundraising {
    function getNFTFundraising(uint256) external view returns (address);

    function getCreateFromFactoryFundraisings(
        address
    ) external view returns (bool);
}
