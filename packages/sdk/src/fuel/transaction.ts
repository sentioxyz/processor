import {
  AbiMap,
  arrayify,
  assembleTransactionSummary,
  bn,
  processGqlReceipt,
  Transaction,
  TransactionCoder,
  TransactionResult
} from 'fuels'

export interface FuelTransaction {
  rawPayload: Uint8Array
  id: string
  gasPrice: string
  status?: string
  blockId?: string
  transaction: Transaction
}

export class FuelTransactionLite implements FuelTransaction {
  readonly transaction: Transaction

  constructor(
    readonly rawPayload: Uint8Array,
    readonly id: string,
    readonly gasPrice: string,
    readonly status: string,
    readonly blockId: string
  ) {
    this.transaction = new TransactionCoder().decode(arrayify(rawPayload), 0)?.[0] as Transaction
  }
}

export class FuelTransactionWithResult implements FuelTransaction {
  readonly transaction: Transaction
  readonly transactionResult: TransactionResult
  readonly status?: string
  readonly blockId?: string
  gasPrice: string
  id: string
  rawPayload: Uint8Array

  constructor(gqlTransaction: any, abiMap: AbiMap, networkConsts: any) {
    this.rawPayload = arrayify(gqlTransaction.rawPayload)
    const [decodedTransaction] = new TransactionCoder().decode(this.rawPayload, 0)
    this.transaction = decodedTransaction
    const receipts = gqlTransaction.receipts?.map(processGqlReceipt) || []

    const { gasPerByte, gasPriceFactor, maxInputs, gasCosts } = networkConsts
    this.id = gqlTransaction.id
    this.gasPrice = gqlTransaction.gasPrice
    const transactionInfo = assembleTransactionSummary({
      id: gqlTransaction.id,
      receipts,
      transaction: decodedTransaction,
      transactionBytes: this.rawPayload,
      gqlTransactionStatus: gqlTransaction.status,
      gasPerByte: bn(gasPerByte),
      gasPriceFactor: bn(gasPriceFactor),
      abiMap,
      maxInputs,
      gasCosts
    })

    this.transactionResult = {
      gqlTransaction,
      ...transactionInfo
    }
    this.blockId = transactionInfo.blockId
    this.status = transactionInfo.status
  }
}
