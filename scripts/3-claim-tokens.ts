import { ethers } from 'hardhat'
import { getContracts } from './utils'

async function main() {
  const [, , user2] = await ethers.getSigners()
  const { factoryFundraising } = await getContracts()

  console.log('Running with user address:', user2.address)

  // Get fundraising address
  const fundraisingAddress = await factoryFundraising.allFundraisingContracts(0)
  const fundraising = await ethers.getContractAt(
    'RealEstateFundraising',
    fundraisingAddress
  )

  // Claim tokens
  console.log('\nClaiming tokens...')
  const claimTx = await fundraising.connect(user2).claimTokens()
  await claimTx.wait()
  console.log('Tokens claimed successfully')

  // Get property token address
  const propertyTokenAddress = await fundraising.propertyToken()
  const propertyToken = await ethers.getContractAt(
    'PropertyToken',
    propertyTokenAddress
  )

  // Check balance
  const balance = await propertyToken.balanceOf(user2.address)
  console.log('\nProperty Token Balance:', ethers.formatEther(balance))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
