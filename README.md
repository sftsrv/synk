# Synk

A library for developing offline-first web applications based on async data replication and synchronization between clients and the server

## Status

- [x] In memory database implementation
- [x] In memory replica implementation
- [x] Connector for synchronizing an in memory database with an in memory replica
- [x] Connector for synchronizing over a websocket
- [x] Method for broadcasting deletes
- [x] IndexedDB replication on browser
- [ ] Offline staging of changes - allow for different strategies
- [ ] Better websocket connection and reconnection management, should be able to use an existing websocket library for this, we don't need to be dependant on the implementation since it would be outside of the scope of our implementation
- [ ] Full-database synchronization example
- [ ] Testing methodology for websocket implementation
- [ ] More sophisticated merge handling (CRDT?)
- [ ] Method for initial sync and cleanup of bad entries
- [ ] Can we make it possible to sync to a file system, check: https://github.com/streetwriters/notesnook/tree/master/packages/streamable-fs

# Examples

<details>

For usage take a look at the `src/examples` directory which has examples for:

1. `pnpm run example:server` - Example can be found in `src/example/websocket-server` - A Node.js erver using an in-memory db and the websocket interfaces

```ts
import { InMemoryOwnedStore } from "@sftsrv/synk/in-memory"
import { WebSocket, WebSocketServer } from "ws"
import { Changes } from "../types"
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

    console.log("changes to client", changes)

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
```

2. `pnpm run example:client-produce` - Example can be found in `src/example/websocket-client-produce` - A Node.js client using the `WebsocketNodeJSConnector` that produces and replicates data from the server

```ts
import { WebsocketNodeJSClientConnector } from "@sftsrv/synk/websocket"
import { InMemoryReplicatedStore } from "@sftsrv/synk/in-memory"
import WebSocket from "ws"
import { Data } from "./types"

const ws = new WebSocket("ws://localhost:8080")
const db = new InMemoryReplicatedStore<Data>()

const connector = new WebsocketNodeJSClientConnector(db, ws, console.log, Data)

setInterval(() => {
  connector.putOne({
    type: "post",
    id: Date.now().toString(),
    version: db.getVersion(),
    userId: "1",
    content: "some content",
  })
}, 5000)
```

3. `pnpm run example:client-watch` - Example can be found in `src/example/websocket-client-watch` - A Node.js client using the `WebsocketNodeJSConnector` that replicates data from the server

```ts
import { InMemoryReplicatedStore } from "@sftsrv/synk/in-memory"
import { WebsocketNodeJSClientConnector } from "@sftsrv/synk/websocket"
import WebSocket from "ws"
import { Data } from "./types"

const ws = new WebSocket("ws://localhost:8080")
const db = new InMemoryReplicatedStore<Data>()

const connector = new WebsocketNodeJSClientConnector(db, ws, console.log, Data)
```

4. `pnpm run example:client-browser` - Example can be found in `src/example/browser` - Browser app using the `IndexedDBStore` and `WebsocketClientConnector`

```ts
import { IndexedDBStore } from "@sftsrv/synk/indexed-db"
import { WebsocketClientConnector } from "@sftsrv/synk/websocket"
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
```

</details>

> Running any client example requires the server to also be running, the relevant commands for running the examples can be found in the `package.json` file

## References

- https://ics.uci.edu/~cs230/lectures20/distrsyslectureset2-win20.pdf
- https://doc.replicache.dev/
