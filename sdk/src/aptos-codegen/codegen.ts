import { MoveModuleBytecode } from 'aptos/src/generated'
import fs from 'fs'
import path from 'path'
import { MoveFunction, MoveModule } from 'aptos/src/generated'
import { MoveStruct } from 'aptos/src/generated/models/MoveStruct'
import prettier from 'prettier'

interface Config {
  srcFile: string
  outputDir: string
}

export class AptosCodegen {
  modules: MoveModuleBytecode[]
  config: Config

  constructor(config: Config) {
    const json = fs.readFileSync(config.srcFile, 'utf-8')
    this.modules = JSON.parse(json)
    this.config = config
  }

  generate() {
    if (!this.modules) {
      return
    }
    let address: string | undefined
    for (const module of this.modules) {
      if (module.abi && module.abi.address) {
        address = module.abi.address
      }
    }
    if (!address) {
      return
    }

    const imports = `import { aptos } from "@sentio/sdk"`

    let source = `
    /* Autogenerated file. Do not edit manually. */
    /* tslint:disable */
    /* eslint-disable */
  
    /* Generated modules for account ${address} */
  
    ${imports}
    
    ${this.modules.map(generateModule).join('\n')}
    ` // source

    const baseName = path.basename(this.config.srcFile, '.json')
    source = prettier.format(source, { parser: 'typescript' })
    fs.writeFileSync(path.join(this.config.outputDir, baseName + '.ts'), source)
  }
}

function generateModule(moduleByteCode: MoveModuleBytecode) {
  if (!moduleByteCode.abi) {
    return ''
  }
  const module = moduleByteCode.abi

  const functions = module.exposed_functions.map((f) => generateOnEntryFunctions(module, f)).filter((s) => s !== '')
  const events = module.structs.map((e) => generateOnEvents(module, e)).filter((s) => s !== '')

  return `
  export class ${module.name} extends aptos.AptosBaseProcessor {
    static DEFAULT_OPTIONS: aptos.NamedAptosBindOptions = {
      address: "${module.address}",
      network: aptos.AptosNetwork.TEST_NET       
    }
    static bind(options = ${module.name}.DEFAULT_OPTIONS): ${module.name} {
      return new ${module.name}({ ...options, name: "${module.name}" })
    }
    
    ${functions.join('\n')}
    
    ${events.join('\n')}
  }`
}

function generateOnEntryFunctions(module: MoveModule, func: MoveFunction) {
  if (!func.is_entry) {
    return ''
  }

  const camelFuncName = capitalizeFirstChar(camelize(func.name))
  const source = `
  onEntry${camelFuncName}(func: (call: aptos.TransactionPayload_EntryFunctionPayload, ctx: aptos.AptosContext) => void): ${module.name} {
    this.onEntryFunctionCall(func, {
      function: '${module.name}::${func.name}'
    })
    return this
  }`

  return source
}

function generateOnEvents(module: MoveModule, struct: MoveStruct): string {
  // for struct that has drop + store
  if (!struct.abilities.includes('drop') || !struct.abilities.includes('store') || !struct.name.endsWith('Event')) {
    return ''
  }
  const source = `
  onEvent${struct.name}(func: (event: aptos.Event, ctx: aptos.AptosContext) => void): ${module.name} {
    this.onEvent(func, {
      type: '${module.name}::${struct.name}'
    })
    return this
  }
  `
  return source
}

function camelize(input: string): string {
  return input
    .split('_')
    .reduce(
      (res, word, i) =>
        i === 0 ? word.toLowerCase() : `${res}${word.charAt(0).toUpperCase()}${word.substr(1).toLowerCase()}`,
      ''
    )
}

function capitalizeFirstChar(input: string): string {
  if (!input) {
    return input
  }
  return input[0].toUpperCase() + (input.length > 1 ? input.substring(1) : '')
}
