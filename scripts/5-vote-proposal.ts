import { ethers } from 'hardhat'
import { getContracts } from './utils'

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const [, , user2] = await ethers.getSigners()
  const { propertyGovernance, factoryFundraising } = await getContracts()

  console.log('Running with user address:', user2.address)

  // Get property token address
  const fundraisingAddress = await factoryFundraising.allFundraisingContracts(0)
  const fundraising = await ethers.getContractAt(
    'RealEstateFundraising',
    fundraisingAddress
  )
  const propertyTokenAddress = await fundraising.propertyToken()

  // Input the proposal ID from the previous script
  const proposalId = '0' // Replace with actual proposal ID

  //   console.log('\nSkipping voting delay...')
  //   await propertyGovernance
  //     .connect(user2)
  //     .skipVotingDelay(propertyTokenAddress, proposalId)
  //   console.log('Voting delay skipped')
  //   await delay(5000) // Wait 5 seconds

  // Cast vote
  console.log('\nCasting vote...')
  const voteTx = await propertyGovernance
    .connect(user2)
    .castVote(propertyTokenAddress, proposalId, true)
  await voteTx.wait()
  console.log('Vote cast successfully')

  // Get proposal state
  const proposal = await propertyGovernance.getProposal(
    propertyTokenAddress,
    proposalId
  )
  console.log('\nProposal State:')
  console.log('For Votes:', ethers.formatEther(proposal.forVotes))
  console.log('Against Votes:', ethers.formatEther(proposal.againstVotes))
  console.log('Executed:', proposal.executed)

  //   console.log('\nSkipping to end of voting period...')
  //   await propertyGovernance.connect(user2).skipVotingPeriod(propertyTokenAddress, proposalId)
  //   console.log('Voting period skipped')

  //  // Check if proposal can be executed
  //  const state = await propertyGovernance.getProposalState(propertyTokenAddress, proposalId)
  //  console.log('\nFinal proposal state:', state)

  //  if (state === 2n) { // Succeeded state
  //    console.log('\nExecuting proposal...')
  //    const executeTx = await propertyGovernance
  //      .connect(user2)
  //      .executeProposal(propertyTokenAddress, proposalId)
  //    await executeTx.wait()
  //    console.log('Proposal executed successfully')

  //    // Get final proposal state
  //    const finalProposal = await propertyGovernance.getProposal(propertyTokenAddress, proposalId)
  //    console.log('\nFinal Proposal State:')
  //    console.log('For Votes:', ethers.formatEther(finalProposal.forVotes))
  //    console.log('Against Votes:', ethers.formatEther(finalProposal.againstVotes))
  //    console.log('Executed:', finalProposal.executed)
  //  } else {
  //    console.log('\nProposal cannot be executed. State:', state)
  //  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
