import { IndexedDBStore } from "../../indexed-db/IndexedDBStore"
import { WebsocketClientConnector } from "../../websocket/WebsocketClientConnector"
import { Data } from "../types"

const changes = document.getElementById("changes") as HTMLDivElement
const database = document.getElementById("database") as HTMLDivElement
const add = document.getElementById("add") as HTMLButtonElement
const dlt = document.getElementById("delete") as HTMLButtonElement
const input = document.getElementById("input") as HTMLInputElement

const main = async () => {
  console.log("Starting")
  const db = new IndexedDBStore<Data>("my-store")

  const ws = new WebSocket("ws://localhost:8080")

  const connector = new WebsocketClientConnector<Data>(db, ws, async (data) => {
    const version = await db.getVersion()
    const store = await db.getAll()
    changes.innerHTML = JSON.stringify(data, null, 2)
    database.innerHTML = JSON.stringify({ version, store }, null, 2)
  })

  add.addEventListener("click", async () => {
    connector.putOne({
      version: await db.getVersion(),
      type: "user",
      id: new Date().toString(),
      name: input.value || "",
      age: Date.now(),
    })

    input.value = ""
  })

  dlt.addEventListener("click", async () => {
    const data = await db.getAll()
    const first = await data[0]

    if (!first) {
      return
    }

    await connector.delete(first)
  })
}

main()
