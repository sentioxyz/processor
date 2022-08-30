import { Erc20Processor, Erc20ProcessorTemplate } from '../builtin/erc20'

export const filter = Erc20Processor.filters.Transfer(
  '0x0000000000000000000000000000000000000000',
  '0xb329e39ebefd16f40d38f07643652ce17ca5bac1'
)

const processorTemplate = new Erc20ProcessorTemplate().onTransfer(async function (event, ctx) {
  console.log('')
})

Erc20Processor.bind({
  address: '0x1e4ede388cbc9f4b5c79681b7f94d36a11abebc9',
  // network: 1,
  name: 'x2y2',
  startBlock: 14201940,
})
  .onTransfer(async function (event, ctx) {
    processorTemplate.bind({ address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', network: 3, name: 'dynamic' })
    // template.bind('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 3, 'dynamic')
    ctx.meter.Counter('c1').add(1)
  }, filter)
  .onBlock(async function (block, ctx) {
    ctx.meter.Gauge('h1').record(10, { k: 'v' })
  })

Erc20Processor.bind({ address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', network: 56, name: 'usdc' })
  .onTransfer(async function (event, ctx) {
    ctx.meter.Counter('c2').add(2)
  }, filter)
  .onBlock(async function (block, ctx) {
    ctx.meter.Gauge('h1').record(20, { k: 'v' })
  })
// .startBlock(14201940)

Erc20Processor.bind({ address: 'xxxx', network: 56 })

Erc20Processor.bind({ address: 'yyyy', network: 1 })
Erc20Processor.bind({ address: 'yyyy', network: 1 })
Erc20Processor.bind({ address: 'yyyy', network: 1, startBlock: 21 })

// const template = Erc20Processor.template
//   .onTransfer(async function (event, ctx) {
//     ctx.meter.Counter('c2').add(2)
//   }, filter)
//   .onBlock(async function (block, ctx) {
//     ctx.meter.Gauge('h1').record(20, { k: 'v' })
//   })
