import { SouffleChefCampaign, CandyMachine } from './types/aptos/souffle'

import { token } from '@sentio/sdk/lib/builtin/aptos/0x3'

SouffleChefCampaign.bind({ startVersion: 6604913 })
  .onEntryPullTokenV2((call, ctx) => {
    ctx.meter.Counter('call_num').add(1)
    ctx.meter.Counter('pulled').add(parseInt(call.arguments[3]))
  })
  .onEventBurnEnjoyEvent((evt, ctx) => {
    ctx.meter.Counter('burned').add(1)
  })
  .onTransaction((txn, ctx) => {
    if (txn.events) {
      for (const event of txn.events) {
        if (event && event.type === '0x3::token::DepositEvent') {
          ctx.meter.Counter('deposit_token_count').add(Number(event.data.amount))
        }
      }
    }
  })

CandyMachine.bind().onEntryPullToken((call, ctx) => {
  ctx.meter.Counter('pulled').add(parseInt(call.arguments[2]))
})

token.bind().onEventWithdrawEvent((evt: token.WithdrawEventInstance, ctx) => {
  ctx.meter.Counter('with_draw').add(parseInt(evt.data.amount), { token: evt.data.id.token_data_id.name })
})
