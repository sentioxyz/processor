import { Data_StarknetEvent, ProcessResult } from '@sentio/protos'
import { StarknetChainId } from '@sentio/chain'
import { CallData, constants, events, ParsedEvent, RpcProvider } from 'starknet'
import { StarknetContext, StarknetTypedContext } from './context.js'
import { StarknetEvent } from './event.js'
import { ListStateStorage, mergeProcessResults } from '@sentio/runtime'
import { StarknetProcessorConfig } from './types.js'

export class StarknetProcessor {
  callHandlers: CallHandler<Data_StarknetEvent>[] = []

  private provider: RpcProvider

  static bind(config: StarknetProcessorConfig): StarknetProcessor {
    const processor = new StarknetProcessor(config)
    StarknetProcessorState.INSTANCE.addValue(processor)
    return processor
  }

  classHash: string

  constructor(readonly config: StarknetProcessorConfig) {}

  async configure() {
    this.provider = new RpcProvider({
      nodeUrl: getRpcEndpoint(this.config.chainId)
    })
    const classHash = await this.provider.getClassHashAt(this.config.address)
    if (!classHash) {
      throw new Error("can't find the class hash defined at " + this.config.address)
    }
    this.classHash = classHash
    if (!this.config.abi) {
      const clazz = await this.provider.getClass(classHash, 'latest')
      this.config.abi = clazz.abi
    }
  }

  public onEvent(
    event: string | string[],
    handler: (events: StarknetEvent<ParsedEvent>, ctx: StarknetContext) => void | Promise<void>
  ) {
    const eventFilter = Array.isArray(event) ? event : [event]
    if (!this.config.abi) {
      throw new Error('abi not found')
    }
    const abi = this.config.abi
    const callHandler = {
      handler: async (call: Data_StarknetEvent) => {
        try {
          const eventData = [call.result] as any[]
          const abiEvents = events.getAbiEvents(abi)

          const abiStructs = CallData.getAbiStruct(abi)
          const abiEnums = CallData.getAbiEnum(abi)

          const parsedEvents = events.parseEvents(eventData, abiEvents, abiStructs, abiEnums)
          const results: ProcessResult[] = []
          const { block_hash, block_number, transaction_hash, from_address } = call.result!
          for (let i = 0; i < parsedEvents.length; i++) {
            const ctx = new StarknetContext(
              this.config,
              this.provider,
              block_number,
              block_hash,
              transaction_hash,
              i,
              this.classHash
            )
            const e = new StarknetEvent(from_address, transaction_hash, parsedEvents[i])
            await handler(e, ctx)
            results.push(ctx.stopAndGetResult())
          }
          return mergeProcessResults(results)
        } catch (e) {
          console.error(e)
          return {
            gauges: [],
            counters: [],
            events: [],
            exports: [],
            states: {
              configUpdated: false
            }
          }
        }
      },
      eventFilter
    }
    this.callHandlers.push(callHandler)
    return this
  }
}

export type CallHandler<T> = {
  handler: (call: T) => Promise<ProcessResult>
  eventFilter?: string[]
}

function getRpcEndpoint(chainId: StarknetChainId | string) {
  switch (chainId) {
    case StarknetChainId.STARKNET_MAINNET:
      return constants.NetworkName.SN_MAIN
    default:
      return constants.NetworkName.SN_SEPOLIA
  }
}

export class StarknetProcessorState extends ListStateStorage<StarknetProcessor> {
  static INSTANCE = new StarknetProcessorState()
}

export abstract class AbstractStarknetProcessor {
  private readonly processor: StarknetProcessor
  protected constructor(
    readonly abi: any,
    readonly config: StarknetProcessorConfig
  ) {
    this.processor = new StarknetProcessor(config)
    StarknetProcessorState.INSTANCE.addValue(this.processor)
  }

  onEvent<T, C>(eventName: string, handler: (event: StarknetEvent<T>, ctx: StarknetTypedContext<C>) => void) {
    this.processor.onEvent(eventName, (events, ctx) => {
      const eventData = events.data[eventName] as T
      const e = new StarknetEvent<T>(events.caller, events.transactionHash, eventData)
      handler(e, ctx.toTyped<C>())
    })
  }
}
