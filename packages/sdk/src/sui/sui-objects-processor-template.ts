import { Data_SuiObject, HandleInterval, MoveOnIntervalConfig_OwnerType, ProcessResult } from '@sentio/protos'
import { ListStateStorage } from '@sentio/runtime'
import { SuiNetwork } from './network.js'
import { SuiObjectsContext } from './context.js'
import { SuiMoveObject } from '@mysten/sui.js'
import { PromiseOrVoid } from '../core/index.js'
import { configure, IndexConfigure, SuiBindOptions } from './sui-processor.js'

// export interface SuiObjectBindOptions {
//   objectId: string
//   network?: SuiNetwork
//   startCheckpoint?: bigint
//   baseLabels?: { [key: string]: string }
// }

class ObjectHandler<HandlerType> {
  type?: string
  versionInterval?: HandleInterval
  timeIntervalInMinutes?: HandleInterval
  handler: HandlerType
}

export class SuiAccountProcessorTemplateState extends ListStateStorage<SuiBaseObjectsProcessorTemplate<any>> {
  static INSTANCE = new SuiAccountProcessorTemplateState()
}

export interface SuiInternalObjectsBindOptions extends SuiBindOptions {
  ownerType: MoveOnIntervalConfig_OwnerType
}

abstract class SuiBaseObjectsProcessorTemplate<HandlerType> {
  // config: IndexConfigure
  ownerType: MoveOnIntervalConfig_OwnerType

  objectHandlers: ObjectHandler<HandlerType>[] = []

  protected constructor(ownerType: MoveOnIntervalConfig_OwnerType) {
    // this.config = configure(options)
    this.ownerType = ownerType
    SuiAccountProcessorTemplateState.INSTANCE.addValue(this)
  }

  // getChainId(): string {
  //   return this.config.network
  // }

  protected onInterval(
    handler: HandlerType, //(resources: SuiMoveObject[], ctx: SuiObjectsContext) => PromiseOrVoid,
    timeInterval: HandleInterval | undefined,
    versionInterval: HandleInterval | undefined,
    type: string | undefined
  ): this {
    const processor = this
    this.objectHandlers.push({
      handler: handler,
      timeIntervalInMinutes: timeInterval,
      versionInterval: versionInterval,
      type,
    })
    return this
  }

  public onTimeInterval(
    handler: HandlerType,
    timeIntervalInMinutes = 60,
    backfillTimeIntervalInMinutes = 240,
    type?: string
  ): this {
    return this.onInterval(
      handler,
      {
        recentInterval: timeIntervalInMinutes,
        backfillInterval: backfillTimeIntervalInMinutes,
      },
      undefined,
      type
    )
  }

  public onSlotInterval(
    handler: HandlerType,
    slotInterval = 100000,
    backfillSlotInterval = 400000,
    type?: string
  ): this {
    return this.onInterval(
      handler,
      undefined,
      { recentInterval: slotInterval, backfillInterval: backfillSlotInterval },
      type
    )
  }
}

export class SuiAddressProcessor extends SuiBaseObjectsProcessorTemplate<
  (objects: SuiMoveObject[], ctx: SuiObjectsContext) => PromiseOrVoid
> {
  // static bind(options: SuiBindOptions): SuiAddressProcessor {
  //   return new SuiAddressProcessor({ ...options, ownerType: MoveOnIntervalConfig_OwnerType.ADDRESS })
  // }

  protected doHandle(
    handler: (objects: SuiMoveObject[], ctx: SuiObjectsContext) => PromiseOrVoid,
    data: Data_SuiObject,
    ctx: SuiObjectsContext
  ): PromiseOrVoid {
    return handler(data.objects as SuiMoveObject[], ctx)
  }
}

export class SuiObjectsProcessor extends SuiBaseObjectsProcessorTemplate<
  (self: SuiMoveObject, dynamicFieldObjects: SuiMoveObject[], ctx: SuiObjectsContext) => PromiseOrVoid
> {
  static bind(options: SuiObjectBindOptions): SuiObjectsProcessor {
    return new SuiObjectsProcessor({
      address: options.objectId,
      network: options.network,
      startCheckpoint: options.startCheckpoint,
      ownerType: MoveOnIntervalConfig_OwnerType.OBJECT,
      baseLabels: options.baseLabels,
    })
  }

  protected doHandle(
    handler: (self: SuiMoveObject, dynamicFieldObjects: SuiMoveObject[], ctx: SuiObjectsContext) => PromiseOrVoid,
    data: Data_SuiObject,
    ctx: SuiObjectsContext
  ): PromiseOrVoid {
    if (!data.self) {
      console.log(`Sui object not existed in ${ctx.slot}, please specific a start time`)
      return
    }
    return handler(data.self as SuiMoveObject, data.objects as SuiMoveObject[], ctx)
  }
}

export class SuiWrappedObjectProcessor extends SuiBaseObjectsProcessorTemplate<
  (dynamicFieldObjects: SuiMoveObject[], ctx: SuiObjectsContext) => PromiseOrVoid
> {
  static bind(options: SuiObjectBindOptions): SuiWrappedObjectProcessor {
    return new SuiWrappedObjectProcessor({
      address: options.objectId,
      network: options.network,
      startCheckpoint: options.startCheckpoint,
      ownerType: MoveOnIntervalConfig_OwnerType.WRAPPED_OBJECT,
      baseLabels: options.baseLabels,
    })
  }

  protected doHandle(
    handler: (dynamicFieldObjects: SuiMoveObject[], ctx: SuiObjectsContext) => PromiseOrVoid,
    data: Data_SuiObject,
    ctx: SuiObjectsContext
  ): PromiseOrVoid {
    return handler(data.objects as SuiMoveObject[], ctx)
  }
}
