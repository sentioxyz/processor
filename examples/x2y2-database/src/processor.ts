import { Counter, Gauge, BigDecimal } from '@sentio/sdk'
import { ERC20Processor } from '@sentio/sdk/eth/builtin'
import { X2y2Processor } from './types/eth/x2y2.js'
import { Reward, Transfer, User } from './schema/schema.js'

const rewardPerBlock = Gauge.register('reward_per_block', {
  description: 'rewards for each block grouped by phase',
  unit: 'x2y2'
})

const tokenCounter = Counter.register('token')

X2y2Processor.bind({ address: '0xB329e39Ebefd16f40d38f07643652cE17Ca5Bac1' }).onBlockInterval(async (block, ctx) => {
  const phase = (await ctx.contract.currentPhase()).toString()
  const reward = (await ctx.contract.rewardPerBlockForStaking()).scaleDown(18)
  // ctx.logger.info(`reward ${reward.toFormat(6)} for block ${ctx.blockNumber}`, { phase })
  rewardPerBlock.record(ctx, reward, { phase })
  // exporter.emit(ctx, { reward, phase })
  const rewardEntity = new Reward({
    id: block.number.toString(),
    value: reward,
    phase
  })

  await ctx.store.upsert(rewardEntity)
})

const filter = ERC20Processor.filters.Transfer(
  '0x0000000000000000000000000000000000000000',
  '0xb329e39ebefd16f40d38f07643652ce17ca5bac1'
)

ERC20Processor.bind({ address: '0x1e4ede388cbc9f4b5c79681b7f94d36a11abebc9' }).onEventTransfer(
  async (event, ctx) => {
    const val = event.args.value.scaleDown(18)
    tokenCounter.add(ctx, val)
    // exporter.emit(ctx, event)
    const from = new User({
      name: 'from',
      id: event.args.from.toLowerCase()
    })

    await ctx.store.upsert(from)
    const to = new User({
      name: 'to',
      id: event.args.to.toLowerCase()
    })
    await ctx.store.upsert(to)
    const transfer = new Transfer({
      arrayValue: [],
      bigIntValue: 0n,
      id: event.transactionHash,
      amount: val
    })
    transfer.fromID = from.id
    transfer.toID = to.id
    await ctx.store.upsert(transfer)

    const transfers = await ctx.store.list(Transfer, [
      {
        field: 'amount',
        op: '>=',
        value: new BigDecimal(100)
      }
    ])
    console.log('transfers', transfers)
  },
  filter // filter is an optional parameter
)
