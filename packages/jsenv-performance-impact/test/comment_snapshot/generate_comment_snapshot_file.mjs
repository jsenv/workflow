import { writeFile, resolveUrl } from "@jsenv/filesystem"

import { createGitHubPullRequestCommentText } from "@jsenv/github-pull-request-impact"

import { createPerfImpactComment } from "@jsenv/performance-impact/src/internal/comment/createPerfImpactComment.js"
import { jsenvCommentParameters } from "@jsenv/performance-impact/src/internal/comment/jsenvCommentParameters.js"

const generateComment = (data) => {
  return createGitHubPullRequestCommentText(
    createPerfImpactComment({
      pullRequestBase: "base",
      pullRequestHead: "head",
      ...jsenvCommentParameters,
      ...data,
    }),
  )
}

const examples = {
  "metric + 2%": generateComment({
    beforeMergeData: {
      timeout: {
        "Duration for setTimeout(100)": { value: 100, unit: "ms" },
        "Memory usage for setTimeout(100)": { value: 50, unit: "byte" },
        "Number of filesystem read": { value: 0 },
      },
    },
    afterMergeData: {
      timeout: {
        "Duration for setTimeout(100)": { value: 102, unit: "ms" },
        "Memory usage for setTimeout(100)": { value: 51, unit: "byte" },
        "Number of filesystem read": { value: 0 },
      },
    },
  }),
  "metric + 100%": generateComment({
    beforeMergeData: {
      timeout: {
        "100ms": { value: 100, unit: "ms" },
      },
    },
    afterMergeData: {
      timeout: {
        "100ms": { value: 200, unit: "ms" },
      },
    },
  }),
  "metric - 2%": generateComment({
    beforeMergeData: {
      timeout: {
        "100ms": { value: 100, unit: "ms" },
      },
    },
    afterMergeData: {
      timeout: {
        "100ms": { value: 98, unit: "ms" },
      },
    },
  }),
  "metric -100%": generateComment({
    beforeMergeData: {
      timeout: {
        "100ms": { value: 100, unit: "ms" },
      },
    },
    afterMergeData: {
      timeout: {
        "100ms": { value: 0, unit: "ms" },
      },
    },
  }),
  "metric duration +0%": generateComment({
    beforeMergeData: {
      timeout: {
        "100ms": { value: 100, unit: "ms" },
      },
    },
    afterMergeData: {
      timeout: {
        "100ms": { value: 100, unit: "ms" },
      },
    },
  }),
  "add a group": generateComment({
    beforeMergeData: {},
    afterMergeData: {
      timeout: {
        "100ms": { value: 100, unit: "ms" },
      },
    },
  }),
  "remove a group": generateComment({
    beforeMergeData: {
      timeout: {
        "100ms": { value: 100, unit: "ms" },
      },
    },
    afterMergeData: {},
  }),
  "add a metric": generateComment({
    beforeMergeData: {
      timeout: {},
    },
    afterMergeData: {
      timeout: {
        "100ms": { value: 100, unit: "ms" },
      },
    },
  }),
  "remove a metric": generateComment({
    beforeMergeData: {
      timeout: {
        "100ms": { value: 100, unit: "ms" },
      },
    },
    afterMergeData: {
      timeout: {},
    },
  }),
}

const exampleFileUrl = resolveUrl("./comment_snapshot.md", import.meta.url)
const exampleFileContent = Object.keys(examples).map((exampleName) => {
  return `# ${exampleName}

${examples[exampleName]}`
}).join(`

`)

await writeFile(
  exampleFileUrl,
  `${exampleFileContent}
`,
)
