// Run node common/locales/convert.cjs
//  to convert ar.json to output.csv

const fs = require('fs')
const path = require('path')

// Path to your JSON file
const filePath = path.join(__dirname, 'ar.json')

// Read JSON file
const rawData = fs.readFileSync(filePath, 'utf8')
const jsonData = JSON.parse(rawData)

// Convert JSON to CSV (Key, Value)
function jsonToCsv(json) {
  const rows = Object.entries(json).map(([key, value]) => `${key},${value}`)
  return ['Key,Value', ...rows].join('\n')
}

// Run conversion
const csvData = jsonToCsv(jsonData)

// Save to output.csv
fs.writeFileSync('output.csv', csvData, 'utf8')

console.log('✅ Converted ar.json -> output.csv')
