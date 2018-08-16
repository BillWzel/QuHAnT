var fs = require('fs')
var jsonexport = require('jsonexport')

a = JSON.parse(fs.readFileSync('./test.json'))

dict = []
for (var item in a) {
  if (!dict[a[item].symbol]) {
    b = JSON.parse(fs.readFileSync('./'+ a[item].symbol + '.json'))
    dict[a[item].symbol] = [{"data":b}]
  }
  b = JSON.parse(fs.readFileSync('./'+ a[item].symbol + '.json'))
  dict[a[item].symbol].push(b)
}

console.log(dict)
console.log(dict.cyp1a1)
j=dict.cyp1a1
console.log(j[0].expression)

/*
for (type in dict) {
  console.log(type)
  jsonexport(dict[type], function (err, csv) {
    if (err) { console.log('json export error: ' + err) }
    fs.writeFileSync(type +'.csv' ,csv)
  })
}
*/

