import { ProcessResult } from '@sentio/protos'
import { SolanaContext } from './solana-context.js'
import { Instruction } from '@project-serum/anchor'
import { SolanaBindOptions } from './solana-options.js'
import { ListStateStorage } from '@sentio/runtime'
import { Labels } from '../core/index.js'
import { SolanaChainId } from '@sentio/chain'

type IndexConfigure = {
  startSlot: bigint
  endSlot?: bigint
}

export interface InstructionCoder {
  decode(ix: Buffer | string, encoding?: 'hex' | 'base58'): Instruction | null
}

export type SolanaInstructionHandler = (instruction: Instruction, ctx: SolanaContext, accounts?: string[]) => void

export class SolanaProcessorState extends ListStateStorage<SolanaBaseProcessor> {
  static INSTANCE: SolanaProcessorState = new SolanaProcessorState()
}

export class SolanaBaseProcessor {
  public instructionHandlerMap: Map<string, SolanaInstructionHandler> = new Map()
  address: string
  endpoint: string
  contractName: string
  baseLabels?: Labels
  network: SolanaChainId
  processInnerInstruction: boolean
  config: IndexConfigure = { startSlot: 0n }
  instructionCoder: InstructionCoder

  decodeInstruction(rawInstruction: string): Instruction | null {
    if (this.instructionCoder) {
      return this.instructionCoder.decode(rawInstruction, 'base58')
    }
    return null
  }

  fromParsedInstruction: (instruction: { type: string; info: any }) => Instruction | null

  constructor(options: SolanaBindOptions) {
    this.address = options.address
    this.contractName = options.name || ''
    this.processInnerInstruction = options.processInnerInstruction || false
    this.network = options.network || SolanaChainId.SOLANA_MAINNET
    if (options.instructionCoder) {
      this.instructionCoder = options.instructionCoder
    }
    if (options.startBlock) {
      this.startSlot(options.startBlock)
    }
    if (options.endBlock) {
      this.endBlock(options.endBlock)
    }
    this.endpoint = options.network || 'https://api.mainnet-beta.solana.com'
    this.baseLabels = options.baseLabels

    SolanaProcessorState.INSTANCE.addValue(this)
  }

  public onInstruction(instructionName: string, handler: SolanaInstructionHandler) {
    this.instructionHandlerMap.set(instructionName, handler)
    return this
  }

  public getParsedInstruction(ins: string | { type: string; info: any }): Instruction | null {
    if (ins) {
      if ((ins as { type: string; info: any }).info) {
        return this.fromParsedInstruction ? this.fromParsedInstruction(ins as { type: string; info: any }) : null
      }
      if (this.decodeInstruction != null) {
        return this.decodeInstruction(ins as string)
      }
    }
    return null
  }

  public getInstructionHandler(parsedInstruction: Instruction): SolanaInstructionHandler | undefined {
    return this.instructionHandlerMap.get(parsedInstruction.name)
  }

  public async handleInstruction(
    parsedInstruction: Instruction,
    accounts: string[],
    handler: SolanaInstructionHandler,
    slot: bigint
  ): Promise<ProcessResult> {
    const ctx = new SolanaContext(this.contractName, this.network, this.address, slot, this.baseLabels)
    await handler(parsedInstruction, ctx, accounts)
    return ctx.stopAndGetResult()
  }

  public startSlot(startSlot: bigint | number) {
    this.config.startSlot = BigInt(startSlot)
    return this
  }

  public endBlock(endBlock: bigint | number) {
    this.config.endSlot = BigInt(endBlock)
    return this
  }
}
