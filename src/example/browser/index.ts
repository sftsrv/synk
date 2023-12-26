import { IndexedDBStore } from "../../indexed-db/IndexedDBStore"
import { WebsocketClientConnector } from "../../websocket/WebsocketClientConnector"
import { Data } from "../types"

const main = async () => {
  console.log("Starting")
  const db = new IndexedDBStore("my-store")

  const ws = new WebSocket("ws://localhost:8080")

  const connector = new WebsocketClientConnector<Data>(db, ws)

  const output = document.getElementById("output")
  const add = document.getElementById("add")
  const input = document.getElementById("input") as HTMLInputElement

  add?.addEventListener("click", async () => {
    connector.putOne({
      version: await db.getVersion(),
      type: "user",
      id: new Date().toString(),
      name: input.value || "",
      age: Date.now(),
    })

    input.value = ""
  })

  setTimeout(() => {}, 1000)
}

main()
