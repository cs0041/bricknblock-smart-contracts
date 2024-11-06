// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "./interface/IFactoryFundraisingDao.sol";

contract PropertyToken is ERC20, ERC20Permit, ERC20Votes {
    address public immutable fundraisingContract;
    address public immutable propertyGovernance;
    IFactoryFundraisingDao public factoryFundraisingDao;

    modifier onlyFundraisingContract() {
        require(
            msg.sender == fundraisingContract ||
                factoryFundraisingDao.getCreateFromFactoryFundraisingsDao(
                    msg.sender
                ),
            "Only fundraising contract"
        );
        _;
    }
    modifier onlyPropertyGovernanceContract() {
        require(
            msg.sender == propertyGovernance,
            "Only PropertyGovernance contract"
        );
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address _fundraisingContract,
        address _factoryFundraisingDao,
        address _propertyGovernance
    ) ERC20(name, symbol) ERC20Permit(name) {
        fundraisingContract = _fundraisingContract;
        factoryFundraisingDao = IFactoryFundraisingDao(_factoryFundraisingDao);
        propertyGovernance = _propertyGovernance;
    }

    function mint(address to, uint256 amount) external onlyFundraisingContract {
        _mint(to, amount);
    }

    function transferDaoFunds(
        address token,
        address to,
        uint256 amount
    ) external onlyPropertyGovernanceContract {
        require(to != address(0), "Invalid address");
        IERC20(token).transfer(to, amount);
    }

    // Required overrides
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, amount);
    }

    function nonces(
        address owner
    ) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    function delegate(address delegatee) public virtual override {
        super.delegate(delegatee);
    }
}
