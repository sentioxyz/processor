import { ListStateStorage } from '@sentio/runtime'
import { Data_FuelCall, FuelCallHandlerConfig, ProcessResult } from '@sentio/protos'
import { FuelContext, FuelTransaction } from './context.js'
import { BN, Provider } from 'fuels'
import { FuelNetwork, getRpcEndpoint } from './network.js'

export class FuelProcessorState extends ListStateStorage<FuelProcessor> {
  static INSTANCE = new FuelProcessorState()
}

export class FuelProcessor {
  callHandlers: CallHandler<Data_FuelCall>[] = []

  static networkConsts: {
    gasPerByte: BN
    gasPriceFactor: BN
    maxInputs: BN
    gasCosts: any
  }
  static bind(config: FuelProcessorConfig): FuelProcessor {
    const processor = new FuelProcessor(config)
    FuelProcessorState.INSTANCE.addValue(processor)
    return processor
  }

  constructor(readonly config: FuelProcessorConfig) {}

  private async getNetworkConsts() {
    if (FuelProcessor.networkConsts) {
      return FuelProcessor.networkConsts
    }

    const url = getRpcEndpoint(this.config.chainId)
    const provider = await Provider.create(url)
    // get some consts from network
    const {
      consensusParameters: { gasPerByte, gasPriceFactor, maxInputs, gasCosts }
    } = provider.getChain()
    FuelProcessor.networkConsts = { gasPerByte, gasPriceFactor, maxInputs, gasCosts }
    return FuelProcessor.networkConsts
  }

  public onTransaction(handler: (transaction: FuelTransaction, ctx: FuelContext) => void | Promise<void>) {
    const callHandler = {
      handler: async (call: Data_FuelCall) => {
        const { rawPayload, id, gasPrice, status } = call.transaction as any
        const tx = new FuelTransaction(rawPayload, id, gasPrice, status.type, status.block.id)

        const ctx = new FuelContext(tx, this.config.chainId)
        await handler(tx, ctx)
        return ctx.stopAndGetResult()
      },
      fetchConfig: {
        filters: []
      }
    }
    this.callHandlers.push(callHandler)
    return this
  }
}

export type CallHandler<T> = {
  handler: (call: T) => Promise<ProcessResult>
  fetchConfig: Partial<FuelCallHandlerConfig>
}

type FuelProcessorConfig = {
  address: string
  name?: string
  chainId: FuelNetwork
  startBlock?: bigint
  endBlock?: bigint
}
