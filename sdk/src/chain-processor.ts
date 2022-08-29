import { LogDescription } from '@ethersproject/abi'
import { Log } from '@ethersproject/abstract-provider'

import { Context, EthContext } from './context'
import { EventFilter } from 'ethers'
import { O11yResult } from './gen/processor/protos/processor'
import { Event } from '@ethersproject/contracts'
import { BytesLike } from '@ethersproject/bytes'
import { EventsHandler } from './base-processor'
import { Networkish } from '@ethersproject/providers'

export class ChainProcessor {
  network: string
  logHandlers: EventsHandler[] = []

  constructor(network: Networkish) {
    this.network = network
  }

  public onLog(handler: (log: Log, ctx: EthContext) => void, filter: EventFilter | EventFilter[]) {
    const chainId = this.chainId

    let _filters: EventFilter[] = []

    if (Array.isArray(filter)) {
      _filters = filter
    } else {
      _filters.push(filter)
    }

    this.logHandlers.push({
      filters: _filters,
      handler: async function (log) {
        const ctx = new EthContext(chainId, undefined, log)
        await handler(log, ctx)
        return {
          gauges: ctx.gauges,
          counters: ctx.counters,
        }
      },
    })
    return this
  }
}
