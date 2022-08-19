// Transform error in more readable format
import { Context } from './context'
import { errors } from 'ethers'

export function transformEtherError(e: Error, ctx: Context<any, any>): Error {
  let msg = ''
  // @ts-ignore
  if (e.code === errors.CALL_EXCEPTION) {
    // @ts-ignore
    if (e.data === '0x') {
      msg += [
        // @ts-ignore
        "jsonrpc eth_call return '0x' (likely contract not existed): " + e.method + '(' + e.args.join(',') + ')',
        'address: ' + ctx.contract.contract.address + ' at chain: ' + ctx.chainId,
        'block: ' + ctx.blockNumber,
        // @ts-ignore
        'data: ' + e.transaction.data,
      ].join('\n')
    }
    return new Error(msg)
  }
  // TODO gracefully handle more errors

  msg = 'jsonrpc error\n' + e.stack?.toString()
  return new Error(msg)
}
