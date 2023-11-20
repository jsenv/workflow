import { assert } from "@jsenv/assert";

import { importOneExportFromFile } from "@jsenv/dynamic-import-worker";

// runtime error
try {
  await importOneExportFromFile(
    `${new URL("./runtime_error.mjs", import.meta.url)}#answer`,
  );
  throw new Error("should throw");
} catch (e) {
  const actual = e.message;
  const expected = "here";
  assert({ actual, expected });
}

{
  const actual = await importOneExportFromFile(
    `${new URL("./exporting_answer.mjs", import.meta.url)}#answer`,
  );
  const expected = 42;
  assert({ actual, expected });
}
