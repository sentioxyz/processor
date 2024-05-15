import { Store } from './store.js'


export abstract class Entity {
  constructor(private readonly store: Store, private readonly data: Record<string, any>) {
  }

  get(field: string) {
    return this.data[field]
  }

  set(field: string, value: any) {
    this.data[field] = value
  }
}