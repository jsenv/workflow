import { byteAsFileSize, msAsDuration } from "@jsenv/log"

export const formatMetricValue = ({ value, unit }) => {
  return formatters[unit](value)
}

const formatters = {
  ms: msAsDuration,
  byte: byteAsFileSize,
  undefined: (value) => value,
}
