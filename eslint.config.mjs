import { eslintConfigRelax } from "@jsenv/eslint-config-relax";

export default [
  ...eslintConfigRelax({
    type: "node",
    rootDirectoryUrl: new URL("./", import.meta.url),
  }),
];
