import { SimpleEthersError } from '../eth/index.js'

/**
 * ignore eth call exception and return undefined if that happened
 * @param promise promise return by eth call
 * @param logError whether to log error
 */
export async function ignoreEthCallException<Res>(promise: Promise<Res>, logError = false): Promise<Res | undefined> {
  try {
    return await promise
  } catch (err) {
    if (err instanceof SimpleEthersError || err.code === 'CALL_EXCEPTION' || err.code === 'BAD_DATA') {
      if (logError) {
        console.error('eth call exception, return undefined', err)
      }
      return undefined
    }
    throw err
  }
}
