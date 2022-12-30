import { Plugin, PluginManager } from '../plugin'
import {
  AccountConfig,
  AptosCallHandlerConfig,
  AptosEventHandlerConfig,
  ContractConfig,
  DataBinding,
  HandlerType,
  ProcessConfigResponse,
  ProcessResult,
} from '../gen/processor/protos/processor'
import { DEFAULT_MAX_BLOCK, errorString, mergeProcessResults, USER_PROCESSOR, Utf8ArrayToStr } from '../service'

import { ServerError, Status } from 'nice-grpc'

import { MoveResource, Transaction_UserTransaction } from 'aptos-sdk/src/generated'
import { AptosAccountProcessorState, AptosProcessorState, MoveResourcesWithVersionPayload } from './aptos-processor'
import { toBigInt } from '../core/numberish'
import Long from 'long'

export class AptosPlugin implements Plugin {
  name: string = 'AptosPlugin'

  private aptosEventHandlers: ((event: any) => Promise<ProcessResult>)[] = []
  private aptosCallHandlers: ((func: any) => Promise<ProcessResult>)[] = []
  private aptosResourceHandlers: ((resourceWithVersion: MoveResourcesWithVersionPayload) => Promise<ProcessResult>)[] =
    []

  configure(config: ProcessConfigResponse): void {
    for (const aptosProcessor of AptosProcessorState.INSTANCE.getValues()) {
      const contractConfig: ContractConfig = {
        processorType: USER_PROCESSOR,
        contract: {
          name: aptosProcessor.moduleName,
          chainId: aptosProcessor.getChainId(),
          address: aptosProcessor.config.address,
          abi: '',
        },
        intervalConfigs: [],
        logConfigs: [],
        traceConfigs: [],
        startBlock: Long.fromString(aptosProcessor.config.startVersion.toString()),
        endBlock: DEFAULT_MAX_BLOCK,
        instructionConfig: undefined,
        aptosEventConfigs: [],
        aptosCallConfigs: [],
      }
      // 1. Prepare event handlers
      for (const handler of aptosProcessor.eventHandlers) {
        const handlerId = this.aptosEventHandlers.push(handler.handler) - 1
        const eventHandlerConfig: AptosEventHandlerConfig = {
          filters: handler.filters.map((f) => {
            return {
              type: f.type,
              account: f.account || '',
            }
          }),
          handlerId,
        }
        contractConfig.aptosEventConfigs.push(eventHandlerConfig)
      }

      // 2. Prepare function handlers
      for (const handler of aptosProcessor.callHandlers) {
        const handlerId = this.aptosCallHandlers.push(handler.handler) - 1
        const functionHandlerConfig: AptosCallHandlerConfig = {
          filters: handler.filters.map((filter) => {
            return {
              function: filter.function,
              typeArguments: filter.typeArguments || [],
              withTypeArguments: filter.typeArguments ? true : false,
              includeFailed: filter.includeFailed || false,
            }
          }),
          handlerId,
        }
        contractConfig.aptosCallConfigs.push(functionHandlerConfig)
      }
      config.contractConfigs.push(contractConfig)
    }

    for (const aptosProcessor of AptosAccountProcessorState.INSTANCE.getValues()) {
      const accountConfig: AccountConfig = {
        address: aptosProcessor.config.address,
        chainId: aptosProcessor.getChainId(),
        startBlock: Long.fromValue(aptosProcessor.config.startVersion.toString()),
        aptosIntervalConfigs: [],
        intervalConfigs: [],
        logConfigs: [],
      }
      for (const handler of aptosProcessor.resourcesHandlers) {
        const handlerId = this.aptosResourceHandlers.push(handler.handler) - 1
        accountConfig.aptosIntervalConfigs.push({
          intervalConfig: {
            handlerId: handlerId,
            minutes: 0,
            minutesInterval: handler.timeIntervalInMinutes,
            slot: 0,
            slotInterval: handler.versionInterval,
          },
          type: handler.type || '',
        })
      }
      config.accountConfigs.push(accountConfig)
    }
  }

  supportedHandlers = [HandlerType.APT_CALL, HandlerType.APT_RESOURCE, HandlerType.APT_EVENT]

  processBinding(request: DataBinding): Promise<ProcessResult> {
    switch (request.handlerType) {
      case HandlerType.APT_CALL:
        return this.processAptosFunctionCall(request)
      case HandlerType.APT_EVENT:
        return this.processAptosEvent(request)
      case HandlerType.APT_RESOURCE:
        return this.processAptosResource(request)
      // case HandlerType.INSTRUCTION:
      //   return this.processInstruction(request)
      default:
        throw new ServerError(Status.INVALID_ARGUMENT, 'No handle type registered ' + request.handlerType)
    }
  }

  async processAptosEvent(binding: DataBinding): Promise<ProcessResult> {
    if (!binding.data) {
      throw new ServerError(Status.INVALID_ARGUMENT, "Event can't be empty")
    }
    const promises: Promise<ProcessResult>[] = []
    let event: Transaction_UserTransaction
    if (binding.data.aptEvent?.event) {
      event = binding.data.aptEvent?.event as Transaction_UserTransaction
    } else {
      const jsonString = Utf8ArrayToStr(binding.data.raw)
      event = JSON.parse(jsonString)
    }

    for (const handlerId of binding.handlerIds) {
      // only support aptos event for now
      promises.push(
        this.aptosEventHandlers[handlerId](event).catch((e) => {
          throw new ServerError(
            Status.INTERNAL,
            'error processing event: ' + JSON.stringify(event) + '\n' + errorString(e)
          )
        })
      )
    }
    return mergeProcessResults(await Promise.all(promises))
  }

  async processAptosResource(binding: DataBinding): Promise<ProcessResult> {
    if (!binding.data) {
      throw new ServerError(Status.INVALID_ARGUMENT, "Event can't be empty")
    }

    const resource: MoveResourcesWithVersionPayload = {
      resources: [],
      version: 0n,
      timestamp: 0,
    }
    if (binding.data.aptResource?.resources) {
      if (binding.data.aptResource.timestampMicros.greaterThan(Number.MAX_SAFE_INTEGER)) {
        throw new ServerError(Status.INVALID_ARGUMENT, 'timestamp is too large')
      }
      resource.timestamp = binding.data.aptResource.timestampMicros.toNumber()
      resource.version = toBigInt(binding.data.aptResource.version)
      resource.resources = binding.data.aptResource.resources as MoveResource[]
    } else {
      const jsonString = Utf8ArrayToStr(binding.data.raw)
      const json = JSON.parse(jsonString)
      if (Long.fromString(json.timestamp).greaterThan(Number.MAX_SAFE_INTEGER)) {
        throw new ServerError(Status.INVALID_ARGUMENT, 'timestamp is too large')
      }
      resource.timestamp = parseInt(json.timestamp)
      resource.version = toBigInt(json.version)
    }

    const promises: Promise<ProcessResult>[] = []
    for (const handlerId of binding.handlerIds) {
      promises.push(
        this.aptosResourceHandlers[handlerId](resource).catch((e) => {
          throw new ServerError(
            Status.INTERNAL,
            'error processing event: ' + JSON.stringify(resource) + '\n' + errorString(e)
          )
        })
      )
    }
    return mergeProcessResults(await Promise.all(promises))
  }

  async processAptosFunctionCall(binding: DataBinding): Promise<ProcessResult> {
    if (!binding.data) {
      throw new ServerError(Status.INVALID_ARGUMENT, "Event can't be empty")
    }
    let call: Transaction_UserTransaction
    if (binding.data.aptCall?.call) {
      call = binding.data.aptCall?.call as Transaction_UserTransaction
    } else {
      const jsonString = Utf8ArrayToStr(binding.data.raw)
      call = JSON.parse(jsonString)
    }

    const promises: Promise<ProcessResult>[] = []
    for (const handlerId of binding.handlerIds) {
      // only support aptos call for now
      const promise = this.aptosCallHandlers[handlerId](call).catch((e) => {
        throw new ServerError(Status.INTERNAL, 'error processing call: ' + JSON.stringify(call) + '\n' + errorString(e))
      })
      promises.push(promise)
    }
    return mergeProcessResults(await Promise.all(promises))
  }
}

PluginManager.INSTANCE.register(new AptosPlugin())
