import WebSocket from "ws"
import { WebsocketNodeJSClientConnector } from "../websocket/WebsocketNodeJSClientConnector"
import { InMemoryReplicatedStore } from "../in-memory/InMemoryReplicatedStore"
import { Data } from "./types"

const ws = new WebSocket("ws://localhost:8080")
const db = new InMemoryReplicatedStore<Data>()

const connector = new WebsocketNodeJSClientConnector(db, ws, Data)

setInterval(() => {
  connector.putOne({
    type: "post",
    id: Date.now().toString(),
    version: db.getVersion(),
    userId: "1",
    content: "some content",
  })
  console.log("DB", db.getAll())
}, 5000)
