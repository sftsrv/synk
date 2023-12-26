import { Changes, Connector, Reference, ReplicatedStore } from "../types"

import type WebSocket from "ws"

import { z } from "zod"
import { AsyncCommand, Push } from "../async/types"
import { AsyncConnector } from "../async/AsyncConnector"
import { OnReceived } from "./types"

/**
 * Uses a websocket to replicate changes between the client and the server. This implements the
 * sending of commands to the server and handles push commands received from the server
 */
export class WebsocketNodeJSClientConnector<T extends Reference>
  extends AsyncConnector<T>
  implements Connector<T>
{
  constructor(
    readonly store: ReplicatedStore<T>,
    private readonly ws: WebSocket,
    private readonly onReceived?: OnReceived<T>,
    private readonly T: z.ZodType<T> = z.any()
  ) {
    super()

    const ClientMessage = Push(T)

    ws.on("open", () => {
      this.init()
    })

    ws.on("close", console.log)
    ws.on("error", console.error)

    ws.on("message", (data) => {
      const message = ClientMessage.safeParse(JSON.parse(data.toString()))
      if (!message.success) {
        throw message.error
      }

      this.receive(message.data)
      this.onReceived?.(message.data)
    })
  }

  send(command: AsyncCommand<T>) {
    this.ws.send(JSON.stringify(command))
  }
}
