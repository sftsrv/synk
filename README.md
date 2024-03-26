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

## Examples

For usage take a look at the `src/examples` directory which has examples for:

1. `src/example/websocket-server` - A Node.js erver using an in-memory db and the websocket interfaces
2. `src/example/websocket-client-produce` - A Node.js client using the `WebsocketNodeJSConnector` that produces and replicates data from the server
3. `src/example/websocket-client-watch` - A Node.js client using the `WebsocketNodeJSConnector` that replicates data from the server
4. `src/example/browser` - Browser app using the `IndexedDBStore` and `WebsocketClientConnector`

> Running any client example requires the server to also be running, the relevant commands for running the examples can be found in the `package.json` file

## References

- https://ics.uci.edu/~cs230/lectures20/distrsyslectureset2-win20.pdf
- https://doc.replicache.dev/
