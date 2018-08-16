var fs = require('fs')
var jsonexport = require('jsonexport')
/*(
a = JSON.parse(fs.readFileSync('./oro_full.json'))
b = JSON.parse(fs.readFileSync('./ki67.json'))
c = JSON.parse(fs.readFileSync('./copper.json'))
d = JSON.parse(fs.readFileSync('./oro_summ.json'))

var j = []
j.push(a)
j.push(b)
j.push(c)
j.push(d)

dict = []
for (var item in j) {
  if (!dict[j[item].type]) {
    dict[j[item].type] = []
  }
  dict[j[item].type].push(j[item].data)
}

for (type in dict) {
  console.log(type)
  jsonexport(dict[type], function (err, csv) {
    if (err) { console.log('json export error: ' + err) }
    fs.writeFileSync(type +'.csv' ,csv)
  })
}

*/
var imjson = {}
imjson["type"] = "rance"
imjson["data"] = [{"project":"ra","set":"nc","ind":""}]

fs.writeFileSync('./hello.json',JSON.stringify(imjson)) 


