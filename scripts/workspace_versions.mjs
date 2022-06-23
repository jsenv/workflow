/*
 * Update all package versions to prepare for publishing a new version
 */

import { updateWorkspaceVersions } from "@jsenv/workflow/packages/jsenv-package-workspace"

await updateWorkspaceVersions({
  directoryUrl: new URL("../", import.meta.url),
})
