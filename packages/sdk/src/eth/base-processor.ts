import { BaseContract, DeferredTopicFilter } from 'ethers'
import { BlockParams, Network } from 'ethers/providers'

import { BoundContractView, ContractContext, ContractView } from './context.js'
import {
  AddressType,
  Data_EthBlock,
  Data_EthLog,
  Data_EthTrace,
  EthFetchConfig,
  HandleInterval,
  ProcessResult,
} from '@sentio/protos'
import { BindOptions } from './bind-options.js'
import { PromiseOrVoid } from '../core/promises.js'
import { ServerError, Status } from 'nice-grpc'
import { fixEmptyKey, TypedEvent, TypedCallTrace, formatEthData } from './eth.js'
import * as console from 'console'
import { getNetworkFromCtxOrNetworkish } from './provider.js'
import sha3 from 'js-sha3'

export interface AddressOrTypeEventFilter extends DeferredTopicFilter {
  addressType?: AddressType
  address?: string
}

export class EventsHandler {
  filters: AddressOrTypeEventFilter[]
  handler: (event: Data_EthLog) => Promise<ProcessResult>
  fetchConfig: EthFetchConfig
}

export class TraceHandler {
  signatures: string[]
  handler: (trace: Data_EthTrace) => Promise<ProcessResult>
  fetchConfig: EthFetchConfig
}

export class BlockHandlder {
  blockInterval?: HandleInterval
  timeIntervalInMinutes?: HandleInterval
  handler: (block: Data_EthBlock) => Promise<ProcessResult>
}

class BindInternalOptions {
  address: string
  network: Network
  name: string
  startBlock: bigint
  endBlock?: bigint
}

export abstract class BaseProcessor<
  TContract extends BaseContract,
  TBoundContractView extends BoundContractView<TContract, ContractView<TContract>>
> {
  blockHandlers: BlockHandlder[] = []
  eventHandlers: EventsHandler[] = []
  traceHandlers: TraceHandler[] = []

  config: BindInternalOptions

  constructor(config: BindOptions) {
    this.config = {
      address: config.address,
      name: config.name || '',
      network: getNetworkFromCtxOrNetworkish(config.network),
      startBlock: 0n,
    }
    if (config.startBlock) {
      this.config.startBlock = BigInt(config.startBlock)
    }
    if (config.endBlock) {
      this.config.endBlock = BigInt(config.endBlock)
    }
  }

  protected abstract CreateBoundContractView(): TBoundContractView

  public getChainId(): number {
    return Number(this.config.network.chainId)
  }

  public onEvent(
    handler: (event: TypedEvent, ctx: ContractContext<TContract, TBoundContractView>) => PromiseOrVoid,
    filter: DeferredTopicFilter | DeferredTopicFilter[],
    fetchConfig?: Partial<EthFetchConfig>
  ): this {
    const chainId = this.getChainId()
    let _filters: DeferredTopicFilter[] = []

    if (Array.isArray(filter)) {
      _filters = filter
    } else {
      _filters.push(filter)
    }

    const contractName = this.config.name
    const processor = this
    this.eventHandlers.push({
      filters: _filters,
      fetchConfig: EthFetchConfig.fromPartial(fetchConfig || {}),
      handler: async function (data: Data_EthLog) {
        const { log, block, transaction, transactionReceipt } = formatEthData(data)
        if (!log) {
          throw new ServerError(Status.INVALID_ARGUMENT, 'Log is empty')
        }
        const contractView = processor.CreateBoundContractView()

        const ctx = new ContractContext<TContract, TBoundContractView>(
          contractName,
          contractView,
          chainId,
          data.timestamp,
          block,
          log,
          undefined,
          transaction,
          transactionReceipt
        )
        const logParam = log as any as { topics: Array<string>; data: string }

        const parsed = contractView.rawContract.interface.parseLog(logParam)

        if (parsed) {
          const event: TypedEvent = { ...log, name: parsed.name, args: fixEmptyKey(parsed) }
          await handler(event, ctx)
          return ctx.getProcessResult()
        }
        return ProcessResult.fromPartial({})
      },
    })
    return this
  }

  public onBlockInterval(
    handler: (block: BlockParams, ctx: ContractContext<TContract, TBoundContractView>) => PromiseOrVoid,
    blockInterval = 250,
    backfillBlockInterval = 1000
  ): this {
    return this.onInterval(handler, undefined, {
      recentInterval: blockInterval,
      backfillInterval: backfillBlockInterval,
    })
  }

  public onTimeInterval(
    handler: (block: BlockParams, ctx: ContractContext<TContract, TBoundContractView>) => PromiseOrVoid,
    timeIntervalInMinutes = 60,
    backfillTimeIntervalInMinutes = 240
  ): this {
    return this.onInterval(
      handler,
      { recentInterval: timeIntervalInMinutes, backfillInterval: backfillTimeIntervalInMinutes },
      undefined
    )
  }

  public onInterval(
    handler: (block: BlockParams, ctx: ContractContext<TContract, TBoundContractView>) => PromiseOrVoid,
    timeInterval: HandleInterval | undefined,
    blockInterval: HandleInterval | undefined
  ): this {
    const chainId = this.getChainId()
    const processor = this
    const contractName = this.config.name

    this.blockHandlers.push({
      handler: async function (data: Data_EthBlock) {
        const { block } = formatEthData(data)

        if (!block) {
          throw new ServerError(Status.INVALID_ARGUMENT, 'Block is empty')
        }

        const contractView = processor.CreateBoundContractView()

        const ctx = new ContractContext<TContract, TBoundContractView>(
          contractName,
          contractView,
          chainId,
          new Date(block.timestamp * 1000),
          block,
          undefined,
          undefined
        )
        await handler(block, ctx)
        return ctx.getProcessResult()
      },
      timeIntervalInMinutes: timeInterval,
      blockInterval: blockInterval,
    })
    return this
  }

  public onAllEvents(
    handler: (event: TypedEvent, ctx: ContractContext<TContract, TBoundContractView>) => PromiseOrVoid,
    fetchConfig?: Partial<EthFetchConfig>
  ): this {
    const _filters: DeferredTopicFilter[] = []
    const tmpContract = this.CreateBoundContractView()

    for (const fragment of tmpContract.rawContract.interface.fragments) {
      if (fragment.type === 'event') {
        const filter = tmpContract.rawContract.filters[fragment.format()]
        _filters.push(filter())
      }
    }
    return this.onEvent(
      function (log, ctx) {
        return handler(log, ctx)
      },
      _filters,
      fetchConfig
    )
  }

  public onTrace(
    signatures: string | string[],
    handler: (trace: TypedCallTrace, ctx: ContractContext<TContract, TBoundContractView>) => PromiseOrVoid,
    fetchConfig?: Partial<EthFetchConfig>
  ): this {
    const chainId = this.getChainId()
    const contractName = this.config.name
    const processor = this
    if (typeof signatures === 'string') {
      signatures = [signatures]
    }

    this.traceHandlers.push({
      signatures,
      fetchConfig: EthFetchConfig.fromPartial(fetchConfig || {}),
      handler: async function (data: Data_EthTrace) {
        const contractView = processor.CreateBoundContractView()
        const contractInterface = contractView.rawContract.interface
        const { trace, block, transaction, transactionReceipt } = formatEthData(data)
        const sighash = trace?.action.input?.slice(0, 10)
        if (!sighash) {
          throw new ServerError(Status.INVALID_ARGUMENT, 'trace has no sighash')
        }
        const fragment = contractInterface.getFunction(sighash)

        if (!trace || !fragment) {
          throw new ServerError(Status.INVALID_ARGUMENT, 'trace is null')
        }
        const typedTrace = trace as TypedCallTrace
        typedTrace.name = fragment.name
        typedTrace.functionSignature = fragment.format()
        // const trace = data.trace as Trace
        if (!trace?.action.input) {
          return ProcessResult.fromPartial({})
        }
        const traceData = '0x' + trace.action.input.slice(10)
        try {
          typedTrace.args = contractInterface.getAbiCoder().decode(fragment.inputs, traceData, true)
        } catch (e) {
          if (!trace.error) {
            throw e
          }
          console.error('Failed to decode successful trace', e)
        }
        const ctx = new ContractContext<TContract, TBoundContractView>(
          contractName,
          contractView,
          chainId,
          data.timestamp,
          block,
          undefined,
          trace,
          transaction,
          transactionReceipt
        )
        await handler(typedTrace, ctx)
        return ctx.getProcessResult()
      },
    })
    return this
  }

  public onAllTraces(
    handler: (event: TypedCallTrace, ctx: ContractContext<TContract, TBoundContractView>) => PromiseOrVoid,
    fetchConfig?: Partial<EthFetchConfig>
  ): this {
    const tmpContract = this.CreateBoundContractView()
    const sighashes = []

    for (const fragment of tmpContract.rawContract.interface.fragments) {
      if (fragment.type === 'function') {
        const signature = fragment.format()
        const test = new TextEncoder().encode(signature)
        const sighash = '0x' + sha3.keccak_256(test).substring(0, 8)
        sighashes.push(sighash)
      }
    }
    return this.onTrace(
      sighashes,
      function (trace, ctx) {
        return handler(trace, ctx)
      },
      fetchConfig
    )
  }
}