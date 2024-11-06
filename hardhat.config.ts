import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import * as dotenv from 'dotenv'

dotenv.config()

const deployer = process.env.DEPLOYER_PRIVATE_KEY || ''
const user1 = process.env.USER1_PRIVATE_KEY || ''
const user2 = process.env.USER2_PRIVATE_KEY || ''
const user3 = process.env.USER3_PRIVATE_KEY || ''

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    bscTestnet: {
      url: 'https://bsc-testnet.blockpi.network/v1/rpc/public',
      chainId: 97,
      accounts: [deployer, user1, user2, user3], // Array of private keys
      gasPrice: 10000000000, // 10 gwei
    },
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCSCAN_API_KEY || '',
    },
  },
  sourcify: {
    enabled: true,
  },
}

export default config
