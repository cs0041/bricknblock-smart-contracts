// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPropertyToken is IERC20 {
    function getVotes(address account) external view returns (uint256);

    function mint(address, uint256) external;

    function getPastVotes(
        address account,
        uint256 timepoint
    ) external view returns (uint256);

    function transferDaoFunds(
        address token,
        address to,
        uint256 amount
    ) external;
}
