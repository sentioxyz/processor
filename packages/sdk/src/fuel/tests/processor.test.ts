import { TestProcessorServer } from '../../testing/index.js'
import { expect } from 'chai'
import { FuelProcessor } from '../fuel-processor.js'
import { FuelChainId } from '@sentio/chain'

describe('fuel network tests', () => {
  const ADDRESS = '0x1000000000000000000000000000000000000000'

  const service = new TestProcessorServer(async () => {
    FuelProcessor.bind({
      address: ADDRESS,
      chainId: FuelChainId.FUEL_TESTNET_BETA_V5
    }).onTransaction(async (tx, ctx) => {
      ctx.eventLogger.emit('tx', {
        distinctId: tx.id,
        message: 'status is ' + tx.status
      })
    })
  })
  beforeAll(async () => {
    await service.start()
  })

  test('check configuration ', async () => {
    const config = await service.getConfig({})
    expect(config.contractConfigs).length(1)
    expect(config.contractConfigs[0].fuelCallConfigs).length(1)
  })

  test('test onTransaction ', async () => {
    const res = await service.fuel.testOnTransaction(testTxData, FuelChainId.FUEL_TESTNET_BETA_V5)

    const events = res.result?.events
    expect(events).length(1)
    expect(events?.[0]?.message).to.equal('status is SuccessStatus')
  })
})

const testTxData = {
  id: '0x09095e4d3d74edd8c2d8ab4803207d05b3c42de32327f6cf668956182974f7e6',
  rawPayload:
    '0x000000000000000000000000000186a00000000000000018000000000000007000000000000000010000000000000002000000000000000200000000000000015a124b6b00fd801bbe6ab72935e6334322c2e36f65e94a0f8d4b16c2911515c3724028a0724428785d451000724828802d41148a2404000000000000000000000000000000000000000000000000000000000000000000000000000000000000ec9b5510ae3749c5a1150f68b049d1eb4db32ecfcbb05a15214e5eb26f85bcaa00000000cfe230f900000000000028d000000000000000080000000000000001000000000000000100000000000000010000000000000001e1ad6a778da9bbb8890c41b89d81ccc74fb44cd3692ae5e3455f6d30db45eac00000000000000000d1990b9e5c2b57fe54a4fbbdecd60b75e64dd5281e0a1e78e1bd56cccc4398f4450ba8bad4e453e26dabf34af38e88aaad9f824157262d25b72588242c8303d800000000009e5db40000000000000000ec9b5510ae3749c5a1150f68b049d1eb4db32ecfcbb05a15214e5eb26f85bcaa0000000000000000a579639762a77a4d680202574eceab08b641d62959f3d69bc331b775b6c570140000000000000001d3fe20c8ff68a4054d8587ac170c40db7d1e200208a575780542bd9a7e3eec0800000000001e7c77000000000000000000000000000000000000000000000000000000000000000000000000009e5b3d00000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000d1990b9e5c2b57fe54a4fbbdecd60b75e64dd5281e0a1e78e1bd56cccc4398f41b65051ec344b1d3c96dc5b9703830b4eebcb24c78e98a7b3a766c546613b5c90000000000000002d3fe20c8ff68a4054d8587ac170c40db7d1e200208a575780542bd9a7e3eec0800000000001e74bf000000000000000000000000000000000000000000000000000000000000000000000000000000400702264fd699e2374b4b6ce4d0544e5315a68c0de1fc0e8daa88fbb61c68866b9e35b30d6b55cfb35269bf190dedb6c4679bf048482544b22da545cb78bd7d74',
  gasPrice: '1',
  receipts: [
    {
      contract: null,
      pc: '11648',
      is: '11648',
      to: {
        id: '0xec9b5510ae3749c5a1150f68b049d1eb4db32ecfcbb05a15214e5eb26f85bcaa'
      },
      toAddress: null,
      amount: '0',
      assetId: '0x0000000000000000000000000000000000000000000000000000000000000000',
      gas: '77909',
      param1: '3487707385',
      param2: '10448',
      val: null,
      ptr: null,
      digest: null,
      reason: null,
      ra: null,
      rb: null,
      rc: null,
      rd: null,
      len: null,
      receiptType: 'CALL',
      result: null,
      gasUsed: null,
      data: null,
      sender: null,
      recipient: null,
      nonce: null,
      contractId: null,
      subId: null
    },
    {
      contract: {
        id: '0xec9b5510ae3749c5a1150f68b049d1eb4db32ecfcbb05a15214e5eb26f85bcaa'
      },
      pc: '12192',
      is: '11648',
      to: null,
      toAddress: null,
      amount: null,
      assetId: null,
      gas: null,
      param1: null,
      param2: null,
      val: null,
      ptr: null,
      digest: null,
      reason: null,
      ra: '8',
      rb: '0',
      rc: '0',
      rd: '0',
      len: null,
      receiptType: 'LOG',
      result: null,
      gasUsed: null,
      data: null,
      sender: null,
      recipient: null,
      nonce: null,
      contractId: null,
      subId: null
    },
    {
      contract: {
        id: '0xec9b5510ae3749c5a1150f68b049d1eb4db32ecfcbb05a15214e5eb26f85bcaa'
      },
      pc: '12196',
      is: '11648',
      to: null,
      toAddress: null,
      amount: null,
      assetId: null,
      gas: null,
      param1: null,
      param2: null,
      val: null,
      ptr: null,
      digest: null,
      reason: null,
      ra: '1',
      rb: '1',
      rc: '0',
      rd: '0',
      len: null,
      receiptType: 'LOG',
      result: null,
      gasUsed: null,
      data: null,
      sender: null,
      recipient: null,
      nonce: null,
      contractId: null,
      subId: null
    },
    {
      contract: {
        id: '0xec9b5510ae3749c5a1150f68b049d1eb4db32ecfcbb05a15214e5eb26f85bcaa'
      },
      pc: '12204',
      is: '11648',
      to: null,
      toAddress: null,
      amount: null,
      assetId: null,
      gas: null,
      param1: null,
      param2: null,
      val: null,
      ptr: null,
      digest: null,
      reason: null,
      ra: '1',
      rb: '2',
      rc: '0',
      rd: '0',
      len: null,
      receiptType: 'LOG',
      result: null,
      gasUsed: null,
      data: null,
      sender: null,
      recipient: null,
      nonce: null,
      contractId: null,
      subId: null
    },
    {
      contract: {
        id: '0xec9b5510ae3749c5a1150f68b049d1eb4db32ecfcbb05a15214e5eb26f85bcaa'
      },
      pc: '12996',
      is: '11648',
      to: null,
      toAddress: null,
      amount: null,
      assetId: null,
      gas: null,
      param1: null,
      param2: null,
      val: '0',
      ptr: null,
      digest: null,
      reason: null,
      ra: null,
      rb: null,
      rc: null,
      rd: null,
      len: null,
      receiptType: 'RETURN',
      result: null,
      gasUsed: null,
      data: null,
      sender: null,
      recipient: null,
      nonce: null,
      contractId: null,
      subId: null
    },
    {
      contract: null,
      pc: '10356',
      is: '10336',
      to: null,
      toAddress: null,
      amount: null,
      assetId: null,
      gas: null,
      param1: null,
      param2: null,
      val: '1',
      ptr: null,
      digest: null,
      reason: null,
      ra: null,
      rb: null,
      rc: null,
      rd: null,
      len: null,
      receiptType: 'RETURN',
      result: null,
      gasUsed: null,
      data: null,
      sender: null,
      recipient: null,
      nonce: null,
      contractId: null,
      subId: null
    },
    {
      contract: null,
      pc: null,
      is: null,
      to: null,
      toAddress: null,
      amount: null,
      assetId: null,
      gas: null,
      param1: null,
      param2: null,
      val: null,
      ptr: null,
      digest: null,
      reason: null,
      ra: null,
      rb: null,
      rc: null,
      rd: null,
      len: null,
      receiptType: 'SCRIPT_RESULT',
      result: '0',
      gasUsed: '82624',
      data: null,
      sender: null,
      recipient: null,
      nonce: null,
      contractId: null,
      subId: null
    }
  ],
  status: {
    type: 'SuccessStatus',
    block: {
      id: '0x5f46a3795162780326eb51dd35a7024a47dbb9f0fd77f34ac1a05511c3cceb7c'
    },
    time: '4611686020141163490',
    programState: {
      returnType: 'RETURN',
      data: '0x0000000000000001'
    }
  }
}
