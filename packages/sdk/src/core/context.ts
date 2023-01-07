import { RecordMetaData } from '@sentio/protos'
import { BaseContract, EventFilter } from 'ethers'
import { Block, Log } from '@ethersproject/abstract-provider'
import { normalizeLabels } from './meter.js'
import { Trace } from './trace.js'
import { Labels } from './metadata.js'
import { CHAIN_IDS } from '../utils/chain.js'
import { BaseContext } from './base-context.js'

export abstract class EthContext extends BaseContext {
  chainId: number
  address: string
  log?: Log
  block?: Block
  trace?: Trace
  blockNumber: bigint | number
  transactionHash?: string
  timestamp: Date

  protected constructor(chainId: number, address: string, block?: Block, log?: Log, trace?: Trace, timestamp?: Date) {
    super()
    this.chainId = chainId
    this.log = log
    this.block = block
    this.trace = trace
    this.address = address
    this.timestamp = timestamp || new Date(0)
    if (log) {
      this.blockNumber = log.blockNumber
      this.transactionHash = log.transactionHash
    } else if (block) {
      this.blockNumber = block.number
    } else if (trace) {
      this.blockNumber = trace.blockNumber
      this.transactionHash = trace.transactionHash
    }
  }

  protected abstract getContractName(): string

  getMetaData(name: string, labels: Labels): RecordMetaData {
    if (this.log) {
      return {
        address: this.address,
        contractName: this.getContractName(),
        blockNumber: BigInt(this.blockNumber),
        transactionIndex: this.log.transactionIndex,
        transactionHash: this.transactionHash || '',
        logIndex: this.log.logIndex,
        chainId: this.chainId.toString(),
        name: name,
        labels: normalizeLabels(labels),
      }
    }
    if (this.block) {
      return {
        address: this.address,
        contractName: this.getContractName(),
        blockNumber: BigInt(this.blockNumber),
        transactionIndex: -1,
        transactionHash: '',
        logIndex: -1,
        chainId: this.chainId.toString(),
        name: name,
        labels: normalizeLabels(labels),
      }
    }
    if (this.trace) {
      return {
        address: this.address,
        contractName: this.getContractName(),
        blockNumber: BigInt(this.blockNumber),
        transactionIndex: this.trace.transactionPosition,
        transactionHash: this.transactionHash || '',
        logIndex: -1,
        chainId: this.chainId.toString(),
        name: name,
        labels: normalizeLabels(labels),
      }
    }
    throw new Error("Invaid ctx argument can't happen")
  }
}

export class AccountContext extends EthContext {
  constructor(chainId: number, address: string, block?: Block, log?: Log, trace?: Trace) {
    super(chainId, address, block, log, trace)
  }
  protected getContractName(): string {
    return 'account'
  }
}

export class ContractContext<
  TContract extends BaseContract,
  TContractBoundView extends BoundContractView<TContract, ContractView<TContract>>
> extends EthContext {
  contract: TContractBoundView
  contractName: string

  constructor(
    contractName: string,
    view: TContractBoundView,
    chainId: number,
    block?: Block,
    log?: Log,
    trace?: Trace,
    timestamp?: Date
  ) {
    super(chainId, view.rawContract.address, block, log, trace, timestamp)
    view.context = this
    this.contractName = contractName
    this.contract = view
  }

  protected getContractName(): string {
    return this.contractName
  }
}

export class ContractView<TContract extends BaseContract> {
  filters: { [name: string]: (...args: Array<any>) => EventFilter }
  protected contract: TContract

  constructor(contract: TContract) {
    this.contract = contract
    this.filters = contract.filters
  }

  get rawContract() {
    return this.contract
  }

  get provider() {
    return this.contract.provider
  }
}

export class BoundContractView<TContract extends BaseContract, TContractView extends ContractView<TContract>> {
  protected view: TContractView
  // context will be set right after context creation (in context's constructor)
  context: ContractContext<TContract, BoundContractView<TContract, TContractView>>

  constructor(view: TContractView) {
    this.view = view
  }

  get rawContract() {
    return this.view.rawContract
  }

  get provider() {
    return this.view.provider
  }

  get filters() {
    return this.view.filters
  }
}

export class SuiContext extends BaseContext {
  address: string
  moduleName: string
  blockNumber: bigint

  constructor(address: string, slot: bigint) {
    super()
    this.address = address
    this.blockNumber = slot
  }

  getMetaData(name: string, labels: Labels): RecordMetaData {
    return {
      address: this.address,
      contractName: this.moduleName,
      blockNumber: this.blockNumber,
      transactionIndex: 0,
      transactionHash: '', // TODO
      logIndex: 0,
      chainId: CHAIN_IDS.SUI_DEVNET, // TODO set in context
      name: name,
      labels: normalizeLabels(labels),
    }
  }
}
