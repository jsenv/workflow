import { assert } from "@jsenv/assert";

import { setNpmConfig } from "@jsenv/package-publish/src/internal/setNpmConfig.js";

{
  const actual = setNpmConfig("", { whatever: 42 });
  const expected = "whatever=42";
  assert({ actual, expected });
}

{
  const actual = setNpmConfig(`whatever=41`, { whatever: 42 });
  const expected = `whatever=42`;
  assert({ actual, expected });
}

{
  const actual = setNpmConfig("foo=bar", { whatever: 42 });
  const expected = `foo=bar
whatever=42`;
  assert({ actual, expected });
}

{
  const actual = setNpmConfig(
    `foo=bar
whatever=41`,
    { whatever: 42 },
  );
  const expected = `foo=bar
whatever=42`;
  assert({ actual, expected });
}

{
  const actual = setNpmConfig(
    `foo=bar
whatever=41
ding=dong`,
    { whatever: 42 },
  );
  const expected = `foo=bar
whatever=42
ding=dong`;
  assert({ actual, expected });
}
