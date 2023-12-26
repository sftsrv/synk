import WebSocket from "ws"
import { InMemoryReplicatedStore } from "../in-memory/InMemoryReplicatedStore"
import { Data } from "./types"
import { WebsocketNodeJSClientConnector } from "../websocket/WebsocketNodeJSClientConnector"

const ws = new WebSocket("ws://localhost:8080")
const db = new InMemoryReplicatedStore<Data>()

const connector = new WebsocketNodeJSClientConnector(db, ws, Data)

setInterval(() => {
  console.log("DB", db.getAll())
}, 5000)
