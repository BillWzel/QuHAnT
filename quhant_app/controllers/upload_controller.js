// Code Review 07/22/16 - Daria Tarasova - Anna Schmidt - Jingyi Liu

var express = require('express')
var router = express.Router()
var manta = require('../models/upload_model.js')
var user = require('../models/user')
var chokidar = require('chokidar')
// var sio = require('socket.io')
var fs = require('fs')
var db = require('../db')

router.get('/upload_view', function (req, res) {
  var sess = req.session
  if (!sess.username) {
    res.render('users/login')
  } if (!sess.project_name) {
    res.render('project/project', {success: ''})
  } else {
    res.render('upload/upload_view', {username: sess.username, setName: sess.project_name})
  }
})

// Uploads images
router.post('/sign', function (req, res) {
  manta.upload(req, res, function (err, res) {
    if (err) {
      console.log(err)
      res.render('constructions/errors')
    }
  })
  res.end()
})

router.post('/sign-zip', function (req, res) {
  sess = req.session
  manta.connect('1234', function(err, output) {
    if (err) {
      console.log(err)
    }
    file = (req.body.file).replace('.tar','')
    // TODO create_file original_set
    manta.create_dir(req, sess.username+'/'+file, function(err,cb) {
      if (err) {
        console.log(err)
      }
    })
    sess.project_name = file

    user.add_proj_to_json(req, 0, 'project', function(err, cb) {
      if (err) {
        console.log(err)
        res.render('constructions/errors')
      }
    })
    manta.upload_zip(req, res, function (err, res) {
      if (err) {
        console.log(err)
        res.render('constructions/errors')
      }
      fs.writeFileSync('./public/cors_demo/'+sess.username+'/'+file+'/ignore_manta_to_local.sync', '.tif') // .set ')
      fs.writeFileSync('./public/cors_demo/'+sess.username+'/'+file+'/ignore_manta_to_manta.sync', '.jpeg .txt .json ')
    })
  })
  res.end()
})


router.post('/stream', function (req, res) {
  var images = req.body.fileArray
  var imagesTotal = images.length
  var sess = req.session

  db.sets.edit_project_imgs(req, imagesTotal, function (err, cb) {
    if (err) {
      console.log(err)
      res.render('constructions/errors')
    }
  })

  manta.stream(req, function (err, res) {
    if (err) {
      console.log(err)
      res.render('constructions/errors')
    }
  })

  // chokidar progress bar
  chokidar.watch('public/cors_demo/' + sess.username + '/' + sess.project_name, {
    persistent: true}).on('all', function (event, path) {
      if ((event === 'add') && path.indexOf('.jpeg') > -1) {
        var jpgArray = fs.readdirSync('public/cors_demo/' + sess.username + '/' + sess.project_name)
        var imageCount = 0
        for (var i in jpgArray) {
          if (jpgArray[i].indexOf('.jpeg') > -1) {
            imageCount = imageCount + 1
          }
        }
        var percentComplete = (imageCount / imagesTotal) * 100
        req.io.broadcast('progress', {value: percentComplete})
      }
    })
  res.end()
})

router.post('/updateSess', function(req,res) {
  var sess = req.session
  res.end()
})

router.post('/processzip', function(req,res) {
  manta.zipextract(req, req.body.file, function(err,cb) {
    if (err) {
      console.log(err)
      res.render('constructions/errors')
    }
  })
  //create project directory on local ( Monitoring folder )
  //create set 
  res.end()
})

router.post('/watch_set', function (req, res) {
  sess = req.session  
  // Chokidar
  chokidar.watch('public/cors_demo/'+sess.username +'/'+ sess.project_name, {
    persistent: true}).on('all', function(event, path) {
      if ((event == 'add' || event == 'change') && path.indexOf('.set') > -1) {
        req.io.broadcast('set', {is_there: true})
      }
    })
})

module.exports = router
