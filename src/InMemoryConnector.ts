import { InMemoryOwnedStore } from "./InMemoryOwnedStore"
import { InMemoryReplicatedStore } from "./InMemoryReplicatedStore"
import {
  Connector,
  OwnedStore,
  Reference,
  ReplicatedStore,
  View,
} from "./types"

export class InMemoryConnector<T extends Reference> implements Connector<T> {
  constructor(
    private readonly db: InMemoryOwnedStore<T>,
    private readonly replica: InMemoryReplicatedStore<T>
  ) {}

  init() {
    const replicaVersion = this.replica.getVersion()
    const data = this.db.getAll(replicaVersion)

    this.replica.putMany(data)
  }

  put(reference: T) {
    this.db.put(reference)
    const version = this.db.getVersion()
    const resolved = this.db.getOne(reference)
    if (!resolved) {
      return
    }

    this.replica.put(resolved)
    this.replica.setVersion(version)
  }

  delete(reference: T) {
    throw new Error("Method not implemented.")
  }
}
