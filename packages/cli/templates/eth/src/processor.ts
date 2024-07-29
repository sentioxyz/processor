import { Counter } from '@sentio/sdk'
import { ERC20Processor } from '@sentio/sdk/eth/builtin'

const tokenCounter = Counter.register('token')

const address = '<%= it.address %>'

ERC20Processor.bind({ address }).onEventTransfer(async (event, ctx) => {
  const val = event.args.value.scaleDown(18)
  tokenCounter.add(ctx, val)
})
