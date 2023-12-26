import { WebSocket, WebSocketServer } from "ws"
import { Changes } from "../types"
import { InMemoryOwnedStore } from "../in-memory/InMemoryOwnedStore"
import { Notify } from "../async/types"
import { Data } from "./types"

let connections: WebSocket[] = []

const Command = Changes(Data)

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

    db.applyChanges(command)
    const changes = db.getChanges(command.version)
    const newVersion = db.getVersion()

    // send latest data to the client that submitted the change
    ws.send(JSON.stringify(changes))

    // send a notification to all other clients that there is new data available
    const notify: Notify = {
      type: "notify",
      version: newVersion,
    }

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
