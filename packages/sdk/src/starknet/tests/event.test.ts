import { describe, it } from 'node:test'
import { hash, events, CallData } from 'starknet'
import assert from 'assert'

import sierra from './testsierra.json'

import test_events_data from './events.json'

describe('Test Starknet event decode', () => {
  it('event name to keys', () => {
    const abiEvents = events.getAbiEvents(sierra.abi)
    const abiStructs = CallData.getAbiStruct(sierra.abi)
    const abiEnums = CallData.getAbiEnum(sierra.abi)

    const parsedEvent = events.parseEvents(test_events_data.result.events, abiEvents, abiStructs, abiEnums)[0]

    assert.ok(parsedEvent['VoteEvent'])
    assert.equal(parsedEvent['VoteEvent'].vote, 1n)

    assert.equal(
      hash.getSelectorFromName('VoteEvent'),
      '0x28d90b3294abf675757c5f5bbcdb07c80d54c4493bf7780c894065cd7ffd2ad'
    )
  })
})
