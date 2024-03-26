import { defineConfig } from "tsup"
import { glob } from "glob"

const indexes = await glob("./src/**/index.ts", {
  platform: "linux",
})

const replacePath = (path: string) => path.slice(4, -3)

const entry = indexes.reduce(
  (prev, curr) => ({
    ...prev,
    [replacePath(curr)]: curr,
  }),
  {}
)

console.log(entry)

export default defineConfig({
  bundle: false,
  entry,
  dts: true,
  format: "esm",
  keepNames: true,
})
