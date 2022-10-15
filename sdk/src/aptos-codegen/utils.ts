import { MoveModule } from 'aptos/src/generated'

export const SPLITTER = '::'

export function isFrameworkAccount(account: string) {
  return account === '0x1' || account === '0x2' || account === '0x3'
}

export function moduleFqn(module: MoveModule) {
  return module.address.toLowerCase() + SPLITTER + module.name
}

export function moduleFqnForType(type: string): [string, string] {
  const parts = type.split(SPLITTER).slice(0, 2)
  return [parts[0], parts[1]]
}
