# Brick'NBlock: Real World Asset (RWA) NFT and Fundraising System

Brick'NBlock is a comprehensive system for tokenizing real world assets using NFTs and facilitating fundraising through ERC20 tokens. The system is built on the Ethereum blockchain using Solidity and leverages OpenZeppelin libraries for security and standardization.

## Deployed Contracts

Here are the addresses of the deployed contracts on the Binance Smart Chain testnet:

- **USDT**: [0x776Ded774F25A3f353763aC174A4F4C11a6deC39](https://testnet.bscscan.com/address/0x776Ded774F25A3f353763aC174A4F4C11a6deC39)
- **NFT**: [0x71353005930B49805df867D75C1610092070F3cc](https://testnet.bscscan.com/address/0x71353005930B49805df867D75C1610092070F3cc)
- **PropertyGovernance**: [0x60962143Ea130bb806e4E4f89c2580f6A31f457A](https://testnet.bscscan.com/address/0x60962143Ea130bb806e4E4f89c2580f6A31f457A)
- **FactoryFundraisingDao**: [0x145737D4641da44a76b846b6bc26cE037c19e391](https://testnet.bscscan.com/address/0x145737D4641da44a76b846b6bc26cE037c19e391)
- **FactoryToken**: [0xf64593Ff0cD457293D3400DD1F8C949F010e11d8](https://testnet.bscscan.com/address/0xf64593Ff0cD457293D3400DD1F8C949F010e11d8)
- **FactoryFundraising**: [0xB34e3DA3e1Cb266Ad048693b3CD9a1eff3850Bc2](https://testnet.bscscan.com/address/0xB34e3DA3e1Cb266Ad048693b3CD9a1eff3850Bc2)

## Contracts Overview
This suite of smart contracts facilitates a decentralized platform for real estate-related activities. The platform includes tokenization of properties, fundraising mechanisms, governance, and DAO functionalities.

### 1. RealEstateNFT.sol (Real World Asset NFT)
Implements Non-Fungible Tokens (NFTs) to represent unique real estate assets within the platform, offering ownership and transfer functionalities
- **Purpose**: Manages the creation and verification of real world asset NFTs.
- **Key Features**:
  - **Minting Properties**:
    - `mintProperty`: Allows users to mint a new NFT representing a real world asset. Requires asset details like name, location, area, etc.
  - **Verification**:
    - `verifyProperty`: Allows a verifier to mark an asset as verified.
  - **Tokenization**:
    - `setTokenized`: Marks an asset as tokenized and links it to a property token.
  - **Property Management**:
    - `getProperty`: Retrieves details of an asset by its token ID.
  - **Admin Functions**:
    - `setIFactoryFundraising`: Sets the address of the fundraising factory, restricted to admin role.

### 2. FactoryFundraisingDao.sol
Manages DAO-specific fundraising initiatives. This contract provides the functionality for decentralized decision-making in fundraising operations.
- **Purpose**: Factory contract for creating `RealEstateFundraisingDao` contracts.
- **Key Features**:
  - **DAO Creation**:
    - `createFundraisingDao`: Creates a new DAO-based fundraising contract.
  - **Management**:
    - `getAllFundraisingsDaoByPropertyToken`: Retrieves all DAO fundraising contracts associated with a property token.

### 3. RealEstateFundraisingDao.sol
A DAO-oriented contract that focuses on decentralized fundraising operations, with governance capabilities integrated for decision-making.
- **Purpose**: Manages DAO-based fundraising for a property token.
- **Key Features**:
  - **Investment Handling**:
    - `invest`: Allows DAO members to invest in the fundraising campaign.
    - `withdrawInvestment`: Allows DAO members to withdraw their investment if the fundraising is not completed.
  - **Fundraising Completion**:
    - `_completeFundraising`: Internal function to finalize the fundraising and transfer funds.
  - **Token Claiming**:
    - `claimTokens`: Allows investors to claim their property tokens after fundraising completion.

### 4. FactoryFundraising.sol
Handles the creation and management of fundraising campaigns for real estate assets. This contract enables the deployment of individual fundraising instances.
- **Purpose**: Factory contract for creating `RealEstateFundraising` contracts.
- **Key Features**:
  - **Fundraising Creation**:
    - `createFundraising`: Creates a new fundraising contract for a specific NFT, setting parameters like goal amount, investment limits, and duration.
  - **Management**:
    - `getNFTFundraising`: Retrieves the fundraising contract associated with a specific NFT.

### 5. RealEstateFundraising.sol
Supports fundraising campaigns specifically targeted at real estate projects. It enables users to contribute funds and receive tokens in exchange.
- **Purpose**: Manages the fundraising process for a specific real world asset NFT.
- **Key Features**:
  - **Investment Handling**:
    - `invest`: Allows users to invest in the fundraising campaign.
    - `withdrawInvestment`: Allows users to withdraw their investment if the fundraising is not completed.
  - **Fundraising Completion**:
    - `_completeFundraising`: Internal function to finalize the fundraising, create property tokens, and transfer funds.
  - **Token Claiming**:
    - `claimTokens`: Allows investors to claim their property tokens after fundraising completion.

### 6. PropertyToken.sol
Defines the token structure used to represent fractional ownership of properties. This contract is central to tokenizing real estate assets.
- **Purpose**: Represents a tokenized property with governance and dividend distribution capabilities.
- **Key Features**:
  - **Minting**:
    - `mint`: Allows the fundraising contract to mint new tokens.
  - **Dividend Management**:
    - `distributeDividends`: Distributes dividends to token holders based on their voting power at a snapshot.
    - `claimDividend`: Allows users to claim their share of dividends.
  - **Governance**:
    - `delegate`: Allows token holders to delegate their voting power.
  - **Fund Transfer**:
    - `transferDaoFunds`: Allows the governance contract to transfer funds.

### 7. PropertyGovernance.sol
Provides governance mechanisms for tokenized properties, including voting and proposal management for property-related decisions.
- **Purpose**: Manages governance proposals and voting for property tokens.
- **Key Features**:
  - **Proposal Management**:
    - `propose`: Allows token holders to create governance proposals.
    - `executeProposal`: Executes a proposal if it passes.
  - **Voting**:
    - `castVote`: Allows token holders to vote on proposals.
  - **State Management**:
    - `getProposalState`: Retrieves the current state of a proposal.

### 8. FactoryToken.sol
Facilitates the creation and management of tokens representing real estate propertie
- **Purpose**: Factory contract for creating `PropertyToken` contracts.
- **Key Features**:
  - **Token Creation**:
    - `createToken`: Creates a new `PropertyToken` contract with specified name and symbol.
  - **Management**:
    - `setFactoryFundraising`: Sets the address of the fundraising factory.
  - **Access Control**:
    - `onlyFundraising`: Modifier to restrict functions to be called only by authorized fundraising contracts.

### 9. USDT.sol
A mock implementation of a stablecoin (USDT) used for transactions within the platform. This contract can be replaced or integrated with actual stablecoins.
- **Purpose**: Implements a basic ERC20 token named USDT.
- **Key Features**:
  - **Token Minting**:
    - `mint`: Allows minting of new tokens to a specified account.
  - **Standard ERC20 Functions**: Inherits from OpenZeppelin's ERC20, providing standard functionalities like transfer, approve, etc.


## Interfaces

### INFT.sol

- **Purpose**: Interface for NFT contracts.
- **Key Features**:
  - **Tokenization**:
    - `setTokenized`: Function to set a property as tokenized.

### IPropertyToken.sol

- **Purpose**: Interface for property token contracts.
- **Key Features**:
  - **Voting and Minting**:
    - `getVotes`: Retrieves the voting power of an account.
    - `mint`: Mints new tokens.
  - **Fund Transfer**:
    - `transferDaoFunds`: Transfers funds from the DAO.

### IFactoryToken.sol

- **Purpose**: Interface for factory token contracts.
- **Key Features**:
  - **Token Creation**:
    - `createToken`: Function to create a new token.

### IFactoryFundraising.sol

- **Purpose**: Interface for fundraising factory contracts.
- **Key Features**:
  - **Fundraising Management**:
    - `getNFTFundraising`: Retrieves the fundraising contract for an NFT.

### IFactoryFundraisingDao.sol

- **Purpose**: Interface for fundraising DAO factory contracts.
- **Key Features**:
  - **DAO Creation**:
    - `createFundraisingDao`: Function to create a new fundraising DAO.

### IPropertyGovernance.sol

- **Purpose**: Interface for property governance contracts.
- **Key Features**:
  - **Investment Validation**:
    - `canInvest`: Checks if an account can invest based on voting.

## Usage

The system allows for the creation and management of real world asset NFTs, fundraising for property investments, and governance through tokenized voting. It is designed to facilitate secure and transparent real estate transactions on the blockchain.

## Getting Started

To deploy and interact with these contracts, you will need a development environment like Hardhat or Truffle, and a connection to an Ethereum network (e.g., a local testnet or a public testnet like Rinkeby).

1. **Install Dependencies**: Ensure you have Node.js and npm installed. Then, install the necessary packages:

   ```shell
   npm install
   ```

2. **Compile Contracts**: Use Hardhat to compile the contracts:

   ```shell
   npx hardhat compile
   ```

3. **Deploy Contracts**: Deploy the contracts to your chosen network:

   ```shell
   npx hardhat run scripts/deploy.js --network <network-name>
   ```

4. **Interact with Contracts**: Use Hardhat tasks or scripts to interact with the deployed contracts.

## License

This project is licensed under the MIT License.
