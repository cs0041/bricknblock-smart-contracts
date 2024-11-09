import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with the account:', deployer.address)
  console.log(
    'Account balance:',
    (await deployer.provider.getBalance(deployer.address)).toString()
  )

  // 0. Deploy USDT
  console.log('\nDeploying USDT...')
  // const USDT = await ethers.getContractFactory('Token')
  const initialSupply = ethers.parseEther('1000000') // 1 million USDT
  // const usdt = await USDT.deploy(initialSupply)
  // await usdt.waitForDeployment()
  const usdt = await ethers.getContractAt(
    'Token',
    '0x776Ded774F25A3f353763aC174A4F4C11a6deC39'
  )
  console.log('USDT deployed to:', await usdt.getAddress())

  // 1. Deploy NFT
  console.log('\nDeploying NFT...')
  // const NFT = await ethers.getContractFactory('RealEstateNFT')
  // const nft = await NFT.deploy()
  // await nft.waitForDeployment()
    const nft = await ethers.getContractAt(
      'RealEstateNFT',
      '0x71353005930B49805df867D75C1610092070F3cc'
    )
  console.log('NFT deployed to:', await nft.getAddress())

  // 2. Deploy PropertyGovernance
  console.log('\nDeploying PropertyGovernance...')
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
  console.log('\nDeploying FactoryFundraisingDao...')
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
  console.log('\nDeploying FactoryToken...')
  const FactoryToken = await ethers.getContractFactory('FactoryToken')
  const factoryToken = await FactoryToken.deploy(
    await factoryFundraisingDao.getAddress(),
    await propertyGovernance.getAddress()
  )
  await factoryToken.waitForDeployment()
  console.log('FactoryToken deployed to:', await factoryToken.getAddress())

  // 5. Deploy FactoryFundraising
  console.log('\nDeploying FactoryFundraising...')
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
  console.log('\nSetting factories in PropertyGovernance...')
  const setFactoriesTx = await propertyGovernance.setFactory(
    await factoryFundraisingDao.getAddress(),
    await factoryToken.getAddress()
  )
  await setFactoriesTx.wait()
  console.log('Factories set in PropertyGovernance')

  // 7. Set FactoryFundraising in FactoryToken
  console.log('\nSetting FactoryFundraising in FactoryToken...')
  const setFactoryFundraisingTx = await factoryToken.setFactoryFundraising(
    await factoryFundraising.getAddress()
  )
  await setFactoryFundraisingTx.wait()
  console.log('FactoryFundraising set in FactoryToken')

  // 8. Set FactoryFundraising in NFT
  console.log('\nSetting FactoryFundraising in NFT...')
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

  // Print deployment information for verification
  console.log('\nVerification Information:')
  console.log('------------------')
  console.log('USDT Constructor Arguments:', [initialSupply.toString()])
  console.log('PropertyGovernance Constructor Arguments:', [
    await usdt.getAddress(),
  ])
  console.log('FactoryFundraisingDao Constructor Arguments:', [
    await propertyGovernance.getAddress(),
  ])
  console.log('FactoryToken Constructor Arguments:', [
    await factoryFundraisingDao.getAddress(),
    await propertyGovernance.getAddress(),
  ])
  console.log('FactoryFundraising Constructor Arguments:', [
    await usdt.getAddress(),
    await nft.getAddress(),
    await factoryToken.getAddress(),
  ])
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
