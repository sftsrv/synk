import { describe, expect, test } from "vitest"
import { IndexedDBStore } from "./IndexedDBStore"
import { Changes, Reference } from "../types"

interface SampleData extends Reference {
  name: string
}

const randomName = () => Math.random().toString()

describe(IndexedDBStore, () => {
  test("Should init stores for version and objects", async () => {
    const store = new IndexedDBStore(randomName())
    await store.init()

    const version = await store.getVersion()
    const data = await store.getAll()

    expect(version).toBeDefined()
    expect(data.length).toEqual(0)
  })

  test("Should apply changes as expected", async () => {
    const store = new IndexedDBStore(randomName())
    await store.init()

    const changes: Changes<SampleData> = {
      type: "changes",
      version: 5,
      delete: [],
      update: [
        {
          id: "1",
          version: 4,
          type: "data",
          name: "name",
        },
      ],
    }

    await store.applyChanges(changes)

    const version = await store.getVersion()
    const data = await store.getAll()

    expect(version).toEqual(changes.version)

    // THe IndexedDB is a replica and should accept data as provided
    expect(data).toStrictEqual(changes.update)
  })

  test("Should apply updates and then deletes", async () => {
    const store = new IndexedDBStore(randomName())
    await store.init()

    const changes: Changes<SampleData> = {
      type: "changes",
      version: 5,
      update: [
        {
          id: "keep",
          version: 4,
          type: "data",
          name: "name",
        },
        {
          id: "remove",
          version: 2,
          type: "data",
          name: "name",
        },
      ],
      delete: [
        {
          id: "remove",
          version: 2,
          type: "data",
        },
      ],
    }

    await store.applyChanges(changes)

    const version = await store.getVersion()
    const data = await store.getAll()

    expect(version).toEqual(changes.version)

    // THe IndexedDB is a replica and should accept data as provided
    expect(data.length).toBe(1)
    expect(data[0]).toStrictEqual(changes.update?.[0])
  })
})
