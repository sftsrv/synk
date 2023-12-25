import { WebSocket, WebSocketServer } from "ws"
import { Reference, ReferenceID, Version } from "../types"
import { InMemoryOwnedStore } from "../in-memory/InMemoryOwnedStore"
import {
  WebsocketCommand,
  WebsocketPush,
} from "../websocket/WebsocketConnector"

interface User extends Reference {
  type: "user"
  name: string
  age: number
}

interface Post extends Reference {
  type: "post"
  userId: ReferenceID
  content: string
}

export type Data = User | Post

let connections: WebSocket[] = []
const db = new InMemoryOwnedStore<Data>()

const wss = new WebSocketServer({ port: 8080 }, () =>
  console.log("Server Listening")
)

wss.on("connection", (ws) => {
  connections.push(ws)

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString()) as WebsocketCommand<Data>
    const version = message.version

    for (const mutation of message.mutate || []) {
      const { command, data } = mutation

      if (command === "delete") {
        db.delete(data)
      } else if (command === "put") {
        db.put(data)
      }
    }

    const changes = db.getAll(version)

    console.log(changes)

    const push: WebsocketPush<Data> = {
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
