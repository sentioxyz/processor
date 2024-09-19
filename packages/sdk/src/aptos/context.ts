import { RecordMetaData } from '@sentio/protos'
import { type Labels, normalizeLabels } from '../index.js'
import { MoveCoder } from './index.js'
import {
  Aptos,
  Event,
  MoveResource,
  UserTransactionResponse,
  MoveModuleBytecode,
  AptosConfig
} from '@aptos-labs/ts-sdk'
import { defaultMoveCoder } from './move-coder.js'
import { AptosNetwork } from './network.js'
import { Endpoints } from '@sentio/runtime'
import { ServerError, Status } from 'nice-grpc'
import { MoveAccountContext, MoveContext } from '../move/index.js'

export class AptosContext extends MoveContext<AptosNetwork, MoveModuleBytecode, Event | MoveResource> {
  moduleName: string
  version: bigint
  transaction: UserTransactionResponse
  eventIndex: number
  coder: MoveCoder

  constructor(
    moduleName: string,
    network: AptosNetwork,
    address: string,
    version: bigint,
    transaction: UserTransactionResponse | null,
    eventIndex: number,
    baseLabels: Labels | undefined
  ) {
    super(baseLabels)
    this.address = address.toLowerCase()
    this.network = network
    this.moduleName = moduleName
    this.version = version
    this.eventIndex = eventIndex
    this.coder = defaultMoveCoder(network)
    if (transaction) {
      this.transaction = transaction
    }
  }

  getChainId() {
    return this.network
  }

  getTimestamp(): number {
    return parseInt(this.transaction.timestamp)
  }

  getMetaDataInternal(name: string, labels: Labels): RecordMetaData {
    return {
      address: this.address,
      contractName: this.moduleName,
      blockNumber: this.version,
      transactionIndex: 0,
      transactionHash: this.transaction?.hash || '', // TODO
      logIndex: this.eventIndex,
      chainId: this.getChainId(),
      name: name,
      labels: normalizeLabels(labels)
    }
  }

  getClient(): Aptos {
    let chainServer = Endpoints.INSTANCE.chainServer.get(this.network)
    if (!chainServer) {
      throw new ServerError(Status.INTERNAL, 'RPC endpoint not provided')
    }
    chainServer = chainServer + '/v1'
    return new Aptos(new AptosConfig({ fullnode: chainServer }))
  }
}

export class AptosResourcesContext extends MoveAccountContext<AptosNetwork, MoveModuleBytecode, Event | MoveResource> {
  version: bigint
  timestampInMicros: number
  coder: MoveCoder

  constructor(network: AptosNetwork, address: string, version: bigint, timestampInMicros: number, baseLabels?: Labels) {
    super(baseLabels)
    this.address = address
    this.network = network
    this.version = version
    this.timestampInMicros = timestampInMicros
    this.coder = defaultMoveCoder(network)
  }

  getChainId() {
    return this.network
  }

  getTimestamp(): number {
    return this.timestampInMicros
  }

  getMetaDataInternal(name: string, labels: Labels): RecordMetaData {
    return {
      address: this.address,
      contractName: 'resources',
      blockNumber: this.version,
      transactionIndex: 0,
      transactionHash: '',
      logIndex: 0,
      chainId: this.getChainId(),
      name: name,
      labels: normalizeLabels(labels)
    }
  }

  getClient(): Aptos {
    let chainServer = Endpoints.INSTANCE.chainServer.get(this.network)
    if (!chainServer) {
      throw new ServerError(Status.INTERNAL, 'RPC endpoint not provided')
    }
    chainServer = chainServer + '/v1'
    return new Aptos(new AptosConfig({ fullnode: chainServer }))
  }
}
