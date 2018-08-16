var csv = require('csvtojson')
var fs = require('fs')

var outputpath = './public/cors_demo/sampletest/Oil-Red-O/'
var inputfile = '/root/results_metadata.csv'


function convertCSV(file) {
  csv()
    .fromFile(file)
    .on('json', (jsonObj) => {
      var newjson = {"type":"metadata", "data": jsonObj}
      var fname = newjson.data['image name']
      console.log(newjson)
      fs.writeFileSync(outputpath + fname + '.metadata.json',JSON.stringify(newjson))
      return jsonObj
    })

    .on('done', (error) => {
      //console.log(error)
    })
}

var csv2json = convertCSV(inputfile)
