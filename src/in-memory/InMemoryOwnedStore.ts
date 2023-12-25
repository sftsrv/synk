import { Awaitable, Reference, OwnedStore, Version, Changes } from "../types"

/**
 * A basic store that persists data in a `Map`. This store owns the data and will increment and
 * manage versions directly
 */
export class InMemoryOwnedStore<T extends Reference> implements OwnedStore<T> {
  private version: Version = 0
  private db = new Map<string, T>()

  private static toKey(reference: Reference) {
    return `${reference.type}::${reference.id}`
  }

  getVersion() {
    return this.version
  }

  incrementVersion() {
    this.version++
    return this.version
  }

  put(reference: T) {
    this.incrementVersion()
    this.db.set(InMemoryOwnedStore.toKey(reference), {
      ...reference,
      version: this.version,
    })
  }

  putMany(references: T[]) {
    this.incrementVersion()

    references.forEach((reference) =>
      this.db.set(InMemoryOwnedStore.toKey(reference), {
        ...reference,
        version: this.version,
      })
    )
  }

  getAll(fromVersion = 0) {
    return Array.from(this.db.values()).filter(
      (val) => val.version >= fromVersion
    )
  }

  getOne(reference: Reference) {
    return this.db.get(InMemoryOwnedStore.toKey(reference))
  }

  delete(reference: Reference) {
    this.incrementVersion()
    this.db.delete(InMemoryOwnedStore.toKey(reference))
  }

  deleteMany(references: Reference[]) {
    this.incrementVersion()
    const keys = references.map(InMemoryOwnedStore.toKey)
    keys.forEach(this.db.delete)
  }
}
