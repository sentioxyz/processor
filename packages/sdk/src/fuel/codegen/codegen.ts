import fs, { readFileSync, writeFileSync } from 'fs'
import chalk from 'chalk'
import { AbiTypeGen, IFile, IFunction, ProgramTypeEnum } from '@fuel-ts/abi-typegen'
import mkdirp from 'mkdirp'
import path from 'path'
import { upperFirst } from './utils.js'

export async function codegen(abisDir: string, outDir: string) {
  if (!fs.existsSync(abisDir)) {
    return
  }

  const numFiles = await codegenInternal(abisDir, outDir)
  console.log(chalk.green(`Generated ${numFiles} files for Fuel`))
}

function patchImport(contents: string) {
  return contents.replace(/from\s+['"](\..+)['"]/g, `from '\$1.js'`)
}

function patchEnumType(contents: string) {
  const matches = contents.matchAll(/export type (.+) = Enum<{ Ok: T, Err: E }>;/g)

  for (const m of matches) {
    const vname = m[1]
    contents = contents.replace(m[0], `export type ${vname}<T,E> = Enum<{ Ok: T, Err: E }>;`)

    const reg = new RegExp(`export type (.+) = ${vname}`, 'g')
    contents = contents.replace(reg, `export type \$1<T,E> = ${vname}<T,E>`)
  }
  return contents
}

async function codegenInternal(abisDir: string, outDir: string): Promise<number> {
  const allFiles = fs.readdirSync(abisDir)
  if (allFiles.length === 0) {
    return 0
  }

  const allABIFiles = []
  for (const f of allFiles) {
    if (f.toLowerCase().endsWith('-abi.json')) {
      allABIFiles.push(path.join(abisDir, f))
    }
  }
  if (allABIFiles.length === 0) {
    return 0
  }
  const abiFiles = allABIFiles.map((filepath) => {
    const abi: IFile = {
      path: filepath,
      contents: readFileSync(filepath, 'utf-8')
    }
    return abi
  })

  // fuels type gen
  const abiTypeGen = new AbiTypeGen({
    abiFiles,
    binFiles: [],
    storageSlotsFiles: [],
    outputDir: outDir,
    programType: ProgramTypeEnum.CONTRACT
  })

  mkdirp.sync(outDir)
  mkdirp.sync(path.join(outDir, 'factories'))

  abiTypeGen.files.forEach((file) => {
    if (!file.path.endsWith('.hex.ts')) {
      let content = patchImport(file.contents)
      content = patchEnumType(content)
      writeFileSync(file.path, content)
    }
  })

  for (const abi of abiTypeGen.abis) {
    const name = abi.name.endsWith('Abi') ? abi.name.slice(0, -3) : abi.name
    const filePath = path.join(outDir, `${name}Processor.ts`)
    const importedTypes = collectImportedTypes(abi.types)

    const content = `/* Autogenerated file. Do not edit manually. */

/* tslint:disable */
/* eslint-disable */
    
import { FuelAbstractProcessor, FuelContext, FuelProcessorConfig, TypedCall, FuelFetchConfig} from '@sentio/sdk/fuel'
import {${abi.name}__factory } from './factories/${abi.name}__factory.js'
import {${abi.commonTypesInUse.join(',')}} from './common.js'
import {${importedTypes.join(',')}} from './${abi.name}.js'

import type {
  BigNumberish,
  BN,
  BytesLike,
} from 'fuels';


namespace ${name} {
${abi.functions.map(genCallType).join('\n')}
}

export class ${name}Processor extends FuelAbstractProcessor {
  constructor(config?: FuelProcessorConfig) {
    super(${abi.name}__factory.abi, config)
  }
  
  static bind(config: FuelProcessorConfig) {
    return new ${name}Processor({
      name: '${name}',
      ...config,
    })
  }

${abi.functions.map((f) => genOnCallFunction(name, f)).join('\n')}   
}
`
    writeFileSync(filePath, content)
  }

  return allABIFiles.length
}

function genCallType(f: IFunction) {
  const name = upperFirst(f.name)
  return `
  export interface ${name}Call extends TypedCall<[${f.attributes.inputs}], ${f.attributes.output}> {
      args: [${f.attributes.inputs}]
      returnValue: ${f.attributes.output}
  }
`
}

function genOnCallFunction(contractName: string, f: IFunction) {
  const name = upperFirst(f.name)
  return `
  onCall${name}(handler: (call: ${contractName}.${name}Call, ctx: FuelContext) => void | Promise<void>, config: FuelFetchConfig) {
      super.onCallMethod('${f.name}', handler, config)
  }`
}

function collectImportedTypes(types: any[]): string[] {
  const ret = new Set<string>()
  for (const type of types) {
    if ((type && type.name == 'struct') || type.name == 'enum') {
      ret.add(type.attributes.inputLabel)
      ret.add(type.attributes.outputLabel)
    }
  }

  return Array.from(ret)
}
