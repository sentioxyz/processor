import { ProcessResult, RecordMetaData } from '@sentio/protos'
import { Logger } from './logger.js'
import { Labels } from './metadata.js'
import { Meter } from './meter.js'

export abstract class BaseContext {
  meter: Meter
  logger: Logger

  res: ProcessResult = {
    counters: [],
    events: [],
    exports: [],
    gauges: [],
    logs: [],
  }

  protected constructor() {
    this.meter = new Meter(this)
    this.logger = new Logger(this)
  }

  getProcessResult(): ProcessResult {
    return this.res
  }

  abstract getMetaData(name: string, labels: Labels): RecordMetaData
}
