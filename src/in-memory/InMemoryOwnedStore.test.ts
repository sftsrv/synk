import { test, describe, it, expect } from "vitest"
import { InMemoryReplicatedStore } from "./InMemoryReplicatedStore"
import { Reference } from "../types"
import { InMemoryOwnedStore } from "./InMemoryOwnedStore"

describe(InMemoryOwnedStore, () => {
  test("Store Initializes to v0", () => {
    const store = new InMemoryOwnedStore()

    const data = store.getAll()

    expect(store.getVersion()).toEqual(0)
    expect(data.length).toEqual(0)
  })

  test("Store auto-updates versions", () => {
    const store = new InMemoryOwnedStore()

    const entity: Reference = {
      id: "id",
      type: "data",
      lastVersion: 0,
    }

    store.put(entity)
    const saved = store.getOne(entity)

    expect(store.getVersion()).toEqual(1)
    expect(saved?.lastVersion).toEqual(1)
    expect(saved).toMatchInlineSnapshot(`
      {
        "id": "id",
        "lastVersion": 1,
        "type": "data",
      }
    `)
  })

  test("Store auto-updates versions for multiple entities", () => {
    const store = new InMemoryOwnedStore()

    const entities: Reference[] = [
      {
        id: "1",
        type: "data",
        lastVersion: 0,
      },
      {
        id: "2",
        type: "data",
        lastVersion: 0,
      },
    ]

    store.putMany(entities)
    const saved = store.getAll()

    expect(store.getVersion()).toEqual(1)
    expect(saved.length).toEqual(2)
    saved?.forEach((item) => expect(item.lastVersion).toBe(1))
    expect(saved).toMatchInlineSnapshot(`
      [
        {
          "id": "1",
          "lastVersion": 1,
          "type": "data",
        },
        {
          "id": "2",
          "lastVersion": 1,
          "type": "data",
        },
      ]
    `)
  })

  test("Store auto-updates for multiple operations", () => {
    const store = new InMemoryOwnedStore()

    const entities: Reference[] = [
      {
        id: "1",
        type: "data",
        lastVersion: 0,
      },
      {
        id: "2",
        type: "data",
        lastVersion: 0,
      },
    ]

    entities.forEach((entity) => store.put(entity))

    const saved = store.getAll()

    expect(store.getVersion()).toEqual(2)
    expect(saved.length).toEqual(2)

    expect(saved?.[0].lastVersion).toEqual(1)
    expect(saved?.[1].lastVersion).toEqual(2)

    expect(saved).toMatchInlineSnapshot(`
      [
        {
          "id": "1",
          "lastVersion": 1,
          "type": "data",
        },
        {
          "id": "2",
          "lastVersion": 2,
          "type": "data",
        },
      ]
    `)
  })
})
