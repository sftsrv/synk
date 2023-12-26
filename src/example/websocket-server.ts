import { WebSocket, WebSocketServer } from "ws"
import { Changes, Reference, ReferenceID, Version } from "../types"
import { InMemoryOwnedStore } from "../in-memory/InMemoryOwnedStore"
import { AsyncCommand } from "../async/types"
import { Data } from "./types"

let connections: WebSocket[] = []

const Command = AsyncCommand(Data)

const db = new InMemoryOwnedStore<Data>()
db.put({
  version: 0,
  type: "user",
  id: "initial",
  name: "initial user",
  age: 5,
})

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

    console.log(message)

    const command = message.data
    const version = command.version

    if (!command.mutate) {
      const changes = db.getAll(version)
      const push: Changes<Data> = {
        version: db.getVersion(),
        update: changes,
      }
      ws.send(JSON.stringify(push))
      return
    }

    for (const mutation of command.mutate || []) {
      const { command, data } = mutation

      if (command === "delete") {
        db.delete(data)
      } else if (command === "put") {
        db.put(data)
      }
    }

    const changes = db.getAll(version)

    const push: Changes<Data> = {
      update: changes,
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
