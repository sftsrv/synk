import { Awaitable } from "vitest"
import { Changes, Reference, ReplicatedStore } from "../types"
import { AsyncCommand } from "./types"

/**
 * A connector with decoupled sending and receiving behaviour
 */
export abstract class AsyncConnector<T extends Reference> {
  abstract store: ReplicatedStore<T>

  abstract send(command: AsyncCommand<T>): Awaitable<void>

  /**
   * Called on initialization so the connector can handle any asynchronous setup and population of
   * the initial store
   */
  async init() {
    await this.store.init()
    const version = await this.store.getVersion()
    this.send({
      version,
    })
  }

  receive(push: Changes<T>) {
    console.log("Received", push)
    this.store.applyChanges(push)
  }

  async putOne(data: T) {
    const version = await this.store.getVersion()
    this.send({
      version,
      mutate: [
        {
          data,
          command: "put",
        },
      ],
    })
  }

  async putMany(references: T[]) {
    const version = await this.store.getVersion()
    this.send({
      version,
      mutate: references.map((data) => ({
        data,
        command: "delete",
      })),
    })
  }

  async delete(data: T) {
    const version = await this.store.getVersion()
    this.send({
      version,
      mutate: [
        {
          data,
          command: "delete",
        },
      ],
    })
  }
}
