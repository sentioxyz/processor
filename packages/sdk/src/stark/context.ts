import { ChainId } from '@sentio/chain'
import { RecordMetaData } from '@sentio/protos'
import { BaseContext, Labels, normalizeLabels } from '../core/index.js'
import { Contract, Provider, RpcProvider } from 'starknet'
import { StarknetProcessorConfig } from './types.js'
import { Abi } from '@sentio/abi-wan-kanabi'
import { StarknetContractView } from './contract.js'

class AbstractContext extends BaseContext {
  constructor(
    readonly provider: Provider,
    readonly contractAddress: string,
    readonly chainId: ChainId | string,
    readonly blockNumber: number,
    readonly blockHash: string,
    readonly transactionHash: string,
    readonly logIndex: number = -1,
    readonly contractName: string = '',
    readonly abi?: Abi
  ) {
    super({})
  }

  protected getMetaDataInternal(name: string, labels: Labels): RecordMetaData {
    return {
      address: this.contractAddress,
      contractName: '',
      blockNumber: BigInt(this.blockNumber),
      transactionIndex: 0,
      transactionHash: this.transactionHash,
      chainId: this.getChainId(),
      name: name,
      logIndex: this.logIndex,
      labels: normalizeLabels(labels)
    }
  }

  getChainId(): ChainId {
    return this.chainId as ChainId
  }
}

export class StarknetContext extends AbstractContext {
  private _contract: Contract

  constructor(
    private readonly config: StarknetProcessorConfig,
    provider: RpcProvider,
    blockNumber: number,
    blockHash: string,
    transaction_hash: string,
    logIndex: number,
    private readonly classHash: string
  ) {
    super(
      provider,
      config.address,
      config.chainId,
      blockNumber,
      blockHash,
      transaction_hash,
      logIndex,
      config.name ?? classHash.slice(0, 8),
      config.abi
    )
  }

  get contract(): Contract {
    if (!this.abi) {
      throw new Error('abi not found')
    }
    if (!this._contract) {
      this._contract = new Contract(this.abi, this.contractAddress, this.provider)
    }
    return this._contract
  }

  toTyped<CT>() {
    return new StarknetTypedContext<CT>(
      this.config,
      this.provider,
      this.blockNumber,
      this.blockHash,
      this.transactionHash,
      this.logIndex,
      this.classHash
    )
  }
}

export class StarknetTypedContext<T> extends AbstractContext {
  private _contract: StarknetContractView

  constructor(
    config: StarknetProcessorConfig,
    provider: RpcProvider,
    blockNumber: number,
    blockHash: string,
    transaction_hash: string,
    logIndex: number,
    classHash: string
  ) {
    super(
      provider,
      config.address,
      config.chainId,
      blockNumber,
      blockHash,
      transaction_hash,
      logIndex,
      config.name ?? classHash.slice(0, 8),
      config.abi
    )
  }

  get contract(): T {
    if (!this.abi) {
      throw new Error('abi not found')
    }
    if (!this._contract) {
      this._contract = new StarknetContractView(this.abi, this.contractAddress, this.provider, this.blockNumber)
    }
    return this._contract as T
  }
}
