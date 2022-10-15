import { parseMoveType } from './typegen'
import { assert } from 'chai'

describe('type gen', () => {
  test('type gen for generic', async () => {
    const res = parseMoveType('x<g1<a,g2<c,d>>,b,g3<a,b>,e>')

    assert(res.symbol === 'x')
    assert(res.typeParams[0].typeParams[1].symbol === 'g2')
    assert(res.typeParams[0].typeParams[1].typeParams[1].symbol === 'd')
  })

  test('type gen for non generic', async () => {
    const res = parseMoveType('xyz')

    assert(res.symbol === 'xyz')
    assert(res.typeParams.length === 0)
  })

  // test('type type gen', async () => {
  //
  //   const res = parseGenericType('x<g1<a,g2<c,d>>,b,g3<a,b>,e>')
  //   console.log(res)
  //
  //   assert(res.symbol === 'x')
  //   assert(res.typeParams[0].typeParams[1].symbol === "g2")
  //   assert(res.typeParams[0].typeParams[1].typeParams[1].symbol === "d")
  // })
})
