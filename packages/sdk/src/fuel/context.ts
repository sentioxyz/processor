import { BaseContext, Labels, normalizeLabels } from '../core/index.js'
import { ChainId } from '@sentio/chain'
import { RecordMetaData } from '@sentio/protos'
import { arrayify, Transaction, TransactionCoder } from 'fuels'

export class FuelTransaction {
  readonly transaction: Transaction

  constructor(
    readonly rawPayload: Uint8Array,
    readonly id: string,
    readonly gasPrice: string,
    readonly status: string,
    readonly blockId: string
  ) {
    this.transaction = new TransactionCoder().decode(arrayify(rawPayload), 0)?.[0] as Transaction
    return this
  }
}

export class FuelContext extends BaseContext {
  constructor(
    readonly transaction: FuelTransaction | null,
    readonly chainId: ChainId
  ) {
    super({})
  }

  getChainId(): ChainId {
    return this.chainId
  }

  protected getMetaDataInternal(name: string, labels: Labels): RecordMetaData {
    return {
      address: this.transaction?.id || '',
      contractName: this.transaction?.id || '', // TODO
      blockNumber: 0n,
      transactionIndex: 0,
      transactionHash: this.transaction?.id || '', // TODO
      chainId: this.getChainId(),
      name: name,
      logIndex: 0,
      labels: normalizeLabels(labels)
    }
  }
}
