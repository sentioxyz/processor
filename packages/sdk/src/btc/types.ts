import { BaseContext, Labels, normalizeLabels } from '../core/index.js'
import { RecordMetaData } from '@sentio/protos'
import { ChainId } from '@sentio/chain'
import { BigDecimal } from '@sentio/bigdecimal'

type Vin = {
  txid: string
  vout: number
  is_coinbase: boolean
  scriptsig: string
  scriptsig_asm: string
  inner_redeemscript_asm?: string
  inner_witnessscript_asm?: string
  sequence: number
  witness: string[]
  prevout: Vout
  is_pegin?: boolean
  issuance?: {
    asset_id: string
    is_reissuance: boolean
    asset_blinding_nonce: string
    asset_entropy: string
    contract_hash: string
    assetamount?: number
    assetamountcommitment?: string
    tokenamount?: number
    tokenamountcommitment?: string
  }
}

type Vout = {
  scriptpubkey: string
  scriptpubkey_asm: string
  scriptpubkey_type: string
  scriptpubkey_address: string
  value: number
  valuecommitment?: string
  asset?: string
  assetcommitment?: string
  pegout?: {
    genesis_hash: string
    scriptpubkey: string
    scriptpubkey_asm: string
    scriptpubkey_address: string
  }
}

type Status = {
  confirmed: boolean
  block_height?: number
  block_hash?: string
  block_time?: number
}

export type Transaction = {
  txid: string
  version: number
  locktime: number
  size: number
  weight: number
  fee: number
  vin: Vin[]
  vout: Vout[]
  status: Status
}

export class BTCContext extends BaseContext {
  constructor(
    readonly chainId: string,
    readonly name: string,
    readonly tx: Transaction,
    readonly address: string
  ) {
    super({})
  }

  protected getMetaDataInternal(name: string, labels: Labels): RecordMetaData {
    return {
      address: this.address,
      contractName: this.name,
      blockNumber: BigInt(this.tx.status?.block_time ?? 0),
      transactionIndex: 0,
      transactionHash: this.tx.txid,
      chainId: this.getChainId(),
      name: name,
      logIndex: 0,
      labels: normalizeLabels(labels)
    }
  }

  getChainId(): ChainId {
    return this.chainId as ChainId
  }
}

export type TransactionFields =
  | 'block_hash'
  | 'block_number'
  | 'block_timestamp'
  | 'transaction_hash'
  | 'transaction_index'
  | 'size'
  | 'virtual_size'
  | 'version'
  | 'lock_time'
  | 'input_count'
  | 'output_count'

export type VinFields =
  | 'vin_index'
  | 'coinbase'
  | 'spent_transaction_hash'
  | 'spent_output_index'
  | 'sequence'
  | 'witness'
  | 'script_asm'
  | 'script_hex'
  | 'value'

export type VOutFields =
  | 'value'
  | 'vout_index'
  | 'script_asm'
  | 'script_hex'
  | 'script_type'
  | 'script_address'
  | 'script_reg_sigs'

export type Filter<F extends string> = {
  [K in F]?: Condition
}

export type Condition = {
  eq?: Comparable
  gt?: Comparable
  gte?: Comparable
  lt?: Comparable
  lte?: Comparable
  ne?: Comparable
  // string has the prefix
  prefix?: string
  // string contains
  contains?: string
  not_contains?: string
  length_eq?: number
  length_gt?: number
  length_lt?: number
  // array contains any of the values
  has_any?: Array<string | Comparable>
  // array contains all the values
  has_all?: Array<string | Comparable>
}

export type Filters<T extends string> = Filter<T> | Filter<T>[]

export type VinFilter = Filters<VinFields> & {
  preVOut?: Filter<VOutFields>
  preTransaction?: {
    filter?: Array<Filter<TransactionFields>>
    outputFilter?: Filters<VOutFields>
    // can't have inputFilter here, we can only support one level of nesting
  }
}

export type VOutFilter = Filters<VOutFields>

export type TransactionFilter = {
  inputFilter?: VinFilter
  outputFilter?: VOutFilter
  filter?: Array<Filter<TransactionFields>>
}

type Comparable = number | BigDecimal | bigint | Date

export type TransactionFilters = TransactionFilter | TransactionFilter[]

/*const stakingFilter: TransactionFilter = {
  filter: [{ block_number: { gt: 800000 } }],
  outputFilter: {
    vout_index: { eq: 1 },
    script_asm: { prefix: 'OP_RETURN 62626e31' }
  }
}

const outboundFilter: TransactionFilter = {
  filter: [{ block_number: { gt: 800000 } }],
  inputFilter: {
    preTransaction: {
      outputFilter: {
        vout_index: { eq: 1 },
        script_asm: { prefix: 'OP_RETURN 62626e31' }
      }
    }
  }
}*/
