import { assert } from "@jsenv/assert";

import { formatMetricValue } from "@jsenv/performance-impact/src/internal/formatMetricValue.js";

{
  const actual = formatMetricValue({ unit: "ms", value: 0.168999 });
  const expected = `0 second`;
  assert({ actual, expected });
}

{
  const actual = formatMetricValue({ unit: "ms", value: 2 });
  const expected = `0.002 second`;
  assert({ actual, expected });
}

{
  const actual = formatMetricValue({ unit: "ms", value: 59 });
  const expected = `0.06 second`;
  assert({ actual, expected });
}

{
  const actual = formatMetricValue({ unit: "ms", value: 1059.456 });
  const expected = `1.1 seconds`;
  assert({ actual, expected });
}

{
  const actual = formatMetricValue({ unit: "ms", value: 1002.456 });
  const expected = `1 second`;
  assert({ actual, expected });
}
