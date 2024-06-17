import { expect } from 'chai'
import { AccountContext } from './context.js'
import { EthChainId } from '@sentio/chain'
import { getProvider } from './provider.js'
import { Endpoints } from '@sentio/runtime'
import { AnyswapRouter__factory } from './tests/types/eth/internal/index.js'

describe('provider test', () => {
  // test('network test with string', async () => {
  //   const n = getEthChainId('321')
  //   expect(n.chainId).eq(321n)
  // })

  // test('network test with id', async () => {
  //   const n = getEthChainId(321)
  //   expect(n.chainId).eq(321n)
  // })

  test('network test with context', async () => {
    const ctx = new AccountContext(EthChainId.KUCOIN, '0x1')
    const n = ctx.getChainId()
    expect(n).eq(EthChainId.KUCOIN)
  })

  test('getProvider', async () => {
    Endpoints.INSTANCE.chainServer.set(EthChainId.BASE, 'http://localhost:8545')
    const provider = getProvider(EthChainId.BASE)
    const contract = AnyswapRouter__factory.connect('fake', provider)
    const result = await contract.getFunction('anySwapInExactTokensForTokens').staticCall()
    if (expect(result) != null) {
      expect(result).to.be.an('object')
    }
  })
})
