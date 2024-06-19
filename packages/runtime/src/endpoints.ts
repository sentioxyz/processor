export class Endpoints {
  static INSTANCE: Endpoints = new Endpoints()

  concurrency = 8
  chainQueryAPI = ''
  priceFeedAPI = ''

  chainServer = new Map<string, string>()

  batchCount = 1
}
