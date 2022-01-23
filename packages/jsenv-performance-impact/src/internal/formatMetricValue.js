import { formatMs } from "./formatMs.js"
import { formatByte } from "./formatByte.js"

export const formatMetricValue = ({ value, unit }) => {
  return formatters[unit](value)
}

const formatters = {
  ms: formatMs,
  byte: formatByte,
  undefined: (value) => value,
}
