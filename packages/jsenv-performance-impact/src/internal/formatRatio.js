import { formatPercentage } from "./format_percentage.js"

export const formatRatioAsPercentage = (ratio) => {
  const asPercentageFormatted = formatPercentage(ratio * 100)
  return asPercentageFormatted
}
