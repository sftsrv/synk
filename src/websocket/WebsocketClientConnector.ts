import { WebSocket } from "ws"
import {
  Changes,
  Connector,
  GenericInfer,
  Reference,
  ReplicatedStore,
  Store,
  Version,
  Writable,
} from "../types"

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

const WebsocketCommand = <T extends Reference>(T: z.ZodType<T>) =>
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

type Status = "disconnected" | "connected" | "error"

/**
 * Uses a websocket to replicate changes between the client and the server. This implements the
 * sending of commands to the server and handles push commands received from the server
 */
export class WebsocketClientConnector<T extends Reference>
  implements Connector<T>
{
  private status: Status = "disconnected"

  constructor(
    private readonly store: ReplicatedStore<T>,
    private readonly ws: WebSocket,
    private readonly T: z.ZodType<T> = z.any()
  ) {
    const DataPush = Changes(T)

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

  private receive(push: Changes<T>) {
    this.store.applyChanges(push)
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
