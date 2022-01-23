import { ensureGithubReleaseForPackage } from "@jsenv/workflow/packages/jsenv-github-release-package/main.js"

await ensureGithubReleaseForPackage({
  projectDirectoryUrl: new URL("../../../", import.meta.url),
})
