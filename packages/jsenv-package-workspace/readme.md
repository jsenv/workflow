# Package workspace

Helpers to manage multiple packages from a single repository. For example when using [NPM workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces).

## Updating a package

Updating a package in a workspace by hand is time consuming and error prone. Let's see it with a basic example where a workspace contains two packages and you make a change to one of them.

_packages/main/package.json:_

```json
{
  "name": "main",
  "version": "3.4.2",
  "dependencies": {
    "util": "1.0.0"
  }
}
```

_packages/util/package.json:_

```json
{
  "name": "util",
  "version": "1.0.0"
}
```

Now you update "version" in "packages/util/package.json"

```diff
{
  "name": "util",
- "version": "1.0.0"
+ "version": "1.1.0"
}
```

At this point you are supposed to update "packages/main/package.json" like this:

```diff
{
  "name": "main",
- "version": "3.4.2",
+ "version": "3.4.3",
  "dependencies": {
-   "util": "1.0.0"
+   "util": "1.1.0"
  }
}
```

In a workspace with many packages this is hard to do correctly and time consuming. You can automate the painful part as follows:

1. Run _updateWorkspaceVersions_
2. Review changes with a tool like "git diff"
3. Run _publishWorkspace_

### updateWorkspaceVersions

_updateWorkspaceVersions_ is an async function ensuring versions in all package.json are in sync for the workspace. It update versions in "dependencies", "devDependencies" and increase "version" if needed. This ensure all versions are in sync before publishing.

```js
import { updateWorkspaceVersions } from "@jsenv/package-workspace"

await updateWorkspaceVersions({
  directoryUrl: new URL("./", import.meta.url),
})
```

### Review changes

Each package might need to increase their package.json "version" differently. When it's required _updateWorkspaceVersions_ increases PATCH number ("1.0.3" becomes "1.0.4"). After that it's up to you to review these changes to decide if you actually need to increase MINOR or MAJOR number.

## publishWorkspace

_publishWorkspace_ is an async function that will publish all packages in the workspace on NPM. But only the packages that are not already published.

```js
import { publishWorkspace } from "@jsenv/package-workspace"

process.env.NPM_TOKEN = "token_auhtorized_to_publish_on_npm"

await publishWorkspace({
  directoryUrl: new URL("./", import.meta.url),
})
```
