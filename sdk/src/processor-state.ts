import {
  BaseProcessor,
  BoundContractView,
  ContractView,
  BaseProcessorTemplate,
  SolanaBaseProcessor,
  SuiBaseProcessor,
} from './core'

import { AptosBaseProcessor } from './aptos'

import { BaseContract } from 'ethers'
import { TemplateInstance } from './gen'
import { Provider } from '@ethersproject/providers'
import { EventTracker } from './core'
import { Metric } from './core/meter'
import { AptosAccountProcessor } from './aptos/aptos-processor'

export class ProcessorState {
  // from abiName_address_chainId => contract wrapper
  contracts = new Map<string, ContractView<BaseContract>>()
  // all evm processors
  processors: BaseProcessor<BaseContract, BoundContractView<BaseContract, any>>[] = []
  // from abiName_options to contracts
  processorMap = new Map<string, BaseProcessor<any, any>>()
  // evm providers
  providers = new Map<number, Provider>()
  // evm processor templates
  templates: BaseProcessorTemplate<BaseContract, BoundContractView<BaseContract, any>>[] = []
  // evm processor template instances spec
  templatesInstances: TemplateInstance[] = []

  solanaProcessors: SolanaBaseProcessor[] = []

  suiProcessors: SuiBaseProcessor[] = []

  aptosProcessors: AptosBaseProcessor[] = []
  aptosAccountProcessors: AptosAccountProcessor[] = []

  eventTrackers: EventTracker[] = []

  metrics: Metric[] = []
}
