import { ProcessResult } from '../gen'
import {
  AptosBindOptions,
  AptosContext,
  AptosNetwork,
  Transaction_UserTransaction,
  TransactionPayload_EntryFunctionPayload,
} from '.'
import type { MoveModule } from 'aptos/src/generated'

import Long from 'long'
import { APTOS_MAINNET_ID, APTOS_TESTNET_ID } from '../utils/chain'
import { EventInstance } from './types'

type IndexConfigure = {
  address: string
  network: AptosNetwork
  startVersion: Long
  // endSeqNumber?: Long
}

export interface EventFilter extends ArgumentsFilter {
  type: string
}

export interface CallFilter extends CallArgumentsFilter {
  function: string
}

export interface CallArgumentsFilter extends ArgumentsFilter {
  typeArguments?: string[]
}

export interface ArgumentsFilter {
  arguments?: string[]
}

class EventHandler {
  filters: EventFilter[]
  handler: (event: EventInstance) => Promise<ProcessResult>
}

class CallHandler {
  filters: CallFilter[]
  handler: (call: Transaction_UserTransaction) => Promise<ProcessResult>
}

export class AptosBaseProcessor {
  readonly moduleName: string
  config: IndexConfigure
  eventHandlers: EventHandler[] = []
  callHandlers: CallHandler[] = []
  // typeMapping = new Map<string, MoveStruct>()

  constructor(moduleName: string, options: AptosBindOptions) {
    this.moduleName = moduleName
    this.configure(options)
    global.PROCESSOR_STATE.aptosProcessors.push(this)

    // const abi = this.getABI()
    // if (abi) {
    //   const prefix = [this.config.address.toLowerCase(), moduleName].join("::")
    //   for (const struct of abi.structs) {
    //     this.typeMapping.set([prefix, struct.name].join("::"), struct)
    //   }
    // }
  }

  getABI(): MoveModule | undefined {
    return undefined
  }

  public onTransaction(
    handler: (transaction: Transaction_UserTransaction, ctx: AptosContext) => void
  ): AptosBaseProcessor {
    const address = this.config.address
    const moduleName = this.moduleName
    this.callHandlers.push({
      handler: async function (tx) {
        const ctx = new AptosContext(moduleName, address, Long.fromString(tx.version), tx)
        if (tx) {
          handler(tx, ctx)
        }
        return {
          gauges: ctx.gauges,
          counters: ctx.counters,
          logs: ctx.logs,
        }
      },
      filters: [],
    })
    return this
  }

  public onEvent(
    handler: (event: EventInstance, ctx: AptosContext) => void,
    filter: EventFilter | EventFilter[]
  ): AptosBaseProcessor {
    let _filters: EventFilter[] = []

    if (Array.isArray(filter)) {
      _filters = filter
    } else {
      _filters.push(filter)
    }

    // const address = this.config.address
    // const moduleName = this.moduleName

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const processor = this

    this.eventHandlers.push({
      handler: async function (event) {
        const ctx = new AptosContext(processor.moduleName, processor.config.address, Long.fromString(event.version))
        if (event) {
          const decoded = processor.tryDecode(event)
          handler(decoded, ctx)
        }
        return {
          gauges: ctx.gauges,
          counters: ctx.counters,
          logs: ctx.logs,
        }
      },
      filters: _filters,
    })
    return this
  }

  public onEntryFunctionCall(
    handler: (call: TransactionPayload_EntryFunctionPayload, ctx: AptosContext) => void,
    filter: CallFilter | CallFilter[]
  ): AptosBaseProcessor {
    let _filters: CallFilter[] = []

    if (Array.isArray(filter)) {
      _filters = filter
    } else {
      _filters.push(filter)
    }

    const address = this.config.address
    const moduleName = this.moduleName

    this.callHandlers.push({
      handler: async function (tx) {
        const ctx = new AptosContext(moduleName, address, Long.fromString(tx.version), tx)
        if (tx) {
          const payload = tx.payload as TransactionPayload_EntryFunctionPayload
          handler(payload, ctx)
        }
        return {
          gauges: ctx.gauges,
          counters: ctx.counters,
          logs: ctx.logs,
        }
      },
      filters: _filters,
    })
    return this
  }

  private configure(options: AptosBindOptions) {
    let startVersion = Long.ZERO
    if (options.startVersion) {
      startVersion = Long.fromValue(options.startVersion)
    }

    this.config = {
      startVersion: startVersion,
      address: options.address,
      network: options.network || AptosNetwork.TEST_NET,
    }
  }

  getChainId(): string {
    switch (this.config.network) {
      case AptosNetwork.TEST_NET:
        return APTOS_TESTNET_ID
      case AptosNetwork.MAIN_NET:
        return APTOS_MAINNET_ID
    }
  }

  tryDecode(event: EventInstance): EventInstance {
    return event
    // const struct = this.typeMapping.get(event.type)
    // if (!struct) {
    //   return event
    // }
    // // const decodedData = decode(struct, event.data)
    //
    // const typedEvent: TypedEvent<any> = {
    //   ...event
    //   // typedArgs: decodedData
    // }
    // return typedEvent
  }
}
