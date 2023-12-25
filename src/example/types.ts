import { z } from "zod"
import { Reference, ReferenceID } from "../types"

const Reference = z.object({
  id: z.string(),
  lastVersion: z.number(),
  type: z.string(),
})

export const User = Reference.extend({
  type: z.literal("user"),
  name: z.string(),
  age: z.number(),
})

export type User = z.infer<typeof User>

export const Post = Reference.extend({
  type: z.literal("post"),
  userId: z.string(),
  content: z.string(),
})

export type Post = z.infer<typeof Post>

export const Data = z.union([User, Post])

export type Data = z.infer<typeof Data>
