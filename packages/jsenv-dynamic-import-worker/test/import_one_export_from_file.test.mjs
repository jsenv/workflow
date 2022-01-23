import { assert } from "@jsenv/assert"

import { importOneExportFromFile } from "@jsenv/dynamic-import-worker"

// file missing
try {
  await importOneExportFromFile(
    `${new URL("./toto.mjs", import.meta.url)}#answer`,
  )
  throw new Error("should throw")
} catch (e) {
  const actual = e
  const expected = new Error(
    `File not found at ${new URL("./toto.mjs", import.meta.url)}`,
  )
  assert({ actual, expected })
}

// runtime error
try {
  await importOneExportFromFile(
    `${new URL("./runtime_error.mjs", import.meta.url)}#answer`,
  )
  throw new Error("should throw")
} catch (e) {
  const actual = e.message
  const expected = "here"
  assert({ actual, expected })
}

// export missing
try {
  await importOneExportFromFile(
    `${new URL("./exporting_toto.mjs", import.meta.url)}#answer`,
  )
  throw new Error("should throw")
} catch (e) {
  const actual = e.message
  const expected = `No export named "answer" in ${new URL(
    "./exporting_toto.mjs",
    import.meta.url,
  )}`
  assert({ actual, expected })
}

{
  const actual = await importOneExportFromFile(
    `${new URL("./exporting_answer.mjs", import.meta.url)}#answer`,
  )
  const expected = 42
  assert({ actual, expected })
}
