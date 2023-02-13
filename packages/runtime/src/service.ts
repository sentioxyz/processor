import { CallContext, ServerError, Status } from 'nice-grpc'

import {
  DataBinding,
  HandlerType,
  ProcessBindingResponse,
  ProcessBindingsRequest,
  ProcessConfigRequest,
  ProcessConfigResponse,
  ProcessorServiceImplementation,
  ProcessResult,
  StartRequest,
  Empty,
} from '@sentio/protos'

import { PluginManager } from './plugin.js'
import { errorString, mergeProcessResults } from './utils.js'
;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

export class ProcessorServiceImpl implements ProcessorServiceImplementation {
  private started = false
  private processorConfig: ProcessConfigResponse

  private readonly loader: () => Promise<any>

  private readonly shutdownHandler?: () => void

  constructor(loader: () => Promise<any>, shutdownHandler?: () => void) {
    this.loader = loader
    this.shutdownHandler = shutdownHandler
  }

  async getConfig(request: ProcessConfigRequest, context: CallContext): Promise<ProcessConfigResponse> {
    if (!this.started) {
      throw new ServerError(Status.UNAVAILABLE, 'Service Not started.')
    }
    if (!this.processorConfig) {
      throw new ServerError(Status.INTERNAL, 'Process config empty.')
    }
    return this.processorConfig
  }

  async configure() {
    this.processorConfig = ProcessConfigResponse.fromPartial({})
    await PluginManager.INSTANCE.configure(this.processorConfig)
  }

  async start(request: StartRequest, context: CallContext): Promise<Empty> {
    if (this.started) {
      return {}
    }

    try {
      // for (const plugin of ['@sentio/sdk', '@sentio/sdk/eth']) {
      //   try {
      //     await import(plugin)
      //   } catch (e) {
      //     console.error('Failed to load plugin: ', plugin)
      //   }
      // }
      //
      // for (const plugin of ['@sentio/sdk/aptos', '@sentio/sdk/solana']) {
      //   try {
      //     await import(plugin)
      //   } catch (e) {}
      // }

      await this.loader()
    } catch (e) {
      throw new ServerError(Status.INVALID_ARGUMENT, 'Failed to load processor: ' + errorString(e))
    }

    await PluginManager.INSTANCE.start(request)

    try {
      await this.configure()
    } catch (e) {
      throw new ServerError(Status.INTERNAL, 'Failed to start processor : ' + errorString(e))
    }
    this.started = true
    return {}
  }

  async stop(request: Empty, context: CallContext): Promise<Empty> {
    console.log('Server Shutting down in 5 seconds')
    if (this.shutdownHandler) {
      setTimeout(this.shutdownHandler, 5000)
    }
    return {}
  }

  async processBindings(request: ProcessBindingsRequest, options?: CallContext): Promise<ProcessBindingResponse> {
    if (!this.started) {
      throw new ServerError(Status.UNAVAILABLE, 'Service Not started.')
    }

    const promises = request.bindings.map((binding) => this.processBinding(binding))
    let promise
    try {
      promise = await Promise.all(promises)
    } catch (e) {
      throw e
    }
    const result = mergeProcessResults(promise)

    let updated = false
    if (PluginManager.INSTANCE.stateDiff(this.processorConfig)) {
      await this.configure()
      updated = true
    }

    return {
      result,
      configUpdated: updated,
    }
  }

  async processBinding(request: DataBinding, options?: CallContext): Promise<ProcessResult> {
    const result = await PluginManager.INSTANCE.processBinding(request)
    recordRuntimeInfo(result, request.handlerType)
    return result
  }

  async *processBindingsStream(requests: AsyncIterable<DataBinding>, context: CallContext) {
    for await (const request of requests) {
      const result = await this.processBinding(request)
      let updated = false
      if (PluginManager.INSTANCE.stateDiff(this.processorConfig)) {
        await this.configure()
        updated = true
      }
      yield {
        result,
        configUpdated: updated,
      }
    }
  }
}

function recordRuntimeInfo(results: ProcessResult, handlerType: HandlerType) {
  for (const list of [results.gauges, results.counters, results.events, results.exports]) {
    list.forEach((e) => {
      e.runtimeInfo = {
        from: handlerType,
      }
    })
  }
}
