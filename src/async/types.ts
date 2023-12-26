import { Changes, GenericInfer, Reference } from "../types"

import { z } from "zod"

const Command = z.union([z.literal("delete"), z.literal("put")])

export type Command = z.infer<typeof Command>

/**
 *
 * @param T
 * @returns
 */
const Mutation = <T extends Reference>(T: z.ZodType<T>) =>
  z.object({
    /**
     * The data/payload assocaited with the mutation
     */
    data: T,
    /**
     * The operation to be handled by this mutation
     */
    command: Command,
  })

export type Mutation<T extends Reference> = GenericInfer<typeof Mutation<T>>

export const AsyncCommand = <T extends Reference>(T: z.ZodType<T>) =>
  z.object({
    /**
     * The version of the database for  client invoking the command
     */
    version: z.number(),
    /**
     * List of mutations to send to the client. If no mutations are sent then the command will
     * only synchronize data
     */
    mutate: z.array(Mutation(T)).optional(),
  })

/**
 * Command to be sent to the server
 */
export type AsyncCommand<T extends Reference> = GenericInfer<
  typeof AsyncCommand<T>
>

export const Notify = z.object({
  type: z.literal("notify"),
  version: z.number(),
})

export type Notify = z.infer<typeof Notify>

/**
 * Type of message that a server can send to a client
 */
export const Push = <T extends Reference>(T: z.ZodType<T>) =>
  z.union([Changes(T), Notify])

export type Push<T extends Reference> = GenericInfer<typeof Push<T>>
