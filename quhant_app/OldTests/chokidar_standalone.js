// Modules to import
var chokidar = require('chokidar'),
    fs = require('fs')

chokidar.watch('.', {
  persistent: true,}).on('all', function(event, path) {
    if (event == 'add' &&  path.indexOf('.json') > -1) {
      console.log('added: ' + path)
      fs.readFile(path, function(err, data){
        var json = data.toString()
        console.log(json)
      })      
    } else if (event == 'change' && path.indexOf('.json') > -1){
      fs.readFile(path, function(err, data){
        var json = data.toString()
        console.log(json)
      })

    }
  })
