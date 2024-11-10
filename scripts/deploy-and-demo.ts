import { ethers } from 'hardhat'

async function main() {
  const [deployer, user1, user2, user3] = await ethers.getSigners()
  console.log('Deploying contracts with the account:', deployer.address)
  // 0. Deploy USDT
  const USDT = await ethers.getContractFactory('Token')
  const initialSupply = ethers.parseEther('1000000') // 1 million USDT
  const usdt = await USDT.deploy(initialSupply)
  await usdt.waitForDeployment()
  console.log('USDT deployed to:', await usdt.getAddress())

  // 1. Deploy NFT
  const NFT = await ethers.getContractFactory('RealEstateNFT')
  const nft = await NFT.deploy()
  await nft.waitForDeployment()
  console.log('NFT deployed to:', await nft.getAddress())

  // 2. Deploy PropertyGovernance
  const PropertyGovernance = await ethers.getContractFactory(
    'PropertyGovernance'
  )
  const propertyGovernance = await PropertyGovernance.deploy(
    await usdt.getAddress()
  )
  await propertyGovernance.waitForDeployment()
  console.log(
    'PropertyGovernance deployed to:',
    await propertyGovernance.getAddress()
  )

  // 3. Deploy FactoryFundraisingDao
  const FactoryFundraisingDao = await ethers.getContractFactory(
    'FactoryFundraisingDao'
  )
  const factoryFundraisingDao = await FactoryFundraisingDao.deploy(
    await propertyGovernance.getAddress()
  )
  await factoryFundraisingDao.waitForDeployment()
  console.log(
    'FactoryFundraisingDao deployed to:',
    await factoryFundraisingDao.getAddress()
  )

  // 4. Deploy FactoryToken
  const FactoryToken = await ethers.getContractFactory('FactoryToken')
  const factoryToken = await FactoryToken.deploy(
    await factoryFundraisingDao.getAddress(),
    await propertyGovernance.getAddress()
  )
  await factoryToken.waitForDeployment()
  console.log('FactoryToken deployed to:', await factoryToken.getAddress())

  // 5. Deploy FactoryFundraising
  const FactoryFundraising = await ethers.getContractFactory(
    'FactoryFundraising'
  )
  const factoryFundraising = await FactoryFundraising.deploy(
    await usdt.getAddress(),
    await nft.getAddress(),
    await factoryToken.getAddress()
  )
  await factoryFundraising.waitForDeployment()
  console.log(
    'FactoryFundraising deployed to:',
    await factoryFundraising.getAddress()
  )

  // 6. Set factories in PropertyGovernance
  const setFactoriesTx = await propertyGovernance.setFactory(
    await factoryFundraisingDao.getAddress(),
    await factoryToken.getAddress()
  )
  await setFactoriesTx.wait()
  console.log('Factories set in PropertyGovernance')

  // 7. Set FactoryFundraising in FactoryToken
  const setFactoryFundraisingTx = await factoryToken.setFactoryFundraising(
    await factoryFundraising.getAddress()
  )
  await setFactoryFundraisingTx.wait()
  console.log('FactoryFundraising set in FactoryToken')

  // 8. Set FactoryFundraising in Nft
  const setFactoryFundraisingTxNFT = await nft.setIFactoryFundraising(
    await factoryFundraising.getAddress()
  )
  await setFactoryFundraisingTxNFT.wait()
  console.log('FactoryFundraising set in NFT')

  // Print all addresses for verification
  console.log('\nDeployed Contracts:')
  console.log('------------------')
  console.log('USDT:', await usdt.getAddress())
  console.log('NFT:', await nft.getAddress())
  console.log('PropertyGovernance:', await propertyGovernance.getAddress())
  console.log(
    'FactoryFundraisingDao:',
    await factoryFundraisingDao.getAddress()
  )
  console.log('FactoryToken:', await factoryToken.getAddress())
  console.log('FactoryFundraising:', await factoryFundraising.getAddress())

  // Wait a bit for blockchain to process
  await new Promise((resolve) => setTimeout(resolve, 0))

  // Start Demo
  console.log('\n--- Starting Demo ---')
  console.log('Running demo with accounts:')
  console.log('User1:', user1.address)
  console.log('User2:', user2.address)

  // 1. User1 mints NFT
  console.log('\n1. Minting NFT for User1...')
  const mintTx = await nft.connect(user1).mintProperty(
    'Sample Name',
    'Sample Location',
    1000, // area
    'Residential',
    'ipfs://sample-documents-hash',
    'ipfs://sample-image-hash'
  )
  await mintTx.wait()
  const nftId = 0 // First NFT minted
  console.log('NFT minted with ID:', nftId)

  // 2. User1 approves NFT for FactoryFundraising
  console.log('\n2. Approving NFT for FactoryFundraising...')
  const approveTx = await nft.connect(user1).approve(factoryFundraising, nftId)
  await approveTx.wait()
  console.log('NFT approved for FactoryFundraising')

  // 3. User1 creates fundraising
  console.log('\n3. Creating fundraising...')
  const goalAmount = ethers.parseEther('1000000') // 1M USDT
  const minInvestment = ethers.parseEther('1000') // 1K USDT
  const maxInvestment = ethers.parseEther('1000000') // 1M USDT
  const durationDays = 30

  const createFundraisingTx = await factoryFundraising
    .connect(user1)
    .createFundraising(
      nftId,
      goalAmount,
      minInvestment,
      maxInvestment,
      durationDays
    )
  const receipt = await createFundraisingTx.wait()
  const fundraisingAddress = await factoryFundraising.allFundraisingContracts(0)

  const fundraising = await ethers.getContractAt(
    'RealEstateFundraising',
    fundraisingAddress
  )
  console.log('Fundraising created at:', await fundraising.getAddress())

  // 4. Mint USDT for User2
  console.log('\n4. Minting USDT for User2...')
  const usdtAmount = ethers.parseEther('500000')
  const mintUsdtTx = await usdt.mint(user2.address, usdtAmount)
  await mintUsdtTx.wait()
  console.log('Minted 0.5M USDT for User2')

  // User2 approves USDT for Fundraising contract
  const approveUsdtTx = await usdt
    .connect(user2)
    .approve(fundraisingAddress, usdtAmount)
  await approveUsdtTx.wait()
  console.log('USDT approved for Fundraising contract')

  // 5. User2 invests in fundraising
  console.log('\n5. User2 investing in fundraising...')
  const investTx = await fundraising.connect(user2).invest(usdtAmount)
  await investTx.wait()
  console.log('Investment successful')

  // Print final state
  const fundraisingState = await fundraising.offer()
  console.log('\nFinal Fundraising State:')
  console.log(
    'Total Raised:',
    ethers.formatEther(fundraisingState.totalRaised),
    'USDT'
  )

  // 6. Mint USDT for User3
  console.log('\n6. Minting USDT for User3...')
  const usdtAmount3 = ethers.parseEther('500000')
  const mintUsdtTx3 = await usdt.mint(user3.address, usdtAmount)
  await mintUsdtTx.wait()
  console.log('Minted 0.5M USDT for User3')

  // User3 approves USDT for Fundraising contract
  const approveUsdtTx3 = await usdt
    .connect(user3)
    .approve(fundraisingAddress, usdtAmount)
  await approveUsdtTx3.wait()
  console.log('USDT approved for Fundraising contract')

  // 7. User3 invests in fundraising
  console.log('\n7. User3 investing in fundraising...')
  const investTx3 = await fundraising.connect(user3).invest(usdtAmount)
  await investTx3.wait()
  console.log('Investment successful')

  // Print final state
  const fundraisingState3 = await fundraising.offer()
  console.log('\nFinal Fundraising3 State:')
  console.log(
    'Total Raised:',
    ethers.formatEther(fundraisingState3.totalRaised),
    'USDT'
  )

  console.log('Is Completed:', fundraisingState3.isCompleted)

  const PropertyTokenAddress = await factoryToken.allPropertyTokenContracts(0)

  const propertyToken = await ethers.getContractAt(
    'PropertyToken',
    PropertyTokenAddress
  )
  console.log('PropertyToken created at:', PropertyTokenAddress)

  console.log('\n--- Starting Demo Part 2 ---')

  // 1. Users claim their PropertyTokens
  console.log('\n1. Claiming PropertyTokens...')

  console.log('User2 claiming tokens...')
  const claimTx1 = await fundraising.connect(user2).claimTokens()
  await claimTx1.wait()
  console.log('User2 tokens claimed')

  console.log('User3 claiming tokens...')
  const claimTx2 = await fundraising.connect(user3).claimTokens()
  await claimTx2.wait()
  console.log('User3 tokens claimed')

  // Print token balances
  const user2Balance = await propertyToken.balanceOf(user2.address)
  const user3Balance = await propertyToken.balanceOf(user3.address)
  console.log('\nPropertyToken Balances:')
  console.log('User2:', ethers.formatEther(user2Balance))
  console.log('User3:', ethers.formatEther(user3Balance))

  // Check voting power before delegation
  console.log('\nVoting Power Before Delegation:')
  const user2VotesBefore = await propertyToken.getVotes(user2.address)
  const user3VotesBefore = await propertyToken.getVotes(user3.address)
  console.log('User2 Voting Power:', ethers.formatEther(user2VotesBefore))
  console.log('User3 Voting Power:', ethers.formatEther(user3VotesBefore))

  // 2. User2 delegates voting power to self (required for governance)
  console.log('\n2. User2 delegating voting power to self...')
  const delegateTx = await propertyToken.connect(user2).delegate(user2.address)
  await delegateTx.wait()
  console.log('Delegation complete')

  // Wait for a block to ensure voting power is active
  await ethers.provider.send('evm_mine', [])

  // Check voting power after delegation
  console.log('\nVoting Power After Delegation:')
  const user2VotesAfter = await propertyToken.getVotes(user2.address)
  const user3VotesAfter = await propertyToken.getVotes(user3.address)
  console.log('User2 Voting Power:', ethers.formatEther(user2VotesAfter))
  console.log('User3 Voting Power:', ethers.formatEther(user3VotesAfter))

  // 3. User2 creates a proposal
  console.log('\n3. Creating governance proposal...')

  // Example proposal to transfer funds
  const description = 'Proposal #1: CreateFundraising 300k'
  const proposalType = 3 // CreateFundraising type
  // In frontend using ethers.js
  const goalAmount2 = ethers.parseEther('300000') // 100k USDT
  const minInvestment2 = ethers.parseEther('100') // 100 USDT
  const maxInvestment2 = ethers.parseEther('300000') // 10k USDT
  const durationDays2 = 30 // 30 days
  const callData = ethers.AbiCoder.defaultAbiCoder().encode(
    ['uint256', 'uint256', 'uint256', 'uint256'],
    [goalAmount2, minInvestment2, maxInvestment2, durationDays2]
  )

  const target = ethers.ZeroAddress // No target for this example

  const proposeTx = await propertyGovernance
    .connect(user2)
    .propose(PropertyTokenAddress, description, proposalType, callData, target)
  const receiptProposeTx = await proposeTx.wait()

  // Get proposal ID from events
  const proposalId = receiptProposeTx?.logs[0].topics[1]
  console.log('Proposal created with ID:', proposalId)

  // Print proposal details
  const proposal = await propertyGovernance.getProposal(
    PropertyTokenAddress,
    proposalId ?? BigInt(0)
  )
  console.log('\nProposal Details:')
  console.log('Description:', proposal.description)
  console.log(
    'Start Time:',
    new Date(Number(proposal.startTime) * 1000).toLocaleString()
  )
  console.log(
    'End Time:',
    new Date(Number(proposal.endTime) * 1000).toLocaleString()
  )
  console.log('For Votes:', ethers.formatEther(proposal.forVotes))
  console.log('Against Votes:', ethers.formatEther(proposal.againstVotes))
  console.log('Executed:', proposal.executed)
  console.log('ProposalType:', proposal.proposalType)
  // console.log('CallData:', proposal.callData)

  // Print proposal state
  const state = await propertyGovernance.getProposalState(
    PropertyTokenAddress,
    proposalId ?? BigInt(0)
  )
  const states = ['Pending', 'Active', 'Defeated', 'Succeeded', 'Executed']
  console.log('Current State:', states[Number(state)])

  // Fast forward time to voting period (after VOTING_DELAY)
  console.log('\n4. Fast forwarding to voting period...')
  const votingDelay = 1 * 24 * 60 * 60 // 1 day in seconds
  await ethers.provider.send('evm_increaseTime', [votingDelay + 1])
  await ethers.provider.send('evm_mine', [])

  // Check proposal state after delay
  const stateAfterDelay = await propertyGovernance.getProposalState(
    PropertyTokenAddress,
    proposalId ?? BigInt(0)
  )
  console.log('Proposal State after delay:', states[Number(stateAfterDelay)])

  // User2 votes on proposal
  console.log('\n5. User2 voting on proposal...')
  const voteTx = await propertyGovernance
    .connect(user2)
    .castVote(PropertyTokenAddress, proposalId ?? BigInt(0), true) // true for voting in favor
  await voteTx.wait()
  console.log('Vote cast successfully')

  // Print updated proposal details
  const proposalAfterVote = await propertyGovernance.getProposal(
    PropertyTokenAddress,
    proposalId ?? BigInt(0)
  )
  console.log('\nProposal Details After Vote:')
  console.log('For Votes:', ethers.formatEther(proposalAfterVote.forVotes))
  console.log(
    'Against Votes:',
    ethers.formatEther(proposalAfterVote.againstVotes)
  )

  // Fast forward time to after voting period
  console.log('\n6. Fast forwarding to end of voting period...')
  const votingPeriod = 7 * 24 * 60 * 60 // 7 days in seconds
  await ethers.provider.send('evm_increaseTime', [votingPeriod + 1])
  await ethers.provider.send('evm_mine', [])

  // Check if proposal can be executed
  const stateBeforeExecution = await propertyGovernance.getProposalState(
    PropertyTokenAddress,
    proposalId ?? BigInt(0)
  )
  console.log(
    'Proposal State before execution:',
    states[Number(stateBeforeExecution)]
  )

  // Execute proposal if it succeeded
  if (stateBeforeExecution === BigInt(3)) {
    // 3 is Succeeded state
    console.log('\n7. Executing proposal...')
    try {
      const executeTx = await propertyGovernance
        .connect(user2)
        .executeProposal(PropertyTokenAddress, proposalId ?? BigInt(0))
      await executeTx.wait()
      console.log('Proposal executed successfully')

      // Print final proposal state
      const finalState = await propertyGovernance.getProposalState(
        PropertyTokenAddress,
        proposalId ?? BigInt(0)
      )
      console.log('Final Proposal State:', states[Number(finalState)])
    } catch (error) {
      console.log('Failed to execute proposal:', error)
    }
  } else {
    console.log(
      '\nProposal cannot be executed. Current state:',
      states[Number(stateBeforeExecution)]
    )
  }

  const factoryFundraisingDaoAddress =
    await factoryFundraisingDao.allFundraisingDaoContracts(0)

  const fundraisingDao = await ethers.getContractAt(
    'RealEstateFundraisingDao',
    factoryFundraisingDaoAddress
  )
  console.log('\nFundraisingDao created at:', await fundraisingDao.getAddress())
  const fundraisingDaoState = await fundraisingDao.offer()
  console.log('FundraisingDao details:')
  console.log(
    'Total Raised:',
    ethers.formatEther(fundraisingDaoState.totalRaised),
    'USDT'
  )
  console.log('Is Completed:', fundraisingDaoState.isCompleted)
  console.log(
    'minInvestment:',
    ethers.formatEther(fundraisingDaoState.minInvestment)
  )
  console.log(
    'maxInvestment:',
    ethers.formatEther(fundraisingDaoState.maxInvestment)
  )
  console.log('goalAmount:', ethers.formatEther(fundraisingDaoState.goalAmount))
  console.log(
    'deadline:',
    new Date(Number(fundraisingDaoState.deadline) * 1000).toLocaleString()
  )

  // Print final proposal details
  const finalProposal = await propertyGovernance.getProposal(
    PropertyTokenAddress,
    proposalId ?? BigInt(0)
  )
  console.log('\nFinal Proposal Details:')
  console.log('Description:', finalProposal.description)
  console.log('For Votes:', ethers.formatEther(finalProposal.forVotes))
  console.log('Against Votes:', ethers.formatEther(finalProposal.againstVotes))
  console.log('Executed:', finalProposal.executed)

  // Print voting power one last time
  const finalVotingPower = await propertyGovernance.getVotingPowerAtProposal(
    PropertyTokenAddress,
    proposalId ?? BigInt(0),
    user2.address
  )
  console.log(
    '\nFinal Voting Power of User2:',
    ethers.formatEther(finalVotingPower)
  )

  console.log('\n--- Checking Initial USDT Balances ---')
  const propertyTokenUSDTBalance = await usdt.balanceOf(PropertyTokenAddress)
  const fundraisingDaoUSDTBalance = await usdt.balanceOf(
    fundraisingDao.getAddress()
  )
  console.log(
    'Initial PropertyToken USDT Balance:',
    ethers.formatEther(propertyTokenUSDTBalance)
  )
  console.log(
    'Initial FundraisingDao USDT Balance:',
    ethers.formatEther(fundraisingDaoUSDTBalance)
  )

  console.log('\n--- Starting Demo Part 3: FundraisingDao Investment ---')

  // 1. User2 approves PropertyToken for RealEstateFundraisingDao
  console.log('\n1. User2 approving PropertyToken for FundraisingDao...')
  const investAmount = ethers.parseEther('300000') // 300k USDT
  await usdt.connect(user2).mint(user2.address, investAmount)
  const approveTokenTx = await usdt
    .connect(user2)
    .approve(fundraisingDao.getAddress(), investAmount)
  await approveTokenTx.wait()
  console.log('PropertyToken approved for FundraisingDao')

  // 2. User2 invests in FundraisingDao
  console.log('\n2. User2 investing 300k USDT in FundraisingDao...')
  const investDaoTx = await fundraisingDao.connect(user2).invest(investAmount)
  await investDaoTx.wait()
  console.log('Investment in FundraisingDao successful')

  // Print updated FundraisingDao state
  const updatedDaoState = await fundraisingDao.offer()
  console.log('\nUpdated FundraisingDao State:')
  console.log(
    'Total Raised:',
    ethers.formatEther(updatedDaoState.totalRaised),
    'USDT'
  )
  console.log('Is Completed:', updatedDaoState.isCompleted)

  // Print User2's investment details
  const user2Investment = await fundraisingDao.getInvestment(user2.address)
  console.log('\nUser2 Investment Details:')
  console.log(
    'Amount Invested:',
    ethers.formatEther(user2Investment.amount),
    'USDT'
  )
  console.log('Tokens Claimed:', user2Investment.claimed)

  console.log('User2 claiming tokens...')
  const claimTx22 = await fundraisingDao.connect(user2).claimTokens()
  await claimTx22.wait()
  console.log('User2 tokens claimed')

  // Print token balances
  const user22Balance = await propertyToken.balanceOf(user2.address)
  console.log('\nPropertyToken Balances:')
  console.log('User2:', ethers.formatEther(user22Balance))

  // After investment and claiming, check final balances
  console.log('\n--- Checking Final USDT Balances ---')
  const finalPropertyTokenUSDTBalance = await usdt.balanceOf(
    PropertyTokenAddress
  )
  const finalFundraisingDaoUSDTBalance = await usdt.balanceOf(
    fundraisingDao.getAddress()
  )
  console.log(
    'Final PropertyToken USDT Balance:',
    ethers.formatEther(finalPropertyTokenUSDTBalance)
  )
  console.log(
    'Final FundraisingDao USDT Balance:',
    ethers.formatEther(finalFundraisingDaoUSDTBalance)
  )

  console.log('\n--- Starting Demo Part 4: Transfer Funds Proposal ---')

  // Create TransferFunds proposal
  console.log('\n1. Creating TransferFunds proposal...')
  const transferAmount = ethers.parseEther('100000') // 100k USDT
  const transferDescription = 'Proposal: Transfer funds to user2'
  const transferProposalType = 2 // TransferFunds type
  const transferCallData = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'address', 'uint256'],
    [await usdt.getAddress(), user2.address, transferAmount]
  )

  const transferProposeTx = await propertyGovernance
    .connect(user2)
    .propose(
      PropertyTokenAddress,
      transferDescription,
      transferProposalType,
      transferCallData,
      ethers.ZeroAddress
    )
  const transferReceiptProposeTx = await transferProposeTx.wait()
  const transferProposalId = transferReceiptProposeTx?.logs[0].topics[1]
  console.log('Transfer proposal created with ID:', transferProposalId)

  // Fast forward time to voting period
  console.log('\n2. Fast forwarding to voting period...')
  await ethers.provider.send('evm_increaseTime', [votingDelay + 1])
  await ethers.provider.send('evm_mine', [])

  // Check balances before voting
  console.log('\n--- Checking Balances Before Vote ---')
  const balanceBeforeUser2 = await usdt.balanceOf(user2.address)
  const balanceBeforePropertyToken = await usdt.balanceOf(PropertyTokenAddress)
  console.log('User2 USDT Balance:', ethers.formatEther(balanceBeforeUser2))
  console.log(
    'PropertyToken USDT Balance:',
    ethers.formatEther(balanceBeforePropertyToken)
  )

  // User2 votes on proposal
  console.log('\n3. User2 voting on transfer proposal...')
  const transferVoteTx = await propertyGovernance
    .connect(user2)
    .castVote(PropertyTokenAddress, transferProposalId ?? BigInt(1), true)
  await transferVoteTx.wait()
  console.log('Vote cast successfully')

  // Fast forward time to after voting period
  console.log('\n4. Fast forwarding to end of voting period...')
  await ethers.provider.send('evm_increaseTime', [votingPeriod + 1])
  await ethers.provider.send('evm_mine', [])

  // Execute proposal
  console.log('\n5. Executing transfer proposal...')
  try {
    const transferExecuteTx = await propertyGovernance
      .connect(user2)
      .executeProposal(PropertyTokenAddress, transferProposalId ?? BigInt(1))
    await transferExecuteTx.wait()
    console.log('Transfer proposal executed successfully')
  } catch (error) {
    console.log('Failed to execute transfer proposal:', error)
  }

  // Check final balances
  console.log('\n--- Checking Final Balances After Transfer ---')
  const balanceAfterUser2 = await usdt.balanceOf(user2.address)
  const balanceAfterPropertyToken = await usdt.balanceOf(PropertyTokenAddress)
  console.log('User2 USDT Balance:', ethers.formatEther(balanceAfterUser2))
  console.log(
    'PropertyToken USDT Balance:',
    ethers.formatEther(balanceAfterPropertyToken)
  )

  // Calculate and display the changes
  const user2Change = balanceAfterUser2 - balanceBeforeUser2
  const propertyTokenChange =
    balanceAfterPropertyToken - balanceBeforePropertyToken
  console.log('\nUSDT Balance Changes:')
  console.log('User2 Change:', ethers.formatEther(user2Change))
  console.log('PropertyToken Change:', ethers.formatEther(propertyTokenChange))

  // Print final proposal state
  const finalTransferProposal = await propertyGovernance.getProposal(
    PropertyTokenAddress,
    transferProposalId ?? BigInt(0)
  )
  console.log('\nFinal Transfer Proposal State:')
  console.log('Description:', finalTransferProposal.description)
  console.log('For Votes:', ethers.formatEther(finalTransferProposal.forVotes))
  console.log(
    'Against Votes:',
    ethers.formatEther(finalTransferProposal.againstVotes)
  )
  console.log('Executed:', finalTransferProposal.executed)

  console.log(
    '\n--- Starting Demo Part 5: Dividend Distribution and Claims ---'
  )

  // 1. Mint some USDT for dividend distribution
  console.log('\n1. Minting USDT for dividend distribution...')
  const dividendAmount = ethers.parseEther('50000') // 50k USDT for dividends
  await usdt.mint(user1.address, dividendAmount)
  console.log(
    'Minted',
    ethers.formatEther(dividendAmount),
    'USDT for dividends'
  )

  // 2. User1 approves PropertyToken contract to spend USDT
  console.log('\n2. Approving USDT for dividend distribution...')
  await usdt.connect(user1).approve(PropertyTokenAddress, dividendAmount)
  console.log('USDT approved for PropertyToken contract')

  // Print initial balances
  console.log('\nInitial Balances:')
  console.log(
    'User1 USDT:',
    ethers.formatEther(await usdt.balanceOf(user1.address))
  )
  console.log(
    'User2 USDT:',
    ethers.formatEther(await usdt.balanceOf(user2.address))
  )
  console.log(
    'User3 USDT:',
    ethers.formatEther(await usdt.balanceOf(user3.address))
  )

  console.log('\nDelegating voting power for user2...')
  await propertyToken.connect(user2).delegate(user2.address)
  console.log('\nDelegating voting power for user3...')
  await propertyToken.connect(user3).delegate(user3.address)

  // Check voting power after delegation
  console.log('\nChecking voting power after delegation:')
  console.log(
    'User2 voting power:',
    ethers.formatEther(await propertyToken.getVotes(user2.address))
  )
  console.log(
    'User3 voting power:',
    ethers.formatEther(await propertyToken.getVotes(user3.address))
  )
  await ethers.provider.send('evm_mine', [])

  // 3. Distribute dividends
  console.log('\n3. Distributing dividends...')
  const distributeTx = await propertyToken
    .connect(user1)
    .distributeDividends(await usdt.getAddress(), dividendAmount)
    const distributeReceiptTx = await distributeTx.wait()
 
  const distributeId = (distributeReceiptTx?.logs[1] as any).args[0]
  console.log('Dividends distributed with ID:', distributeId)
  console.log('Dividends distributed successfully')

  await ethers.provider.send('evm_mine', [])

  // 4. Get dividend info
  const dividendInfo = await propertyToken.getDividendInfo(distributeId!)
  console.log('\nDividend Information:')
  console.log('Amount:', ethers.formatEther(dividendInfo[0]), 'USDT')
  console.log('Total Supply at Snapshot:', ethers.formatEther(dividendInfo[1]))
  console.log('Timestamp:', dividendInfo[2])
  console.log('Token:', dividendInfo[3])

  // 5. Check if users can claim
  console.log('\nChecking claim eligibility:')
  const user2CanClaim = await propertyToken.canClaimDividend(user2.address, distributeId!)
  const user3CanClaim = await propertyToken.canClaimDividend(user3.address, distributeId!)
  console.log('User2 can claim:', user2CanClaim)
  console.log('User3 can claim:', user3CanClaim)

  // 6. Users claim their dividends
  if (user2CanClaim) {
    console.log('\n6. User2 claiming dividends...')
    const claimTx2 = await propertyToken
      .connect(user2)
      .claimDividend(distributeId!)
    await claimTx2.wait()
    console.log('User2 claimed dividends successfully')
  }

  if (user3CanClaim) {
    console.log('\nUser3 claiming dividends...')
    const claimTx3 = await propertyToken
      .connect(user3)
      .claimDividend(distributeId!)
    await claimTx3.wait()
    console.log('User3 claimed dividends successfully')
  }

  // 7. Print final balances
  console.log('\nFinal Balances:')
  console.log(
    'User1 USDT:',
    ethers.formatEther(await usdt.balanceOf(user1.address))
  )
  console.log(
    'User2 USDT:',
    ethers.formatEther(await usdt.balanceOf(user2.address))
  )
  console.log(
    'User3 USDT:',
    ethers.formatEther(await usdt.balanceOf(user3.address))
  )

  // 8. Try to claim again (should fail)
  console.log('\n8. Testing double-claim prevention...')
  try {
    await propertyToken.connect(user2).claimDividend(0)
    console.log('ERROR: Double claim succeeded when it should have failed')
  } catch (error) {
    console.log('Successfully prevented double claim (expected)')
  }

  // 9. Check if users can still claim
  console.log('\nFinal claim eligibility:')
  console.log(
    'User2 can claim:',
    await propertyToken.canClaimDividend(user2.address, 0)
  )
  console.log(
    'User3 can claim:',
    await propertyToken.canClaimDividend(user3.address, 0)
  )

  // 10. Try to distribute invalid amount (should fail)
  console.log('\n10. Testing invalid dividend distribution...')
  try {
    await propertyToken
      .connect(user1)
      .distributeDividends(await usdt.getAddress(), 0)
    console.log(
      'ERROR: Zero amount distribution succeeded when it should have failed'
    )
  } catch (error) {
    console.log('Successfully prevented zero amount distribution (expected)')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
