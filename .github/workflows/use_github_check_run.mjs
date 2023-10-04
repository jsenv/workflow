import {
  readGitHubWorkflowEnv,
  startGithubCheckRun,
} from "@jsenv/github-check-run";

const { progress, pass } = await startGithubCheckRun({
  ...readGitHubWorkflowEnv(),
  logLevel: "debug",
  checkName: "MY_CHECK_NAME",
  checkTitle: "MY_CHECK_TITLE",
  checkSummary: "MY_CHECK_SUMMARY",
});

await new Promise((resolve) => {
  setTimeout(resolve, 2_000);
});
await progress({
  title: "PROGRESS AFTER 2s",
  summary: "SUMMARY AFTER 2s",
  annotations: [
    {
      path: "file.js",
      title: "✖ execution 1 of 2 failed",
      start_line: 10,
      end_line: 10,
      annotation_level: "failure",
      message: `AssertionError: unequal values
--- found ---
false
--- expected ---
true
--- path ---
actual.foo
  at node_modules/@jsenv/assert/src/main.js:10:3`,
    },
  ],
});

await new Promise((resolve) => {
  setTimeout(resolve, 4_000);
});
await progress({
  title: "PROGRESS AFTER 6s",
  summary: "SUMMARY AFTER 6s",
});

await new Promise((resolve) => {
  setTimeout(resolve, 6_000);
});
await pass({
  title: "SUCCESS AFTER 10s",
  summary: "SUMMARY AFTER 10s",
});
