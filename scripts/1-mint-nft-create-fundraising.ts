import { ethers } from 'hardhat'
import { getContracts } from './utils'

async function main() {
  const [, user1] = await ethers.getSigners()
  const { nft, factoryFundraising } = await getContracts()

  console.log('Running with user address:', user1.address)

  // 1. Mint NFT
  console.log('\n1. Minting NFT...')
  const mintTx = await nft.connect(user1).mintProperty(
    'Sample Location',
    1000, // area
    'Residential',
    'ipfs://sample-documents-hash'
  )
  await mintTx.wait()
  const nftId = 0 // First NFT minted
  console.log('NFT minted with ID:', nftId)

  // 2. Approve NFT for FactoryFundraising
  console.log('\n2. Approving NFT for FactoryFundraising...')
  const approveTx = await nft
    .connect(user1)
    .approve(await factoryFundraising.getAddress(), nftId)
  await approveTx.wait()
  console.log('NFT approved for FactoryFundraising')

  // 3. Create fundraising
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
  await createFundraisingTx.wait()

  const fundraisingAddress = await factoryFundraising.allFundraisingContracts(0)
  console.log('Fundraising created at:', fundraisingAddress)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
