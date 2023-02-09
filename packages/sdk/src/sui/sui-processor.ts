// import { Data_SuiEvent, ProcessResult, SuiFetchConfig } from '@sentio/protos'
// import { ListStateStorage } from '@sentio/runtime'
// import { SuiNetwork, getChainId } from "./network.js";
// import { ServerError, Status } from "nice-grpc";
// import { SuiContext } from "./context.js";
// import { MoveEvent, SuiTransactionResponse } from "@mysten/sui.js";
//
// export class IndexConfigure {
//   address: string
//   network: SuiNetwork
//   startTimestamp: number
// }
//
// export class SuiBindOptions {
//   address: string
//   network?: SuiNetwork
//   startTimestamp?: number
// }
//
// export class SuiProcessorState extends ListStateStorage<SuiBaseProcessor> {
//   static INSTANCE = new SuiProcessorState()
// }
//
// export interface EventFilter {
//   type: string
//   account?: string
// }
//
// class EventHandler {
//   filters: EventFilter[]
//   handler: (event: Data_SuiEvent) => Promise<ProcessResult>
//   fetchConfig: SuiFetchConfig
// }
//
// export class SuiBaseProcessor {
//   readonly moduleName: string
//   config: IndexConfigure
//
//   eventHandlers: EventHandler[] = []
//
//   constructor(name: string, options: SuiBindOptions) {
//     this.config = configure(options)
//     SuiProcessorState.INSTANCE.addValue(this)
//   }
//
//   getChainId(): string {
//     return getChainId(this.config.network)
//   }
//
//   public onEvent(
//       handler: (event: MoveEvent, ctx: SuiContext) => void,
//       filter: EventFilter | EventFilter[],
//       fetchConfig?: SuiFetchConfig
//   ): SuiBaseProcessor {
//     let _filters: EventFilter[] = []
//     const _fetchConfig = fetchConfig || SuiFetchConfig.fromPartial({})
//
//     if (Array.isArray(filter)) {
//       _filters = filter
//     } else {
//       _filters.push(filter)
//     }
//
//     // const address = this.config.address
//     // const moduleName = this.moduleName
//
//     const processor = this
//
//     this.eventHandlers.push({
//       handler: async function (data) {
//         if (!data.transaction) {
//           throw new ServerError(Status.INVALID_ARGUMENT, 'event is null')
//         }
//         const txn = data.transaction as SuiTransactionResponse
//         if (!txn.effects.events || !txn.effects.events.length) {
//           throw new ServerError(Status.INVALID_ARGUMENT, 'no event in the transactions')
//         }
//
//         const ctx = new SuiContext(
//             processor.moduleName,
//             processor.config.network,
//             processor.config.address,
//             txn.timestamp_ms || 0,
//             txn
//         )
//
//         const events = txn.effects.events
//         txn.effects.events = []
//         for (const evt of events) {
//           const eventInstance = evt as MoveEvent
//           const decoded = eventInstance // TODO
//           // const decoded = MOVE_CODER.decodeEvent<any>(eventInstance)
//           await handler(decoded || eventInstance, ctx)
//         }
//
//         return ctx.getProcessResult()
//       },
//       filters: _filters,
//       fetchConfig: _fetchConfig,
//     })
//     return this
//   }
// }
//
// function configure(options: SuiBindOptions): IndexConfigure {
//   return {
//     startTimestamp: options.startTimestamp || 0,
//     address: options.address,
//     network: options.network || SuiNetwork.MAIN_NET,
//   }
// }
