import WebSocket from "ws"
import {
  WebsocketCommand,
  WebsocketConnector,
} from "../websocket/WebsocketConnector"
import { type Data } from "./websocket-server"
import { InMemoryReplicatedStore } from "../in-memory/InMemoryReplicatedStore"

const ws = new WebSocket("ws://localhost:8080")
const db = new InMemoryReplicatedStore<Data>()

const connector = new WebsocketConnector(db, ws)

setInterval(() => {
  connector.putOne({
    type: "post",
    id: Date.now().toString(),
    lastVersion: db.getVersion(),
    userId: "1",
    content: "some content",
  })
  console.log("DB", db.getAll())
}, 5000)
