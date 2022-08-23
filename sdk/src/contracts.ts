import { Networkish } from '@ethersproject/networks'
import { ContractWrapper } from '@sentio/sdk'
import { getNetwork } from '@ethersproject/providers'
import { BaseContract } from 'ethers'

export function getContractByABI(abiName: string, address: string, network: Networkish) {
  const chainId = getNetwork(network).chainId.toString()
  const sig = [abiName, address.toLowerCase(), chainId].join('_')
  return global.PROCESSOR_STATE.contracts.get(sig)
}

export function addContractByABI(
  abiName: string,
  address: string,
  network: Networkish,
  contract: ContractWrapper<BaseContract>
) {
  const chainId = getNetwork(network).chainId.toString()
  const sig = [abiName, address.toLowerCase(), chainId].join('_')
  return global.PROCESSOR_STATE.contracts.set(sig, contract)
}
