/*
 * Update all package versions to prepare for publishing a new version
 */

import { updateWorkspaceVersions } from "@jsenv/workflow/packages/jsenv-package-workspace/main.js"
import { projectDirectoryUrl } from "@jsenv/workflow/jsenv.config.mjs"

await updateWorkspaceVersions({
  directoryUrl: projectDirectoryUrl,
})
