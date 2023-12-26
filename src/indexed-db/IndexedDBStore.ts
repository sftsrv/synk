import {
  Awaitable,
  Changes,
  Reference,
  ReplicatedStore,
  Version,
} from "../types"

const requestDatabase = (name: string) => {
  return new Promise<IDBDatabase>((resolve, reject) => {})
}

function assertInitialized<T>(db?: T): asserts db is T {
  if (!db) {
    throw new Error("Database not initialized")
  }
}

interface StoreEntry<T> {
  key: string
  data: T
}

/**
 * An instance of an IndexedDB backed store. When creating an instance the store needs to be
 * initialized. This will be handled by the connector if needed
 */
export class IndexedDBStore<T extends Reference> implements ReplicatedStore<T> {
  db?: IDBDatabase

  private readonly versionStoreName = "version"
  private readonly dataStoreName = "data"

  readonly schemaVersion = 1

  constructor(private readonly name: string) {}

  /**
   * Initializes IndexedDB to the schema version that aligns to the structure of the replicated
   * store
   */
  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = window.indexedDB.open(this.name, this.schemaVersion)

      request.onerror = reject

      request.onsuccess = () => {
        const db = request.result

        // If there is an upgrade transaction then we don't handle anything as the DB needs to be
        // updated
        const upgradeTransaction = request.transaction
        if (upgradeTransaction) {
          // we do not resolve here - the resolution will happen during `onupgradeneeded`
          return
        }

        // If no update needed then just initialize the internal state and resolve
        this.db = db
        resolve()
      }

      // Create the relevant o bject stores and indexes if the DB needs to be upgraded based on the
      // schema version check performed by IndexedDB
      request.onupgradeneeded = () => {
        const db = request.result

        // The upgrade transaction, if it exists then  we need to do he update within its scope
        const upgradeTransaction = request.transaction

        if (!upgradeTransaction) {
          // Not resolving here, if we are not upgrading then resolution happens during `onsuccess`
          return
        }

        upgradeTransaction.db.createObjectStore(this.versionStoreName)
        upgradeTransaction.db.createObjectStore(this.dataStoreName, {
          keyPath: "key",
        })

        upgradeTransaction.oncomplete = () => resolve()

        this.db = db
      }
    })
  }

  getVersionStore(mode?: IDBTransactionMode) {
    assertInitialized(this.db)

    const transaction = this.db.transaction([this.versionStoreName], mode)
    const store = transaction.objectStore(this.versionStoreName)

    return store
  }

  private readonly versionKey = "version"
  async getVersion() {
    return new Promise<Version>((resolve, reject) => {
      const store = this.getVersionStore("readonly")

      const request = store.get("version")

      request.onerror = reject
      request.onsuccess = () => {
        const version = request.result as Version | undefined
        resolve(version || 0)
      }
    })
  }

  toKey(data: Reference) {
    return `${data.type}::${data.id}`
  }

  toStoreData(data: T) {
    const key = this.toKey(data)
    const entry: StoreEntry<T> = {
      key,
      data,
    }

    return entry
  }

  applyChanges(changes: Changes<T>): Awaitable<void> {
    return new Promise((resolve, reject) => {
      assertInitialized(this.db)

      const transaction = this.db.transaction(
        [this.dataStoreName, this.versionStoreName],
        "readwrite"
      )
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject()

      const dataStore = transaction.objectStore(this.dataStoreName)
      const versionStore = transaction.objectStore(this.versionStoreName)

      const updates = changes.update || []
      const deletes = changes.delete || []

      updates.forEach((data) => {
        const entry = this.toStoreData(data)
        // The data store uses inline keys so a key should not be provided
        dataStore.put(entry)
      })

      deletes.forEach((data) => {
        const key = this.toKey(data)
        dataStore.delete(key)
      })

      versionStore.put(changes.version, this.versionKey)
    })
  }
}
