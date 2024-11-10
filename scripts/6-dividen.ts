import { ethers } from 'hardhat'
import { getContracts } from './utils'

async function main() {
  const [, user1, user2] = await ethers.getSigners()
  const {usdt, factoryFundraising } = await getContracts()

  console.log('Running with user1 address:', user1.address)
  console.log('Running with user2 address:', user2.address)

  const propertyTokenAddress = '0x2f675e186a6500db71430d8f1a1fe8384fb31d85'
 
  const propertyToken = await ethers.getContractAt(
    'PropertyToken',
    propertyTokenAddress
  )
 
  // Check initial balances
  const propertyTokenBalance = await propertyToken.balanceOf(user2.address)
  console.log('\nInitial Property Token Balance:', ethers.formatEther(propertyTokenBalance))
  
  const usdtTokenBalance = await usdt.balanceOf(user1.address)
  console.log('Initial USDT Token Balance:', ethers.formatEther(usdtTokenBalance))

  try {
    // Mint USDT for user
    console.log('\n1. Minting USDT...')
    const usdtAmount = ethers.parseEther('100000') // 100k USDT
    const mintTx = await usdt.connect(user1).mint(user1.address, usdtAmount)
    await mintTx.wait()
    console.log('Minted USDT:', ethers.formatEther(usdtAmount))
 


    const dividendAmount = ethers.parseEther('100000')

    console.log('\n--- Distributing Dividends ---')

    // First approve the PropertyToken contract to spend the test tokens
    console.log('Approving usdt token transfer...')
    const approveTx = await usdt
      .connect(user1)
      .approve(propertyTokenAddress, dividendAmount)
    await approveTx.wait()
    console.log('Approval successful')

    // Distribute dividends
    console.log('Distributing dividends...')
    const distributeTx = await propertyToken
      .connect(user1)
      .distributeDividends(usdt, dividendAmount)
    const distributeReceiptTx = await distributeTx.wait()
    const distributeId = (distributeReceiptTx?.logs[1] as any).args[0]


      console.log(`Amount: ${ethers.formatEther(dividendAmount)} tokens`)

      // Wait a bit before claiming
      console.log('\nWaiting for a few seconds...')
      await new Promise((resolve) => setTimeout(resolve, 3000))

      console.log('\n--- Claiming Dividends ---')

      // Check if user2 can claim
      const canClaim = await propertyToken.canClaimDividend(
        user2.address,
        distributeId
      )
      console.log('Can user2 claim dividend?', canClaim)

      if (canClaim) {
        // Get dividend info before claiming
        const dividendInfo = await propertyToken.getDividendInfo(distributeId)
        console.log('\nDividend Info:')
        console.log(`Amount: ${ethers.formatEther(dividendInfo[0])}`)
        console.log(
          `Total Supply at Snapshot: ${ethers.formatEther(dividendInfo[1])}`
        )
        console.log(`Block Number: ${dividendInfo[2]}`)
        console.log(`Token Address: ${dividendInfo[3]}`)

        // Claim dividend
        console.log('\nClaiming dividend...')
        const claimTx = await propertyToken
          .connect(user2)
          .claimDividend(distributeId)
        const claimReceipt = await claimTx.wait()
        console.log(`claimReceipt!`)
    

        // Check final balances
        const finalTestTokenBalance = await usdt.balanceOf(user2.address)
        console.log(
          '\nFinal Test Token Balance for user2:',
          ethers.formatEther(finalTestTokenBalance)
        )
      } else {
        console.log('\nUser2 cannot claim this dividend. Possible reasons:')
        console.log('- Already claimed')
        console.log('- No voting power at snapshot')
        console.log('- Invalid dividend index')
      }
    
  } catch (error) {
    console.error('\nError:', error)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
