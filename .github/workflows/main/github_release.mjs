import { ensureGithubReleaseForPackage } from "@jsenv/workflow/packages/jsenv-github-release-package"

await ensureGithubReleaseForPackage({
  projectDirectoryUrl: new URL("../../../", import.meta.url),
})
