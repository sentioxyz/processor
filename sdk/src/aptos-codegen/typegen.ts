import { MoveModule } from 'aptos/src/generated'
import { moduleFqn, moduleFqnForType, SPLITTER } from './utils'

const VECTOR_STR = 'vector'

export class TypeDescriptor {
  // type: string

  symbol: string
  // account?: string
  // module?: string

  typeParams: TypeDescriptor[]

  constructor(symbol: string, typeParams?: TypeDescriptor[]) {
    this.symbol = symbol
    this.typeParams = typeParams || []
  }

  generateType(): string {
    switch (this.symbol) {
      case 'signer': // TODO check this
      case 'address':
        return 'Address'
      case '0x1::string::String':
        return 'string'
      case 'bool':
        return 'Boolean'
      case 'u8':
      case 'u16':
      case 'u32':
        return 'number'
      case 'u64':
      case 'u128':
        return 'string'
    }

    if (this.symbol === VECTOR_STR) {
      return this.typeParams[0].generateType() + '[]'
    }

    const simpleName = generateSimpleType(this.symbol)
    if (simpleName.length === 0) {
      console.error('unexpected error')
    }
    if (simpleName.includes('vector')) {
      console.error('unexpected error')
    }
    if (this.typeParams.length > 0) {
      // return simpleName
      return simpleName + '<' + this.typeParams.map((t) => t.generateType()).join(',') + '>'
    }
    return simpleName
  }

  // all depended types including itself, not include system type
  dependedTypes(): string[] {
    switch (this.symbol) {
      case 'signer':
      case 'address':
      case '0x1::string::String':
      case 'bool':
      case 'u8':
      case 'u16':
      case 'u32':
      case 'u64':
      case 'u128':
        return []
    }

    // Type parameters are not depended
    if (this.symbol.indexOf(SPLITTER) == -1) {
      if (this.symbol.startsWith('T')) {
        return []
      }
    }

    const types = new Set<string>()
    for (const param of this.typeParams) {
      param.dependedTypes().forEach((t) => types.add(t))
    }

    if (this.symbol !== VECTOR_STR) {
      types.add(this.symbol)
    }

    return Array.from(types)
  }
}

function generateSimpleType(type: string): string {
  const parts = type.split(SPLITTER)
  if (parts.length < 2) {
    return parts[0]
  }

  return parts.slice(1).join('.')
}

export function parseMoveType(type: string) {
  type = type.replace('&', '')

  type = type.replace(' ', '')
  const stack: TypeDescriptor[] = [new TypeDescriptor('')]
  let buffer = []

  // xxx:asdf<g1<a,<c,d>>, b, g2<a,b>, e>
  for (let i = 0; i < type.length; i++) {
    const ch = type[i]
    if (ch === '<') {
      // const symbol = type.slice(symbolStart, i)
      // symbolStart =
      const symbol = buffer.join('')
      buffer = []
      stack[stack.length - 1].symbol = symbol
      stack.push(new TypeDescriptor(''))
      continue
    }
    if (ch === '>') {
      const typeParam = stack.pop()
      if (!typeParam) {
        throw Error('Uxpectecd stack size')
      }
      if (buffer.length > 0) {
        typeParam.symbol = buffer.join('')
        buffer = []
      }
      stack[stack.length - 1].typeParams.push(typeParam)
      continue
    }
    if (ch === ',') {
      const typeParam = stack.pop()
      if (!typeParam) {
        throw Error('Uxpectecd stack size')
      }
      if (buffer.length > 0) {
        typeParam.symbol = buffer.join('')
        buffer = []
      }

      stack[stack.length - 1].typeParams.push(typeParam)
      // continue parse next param
      stack.push(new TypeDescriptor(''))
      continue
    }

    buffer.push(ch)
  }

  if (buffer.length > 0) {
    stack[stack.length - 1].symbol = buffer.join('')
  }

  const res = stack.pop()
  if (!res || stack.length > 0) {
    throw Error('Uxpectecd stack size')
  }
  return res
}

// TODO ctx need to have type parameters
export function generateType(type: string, ctx?: any): string {
  return parseMoveType(type).generateType()
}

export class AccountModulesImportInfo {
  // account to module
  imports: Map<string, Set<string>>
  account: string
  moduleName: string

  constructor(account: string, tsModuleName: string) {
    this.account = account
    this.moduleName = tsModuleName
    this.imports = new Map<string, Set<string>>()
  }

  addImport(account: string, module: string) {
    if (account === this.account) {
      return
    }
    let accountModules = this.imports.get(account)
    if (!accountModules) {
      accountModules = new Set<string>()
      this.imports.set(account, accountModules)
    }
    accountModules.add(module)
  }
}

export class AccountRegister {
  accountImports = new Map<string, AccountModulesImportInfo>()
  pendingAccounts = new Set<string>()

  // loadedAccount = new Set<string>()
  typeRegistry = new Map<string, TypeDescriptor>()

  private loadTypeDescriptor(type: string) {
    let descriptor = this.typeRegistry.get(type)

    // const descriptparseMoveType(type)
    if (!descriptor) {
      descriptor = parseMoveType(type)
      this.typeRegistry.set(type, descriptor)
    }
    return descriptor
  }

  register(module: MoveModule, tsModuleName: string): AccountModulesImportInfo {
    const currentModuleFqn = moduleFqn(module)

    let accountModuleImports = this.accountImports.get(module.address)
    if (!accountModuleImports) {
      accountModuleImports = new AccountModulesImportInfo(module.address, tsModuleName)
      this.accountImports.set(module.address, accountModuleImports)
      // the account has already be processed, delete pending task
      this.pendingAccounts.delete(module.address)
    }

    for (const struct of module.structs) {
      for (const field of struct.fields) {
        for (const type of this.loadTypeDescriptor(field.type).dependedTypes()) {
          const [account, module] = moduleFqnForType(type)
          accountModuleImports.addImport(account, module)
          if (!this.accountImports.has(account)) {
            this.pendingAccounts.add(account)
          }
        }
      }
    }

    for (const func of module.exposed_functions) {
      if (!func.is_entry) {
        continue
      }
      for (const param of func.params) {
        for (const type of this.loadTypeDescriptor(param).dependedTypes()) {
          const [account, module] = moduleFqnForType(type)
          accountModuleImports.addImport(account, module)
          if (!this.accountImports.has(account)) {
            this.pendingAccounts.add(account)
          }
        }
      }
    }
    this.accountImports.set(currentModuleFqn, accountModuleImports)
    return accountModuleImports
  }
}
