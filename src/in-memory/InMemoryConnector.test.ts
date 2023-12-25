import { describe, expect, test } from "vitest"
import { InMemoryConnector } from "./InMemoryConnector"
import { InMemoryOwnedStore } from "./InMemoryOwnedStore"
import { InMemoryReplicatedStore } from "./InMemoryReplicatedStore"
import { Reference } from "../types"

describe(InMemoryConnector, () => {
  test("Initialization synchronizes the replica store", () => {
    const owner = new InMemoryOwnedStore()
    const replica = new InMemoryReplicatedStore()

    const entities: Reference[] = [
      {
        id: "1",
        version: 0,
        type: "data",
      },
      {
        id: "2",
        version: 0,
        type: "data",
      },
    ]

    owner.putMany(entities)
    const connector = new InMemoryConnector(owner, replica)

    expect(replica.getAll().length).toBe(0)

    connector.init()

    expect(replica.getAll().length).toBe(2)
    expect(replica.getAll()).toStrictEqual(owner.getAll())
  })

  test("Updates the stores appropriately after connector related operations", () => {
    const owner = new InMemoryOwnedStore()
    const replica = new InMemoryReplicatedStore()

    const connector = new InMemoryConnector(owner, replica)
    connector.init()

    const entities: Reference[] = [
      {
        id: "1",
        version: 0,
        type: "data",
      },
      {
        id: "2",
        version: 0,
        type: "data",
      },
    ]

    connector.putMany(entities)

    expect(owner.getAll().length).toBe(2)
    expect(replica.getAll().length).toBe(2)
    expect(replica.getAll()).toStrictEqual(owner.getAll())
    expect(owner.getAll()).toMatchInlineSnapshot(`
      [
        {
          "id": "1",
          "type": "data",
          "version": 1,
        },
        {
          "id": "2",
          "type": "data",
          "version": 1,
        },
      ]
    `)
  })
})
