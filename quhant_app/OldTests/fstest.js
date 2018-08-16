var fs = require('fs')

var all_json = []
var DirPath = '../public/cors_demo/naultran/'

var imgList = fs.readFileSync(DirPath+'RanceGo1/RanceGo1_original.set').toString().split('\n')
var fileList = fs.readdirSync(DirPath+'RanceGo1/')

for (var i in imgList) {
  tempList = fileList.filter(function(x) { return x.indexOf(imgList[i] + '.') > -1 && x.indexOf('.json') > -1 })
  for (var j in tempList) {
    var results = JSON.parse(fs.readFileSync(DirPath + 'RanceGo1/' + tempList[j]))
    all_json.push(results)
  }
}
console.log(all_json)
