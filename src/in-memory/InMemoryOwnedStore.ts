import { Awaitable, Reference, OwnedStore, Version, Changes } from "../types"

interface DeleteReference {
  version: Version
  reference: Reference
}

/**
 * A basic store that persists data in a `Map`. This store owns the data and will increment and
 * manage versions directly
 */
export class InMemoryOwnedStore<T extends Reference> implements OwnedStore<T> {
  private version: Version = 0
  private db = new Map<string, T>()
  private deletes = new Map<string, DeleteReference>()

  private static toKey(reference: Reference) {
    return `${reference.type}::${reference.id}`
  }

  getVersion() {
    return this.version
  }

  applyChanges(changes: Changes<T>) {
    if (changes.update?.length) {
      this.putMany(changes.update || [])
    }

    if (changes.update?.length) {
      this.deleteMany(changes.delete || [])
    }
  }

  getChanges(fromVersion?: number | undefined): Changes<T> {
    return {
      type: "changes",
      version: this.getVersion(),
      update: this.getAll(fromVersion),
      delete: this.getDeletes(fromVersion),
    }
  }

  incrementVersion() {
    this.version++
    return this.version
  }

  put(reference: T) {
    this.incrementVersion()
    const updatedReference: T = {
      ...reference,
      version: this.version,
    }

    this.db.set(InMemoryOwnedStore.toKey(reference), updatedReference)

    return updatedReference
  }

  putMany(references: T[]) {
    this.incrementVersion()

    const updatedReferences = references.map<T>((reference) => ({
      ...reference,
      version: this.version,
    }))

    updatedReferences.forEach((reference) =>
      this.db.set(InMemoryOwnedStore.toKey(reference), reference)
    )

    return updatedReferences
  }

  getAll(fromVersion = 0) {
    return Array.from(this.db.values()).filter(
      (val) => val.version >= fromVersion
    )
  }

  getDeletes(fromVersion = 0) {
    return Array.from(this.deletes.values())
      .filter((val) => val.version >= fromVersion)
      .map((val) => val.reference)
  }

  getOne(reference: Reference) {
    return this.db.get(InMemoryOwnedStore.toKey(reference))
  }

  delete(reference: Reference) {
    // increment the version before as this is the version from which the delete is effective
    this.incrementVersion()
    const key = InMemoryOwnedStore.toKey(reference)

    this.deletes.set(key, { version: this.version, reference })
    this.db.delete(key)

    return reference
  }

  deleteMany(references: Reference[]) {
    // exact same implemetation as `this.delete` but we consider all these to be the same version
    this.incrementVersion()
    const deleteResults = references.map((reference) => {
      const key = InMemoryOwnedStore.toKey(reference)
      this.deletes.set(key, { version: this.version, reference })
      this.db.delete(key)

      return reference
    })

    return deleteResults
  }
}
