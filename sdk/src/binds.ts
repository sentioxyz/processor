import { BindOptions, getOptionsSignature } from './bind-options'
import { BaseProcessor } from './base-processor'

export function getProcessor(abiName: string, opts: BindOptions) {
  const sig = abiName + '_' + getOptionsSignature(opts)
  return global.PROCESSOR_STATE.processorMap.get(sig)
}

export function addProcessor(abiName: string, opts: BindOptions, processor: BaseProcessor<any, any>) {
  const sig = abiName + '_' + getOptionsSignature(opts)
  // TODO next break change move this to binds
  // global.PROCESSOR_STATE.processors.push(processor)
  global.PROCESSOR_STATE.processorMap.set(sig, processor)
}
