// Code Review 01/31/17 - Daria Tarasova - Rance Nault

var fs = require('fs') // Navigate file system
var db = require('../db')

exports.get = function (req, cb) { 
  var sess = req.session
  if (sess.set_name == null) {
    sess.set_name = sess.project_name + '_verified'
  }
  // Check to see if user is on sample project
  var FilePath = './public/cors_demo/' + sess.username + '/' + sess.project_name
  if (!fs.lstatSync(FilePath)) {
    cb(true, null)
  } else {
    var checkSymLink = fs.lstatSync(FilePath).isSymbolicLink()
    if (checkSymLink) {
      FilePath = fs.readlinkSync(FilePath).replace(/\/$/,'') + '/'
      sess.set_name = sess.username
    } else {
      FilePath = FilePath + '/'
    }

    if (!fs.existsSync(FilePath + sess.project_name + '_original.set')){
      cb(true,null)
    } else {

      var idArray = []

      // Create intermediate if doesn't exist
      if (!fs.existsSync(FilePath + sess.set_name + '.intermediate')) {
        var imgArray = fs.readFileSync(FilePath + sess.project_name + '_original' + '.set').toString().split('\n')
        fs.writeFileSync(FilePath + sess.set_name + '.intermediate', imgArray.join('\n'))
      } else {
        var ray = fs.readFileSync(FilePath + sess.set_name + '.intermediate').toString().split('\n')
        imgArray = []
        // Reading in image names and parsing out user annotations
        for (i in ray) {
          var values = ray[i].split('\t')
          imgArray.push(values[0])
        }
      }
      // Removes blank spaces within array
      imgArray = imgArray.filter(function(x) { return x != ''})

      // Collecting QC output
      for (i in imgArray) {
        if (!fs.existsSync(FilePath + imgArray[i] + '.txt')) {
          var scoreArray = fs.readFileSync('public/img/loading.txt').toString().split('\n')
          // QCcomplete = false;
        } else {
          scoreArray = fs.readFileSync(FilePath + imgArray[i] + '.txt').toString().split('\n')
        }
        // Go through all QC metrics
        scoreArray = scoreArray.filter(function(x) { return x != ''})
        var qcArray = []
        var idName
        var userInput = null
        var number_channel = 3
        var intermediateArray = fs.readFileSync(FilePath + sess.set_name + '.intermediate').toString().split('\n')

        // Loop through each variable of the metrics
        for (j = 0; j < scoreArray.length; j++) {
          values = scoreArray[j].split('\t')
          idName = values[0].replace('.jpeg', '')
          if (j !== scoreArray.length - 1) {
            qcArray.push({'name': values[1], 'metrics': values[2]})
          } else {
            var qcOutput = values[1]
            if (values[1] == 'BAD' && values[2].indexOf('color image') !== -1) {
              number_channel = 1
            }
          }
        }

        var ImageFilepath =  FilePath + idName + '.jpeg'
        if (!fs.existsSync(ImageFilepath)) {
          var ImagePath = '/img/loadingSymbol.gif'
          idName = imgArray[i]
        } else {
          var ImagePath2 = ImageFilepath.replace('./public','')
          ImagePath = ImagePath2.replace('public','')
          if (intermediateArray.indexOf(idName + '\tGOOD') !== -1) {
            userInput = 'GOOD'
          } else if (intermediateArray.indexOf(idName + '\tBAD') !== -1) {
            userInput = 'BAD'
            if (intermediateArray.indexOf('Not a color image') !== -1) {
              number_channel = 1
            }
          }
        }

        idArray.push({'imgName': idName, 'image': ImagePath, 'QC': qcArray, 'qcOutput': qcOutput, 'userInput': userInput, 'numChannels': number_channel})
      }
      cb(null, {user: sess.username, project: sess.project_name, images: idArray})
    }
  }
}

exports.update = function (req, cb) {
  var sess = req.session
  if (sess.sampleproj) {
    var SymPath = fs.readlinkSync('public/cors_demo/' + sess.username + '/' + sess.project_name)
    var FilePath = SymPath + '/' + sess.set_name
  } else {
    var FilePath = 'public/cors_demo/' + sess.username + '/' + sess.project_name + '/' + sess.set_name
  }

  var checked = req.body.isCheck
  var ImagePath = req.body.img_path

  var dataArray = fs.readFileSync(FilePath + '.intermediate').toString().split('\n')
  // IndexOf only finds full strings, not substrings
  var index = dataArray.indexOf(ImagePath)
  var goodIndex = dataArray.indexOf(ImagePath + '\tGOOD')
  var badIndex = dataArray.indexOf(ImagePath + '\tBAD')

  var foundIndex = Math.max(index, goodIndex, badIndex)

  dataArray = dataArray.filter(function(x) { return x != ''})

  if (foundIndex < 0) {
    cb(null)
  } else if (checked === 'true') {
    dataArray[foundIndex] = ImagePath + '\tGOOD'
  } else {
    dataArray[foundIndex] = ImagePath + '\tBAD'
  }

  fs.writeFileSync(FilePath + '.intermediate', dataArray.join('\n'))
  cb(null)
}

exports.update_all = function(req, cb) {
  var sess = req.session
  if (sess.sampleproj) {
    var SymPath = fs.readlinkSync('public/cors_demo/' + sess.username + '/' + sess.project_name)
    var FilePath = SymPath + '/' + sess.set_name
  } else {
    var FilePath = 'public/cors_demo/' + sess.username + '/' + sess.project_name + '/' + sess.set_name
  }
 
  if (req.body.check_all == 1) {
    var all_str = '\tGOOD'
  } else {
    var all_str = '\tBAD'
  }
  var dataArray = fs.readFileSync(FilePath + '.intermediate').toString().split('\n')

  if (req.body.all_pages == 'false') {
    var start_idx = Number(req.body.start_idx)
    var end_idx = Number(req.body.end_idx)
  } else {
    var start_idx = 0
    var end_idx = dataArray.length 
  }

  for (var i in dataArray) {
    if (i >= start_idx && i < end_idx) {
      var line = dataArray[i].split('\t')
      dataArray[i] = line[0] + all_str 
    }
  }

  fs.writeFileSync(FilePath + '.intermediate', dataArray.join('\n'))
   
  cb(null)
}
