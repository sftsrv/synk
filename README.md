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

## Usage

For usage take a look at the `src/examples` directory which has examples for:

1. A server
2. A client that produces data
3. A client that watches and receives and applies changes

> Running any client example requires the server to also be running, the relevant commands for running the examples can be found in the `package.json` file

## References

- https://ics.uci.edu/~cs230/lectures20/distrsyslectureset2-win20.pdf
- https://doc.replicache.dev/
