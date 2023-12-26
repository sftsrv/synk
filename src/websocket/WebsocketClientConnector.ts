import { WebSocket } from "ws"
import { Changes, Connector, Reference, ReplicatedStore } from "../types"

import { z } from "zod"
import { WebsocketCommand } from "./types"

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

    ws.on("open", () => {
      this.status = "connected"
      this.init()
    })

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

  /**
   * Called on initialization so the connector can handle any asynchronous setup and population of
   * the initial store
   */
  private async init() {
    await this.store.init()
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
