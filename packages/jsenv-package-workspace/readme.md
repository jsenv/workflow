# Package workspace

Helpers to manage multiple packages from a single repository: [NPM workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces)

## Publishing workspace

1. You have a package in your workspace called "util"
2. You make a change to the source code in "util"
3. You update "version" field in "util"

In this scenario all other packages in your workspace depending on "util" must be updated to use this new version. Each package referencing "util" in "dependencies" should also update their "version" and be published.

Doing this by hand is time consuming and error prone. This can be partially automated following these steps:

1. Use _updateWorkspaceVersions_ to synchronize all versions in the workspace
2. Review changes with a tool like "git diff"
3. Use _publishWorkspace_ to publish packages to NPM

### updateWorkspaceVersions

_updateWorkspaceVersions_ is an async function ensuring versions in all package.json are in sync for the workspace. It update versions in "dependencies", "devDependencies" and increase "version" if needed. This ensure all versions are in sync before publishing.

```js
import { updateWorkspaceVersions } from "@jsenv/package-workspace"

await updateWorkspaceVersions({
  directoryUrl: new URL("./", import.meta.url),
})
```

### Review changes

Each package might need to increase their package.json "version" differently. Running _updateWorkspaceVersions_ increase PATCH number ("1.0.3" becomes "1.0.4") when needed. After that it's up to you to review these changes to decide if you actually need to increase MINOR or MAJOR number.

## publishWorkspace

_publishWorkspace_ is an async function that will publish all packages in the workspace on NPM. But only the packages that are not already published.

```js
import { publishWorkspace } from "@jsenv/package-workspace"

process.env.NPM_TOKEN = "token_auhtorized_to_publish_on_npm"

await publishWorkspace({
  directoryUrl: new URL("./", import.meta.url),
})
```
