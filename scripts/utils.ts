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
    PropertyGovernance: '0xF038D6dBead9aB4f83e4Cf955464132048Bf15BA',
    FactoryFundraisingDao: '0x188d97f93F594914792d3592033Dee5c637302fD',
    FactoryToken: '0x4e048Db12B5769fa06A5bF5df65B806a1AE2c6d3',
    FactoryFundraising: '0xfEb148017401503cB0726BC3875FcE01e51204f7'
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
