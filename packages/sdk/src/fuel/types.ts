import { MapStateStorage } from '@sentio/runtime'
import {
  Data_FuelBlock,
  Data_FuelCall,
  Data_FuelReceipt,
  FuelAssetHandlerConfig,
  FuelCallHandlerConfig,
  HandleInterval,
  OnIntervalConfig,
  ProcessResult
} from '@sentio/protos'
import { Block, TransactionSummary } from 'fuels'

export interface FuelBaseProcessor<T> {
  configure(): Promise<void>
  config: T
  callHandlers: CallHandler<Data_FuelCall>[]
  blockHandlers: BlockHandler[]
  logHandlers?: LogHandler<Data_FuelReceipt>[]
}

export class FuelProcessorState extends MapStateStorage<FuelBaseProcessor<any>> {
  static INSTANCE = new FuelProcessorState()
}

export type CallHandler<T> = {
  handlerName: string
  handler: (call: T) => Promise<ProcessResult>
  fetchConfig?: Partial<FuelCallHandlerConfig>
  assetConfig?: Partial<FuelAssetHandlerConfig>
}

export type LogHandler<T> = {
  handlerName: string
  handler: (call: T) => Promise<ProcessResult>
  logConfig?: {
    logIds: string[]
  }
}

export type BlockHandler = {
  blockInterval?: HandleInterval
  timeIntervalInMinutes?: HandleInterval
  handler: (block: Data_FuelBlock) => Promise<ProcessResult>
  handlerName: string
  fetchConfig?: Partial<OnIntervalConfig>
}

export interface FuelLog<T> {
  logId: string
  data: T
  receiptIndex: number
}

export type FuelTransaction = TransactionSummary & {
  blockNumber?: string
  logs?: FuelLog<any>[]
  sender?: string
}

export type FuelBlock = Omit<Block, 'transactionIds'>
