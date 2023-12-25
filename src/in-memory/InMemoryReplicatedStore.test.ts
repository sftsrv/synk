import { test, describe, it, expect } from "vitest"
import { InMemoryReplicatedStore } from "./InMemoryReplicatedStore"
import { Reference } from "../types"

describe(InMemoryReplicatedStore, () => {
  test("Store Initializes to v0", () => {
    const store = new InMemoryReplicatedStore()

    const data = store.getAll()

    expect(store.getVersion()).toEqual(0)
    expect(data.length).toEqual(0)
  })

  test("Store does not auto-update version", () => {
    const store = new InMemoryReplicatedStore()

    const entity: Reference = {
      id: "id",
      type: "data",
      version: 0,
    }

    store.put(entity)
    const saved = store.getOne(entity)

    expect(store.getVersion()).toEqual(0)
    expect(saved?.version).toEqual(0)
    expect(entity).toEqual(saved)
  })

  test("Store version can be externally updated", () => {
    const store = new InMemoryReplicatedStore()

    const version = 2
    store.setVersion(version)

    expect(store.getVersion()).toEqual(2)
  })
})
