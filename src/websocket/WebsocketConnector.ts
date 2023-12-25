import { WebSocket } from "ws"
import {
  Connector,
  Reference,
  ReplicatedStore,
  Store,
  Version,
  Writable,
} from "../types"

export type CommandType = "delete" | "put"

export interface Mutation<T> {
  command: CommandType
  data: T
}

export interface WebsocketCommand<T extends Reference> {
  version: Version
  mutate?: Mutation<T>[]
}

export interface WebsocketPush<T extends Reference> {
  version: Version
  data: T[]
}

type Status = "disconnected" | "connected" | "error"

export class WebsocketConnector<T extends Reference> implements Connector<T> {
  private status: Status = "disconnected"

  constructor(
    private readonly store: ReplicatedStore<T>,
    private readonly ws: WebSocket
  ) {
    ws.on("open", () => (this.status = "connected"))
    ws.on("close", () => (this.status = "disconnected"))
    ws.on("error", () => (this.status = "error"))

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString()) as WebsocketPush<T>
      this.receive(message)
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
