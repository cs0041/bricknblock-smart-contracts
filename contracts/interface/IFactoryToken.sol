// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IFactoryToken {
    function getCreateFromFactoryToken(address) external view returns (bool);

    function createToken(
        string memory name,
        string memory symbol,
        address _fundraisingContract
    ) external returns (address token);
}
