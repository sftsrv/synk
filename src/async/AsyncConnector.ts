import { Awaitable } from "../types"
import { Changes, Reference, ReplicatedStore } from "../types"
import { Push, Notify } from "./types"

/**
 * A connector with decoupled sending and receiving behaviour
 */
export abstract class AsyncConnector<T extends Reference> {
  abstract store: ReplicatedStore<T>

  abstract send(changes: Changes<T>): Awaitable<void>

  /**
   * Called on initialization so the connector can handle any asynchronous setup and population of
   * the initial store
   */
  async init() {
    await this.store.init()
    const version = await this.store.getVersion()
    await this.send({
      type: "changes",
      version,
    })
  }

  async receive(message: Push<T>) {
    if (message.type === "notify") {
      await this.requestChanges(message)
    } else {
      await this.store.applyChanges(message)
    }
  }

  /**
   * Request changes from the server if the notification version is greater than our current version
   */
  private async requestChanges(message: Notify) {
    const version = await this.store.getVersion()
    if (version === message.version) {
      return
    }

    await this.send({
      type: "changes",
      version,
    })
  }

  async putOne(data: T) {
    const version = await this.store.getVersion()
    await this.send({
      type: "changes",
      version,
      update: [data],
    })
  }

  async putMany(references: T[]) {
    const version = await this.store.getVersion()
    await this.send({
      type: "changes",
      version,
      update: references,
    })
  }

  async delete(data: T) {
    const version = await this.store.getVersion()
    await this.send({
      type: "changes",
      version,
      delete: [data],
    })
  }
}
