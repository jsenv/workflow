import { setRoundedPrecision } from "@jsenv/log"

export const formatRatioAsPercentage = (ratio) => {
  const percentage = ratio * 100
  return `${percentage < 0 ? `-` : "+"}${setRoundedPrecision(
    Math.abs(percentage),
    {
      decimals: 0,
      decimalsWhenSmall: 1,
    },
  )}%`
}
