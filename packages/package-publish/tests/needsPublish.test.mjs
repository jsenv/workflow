import { assert } from "@jsenv/assert";

import {
  needsPublish,
  PUBLISH_BECAUSE_NEVER_PUBLISHED,
  PUBLISH_BECAUSE_LATEST_LOWER,
  PUBLISH_BECAUSE_TAG_DIFFERS,
  NOTHING_BECAUSE_LATEST_HIGHER,
  NOTHING_BECAUSE_ALREADY_PUBLISHED,
} from "@jsenv/package-publish/src/internal/needsPublish.js";

{
  const actual = needsPublish({
    packageVersion: "1.0.0",
    registryLatestVersion: null,
  });
  const expected = PUBLISH_BECAUSE_NEVER_PUBLISHED;
  assert({ actual, expected });
}

{
  const actual = needsPublish({
    packageVersion: "1.0.0",
    registryLatestVersion: "1.0.0",
  });
  const expected = NOTHING_BECAUSE_ALREADY_PUBLISHED;
  assert({ actual, expected });
}

{
  const actual = needsPublish({
    packageVersion: "1.0.0",
    registryLatestVersion: "2.0.0",
  });
  const expected = NOTHING_BECAUSE_LATEST_HIGHER;
  assert({ actual, expected });
}

{
  const actual = needsPublish({
    packageVersion: "2.0.0",
    registryLatestVersion: "1.0.0",
  });
  const expected = PUBLISH_BECAUSE_LATEST_LOWER;
  assert({ actual, expected });
}

{
  const actual = needsPublish({
    packageVersion: "1.0.0-beta.0",
    registryLatestVersion: "1.0.0-alpha.0",
  });
  const expected = PUBLISH_BECAUSE_TAG_DIFFERS;
  assert({ actual, expected });
}

{
  const actual = needsPublish({
    packageVersion: "1.0.0-alpha.0",
    registryLatestVersion: "1.0.0-alpha.1",
  });
  const expected = NOTHING_BECAUSE_LATEST_HIGHER;
  assert({ actual, expected });
}

{
  const actual = needsPublish({
    packageVersion: "1.0.0-alpha.1",
    registryLatestVersion: "1.0.0-alpha.0",
  });
  const expected = PUBLISH_BECAUSE_LATEST_LOWER;
  assert({ actual, expected });
}

{
  const actual = needsPublish({
    packageVersion: "1.0.0-alpha.0",
    registryLatestVersion: "1.0.0-alpha.0",
  });
  const expected = NOTHING_BECAUSE_ALREADY_PUBLISHED;
  assert({ actual, expected });
}
