import { setRoundedPrecision } from "@jsenv/log"

export const formatPercentage = (number) => {
  return `${number < 0 ? `-` : "+"}${setRoundedPrecision(number, {
    decimals: 0,
    decimalsWhenSmall: 1,
  })}%`
}
