import { WebSocket, WebSocketServer } from "ws"
import { Changes } from "../types"
import { InMemoryOwnedStore } from "../in-memory/InMemoryOwnedStore"
import { AsyncCommand, Notify } from "../async/types"
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
        type: "changes",
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

    const newVersion = db.getVersion()

    const push: Changes<Data> = {
      type: "changes",
      update: changes,
      version: newVersion,
    }

    // send latest data to the client that submitted the change
    ws.send(JSON.stringify(push))

    // send a notification to all other clients that there is new data available
    const notify: Notify = {
      type: "notify",
      version: newVersion,
    }

    console.log({ push, notify })

    connections.forEach((conn) => conn.send(JSON.stringify(notify)))
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
