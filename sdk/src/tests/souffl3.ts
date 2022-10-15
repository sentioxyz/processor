import { SouffleChefCampaign, CandyMachine } from './types/aptos/souffle'
import { token } from '../builtin/aptos/0x3'

SouffleChefCampaign.bind({ startVersion: 3212312 })
  .onEntryPullTokenV2((call: SouffleChefCampaign.PullTokenV2Payload<any>, ctx) => {
    ctx.meter.Counter('call_num').add(1)
    ctx.meter.Counter('pulled').add(parseInt(call.arguments[3]))
  })
  .onEventPullTokenEvent((evt, ctx) => {
    console.log(evt.data.receiver)
    ctx.meter.Counter('burned').add(1)
  })
  .onEvent(
    (event, ctx) => {
      ctx.meter.Counter('evt_num').add(1)
    },
    {
      type: '0x1::coin::DepositEvent',
    }
  )
  .onTransaction((txn, ctx) => {
    if (txn.events) {
      for (const event of txn.events) {
        if (event && event.type === '0x3::token::DepositEvent') {
          ctx.meter.Counter('deposit_token_count').add(Number(event.data.amount))
        }
      }
    }
  })

CandyMachine.bind().onEntryPullToken((call: CandyMachine.PullTokenPayload<any>, ctx) => {
  ctx.meter.Counter('pulled').add(parseInt(call.arguments[2]))
})

token.bind().onEventWithdrawEvent((evt: token.WithdrawEventInstance, ctx) => {
  ctx.meter.Counter('with_draw').add(parseInt(evt.data.amount), { token: evt.data.id.token_data_id.name })
})
