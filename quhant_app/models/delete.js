var fs = require('fs')

exports.AddMantaIgnore = function (DelPath, cb) {
  DelPath = '-x ' + DelPath + ' '
  var OldPaths = fs.readFileSync('public/services/manta-sync-ignore.txt').toString().replace(/\r?\n|\r/g,'')
  Paths = OldPaths + DelPath
  fs.writeFileSync('public/services/manta-sync-ignore.txt',Paths)
  cb(null,null)
}
