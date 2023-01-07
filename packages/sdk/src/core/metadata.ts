import { normalizeName } from './meter.js'

export type Labels = { [key: string]: string }

export class NamedResultDescriptor {
  name: string

  constructor(name: string) {
    this.name = normalizeName(name)
  }
}
