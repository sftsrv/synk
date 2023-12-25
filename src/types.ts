export type Awaitable<T> = Promise<T> | T

export type Version = number

/**
 * A declaration of use for a named set of entities that the client will require from the store
 *
 * It is up to the connector to provide this data in the store
 */
export interface View {
  name: string
  version: Version
}

export type ReferenceID = string
export type ReferenceHash = string
export type ReferenceType = string

/**
 * A reference to an object that will be shared between participants
 */
export interface Reference {
  type: ReferenceType
  id: ReferenceID
  lastVersion: Version
}

/**
 * Used for connecting stores to a network layer. Allows for using multiple stores
 *
 * A connector holds a reference to a store because a given store may be asynchronous and we do not
 * guarantee that any given transaction is successful on the resulting client
 *
 * Connectors may also buffer updates in the case a client is offline or to minimize network load
 * which may be dependant on the connector
 */
export interface Connector<T extends Reference> {
  /**
   * Called on initialization so the connector can handle any asynchronous setup or kick off
   * synchronization if needed
   */
  init(): void

  putOne(reference: T): void
  putMany(references: T[]): void

  delete(reference: T): void
}

/**
 * A data store that will be used for resolving and retreiving requested entities as well as persisting
 * reference updates
 */
export interface Writable<T extends Reference> {
  getVersion(): Awaitable<Version>

  put(reference: T): Awaitable<void>
  putMany(references: T[]): Awaitable<void>

  delete(reference: Reference): Awaitable<void>
}

/**
 * A store that will be used for retreiving data from the underlying persistence implementation
 */
export interface Readable<T extends Reference> {
  getAll(fromVersion?: number): Awaitable<T>[]
  getOne(reference: Reference): Awaitable<T | undefined>
}

/**
 * A data store that is the target of data replication. It simply stores items and does not do any
 * modification of versions
 */

export interface ReplicatedStore<T extends Reference>
  extends Writable<T>,
    Readable<T> {
  setVersion(version: Version): void
}

/**
 * A store that owns the underlying data and can modify or update versions or data as needed
 */
export interface OwnedStore<T extends Reference>
  extends Writable<T>,
    Readable<T> {}

export type Store<T extends Reference> = OwnedStore<T> | ReplicatedStore<T>
