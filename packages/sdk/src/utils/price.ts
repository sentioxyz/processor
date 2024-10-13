import { CoinID } from '@sentio/protos'
import { Endpoints } from '@sentio/runtime'
import { ChainId } from '@sentio/chain'
import { LRUCache } from 'lru-cache'
import { Configuration, PriceApi } from '@sentio/api'
import path from 'path'
import fs from 'fs'
import os from 'os'

function getApiKey() {
  try {
    const content = fs.readFileSync(path.join(os.homedir(), '.sentio', 'config.json'), 'utf8')
    const config = JSON.parse(content)
    return config['https://app.sentio.xyz']?.api_keys
  } catch (e) {}
}

export function getPriceClient(basePath = Endpoints.INSTANCE.priceFeedAPI) {
  if (!basePath.startsWith('http')) {
    basePath = 'http://' + basePath
  }
  if (basePath.endsWith('/')) {
    basePath = basePath.slice(0, -1)
  }
  const config = new Configuration({
    basePath,
    apiKey: getApiKey()
  })
  const api = new PriceApi(config)
  return api
}

const priceMap = new LRUCache<string, Promise<number | undefined>>({
  max: 100000,
  ttl: 1000 * 60 * 60 // 1 hour
})

let priceClient: PriceApi

interface PriceOptions {
  toleranceInDays?: number
}
async function getPriceByTypeOrSymbol(date: Date, coinId: CoinID, options?: PriceOptions): Promise<number | undefined> {
  if (!priceClient) {
    priceClient = getPriceClient()
  }
  return getPriceByTypeOrSymbolInternal(priceClient, date, coinId, options)
}

export async function getPriceByTypeOrSymbolInternal(
  priceClient: PriceApi,
  date: Date,
  coinId: CoinID,
  options?: PriceOptions
): Promise<number | undefined> {
  const dateStr = dateString(date)
  const todayDateString = dateString(new Date())

  let key: string
  if (coinId.symbol) {
    key = `${coinId.symbol}-${dateStr}`
  } else {
    key = `${coinId.address?.address}-${coinId.address?.chain}-${dateStr}`
  }
  let price = priceMap.get(key)
  if (price) {
    return price
  }

  const response = priceClient.getPrice({
    timestamp: date,
    coinIdSymbol: coinId.symbol,
    coinIdAddressAddress: coinId.address?.address,
    coinIdAddressChain: coinId.address?.chain
  })
  price = response
    .then((res) => {
      if (res.timestamp) {
        const responseDateString = dateString(res.timestamp)
        if (responseDateString === todayDateString) {
          priceMap.delete(key)
        } else {
          // https://www.javatpoint.com/javascript-date-difference
          const diff = Math.abs(res.timestamp.getTime() - date.getTime())
          const daysDiff = diff / (1000 * 60 * 60 * 24)
          const tolerance = options?.toleranceInDays || 2
          if (daysDiff > tolerance) {
            priceMap.delete(key)
            return undefined
          }
        }
      } else {
        priceMap.delete(key)
      }
      return res.price
    })
    .catch((e) => {
      setTimeout(() => {
        priceMap.delete(key)
      }, 1000)

      if (e.response?.status === 404) {
        console.error('price not found for ', JSON.stringify(coinId), ' at ', dateStr)
        return undefined
      }
      // TODO maybe use small set of error
      priceMap.delete(key)
      throw e
    })
  priceMap.set(key, price)
  return price
}

/**
 *
 * @param chainId chain id refers to CHAIN_MAP
 * @param coinType
 * @param date
 * @param options other behavior options
 */
export async function getPriceByType(
  chainId: ChainId,
  coinType: string,
  date: Date,
  options?: PriceOptions
): Promise<number | undefined> {
  return getPriceByTypeOrSymbol(
    date,
    {
      address: {
        chain: chainId,
        address: coinType
      }
    },
    options
  )
}

/**
 * @param symbol token symbol like BTC, etc
 * @param date
 * @param options other behavior options
 */
export async function getPriceBySymbol(
  symbol: string,
  date: Date,
  options?: PriceOptions
): Promise<number | undefined> {
  return getPriceByTypeOrSymbol(date, { symbol }, options)
}

function dateString(date: Date) {
  return [date.getUTCDate(), date.getUTCMonth() + 1, date.getUTCFullYear()].join('-')
}

/**
 * get coins that has price, return results are list of coin id with both symbol and address field set
 * @param chainId
 */
export async function getCoinsThatHasPrice(chainId: ChainId) {
  if (!priceClient) {
    priceClient = getPriceClient()
  }
  const response = await priceClient.priceListCoins({
    chain: chainId,
    limit: 1000
  })

  if (!response.coinAddressesInChain) {
    return []
  }
  return Object.entries(response.coinAddressesInChain).map(([symbol, coin]) => {
    coin.symbol = symbol
    return coin
  })
}
