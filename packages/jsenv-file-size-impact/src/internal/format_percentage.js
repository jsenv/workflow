export const formatPercentage = (number) => {
  const absoluteValue = Math.abs(number)
  const valueRounded = roundNumber(
    absoluteValue,
    determineDecimals(absoluteValue),
  )
  return `${number < 0 ? `-` : "+"}${valueRounded}%`
}

const determineDecimals = (number) => {
  if (number < 0.001) {
    return 4
  }
  if (number < 0.01) {
    return 3
  }
  if (number < 0.1) {
    return 2
  }
  if (number < 1) {
    return 1
  }
  return 0
}

const roundNumber = (value, maxDecimals) => {
  const expValue = Math.pow(10, maxDecimals)
  const roundedValue = Math.round(expValue * value) / expValue
  const valueAsString = roundedValue.toFixed(maxDecimals)
  return parseFloat(valueAsString)
}
