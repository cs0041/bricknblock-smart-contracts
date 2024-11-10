import { ethers } from 'hardhat'
import fs from 'fs'

// export function getDeployedAddresses() {
//   const addresses = JSON.parse(
//     fs.readFileSync('deployed-addresses.json', 'utf8')
//   )
//   return addresses
// }

export async function getContracts() {
  //   const addresses = getDeployedAddresses()
  const addresses = {
    USDT: '0x776Ded774F25A3f353763aC174A4F4C11a6deC39',
    NFT: '0x71353005930B49805df867D75C1610092070F3cc',
    PropertyGovernance: '0x60962143Ea130bb806e4E4f89c2580f6A31f457A',
    FactoryFundraisingDao: '0x145737D4641da44a76b846b6bc26cE037c19e391',
    FactoryToken: '0xf64593Ff0cD457293D3400DD1F8C949F010e11d8',
    FactoryFundraising: '0xB34e3DA3e1Cb266Ad048693b3CD9a1eff3850Bc2',
  }

  const usdt = await ethers.getContractAt('Token', addresses.USDT)
  const nft = await ethers.getContractAt('RealEstateNFT', addresses.NFT)
  const propertyGovernance = await ethers.getContractAt(
    'PropertyGovernance',
    addresses.PropertyGovernance
  )
  const factoryFundraising = await ethers.getContractAt(
    'FactoryFundraising',
    addresses.FactoryFundraising
  )
  const factoryFundraisingDao = await ethers.getContractAt(
    'FactoryFundraisingDao',
    addresses.FactoryFundraisingDao
  )

  return { usdt, nft, propertyGovernance, factoryFundraising, factoryFundraisingDao }
}
