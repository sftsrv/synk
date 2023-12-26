import { GenericInfer, Reference } from "../types"

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

export const WebsocketCommand = <T extends Reference>(T: z.ZodType<T>) =>
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
export type WebsocketCommand<T extends Reference> = GenericInfer<
  typeof WebsocketCommand<T>
>
