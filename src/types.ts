import { z } from "zod"

export type Awaitable<T> = Promise<T> | T

/**
 * Infer the type of a function that returns a Zod schema
 */
export type GenericInfer<Fn extends (schema: z.ZodType) => z.ZodType> = z.infer<
  ReturnType<Fn>
>

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

/**
 * A reference to an object that will be shared between participants
 */
export const Reference = z.object({
  id: z.string(),
  version: z.number(),
  type: z.string(),
})

export type Reference = z.infer<typeof Reference>
export type ReferenceID = Reference["id"]
export type ReferenceType = Reference["version"]

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
  putOne(reference: T): void
  putMany(references: T[]): void

  delete(reference: T): void
}

export const Changes = <T extends Reference>(T: z.ZodType<T>) =>
  z.object({
    version: z.number(),
    update: z.array(T).optional(),
    delete: z.array(Reference).optional(),
  })

export type Changes<T extends Reference> = GenericInfer<typeof Changes<T>>

/**
 * A data store that will be used for resolving and retreiving requested entities as well as persisting
 * reference updates
 */
export interface Writable<T extends Reference> {
  getVersion(): Awaitable<Version>
}

/**
 * A data store that is the target of data replication. It simply stores items and does not do any
 * modification of versions
 */
export interface ReplicatedStore<T extends Reference> extends Writable<T> {
  /**
   * Used so that connectors can initialize the store as part of their own setup sequence so that
   * consumers do not need to manage the lifecycle of the store
   */
  init(): Awaitable<void>
  applyChanges(changes: Changes<T>): Awaitable<void>
}

/**
 * A store that owns the underlying data and can modify or update versions or data as needed
 */
export interface OwnedStore<T extends Reference> extends Writable<T> {}

export type Store<T extends Reference> = OwnedStore<T> | ReplicatedStore<T>
