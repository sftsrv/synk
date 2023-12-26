import { Changes, GenericInfer, Reference } from "../types"

import { z } from "zod"

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
