import { Plugin, PluginManager, USER_PROCESSOR } from '@sentio/runtime'
import {
  ContractConfig,
  Data_SuiEvent,
  DataBinding,
  HandlerType,
  ProcessConfigResponse,
  ProcessResult,
  SuicEventHandlerConfig,
} from '@sentio/protos'

import { ServerError, Status } from 'nice-grpc'

import { SuiProcessorState } from './sui-processor.js'
import { getChainId } from './network.js'

export class SuiPlugin extends Plugin {
  name: string = 'SuiPlugin'

  private suiEventHandlers: ((event: Data_SuiEvent) => Promise<ProcessResult>)[] = []

  async configure(config: ProcessConfigResponse) {
    for (const suiProcessor of SuiProcessorState.INSTANCE.getValues()) {
      const contractConfig = ContractConfig.fromPartial({
        transactionConfig: [],
        processorType: USER_PROCESSOR,
        contract: {
          name: suiProcessor.moduleName,
          chainId: getChainId(suiProcessor.config.network),
          address: suiProcessor.config.address,
          abi: '',
        },
        startBlock: BigInt(suiProcessor.config.startTimestamp),
      })
      for (const handler of suiProcessor.eventHandlers) {
        const handlerId = this.suiEventHandlers.push(handler.handler) - 1
        const eventHandlerConfig: SuicEventHandlerConfig = {
          filters: handler.filters.map((f) => {
            return {
              type: f.type,
              account: f.account || '',
            }
          }),
          fetchConfig: handler.fetchConfig,
          handlerId,
        }
        contractConfig.suiEventConfigs.push(eventHandlerConfig)
      }
      config.contractConfigs.push(contractConfig)
    }
  }

  supportedHandlers = []

  processBinding(request: DataBinding): Promise<ProcessResult> {
    switch (request.handlerType) {
      case HandlerType.SUI_EVENT:
      // return this.processSolInstruction(request)
      default:
        throw new ServerError(Status.INVALID_ARGUMENT, 'No handle type registered ' + request.handlerType)
    }
  }
}

PluginManager.INSTANCE.register(new SuiPlugin())
