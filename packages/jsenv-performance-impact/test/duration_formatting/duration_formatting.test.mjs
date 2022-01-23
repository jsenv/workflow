import { assert } from "@jsenv/assert"

import { formatMs } from "@jsenv/performance-impact/src/internal/formatMs.js"

{
  const actual = formatMs(0.168999)
  const expected = `0.0001 seconds`
  assert({ actual, expected })
}

{
  const actual = formatMs(2)
  const expected = `0.002 seconds`
  assert({ actual, expected })
}

{
  const actual = formatMs(59)
  const expected = `0.059 seconds`
  assert({ actual, expected })
}

{
  const actual = formatMs(1059.456)
  const expected = `1.05 seconds`
  assert({ actual, expected })
}

{
  const actual = formatMs(1002.456)
  const expected = `1 second`
  assert({ actual, expected })
}
