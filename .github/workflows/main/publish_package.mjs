import { publishPackage } from "@jsenv/package-publish"

const rootDirectoryUrl = new URL("../../../", import.meta.url)

await ["jsenv-package-publish"].reduce(async (previous, packageName) => {
  await previous
  await publishPackage({
    projectDirectoryUrl: new URL(`./packages/${packageName}`, rootDirectoryUrl),
    registriesConfig: {
      "https://registry.npmjs.org": {
        token: process.env.NPM_TOKEN,
      },
    },
  })
}, Promise.resolve())
