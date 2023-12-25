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

export type EntityID = string
export type EntityHash = string
export type EntityType = string

/**
 * A reference to an object that will be shared between participants
 */
export interface Reference {
  type: EntityType
  id: EntityID
  updatedVersion: Version
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
   * Update store and view data
   */
  synchronize(): void

  addView(view: View): void
  removeView(view: View): void

  addStore(store: Writable<T>): void
  removeStore(store: Writable<T>): void

  create(entity: T): void

  update(entity: T): void

  delete(entity: T): void
}

/**
 * A data store that will be used for resolving and retreiving requested entities as well as persisting
 * entity updates
 */
export interface Writable<T extends Reference> {
  put(entity: T): Awaitable<void>
  putMany(entities: T[]): Awaitable<void>

  delete(id: EntityID): Awaitable<void>
}

/**
 * A store that will be used for retreiving data from the underlying persistence implementation
 */
export interface Readable<T extends Reference> {
  readAll(): Awaitable<T>[]
  read(id: EntityID): Awaitable<T | undefined>
}

/**
 * Abstraction for a store that implements the writable and readable store interfaces
 */
export interface Store<T extends Reference> extends Writable<T>, Readable<T> {}
