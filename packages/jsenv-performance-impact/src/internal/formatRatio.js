export const formatRatioAsPercentage = (ratio) => {
  const asPercentage = ratio * 100
  const asPercentageFormatted = `${ratio < 0 ? `-` : "+"}${Math.abs(
    limitDecimals(asPercentage, 2),
  )}%`
  return asPercentageFormatted
}

const limitDecimals = (number, decimalCount = 2) => {
  const multiplier = Math.pow(10, decimalCount)
  return Math.round(number * multiplier) / multiplier
}
