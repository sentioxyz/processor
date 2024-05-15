import { parse } from 'graphql'
import { buildSchema } from '../schema.js'
import { codegen } from '../codegen.js'

describe('Test Graphql Codegen', () => {
  const doc = parse(`
  type Burn @entity {
  id: ID!
  block: Int!
  address: String! @index
  value: BigInt!
  txHash: String!
}
`)

  it('should generate types', async () => {
    const schema = buildSchema(doc)
    codegen(schema, 'generated')
  })

})