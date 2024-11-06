import { ethers } from 'hardhat'
import { getContracts } from './utils'

async function main() {
  const [, , user2] = await ethers.getSigners()
  const { usdt, factoryFundraising } = await getContracts()

  console.log('Running with user address:', user2.address)

  // Get fundraising address
  const fundraisingAddress = await factoryFundraising.allFundraisingContracts(0)
  const fundraising = await ethers.getContractAt(
    'RealEstateFundraising',
    fundraisingAddress
  )

  // 1. Mint USDT for user
  console.log('\n1. Minting USDT...')
  const usdtAmount = ethers.parseEther('1000000') // 500k USDT
  const mintTx = await usdt.connect(user2).mint(user2.address, usdtAmount)
  await mintTx.wait()
  console.log('Minted USDT:', ethers.formatEther(usdtAmount))

  // 2. Approve USDT for fundraising
  console.log('\n2. Approving USDT...')
  const approveTx = await usdt
    .connect(user2)
    .approve(fundraisingAddress, usdtAmount)
  await approveTx.wait()
  console.log('USDT approved for fundraising')

  // 3. Invest
  console.log('\n3. Investing...')
  const investTx = await fundraising.connect(user2).invest(usdtAmount)
  await investTx.wait()
  console.log('Investment successful')

  // Print final state
  const state = await fundraising.offer()
  console.log('\nFinal Fundraising State:')
  console.log('Total Raised:', ethers.formatEther(state.totalRaised), 'USDT')
  console.log('isCompleted:', state.isCompleted)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
