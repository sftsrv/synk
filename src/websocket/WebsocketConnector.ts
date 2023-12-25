import { WebSocket } from "ws"
import {
  Connector,
  Reference,
  ReplicatedStore,
  Store,
  Version,
  Writable,
} from "../types"

import { z } from "zod"

type GenericInfer<Fn extends (schema: z.ZodType) => z.ZodType> = z.infer<
  ReturnType<Fn>
>

const Command = z.union([z.literal("delete"), z.literal("put")])

export type Command = z.infer<typeof Command>

const Mutation = <T extends Reference>(data: z.ZodType<T>) =>
  z.object({
    data,
    command: Command,
  })

export type Mutation<T extends Reference> = GenericInfer<typeof Mutation<T>>

export const WebsocketCommand = <T extends Reference>(data: z.ZodType<T>) =>
  z.object({
    version: z.number(),
    mutate: z.array(Mutation(data)).optional(),
  })

export type WebsocketCommand<T extends Reference> = GenericInfer<
  typeof WebsocketCommand<T>
>

export const WebsocketPush = <T extends Reference>(data: z.ZodType<T>) =>
  z.object({
    version: z.number(),
    data: z.array(data),
  })

export type WebsocketPush<T extends Reference> = GenericInfer<
  typeof WebsocketPush<T>
>

type X = WebsocketPush<Reference & { name: string }>

type Status = "disconnected" | "connected" | "error"

export class WebsocketConnector<T extends Reference> implements Connector<T> {
  private status: Status = "disconnected"

  constructor(
    private readonly store: ReplicatedStore<T>,
    private readonly ws: WebSocket,
    private readonly T: z.ZodType<T>
  ) {
    const DataPush = WebsocketPush(T)

    ws.on("open", () => (this.status = "connected"))
    ws.on("close", () => (this.status = "disconnected"))
    ws.on("error", () => (this.status = "error"))

    ws.on("message", (data) => {
      const message = DataPush.safeParse(JSON.parse(data.toString()))
      if (!message.success) {
        throw message.error
      }

      this.receive(message.data)
    })
  }

  async init() {
    const version = await this.store.getVersion()
    this.send({
      version,
    })
  }

  private send(command: WebsocketCommand<T>) {
    this.ws.send(JSON.stringify(command))
  }

  private receive(push: WebsocketPush<T>) {
    console.log("Received changes", push)
    this.store.putMany(push.data)
    this.store.setVersion(push.version)
  }

  async putOne(data: T) {
    const version = await this.store.getVersion()
    this.send({
      version,
      mutate: [
        {
          data,
          command: "put",
        },
      ],
    })
  }

  async putMany(references: T[]) {
    const version = await this.store.getVersion()
    this.send({
      version,
      mutate: references.map((data) => ({
        data,
        command: "delete",
      })),
    })
  }

  async delete(data: T) {
    const version = await this.store.getVersion()
    this.send({
      version,
      mutate: [
        {
          data,
          command: "delete",
        },
      ],
    })
  }
}
