import { IndexedDBStore } from "../../indexed-db/IndexedDBStore"

const main = async () => {
  console.log("Starting")
  const db = new IndexedDBStore("my-store")
  await db.init()

  console.log("Setting version")
  await db.applyChanges({
    version: 7,
  })

  const version = await db.getVersion()

  console.log({ version })
}

main()
