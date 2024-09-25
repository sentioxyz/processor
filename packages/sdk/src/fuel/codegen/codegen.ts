import fs, { readFileSync, writeFileSync } from 'fs'
import chalk from 'chalk'
import { AbiTypeGen, IFile, IFunction, ProgramTypeEnum } from '@fuel-ts/abi-typegen'
import mkdirp from 'mkdirp'
import path from 'path'
import { upperFirst } from './utils.js'
import { versions as builtinVersions } from '@fuel-ts/versions'

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

/*function patchEnumType(contents: string) {
  const matches = contents.matchAll(/export type (.+) = Enum<{ Ok: T, Err: E }>;/g)

  for (const m of matches) {
    const vname = m[1]
    contents = contents.replace(m[0], `export type ${vname}<T,E> = Enum<{ Ok: T, Err: E }>;`)

    const reg = new RegExp(`export type (.+) = ${vname}`, 'g')
    contents = contents.replace(reg, `export type \$1<T,E> = ${vname}<T,E>`)
  }
  return contents
}*/

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
    programType: ProgramTypeEnum.CONTRACT,
    versions: { FUELS: builtinVersions.FUELS }
  })

  mkdirp.sync(outDir)
  let count = 0
  abiTypeGen.files.forEach((file) => {
    if (!file.path.endsWith('.hex.ts')) {
      const content = patchImport(file.contents)
      // content = patchEnumType(content)
      writeFileSync(file.path, content)
      count++
    }
  })

  // for (const file of abiTypeGen.files) {
  //   const jsonAbi: JsonAbi = JSON.parse(file.contents)
  //   for (const logType of jsonAbi.loggedTypes) {
  //     logType.loggedType.name
  //
  //   }
  // }

  for (const abi of abiTypeGen.abis) {
    const name = abi.capitalizedName.endsWith('Abi') ? abi.capitalizedName.slice(0, -3) : abi.capitalizedName
    const filePath = path.join(outDir, `${name}Processor.ts`)
    const importedTypes = collectImportedTypes(abi.types)

    const logByTypes: Record<string, string[]> = {}

    for (const logType of abi.rawContents.loggedTypes) {
      const metadataTypeId = abi.rawContents.concreteTypes.find(
        (t) => t.concreteTypeId == logType.concreteTypeId
      )?.metadataTypeId
      // @ts-ignore - we know that the type is in the abi
      let t = abi.types.find((t) => t.rawAbiType.concreteTypeId == logType.concreteTypeId)
      if (!t) {
        t = abi.types.find((t) => t.rawAbiType.typeId == metadataTypeId)
      }
      // @ts-ignore - we know that the type is in the abi
      const typeName = t?.attributes?.outputLabel
      if (typeName) {
        if (!logByTypes[typeName]) {
          logByTypes[typeName] = []
        }
        logByTypes[typeName].push(logType.logId)
      }
    }

    const content = `/* Autogenerated file. Do not edit manually. */

/* tslint:disable */
/* eslint-disable */
    
import { FuelAbstractProcessor, FuelContractContext, FuelProcessorConfig, TypedCall, FuelFetchConfig, FuelCall, FuelLog} from '@sentio/sdk/fuel'
import {${abi.commonTypesInUse.join(',')}} from './common.js'
import {${importedTypes.join(',')}, ${abi.capitalizedName}} from './${abi.capitalizedName}.js'

import type { BigNumberish, BN } from 'fuels';
import type { BytesLike, Bytes } from 'fuels';


namespace ${name}NS {
  export abstract class CallWithLogs<T extends Array<any>, R> extends TypedCall<T, R> {
${Object.entries(logByTypes)
  .flatMap(([t, ids]) => {
    const s = []
    s.push(`
    getLogsOfType${getTypeName(t)}(): Array<${t}> {
      return this.logs?.filter(l =>[${ids.map((id) => `"${id}"`).join(', ')}].includes(l.logId) ).map(l => l.data) as Array<${t}>
    }`)

    return s
  })
  .join('\n')}
  }

${
  ''
  // abi.functions.map(genCallType).join('\n')
}
}

type LogIdFilter<T> = T | T[]
${getLogConstants(logByTypes)}

export class ${name}Processor extends FuelAbstractProcessor<${name}> {
  static bind(config: Omit<FuelProcessorConfig, 'abi'>) {
    return new ${name}Processor(${abi.capitalizedName}.abi, {
      name: '${name}',
      ...config,
    })
  }

${
  ''
  /* disable codegen for now
       abi.functions.map((f) => genOnCallFunction(name, f)).join('\n') */
}   

${Object.entries(logByTypes)
  .map((e) => genOnLogFunction(name, e))
  .join('\n')}

}
`
    writeFileSync(filePath, content)
    count++
  }

  return count
}

function genCallType(f: IFunction) {
  const name = upperFirst(f.name)
  const argMap: Record<string, string> = {}
  const argTypes = f.attributes.inputs.split(',').map((t) => t.trim())
  f.rawAbiFunction.inputs.forEach((input, idx) => {
    argMap[input.name] = argTypes[idx]
  })

  return `
  export class ${name}Call extends CallWithLogs<[${argTypes.join(', ')}], ${f.attributes.output}> {
      declare args: [${argTypes.join(', ')}]
      declare returnValue: ${f.attributes.output}
      declare argsObject: {
          ${Object.entries(argMap)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')}
      } 
      constructor(call: FuelCall) {
        super(call)
      }
  }
`
}

function genOnCallFunction(contractName: string, f: IFunction) {
  const name = upperFirst(f.name)
  return `
  onCall${name}(handler: (call: ${contractName}.${name}Call, ctx: FuelContractContext<${contractName}>) => void | Promise<void>, config?: FuelFetchConfig) {
    return super.onCall('${f.name}', (call, ctx) => handler(new ${contractName}.${name}Call(call), ctx), config)
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

function getLogConstants(logByTypes: Record<string, string[]>) {
  return Object.entries(logByTypes)
    .map(([t, ids]) => {
      const name = getTypeName(t)
      if (ids.length == 1) {
        return `const Log${name}Id = "${ids[0]}"`
      }
      return ids.map((id, idx) => `const Log${name}Id${idx} = "${id}"`).join('\n')
    })
    .join('\n')
}

function genOnLogFunction(contractName: string, [type, ids]: [string, string[]]) {
  const name = getTypeName(type)

  if (ids.length == 1) {
    return `
  onLog${name}(handler: (log: FuelLog<${type}>, ctx: FuelContractContext<${contractName}>) => void | Promise<void>) {
    return super.onLog<${type}>([Log${name}Id], (log, ctx) => handler(log, ctx))
  }`
  }
  const logIdFilterValues = ids.map((_, idx) => `Log${name}Id${idx}`)

  return `
  onLog${name}(handler: (log: FuelLog<${type}>, ctx: FuelContractContext<${contractName}>) => void | Promise<void>, 
               logIdFilter?: LogIdFilter<${logIdFilterValues.map((d) => `typeof ${d}`).join(' | ')}> ) {
    return super.onLog<${type}>(logIdFilter ?? [${logIdFilterValues.join(', ')}], (log, ctx) => handler(log, ctx))
  }`
}

function getTypeName(type: string) {
  return upperFirst(type.replace('Output', ''))
}
