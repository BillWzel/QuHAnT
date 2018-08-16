// Modules to import
var fs = require('fs')

//fs.symlinkSync('../public/cors_demo/sampletest/SampleProject/', '../public/cors_demo/Hello/SampleProject', 'dir')

var hi = fs.lstatSync('../public/cors_demo/Hello/db').isSymbolicLink()
console.log(hi)

var hii = fs.lstatSync('../public/cors_demo/Hello/SampleProject').isSymbolicLink()
console.log(hii)

var hello = fs.readlinkSync('../public/cors_demo/Hello/SampleProject')
console.log(hello)


var DirPath = '../public/cors_demo/Hello'
var projArray = []
var prolist = []
var symlist = []
var setArray = []

type='.set'

fs.readdir(DirPath, function (err, list) {
  if (err) {
    console.log(err)
  }
  list.forEach(function (filename) {
    checkSymlink = fs.lstatSync(DirPath + '/' + filename).isSymbolicLink()
    if (checkSymlink) {
      newpath = fs.readlinkSync(DirPath + '/' + filename)
      symlist.push(newpath)
    } else {
      if (!/db|results|.db|.results/.test(filename)) {
        prolist.push(filename)
      }
    }
  })
  
  for (var proj in prolist) {
    //var setArray = []
    var ProjPath = '../public/cors_demo/Hello/' + prolist[proj]
    var SetList = fs.readdirSync(ProjPath)
     
    for (var set in SetList) {
      if (SetList[set].indexOf(type) > -1) {
        var SetStr = (SetList[set]).replace(type, '')
        setArray.push(SetStr)
      }
    }

    console.log(setArray)
    for (sym in symlist) {
      console.log(symlist[sym])
      var SetList = fs.readdirSync(symlist[sym])
      
      for (var set in SetList) {
        if (SetList[set].indexOf(type) > -1) {
          var SetStr = (SetList[set]).replace(type, '')
          setArray.push('Sample Project: ' + SetStr)
        }
      }
    }
    projArray.push({project: prolist[proj], sets: setArray})
    console.log(setArray)
  }
  //cb....
})

//models/sets/line27

