import { WebSocket, WebSocketServer } from "ws"
import { Reference, ReferenceID, Version } from "../types"
import { InMemoryOwnedStore } from "../in-memory/InMemoryOwnedStore"
import {
  WebsocketCommand,
  Changes,
} from "../websocket/WebsocketClientConnector"
import { Data } from "./types"

let connections: WebSocket[] = []

const Command = WebsocketCommand(Data)

const db = new InMemoryOwnedStore<Data>()

const wss = new WebSocketServer({ port: 8080 }, () =>
  console.log("Server Listening")
)

wss.on("connection", (ws) => {
  connections.push(ws)

  ws.on("message", (data) => {
    const message = Command.safeParse(JSON.parse(data.toString()))
    if (!message.success) {
      console.error(message.error)
      return
    }

    const command = message.data
    const version = command.version

    for (const mutation of command.mutate || []) {
      const { command, data } = mutation

      if (command === "delete") {
        db.delete(data)
      } else if (command === "put") {
        db.put(data)
      }
    }

    const changes = db.getAll(version)

    console.log(changes)

    const push: Changes<Data> = {
      data: changes,
      version: db.getVersion(),
    }

    connections.forEach((conn) => conn.send(JSON.stringify(push)))
  })

  ws.on("open", () => {
    console.log("open")
    connections.push(ws)
  })

  ws.on("close", () => {
    console.log("closed")
    connections = connections.filter((conn) => conn !== ws)
  })

  ws.on("error", (err) => {
    console.log(err)
    connections = connections.filter((conn) => conn !== ws)
  })
})
