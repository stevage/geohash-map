// TODO https://data.geohashing.info/dow.csv
// full retrohash page?
import md5 from './md5'
// given a floating point number expressed in hex, return a decimal number
// input: 0.db9318c2259923d0
// output: 0.857713267707002344
function hexToDecimal(hex: string[]) {
  return [...hex].reduce((acc, digit, i) => acc + parseInt(digit, 16) * Math.pow(16, -i - 1), 0)
}

function computeGeohash(date: string, dow: number) {
  const hash = md5(`${date}-${dow}`)
  const lon = hexToDecimal(hash.slice(0, 16))
  const lat = hexToDecimal(hash.slice(16, 32))
  return [lon, lat]
}

console.log(computeGeohash('2005-05-26', 10458.68))
