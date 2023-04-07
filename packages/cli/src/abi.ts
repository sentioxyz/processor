import { AptosClient } from 'aptos-sdk'
import { JsonRpcProvider, Connection } from '@mysten/sui.js'
import { CHAIN_IDS } from './chain.js'
import chalk from 'chalk'
import process from 'process'
import path from 'path'
import fs from 'fs-extra'
import fetch from 'node-fetch'

export const ETH_API_URL_MAP: Record<string, string> = {}

ETH_API_URL_MAP[CHAIN_IDS.ETHEREUM] = 'https://api.etherscan.io'
ETH_API_URL_MAP[CHAIN_IDS.GOERLI] = 'https://api-goerli.etherscan.io'
ETH_API_URL_MAP[CHAIN_IDS.BINANCE] = 'https://api.bscscan.com'
ETH_API_URL_MAP[CHAIN_IDS.POLYGON] = 'https://api.polygonscan.com'
ETH_API_URL_MAP[CHAIN_IDS.ARBITRUM] = 'https://api.arbiscan.io'
ETH_API_URL_MAP[CHAIN_IDS.OPTIMISM] = 'https://api-optimistic.etherscan.io'
// ETH_API_URL_MAP[CHAIN_IDS.BASE_GOERLI] = 'https://api-goerli.basescan.org' // didn't see any verified contract

ETH_API_URL_MAP[CHAIN_IDS.AVALANCHE] = 'https://api.snowtrace.io'
ETH_API_URL_MAP[CHAIN_IDS.CRONOS] = 'https://api.cronoscan.com'
ETH_API_URL_MAP[CHAIN_IDS.MOONBEAM] = 'https://api-moonbeam.moonscan.io'
ETH_API_URL_MAP[CHAIN_IDS.FANTOM] = 'https://api.ftmscan.com'

export async function getABI(
  chain: string,
  address: string,
  name: string | undefined
): Promise<{ name?: string; abi: object | string }> {
  let ethApi
  let aptosClient: AptosClient | undefined
  let suiClient: JsonRpcProvider | undefined

  switch (chain) {
    case CHAIN_IDS.APTOS_MAINNET:
      aptosClient = new AptosClient('https://mainnet.aptoslabs.com/')
      break
    case CHAIN_IDS.APTOS_TESTNET:
      aptosClient = new AptosClient('https://testnet.aptoslabs.com/')
      break
    case CHAIN_IDS.SUI_MAINNET:
      throw Error('SUI mainnet is not support yet, try sui/testnet')
    // suiClient = new JsonRpcProvider('https://fullnode.mainnet.sui.io/')
    // break
    case CHAIN_IDS.SUI_TESTNET:
      suiClient = new JsonRpcProvider(new Connection({ fullnode: 'https://fullnode.testnet.sui.io/' }))
      break
    default:
      ethApi = ETH_API_URL_MAP[chain]
      if (!ethApi) {
        console.error(chalk.red(`chain ${chain} not supported for direct add, please download the ABI manually`))
        process.exit(1)
      }
  }

  const baseErrMsg = chalk.red(
    `Failed to automatic download contract ${address} from ${chain}, please manually download abi and put it into abis/eth directory`
  )

  if (aptosClient) {
    try {
      return {
        abi: await aptosClient.getAccountModules(address),
      }
    } catch (e) {
      console.error(baseErrMsg, e)
      process.exit(1)
    }
  }
  if (suiClient) {
    try {
      return {
        abi: await suiClient.getNormalizedMoveModulesByPackage({ package: address }),
      }
    } catch (e) {
      console.error(baseErrMsg, e)
      process.exit(1)
    }
  }

  try {
    let resp = (await (await fetch(`${ethApi}/api?module=contract&action=getabi&address=${address}`)).json()) as any
    if (resp.status !== '1') {
      throw Error(resp.message)
    }
    const abi = resp.result

    if (!name) {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      resp = (await (
        await fetch(`${ethApi}/api?module=contract&action=getsourcecode&address=${address}`)
      ).json()) as any
      if (resp.status !== '1') {
        throw Error(resp.message)
      }
      const contractName = resp.result[0].ContractName
      if (contractName) {
        name = contractName
      }
    }
    return {
      name,
      abi,
    }
  } catch (e) {
    console.error(baseErrMsg, e)
    process.exit(1)
  }
}

export function getABIFilePath(chain: string, name: string): string {
  let subpath
  switch (chain) {
    case CHAIN_IDS.APTOS_MAINNET:
      subpath = 'aptos'
      break
    case CHAIN_IDS.APTOS_TESTNET:
      subpath = 'aptos/testnet'
      break
    case CHAIN_IDS.SUI_MAINNET:
      subpath = 'sui'
      break
    case CHAIN_IDS.SUI_TESTNET:
      subpath = 'sui/testnet'
      break
    default:
      subpath = 'eth'
  }

  return path.join('abis', subpath, name + '.json')
}

export function writeABIFile(obj: string | object, output: string) {
  if (typeof obj === 'string') {
    obj = JSON.parse(obj)
  }
  const data = JSON.stringify(obj, null, 2)
  fs.mkdirSync(path.dirname(output), { recursive: true })
  fs.writeFileSync(output, data)
  console.log(chalk.green('ABI has been downloaded to', output))
}
