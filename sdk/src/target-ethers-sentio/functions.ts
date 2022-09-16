import { generateObjectTypeLiteral } from '@typechain/ethers-v5/dist/codegen/types'
import { AbiParameter, EvmType, FunctionDeclaration, getSignatureForFn } from 'typechain'
import { STRUCT_INPUT_POSTFIX } from '@typechain/ethers-v5/dist/common'

export function codegenFunctions(fns: FunctionDeclaration[], contractName: string): string {
  if (fns.length === 1) {
    return generateFunction(fns[0], contractName)
  }

  return fns.map((fn) => generateFunction(fn, contractName, getFullSignatureAsSymbolForFunction(fn))).join('\n')
}

export function codegenCallTraceTypes(fns: FunctionDeclaration[]): string {
  if (fns.length === 1) {
    return codegenCallTraceType(fns[0])
  }

  return fns.map((fn) => codegenCallTraceType(fn, getFullSignatureAsSymbolForFunction(fn))).join('\n')
}

function codegenCallTraceType(fn: FunctionDeclaration, overloadedName?: string): string {
  return `
  export interface ${capitalizeFirstChar(
    overloadedName ?? fn.name
  )}CallTrace extends TypedTrace<[${generateInputTypesParam(fn.inputs, { useStructs: false })}]> {
    args: [${generateInputTypes(fn.inputs, { useStructs: true })}]
  }
  `
}

function generateFunction(fn: FunctionDeclaration, contractName: string, overloadedName?: string): string {
  return `
  on${capitalizeFirstChar(overloadedName ?? fn.name)}Call(
    handler: (trace: ${capitalizeFirstChar(overloadedName ?? fn.name)}CallTrace, ctx: ${contractName}Context) => void
  ) {
    return super.onTrace("${getSignatureForFn(fn)}", handler);
  }
`
}

function getFullSignatureAsSymbolForFunction(fn: FunctionDeclaration): string {
  return `${fn.name}_${fn.inputs
    .map((e) => {
      if (e.type.type === 'array') {
        return e.type.itemType.originalType + '_array'
      } else {
        return e.type.originalType
      }
    })
    .join('_')}`
}

function capitalizeFirstChar(input: string): string {
  if (!input) {
    return input
  }
  return input[0].toUpperCase() + (input.length > 1 ? input.substring(1) : '')
}

interface GenerateTypeOptions {
  returnResultObject?: boolean
  useStructs?: boolean // uses struct type for first depth, if false then generates first depth tuple types
}

function generateInputTypes(input: Array<AbiParameter>, options: GenerateTypeOptions): string {
  if (input.length === 0) {
    return ''
  }
  return (
    input
      .map((input, index) => `${input.name || `arg${index}`}: ${generateInputType(options, input.type)}`)
      .join(', ') + ', '
  )
}

function generateInputTypesParam(input: Array<AbiParameter>, options: GenerateTypeOptions): string {
  if (input.length === 0) {
    return ''
  }
  return input.map((input, index) => `${generateInputType(options, input.type)}`).join(', ')
}

// same as types.generateInputType but without wrapping
export function generateInputType(options: GenerateTypeOptions, evmType: EvmType): string {
  switch (evmType.type) {
    case 'integer':
      return 'BigNumberish'
    case 'uinteger':
      return 'BigNumberish'
    case 'address':
      return 'string'
    case 'bytes':
    case 'dynamic-bytes':
      return 'BytesLike'
    case 'array':
      return generateArrayOrTupleType(generateInputType(options, evmType.itemType), evmType.size)
    case 'boolean':
      return 'boolean'
    case 'string':
      return 'string'
    case 'tuple':
      if (evmType.structName && options.useStructs) {
        return evmType.structName.toString() + STRUCT_INPUT_POSTFIX
      }
      return generateObjectTypeLiteral(evmType, generateInputType.bind(null, { ...options, useStructs: true }))
    case 'unknown':
      return 'any'
  }
}

function generateArrayOrTupleType(item: string, length?: number) {
  if (length !== undefined && length < 6) {
    return `[${Array(length).fill(item).join(', ')}]`
  } else {
    return `${item}[]`
  }
}
