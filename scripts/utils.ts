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
    NFT: '0x5061213ed078Eba29fF1C6da64e7b66A1F499E2f',
    PropertyGovernance: '0xA3a3949FA69fff971Ea7E45fB11c9FD9F899EE04',
    FactoryFundraisingDao: '0xD667766A0B5Dea93658E8f6D3835408129D94F98',
    FactoryToken: '0x2Be2332E8fc7E39043F7fCD8a1F783353F4d018f',
    FactoryFundraising: '0xA896EA960219596b2457104026C01ef556906090',
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

  return { usdt, nft, propertyGovernance, factoryFundraising }
}
