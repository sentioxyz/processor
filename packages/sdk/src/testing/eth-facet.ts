import { TestProcessorServer } from './test-processor-server.js'
import { DataBinding, HandlerType, ProcessBindingResponse } from '@sentio/protos'
import { Trace } from '../eth/eth.js'
import { BlockParams, LogParams, Networkish } from 'ethers/providers'
import { Block } from 'ethers'
import { getNetworkFromCtxOrNetworkish } from '../eth/provider.js'

export class EthFacet {
  server: TestProcessorServer

  constructor(server: TestProcessorServer) {
    this.server = server
  }

  testTrace(trace: Trace, network: Networkish = 1): Promise<ProcessBindingResponse> {
    return this.testTraces([trace], network)
  }

  testTraces(traces: Trace[], network: Networkish = 1): Promise<ProcessBindingResponse> {
    const bindings = []
    for (const trace of traces) {
      const binding = this.buildTraceBinding(trace, network)
      if (!binding) {
        throw Error('Invalid test trace: ' + JSON.stringify(trace))
      }
      bindings.push(binding)
    }
    return this.server.processBindings({
      bindings: bindings,
    })
  }

  buildTraceBinding(trace: Trace, network: Networkish = 1): DataBinding | undefined {
    if (trace.type !== 'call' || !trace.action.input) {
      throw Error('Invalid test trace: ' + JSON.stringify(trace))
    }
    const signature = trace.action.input.slice(0, 10)

    for (const contract of this.server.contractConfigs) {
      if (contract.contract?.chainId !== getNetworkFromCtxOrNetworkish(network).chainId.toString()) {
        continue
      }
      if (trace.action.to?.toLowerCase() !== contract.contract?.address.toLowerCase()) {
        continue
      }
      for (const config of contract.traceConfigs) {
        if (config.signature == signature) {
          return {
            data: {
              ethTrace: {
                trace,
                timestamp: new Date(),
              },
            },
            handlerIds: [config.handlerId],
            handlerType: HandlerType.ETH_TRACE,
          }
        }
      }
    }
    return undefined
  }

  testLog(log: LogParams, network: Networkish = 1): Promise<ProcessBindingResponse> {
    return this.testLogs([log], network)
  }

  testLogs(logs: LogParams[], network: Networkish = 1): Promise<ProcessBindingResponse> {
    const bindings = []
    for (const log of logs) {
      const binding = this.buildLogBinding(log, network)
      if (!binding) {
        throw Error('Invalid test log: ' + JSON.stringify(log))
      }
      bindings.push(binding)
    }
    return this.server.processBindings({
      bindings: bindings,
    })
  }

  buildLogBinding(log: LogParams, network: Networkish = 1): DataBinding | undefined {
    for (const contract of this.server.contractConfigs) {
      if (contract.contract?.chainId !== getNetworkFromCtxOrNetworkish(network).chainId.toString()) {
        continue
      }
      if (log.address.toLowerCase() !== contract.contract?.address.toLowerCase()) {
        continue
      }
      for (const config of contract.logConfigs) {
        for (const filter of config.filters) {
          // if (filter.topics.length != log.topics.length) {
          //   continue
          // }

          let match = true
          for (const topicIdx in filter.topics) {
            const logTopic = log.topics[topicIdx]
            const possibleTopic = filter.topics[topicIdx].hashes
            if (possibleTopic.length === 0) {
              // match all
              continue
            }
            if (possibleTopic.find((e) => e.toLowerCase() === logTopic.toLowerCase())) {
              // find one
              continue
            }
            match = false
            break
          }
          if (match) {
            return {
              data: {
                ethLog: { log, timestamp: new Date() },
              },
              handlerIds: [config.handlerId],
              handlerType: HandlerType.ETH_LOG,
            }
          }
        }
      }
    }
    return undefined
  }
  testAccountLog(address: string, log: LogParams, network: Networkish = 1): Promise<ProcessBindingResponse> {
    return this.testAccountLogs(address, [log], network)
  }

  testAccountLogs(address: string, logs: LogParams[], network: Networkish = 1): Promise<ProcessBindingResponse> {
    const bindings = []
    for (const log of logs) {
      const binding = this.buildAccountLogBinding(address, log, network)
      if (!binding) {
        throw Error('Invalid test log: ' + JSON.stringify(log))
      }
      bindings.push(binding)
    }
    return this.server.processBindings({
      bindings: bindings,
    })
  }

  buildAccountLogBinding(address: string, log: LogParams, network: Networkish = 1): DataBinding | undefined {
    for (const account of this.server.accountConfigs) {
      if (account.chainId !== getNetworkFromCtxOrNetworkish(network).chainId.toString()) {
        continue
      }
      if (address.toLowerCase() !== account.address.toLowerCase()) {
        continue
      }
      for (const config of account.logConfigs) {
        for (const filter of config.filters) {
          // if (filter.topics.length != log.topics.length) {
          //   continue
          // }

          let match = true
          for (const topicIdx in filter.topics) {
            const logTopic = log.topics[topicIdx]
            const possibleTopic = filter.topics[topicIdx].hashes
            if (possibleTopic.length === 0) {
              // match all
              continue
            }
            if (possibleTopic.find((e) => e.toLowerCase() === logTopic.toLowerCase())) {
              // find one
              continue
            }
            match = false
            break
          }
          if (match) {
            return {
              data: {
                ethLog: { log, timestamp: new Date() },
              },
              handlerIds: [config.handlerId],
              handlerType: HandlerType.ETH_LOG,
            }
          }
        }
      }
    }
    return undefined
  }

  testBlock(
    block: Partial<BlockParams> & { number: number },
    network: Networkish = 1
  ): Promise<ProcessBindingResponse> {
    return this.testBlocks([block], network)
  }

  testBlocks(blocks: Partial<BlockParams> & { number: number }[], network: Networkish = 1) {
    const bindings = []
    for (const block of blocks) {
      const binding = this.buildBlockBinding(block, network)
      if (!binding) {
        throw Error('Invalid test block: ' + JSON.stringify(block))
      }
      bindings.push(binding)
    }
    return this.server.processBindings({
      bindings: bindings,
    })
  }

  buildBlockBinding(block: Partial<Block> & { number: number }, network: Networkish = 1): DataBinding {
    const binding: DataBinding = {
      data: {
        ethBlock: { block },
      },
      handlerType: HandlerType.ETH_BLOCK,
      handlerIds: [],
    }
    for (const contract of this.server.contractConfigs) {
      if (contract.contract?.chainId !== getNetworkFromCtxOrNetworkish(network).chainId.toString()) {
        continue
      }
      const longBlockNumber = block.number
      if (longBlockNumber < contract.startBlock) {
        continue
      }
      if (contract.endBlock !== 0n && longBlockNumber >= contract.endBlock) {
        continue
      }

      for (const config of contract.intervalConfigs) {
        binding.handlerIds.push(config.handlerId)
      }
    }
    return binding
  }
}
