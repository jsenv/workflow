import bytes from "pretty-bytes"

export const formatSize = (sizeNumber, { diff = false } = {}) => {
  const sizeNumberAbsolute = Math.abs(sizeNumber)
  let sizeString = bytes(sizeNumberAbsolute)
  if (diff) {
    if (sizeNumber < 0) {
      sizeString = `-${sizeString}`
    } else if (sizeNumber > 0) {
      sizeString = `+${sizeString}`
    }
  }
  return sizeString
}
