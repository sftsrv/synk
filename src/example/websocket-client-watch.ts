import WebSocket from "ws"
import { InMemoryReplicatedStore } from "../in-memory/InMemoryReplicatedStore"
import { Data } from "./types"
import { WebsocketClientConnector } from "../websocket/WebsocketClientConnector"

const ws = new WebSocket("ws://localhost:8080")
const db = new InMemoryReplicatedStore<Data>()

const connector = new WebsocketClientConnector(db, ws, Data)

setInterval(() => {
  console.log("DB", db.getAll())
}, 5000)
