import { IndexedDBStore } from "../../indexed-db/IndexedDBStore"
import { WebsocketClientConnector } from "../../websocket/WebsocketClientConnector"
import { Data } from "../types"

const main = async () => {
  console.log("Starting")
  const db = new IndexedDBStore("my-store")

  const ws = new WebSocket("wss://localhost:8080")

  const connector = new WebsocketClientConnector<Data>(db, ws)

  setInterval(async () => {
    connector.putOne({
      version: await db.getVersion(),
      type: "user",
      id: new Date().toString(),
      name: new Date().toString(),
      age: Date.now(),
    })
  }, 5000)
}

main()
