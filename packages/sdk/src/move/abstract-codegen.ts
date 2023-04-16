import {
  InternalMoveFunction,
  InternalMoveFunctionVisibility,
  InternalMoveModule,
  InternalMoveStruct,
} from './internal-models.js'
import path from 'path'
import fs from 'fs'
import { AccountModulesImportInfo, AccountRegister } from './account.js'
import chalk from 'chalk'
import { format } from 'prettier'
import { isFrameworkAccount, moduleQname, normalizeToJSName, SPLITTER, VECTOR_STR } from './utils.js'
import { camelCase, upperFirst } from 'lodash-es'
import { TypeDescriptor } from './types.js'
import { ChainAdapter } from './chain-adapter.js'

interface OutputFile {
  fileName: string
  fileContent: string
}

interface Config<NetworkType> {
  fileName: string
  outputDir: string
  network: NetworkType
}

export abstract class AbstractCodegen<ModuleTypes, NetworkType> {
  TEST_NET: NetworkType
  MAIN_NET: NetworkType
  ADDRESS_TYPE: string
  PREFIX: string
  STRUCT_FIELD_NAME: string = 'data'
  GENERATE_CLIENT = false
  GENERATE_ON_ENTRY = true
  PAYLOAD_OPTIONAL = false
  SYSTEM_MODULES = new Set(['0x1', '0x2', '0x3'])

  chainAdapter: ChainAdapter<NetworkType, ModuleTypes>

  protected constructor(chainAdapter: ChainAdapter<NetworkType, ModuleTypes>) {
    this.chainAdapter = chainAdapter
  }

  readModulesFile(fullPath: string) {
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
  }

  async generate(srcDir: string, outputDir: string): Promise<number> {
    const num1 = await this.generateForNetwork(srcDir, outputDir, this.MAIN_NET)
    const num2 = await this.generateForNetwork(
      path.join(srcDir, 'testnet'),
      path.join(outputDir, 'testnet'),
      this.TEST_NET
    )
    return num1 + num2
  }

  async generateForNetwork(srcDir: string, outputDir: string, network: NetworkType) {
    if (!fs.existsSync(srcDir)) {
      return 0
    }

    const files = fs.readdirSync(srcDir)
    outputDir = path.resolve(outputDir)
    const outputs: OutputFile[] = []

    fs.mkdirSync(outputDir, { recursive: true })

    const loader = new AccountRegister()

    // when generating user code, don't need to generate framework account
    for (const sysModule of this.SYSTEM_MODULES) {
      loader.accountImports.set(sysModule, new AccountModulesImportInfo(sysModule, sysModule))
    }
    // const client = getRpcClient(network)

    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue
      }
      const fullPath = path.resolve(srcDir, file)
      const abi = this.readModulesFile(fullPath)
      const modules = this.chainAdapter.toInternalModules(abi)

      for (const module of modules) {
        loader.register(module, path.basename(file, '.json'))
      }
      const codeGen = new AccountCodegen(this, loader, abi, modules, {
        fileName: path.basename(file, '.json'),
        outputDir: outputDir,
        network,
      })

      outputs.push(...codeGen.generate())
    }

    while (loader.pendingAccounts.size > 0) {
      for (const account of loader.pendingAccounts) {
        console.log(`download dependent module for account ${account} at ${network}`)

        try {
          const rawModules = await this.chainAdapter.fetchModules(account, network)
          const modules = this.chainAdapter.toInternalModules(rawModules)

          fs.writeFileSync(path.resolve(srcDir, account + '.json'), JSON.stringify(rawModules, null, '\t'))
          for (const module of modules) {
            loader.register(module, account)
          }
          const codeGen = new AccountCodegen(this, loader, rawModules, modules, {
            fileName: account,
            outputDir: outputDir,
            network,
          })

          outputs.push(...codeGen.generate())
        } catch (e) {
          console.error(
            chalk.red(
              'Error downloading account module, check if you choose the right network，or download account modules manually into your director'
            )
          )
          console.error(e)
          process.exit(1)
        }
      }
    }

    for (const output of outputs) {
      // const content = output.fileContent
      const content = format(output.fileContent, { parser: 'typescript' })
      fs.writeFileSync(path.join(outputDir, output.fileName), content)
    }

    const rootFile = path.join(outputDir, 'index.ts')
    fs.writeFileSync(
      rootFile,
      `/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
`
    )
    for (const output of outputs) {
      const parsed = path.parse(output.fileName)
      const content = `export * as _${parsed.name.replaceAll('-', '_')} from './${parsed.name}.js'\n`
      fs.appendFileSync(rootFile, content)
    }
    return outputs.length + 1
  }

  generateNetworkOption(network: NetworkType) {
    switch (network) {
      case this.TEST_NET:
        return 'TEST_NET'
    }
    return 'MAIN_NET'
  }

  generateModule(module: InternalMoveModule, network: NetworkType) {
    const functions = this.GENERATE_ON_ENTRY
      ? module.exposedFunctions.map((f) => this.generateOnEntryFunctions(module, f)).filter((s) => s !== '')
      : []
    const clientFunctions = this.GENERATE_CLIENT
      ? module.exposedFunctions.map((f) => this.generateClientFunctions(module, f)).filter((s) => s !== '')
      : []
    const eventStructs = this.chainAdapter.getEventStructs(module)
    const eventTypes = new Set(eventStructs.keys())
    const events = Array.from(eventStructs.values())
      .map((e) => this.generateOnEvents(module, e))
      .filter((s) => s !== '')
    const structs = module.structs.map((s) => this.generateStructs(module, s, eventTypes))
    const callArgs = module.exposedFunctions.map((f) => this.generateCallArgsStructs(module, f))

    const moduleName = normalizeToJSName(module.name)
    let processor = ''
    let client = ''

    if (clientFunctions.length > 0) {
      client = `
      export class ${moduleName}_client extends ModuleClient {
        ${clientFunctions.join('\n')}
      }
      `
    }

    if (functions.length > 0 || events.length > 0) {
      processor = `export class ${moduleName} extends ${this.PREFIX}BaseProcessor {

    constructor(options: ${this.PREFIX}BindOptions) {
      super("${module.name}", options)
    }
    static DEFAULT_OPTIONS: ${this.PREFIX}BindOptions = {
      address: "${module.address}",
      network: ${this.PREFIX}Network.${this.generateNetworkOption(network)}
    }

    static bind(options: Partial<${this.PREFIX}BindOptions> = {}): ${moduleName} {
      return new ${moduleName}({ ...${moduleName}.DEFAULT_OPTIONS, ...options })
    }

    ${functions.join('\n')}

    ${events.join('\n')}
  }
  `
    }

    return `
  ${client}

  ${processor}

  export namespace ${moduleName} {
    ${structs.join('\n')}

    ${callArgs.join('\n')}
 }
  `
  }

  generateStructs(module: InternalMoveModule, struct: InternalMoveStruct, events: Set<string>) {
    const genericString = this.generateStructTypeParameters(struct)
    const genericStringAny = this.generateStructTypeParameters(struct, true)

    const structName = normalizeToJSName(struct.name)

    const fields = struct.fields.map((field) => {
      const type = this.generateTypeForDescriptor(field.type, module.address)
      return `${field.name}: ${type}`
    })

    let eventPayload = ''
    if (events.has(moduleQname(module) + SPLITTER + struct.name)) {
      eventPayload = `
    export interface ${structName}Instance extends
        TypedEventInstance<${structName}${genericStringAny}> {
      ${this.STRUCT_FIELD_NAME}_decoded: ${structName}${genericStringAny}
      type_arguments: [${struct.typeParams.map((_) => 'string').join(', ')}]
    }
    `
    }

    return `
  export class ${structName}${genericString} {
    static TYPE_QNAME = '${module.address}::${module.name}::${struct.name}'
    ${fields.join('\n')}
  }

  ${eventPayload}
  `
  }

  generateFunctionTypeParameters(func: InternalMoveFunction) {
    let genericString = ''
    if (func.typeParams && func.typeParams.length > 0) {
      const params = func.typeParams
        .map((v, idx) => {
          return `T${idx}=any`
        })
        .join(',')
      genericString = `<${params}>`
    }
    return genericString
  }

  generateStructTypeParameters(struct: InternalMoveStruct, useAny = false) {
    let genericString = ''

    if (struct.typeParams && struct.typeParams.length > 0) {
      const params = struct.typeParams
        .map((v, idx) => {
          return useAny ? 'any' : 'T' + idx
        })
        .join(',')
      genericString = `<${params}>`
    }
    return genericString
  }

  generateCallArgsStructs(module: InternalMoveModule, func: InternalMoveFunction) {
    if (!func.isEntry) {
      return
    }

    const fields = this.chainAdapter.getMeaningfulFunctionParams(func.params).map((param) => {
      return this.generateTypeForDescriptor(param, module.address) + (this.PAYLOAD_OPTIONAL ? ' | undefined' : '')
    })

    const camelFuncName = upperFirst(camelCase(func.name))

    const genericString = this.generateFunctionTypeParameters(func)
    return `
  export interface ${camelFuncName}Payload${genericString}
      extends TypedFunctionPayload<[${fields.join(',')}]> {
    arguments_decoded: [${fields.join(',')}],
    type_arguments: [${func.typeParams.map((_) => 'string').join(', ')}]
  }
  `
  }

  generateClientFunctions(module: InternalMoveModule, func: InternalMoveFunction) {
    if (func.visibility === InternalMoveFunctionVisibility.PRIVATE) {
      return ''
    }
    if (func.isEntry) {
      return ''
    }
    // const moduleName = normalizeToJSName(module.name)
    const funcName = camelCase(func.name)
    const fields = this.chainAdapter.getMeaningfulFunctionParams(func.params).map((param) => {
      return this.generateTypeForDescriptor(param, module.address)
    })
    const genericString = this.generateFunctionTypeParameters(func)

    const returns = func.return.map((param) => {
      return this.generateTypeForDescriptor(param, module.address)
    })

    const source = `
  ${funcName}${genericString}(type_arguments: [${func.typeParams
      .map((_) => 'string')
      .join(', ')}], args: [${fields.join(',')}], version?: bigint): Promise<[${returns.join(',')}]> {
    return this.viewDecoded('${module.address}::${module.name}::${func.name}', type_arguments, args, version) as any
  }`
    return source
  }

  generateOnEntryFunctions(module: InternalMoveModule, func: InternalMoveFunction) {
    if (!func.isEntry) {
      return ''
    }

    // const genericString = generateFunctionTypeParameters(func)
    const moduleName = normalizeToJSName(module.name)

    const camelFuncName = upperFirst(camelCase(func.name))
    const source = `
  onEntry${camelFuncName}(func: (call: ${moduleName}.${camelFuncName}Payload, ctx: ${this.PREFIX}Context) => void, filter?: CallFilter, fetchConfig?: Partial<MoveFetchConfig>): ${moduleName} {
    this.onEntryFunctionCall(func, {
      ...filter,
      function: '${module.name}::${func.name}'
    },
    fetchConfig)
    return this
  }`

    return source
  }

  generateOnEvents(module: InternalMoveModule, struct: InternalMoveStruct): string {
    // for struct that has drop + store
    // if (!isEvent(struct, module)) {
    //   return ''
    // }

    // const genericString = generateStructTypeParameters(struct)

    const moduleName = normalizeToJSName(module.name)
    const source = `
  onEvent${struct.name}(func: (event: ${moduleName}.${normalizeToJSName(struct.name)}Instance, ctx: ${
      this.PREFIX
    }Context) => void, fetchConfig?: Partial<MoveFetchConfig>): ${moduleName} {
    this.onMoveEvent(func, {
      type: '${module.name}::${struct.name}'
    },
    fetchConfig)
    return this
  }
  `
    return source
  }

  generateTypeForDescriptor(type: TypeDescriptor, currentAddress: string): string {
    if (type.reference) {
      return this.ADDRESS_TYPE
    }

    switch (type.qname) {
      case 'signer': // TODO check this
      case 'address':
      case 'Address':
        return this.ADDRESS_TYPE
      case '0x1::string::String':
        return 'string'
      case 'bool':
      case 'Bool':
        return 'Boolean'
      case 'u8':
      case 'U8':
      case 'u16':
      case 'U16':
      case 'u32':
      case 'U32':
        return 'number'
      case 'u64':
      case 'U64':
      case 'u128':
      case 'U128':
      case 'u256':
      case 'U256':
        return 'bigint'
    }

    if (type.qname.toLowerCase() === VECTOR_STR) {
      // vector<u8> as hex string
      const elementTypeQname = type.typeArgs[0].qname
      if (elementTypeQname === 'u8') {
        // only for aptos
        return 'string'
      }
      if (elementTypeQname.startsWith('T') && !elementTypeQname.includes(SPLITTER)) {
        return `${elementTypeQname}[] | string`
      }
      return this.generateTypeForDescriptor(type.typeArgs[0], currentAddress) + '[]'
    }

    const simpleName = this.generateSimpleType(type.qname, currentAddress)
    if (simpleName.length === 0) {
      console.error('unexpected error')
    }
    if (simpleName.toLowerCase() === VECTOR_STR || simpleName.toLowerCase().startsWith(VECTOR_STR + SPLITTER)) {
      console.error('unexpected vector type error')
    }
    if (type.typeArgs.length > 0) {
      // return simpleName
      return (
        simpleName + '<' + type.typeArgs.map((t) => this.generateTypeForDescriptor(t, currentAddress)).join(',') + '>'
      )
    }
    return simpleName
  }

  generateSimpleType(type: string, currentAddress: string): string {
    const parts = type.split(SPLITTER)

    for (let i = 0; i < parts.length; i++) {
      parts[i] = normalizeToJSName(parts[i])
    }

    if (parts.length < 2) {
      return parts[0]
    }
    if (parts[0] === currentAddress) {
      return parts.slice(1).join('.')
    }
    return '_' + parts.join('.')
  }
}

export class AccountCodegen<ModuleType, NetworkType> {
  modules: InternalMoveModule[]
  config: Config<NetworkType>
  abi: ModuleType[]
  loader: AccountRegister
  moduleGen: AbstractCodegen<ModuleType, NetworkType>

  constructor(
    moduleGen: AbstractCodegen<ModuleType, NetworkType>,
    loader: AccountRegister,
    abi: ModuleType[],
    modules: InternalMoveModule[],
    config: Config<NetworkType>
  ) {
    // const json = fs.readFileSync(config.srcFile, 'utf-8')
    this.moduleGen = moduleGen
    this.abi = abi
    this.modules = modules
    this.config = config
    this.loader = loader
  }

  generate(): OutputFile[] {
    if (!this.modules) {
      return []
    }
    // const baseName = path.basename(this.config.fileName, '.json')

    let address: string | undefined
    for (const module of this.modules) {
      address = module.address
    }
    if (!address) {
      return []
    }

    const imports = `
    import { CallFilter } from "@sentio/sdk/move"
    import {
      MoveCoder, defaultMoveCoder, ${this.moduleGen.PREFIX}BindOptions, ${this.moduleGen.PREFIX}BaseProcessor,
      TypedEventInstance, ${this.moduleGen.PREFIX}Network, TypedFunctionPayload,
      ${this.moduleGen.PREFIX}Context } from "@sentio/sdk/${this.moduleGen.PREFIX.toLowerCase()}"
    import { MoveFetchConfig } from "@sentio/protos"
    import { ${this.moduleGen.ADDRESS_TYPE}, ModuleClient } from "@sentio/sdk/${this.moduleGen.PREFIX.toLowerCase()}"
    `

    const dependedAccounts: string[] = []

    const moduleImports: string[] = []

    const info = this.loader.accountImports.get(address)

    if (info) {
      for (const [account] of info.imports.entries()) {
        // Remap to user's filename if possible, TODO codepath not well tested
        const tsAccountModule = './' + (this.loader.accountImports.get(account)?.moduleName || account)
        if (isFrameworkAccount(account) && !isFrameworkAccount(address)) {
          // Decide where to find runtime library
          moduleImports.push(`import { _${account} } from "@sentio/sdk/${this.moduleGen.PREFIX.toLowerCase()}/builtin"`)
        } else {
          moduleImports.push(`import * as _${account} from "${tsAccountModule}.js"`)
        }

        dependedAccounts.push(account)
      }
    }

    let loadAllTypes = `loadAllTypes(defaultMoveCoder(${
      this.moduleGen.PREFIX
    }Network.${this.moduleGen.generateNetworkOption(this.config.network)}))`

    if (this.moduleGen.SYSTEM_MODULES.has(address)) {
      loadAllTypes = `
        loadAllTypes(defaultMoveCoder(${this.moduleGen.PREFIX}Network.MAIN_NET))
        loadAllTypes(defaultMoveCoder(${this.moduleGen.PREFIX}Network.TEST_NET))
      `
    }

    const source = `
    /* Autogenerated file. Do not edit manually. */
    /* tslint:disable */
    /* eslint-disable */

    /* Generated modules for account ${address} */

    ${imports}

    ${moduleImports.join('\n')}

    ${this.modules.map((m) => this.moduleGen.generateModule(m, this.config.network)).join('\n')}

    const MODULES = JSON.parse('${JSON.stringify(this.abi)}')

    export function loadAllTypes(coder: MoveCoder) {
      ${dependedAccounts.map((a) => `_${a}.loadAllTypes(coder)`).join('\n')}
      for (const m of Object.values(MODULES)) {
        coder.load(m as any)
      }
    }

    ${loadAllTypes}
    ` // source

    return [
      {
        fileName: this.config.fileName + '.ts',
        fileContent: source,
      },
    ]
  }
}
