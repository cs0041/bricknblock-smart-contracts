import { ethers } from 'hardhat'
import { getContracts } from './utils'

async function main() {
  const [, , user2] = await ethers.getSigners()
  const { usdt, propertyGovernance, factoryFundraising } = await getContracts()

  console.log('Running with user address:', user2.address)

  // Get fundraising and property token addresses
  const fundraisingAddress = await factoryFundraising.allFundraisingContracts(0)
  const fundraising = await ethers.getContractAt(
    'RealEstateFundraising',
    fundraisingAddress
  )
  const propertyTokenAddress = await fundraising.propertyToken()

  // Get PropertyToken contract
  const propertyToken = await ethers.getContractAt(
    'PropertyToken',
    propertyTokenAddress
  )

  // Check current voting power
  const votingPowerBefore = await propertyToken.getVotes(user2.address)
  console.log('\nCurrent voting power:', ethers.formatEther(votingPowerBefore))

  // Delegate votes to self if not already delegated
  if (votingPowerBefore === BigInt(0)) {
    console.log('\nDelegating votes to self...')
    const delegateTx = await propertyToken
      .connect(user2)
      .delegate(user2.address)
    await delegateTx.wait()
    console.log('Delegation complete')

    // Check new voting power
    const votingPowerAfter = await propertyToken.getVotes(user2.address)
    console.log('New voting power:', ethers.formatEther(votingPowerAfter))
  }

  // Create proposal
  console.log('\nCreating transfer proposal...')
  const transferAmount = ethers.parseEther('100000') // 100k USDT
  const description = 'Proposal: Transfer funds to user2'
  const proposalType = 2 // TransferFunds type
  const callData = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'address', 'uint256'],
    [await usdt.getAddress(), user2.address, transferAmount]
  )

  const proposeTx = await propertyGovernance
    .connect(user2)
    .propose(
      propertyTokenAddress,
      description,
      proposalType,
      callData,
      ethers.ZeroAddress
    )
  const receipt = await proposeTx.wait()
  const proposalId = receipt?.logs[0].topics[1]
  console.log('Proposal created with ID:', proposalId)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
