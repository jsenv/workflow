import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
// https://github.com/npm/node-semver#readme
const { inc } = require("semver")

export const increaseVersion = (version, releaseType) => {
  return inc(version, releaseType)
}
