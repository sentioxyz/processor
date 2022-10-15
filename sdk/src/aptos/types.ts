import { Event } from 'aptos/src/generated'

export type EventInstance = Event & { version: string }

// export interface TypedEvent<T> extends Event {
//   // Typed data structured converted from ABI
//   // undefined if there is converting error, usually because the ABI/data
//   // mismatch
//   data: T
// }

// Don't use intermedidate type to make IDE happier
// export interface TypedEntryFunctionPayload<T extends Array<any>> extends TransactionPayload_EntryFunctionPayload {
//   arguments: T
// }
