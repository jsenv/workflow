# Package publish [![npm package](https://img.shields.io/npm/v/@jsenv/package-publish.svg?logo=npm&label=package)](https://www.npmjs.com/package/@jsenv/package-publish) [![github main](https://github.com/jsenv/package-publish/workflows/main/badge.svg)](https://github.com/jsenv/package-publish/actions?workflow=main) [![codecov coverage](https://codecov.io/gh/jsenv/package-publish/branch/master/graph/badge.svg)](https://codecov.io/gh/jsenv/package-publish)

Publish package to one or many registry.

# Presentation

- Can be used to automate "npm publish" during a workflow
- Allows to publish on many registries: both npm and github registries for instance.

You can use it inside a GitHub workflow or inside any other continuous environment like Travis or Jenkins.

Screenshot taken inside a github workflow when the package.json version is already published: ![already published github workflow screenshot](./docs/already-published-github-workflow-screenshot.png)

Screenshot taken inside a github workflow when the package.json version is not published: ![publishing github workflow screenshot](./docs/publishing-github-workflow-screenshot.png)

This package is using itself to be published on NPM. It is done during ["publish package" step](https://github.com/jsenv/package-publish/blob/0170a5c859c4732203ff2f3e70b85e705396ccc7/.github/workflows/main.yml#L70-L74) in GitHub worflow.

# Installation

```console
npm install --save-dev @jsenv/package-publish
```

# Documentation

The api consist into one function called _publishPackage_.

_publishPackage_ is an async function publishing a package on one or many registries.

```js
import { publishPackage } from "@jsenv/package-publish"

const publishReport = await publishPackage({
  projectDirectoryUrl: new URL('./', import.meta.url)
  registriesConfig: {
    "https://registry.npmjs.org": {
      token: process.env.NPM_TOKEN,
    },
    "https://npm.pkg.github.com": {
      token: process.env.GITHUB_TOKEN,
    },
  },
})
```

## projectDirectoryUrl

_projectDirectoryUrl_ parameter is a string leading to a directory containing the package.json.

This parameter is **required**.

## registriesConfig

_registriesConfig_ parameter is an object configuring on which registries you want to publish your package.

This parameter is **required**.

## logLevel

_logLevel_ parameter is a string controlling verbosity of logs during the function execution.

This parameter is optional.

— see also https://github.com/jsenv/jsenv-logger#loglevel