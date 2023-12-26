import { InMemoryOwnedStore } from "./InMemoryOwnedStore"
import { InMemoryReplicatedStore } from "./InMemoryReplicatedStore"
import { Connector, Reference } from "../types"

export class InMemoryConnector<T extends Reference> implements Connector<T> {
  constructor(
    private readonly db: InMemoryOwnedStore<T>,
    private readonly replica: InMemoryReplicatedStore<T>
  ) {}

  init() {
    this.replica.init()
    const replicaVersion = this.replica.getVersion()
    const data = this.db.getAll(replicaVersion)

    this.replica.putMany(data)
  }

  putOne(reference: T) {
    this.db.put(reference)
    const version = this.db.getVersion()

    const update = this.db.getAll(this.replica.getVersion())

    this.replica.applyChanges({
      type: "changes",
      version,
      update,
    })
  }

  putMany(references: T[]) {
    this.db.putMany(references)
    const version = this.db.getVersion()

    const update = this.db.getAll(this.replica.getVersion())

    this.replica.applyChanges({
      type: "changes",
      version,
      update,
    })
  }

  delete(reference: T) {
    throw new Error("Method not implemented.")
  }
}
