// Code Review 07/22/16 - Daria Tarasova - Jingyi Liu - Anna Schmidt

var express = require('express')
var router = express.Router()
var Image = require('../models/image')
var set = require('../models/sets')
var chokidar = require('chokidar')
var fs = require('fs')
var analysis = require('../models/results')

// STEP 1 - Quality Control
// Goes to image display view
router.get('/sample_display', function (req, res) {
  var sampleSess = req
  var sess = req.session
  var user = req.session.username
  sampleSess.session.username = 'SampleDataUser'
  sampleSess.session.project_name = 'SampleDataProject'
  sampleSess.session.set_name = user
  if (!sess.username) {
    res.render('users/login')
  } else {
    Image.get(sampleSess, function (err, images) {
      if (err) {
        console.log(err)
        res.render('constructions/errors')
      }
      sess.username = user
      sess.set_name = user
      req.session.username = user
      req.session.set_name = user
      res.render('sampledata/sample_image', {img: images, set: sess.set_name})
    })
  }
})

// Updates text file from checkbox click
router.post('/sample_update', function (req, res) {
  var sampleSess = req
  var user = req.session.username
  sampleSess.session.username = 'SampleDataUser'
  sampleSess.session.project_name = 'SampleDataProject'
  sampleSess.session.set_name = user
  Image.update(sampleSess, function (err, res) {
    if (err) {
      console.log(err)
      res.render('constructions/errors')
    }
    req.session.username = user
  })
  res.end()
})

router.post('/sample_accept', function (req, res) {
  var sampleSess = req
  var user = req.session.username
  sampleSess.session.username = 'SampleDataUser'
  sampleSess.session.project_name = 'SampleDataProject'
  sampleSess.session.set_name = user
  var sess = sampleSess.session
  var DirPath = './public/cors_demo/' + sess.username + '/' + sess.project_name + '/' + sess.set_name
  var newSet = []
  var numImgs = 0
  var out = { Code: '',
  username: 'SampleDataUser',
  dateCreated: 'Now',
  createBy: 'Rance_Nault',
  value: 2.00,
  dateExpired: '2017-10-4',
  description: 'Sample Dataset',
  charges: 0,
  balance: 2.00 }
  Image.get(sampleSess, function (err, images) {
    if (err) {
      console.log(err)
      res.render('constructions/errors')
    }
    for (var i in images.images) {
      if (!images.images[i].userInput) {
        if (images.images[i].qcOutput === 'GOOD') {
          newSet.push(images.images[i].imgName)
          numImgs = numImgs + 1
        }
      } else if (images.images[i].userInput === 'GOOD') {
        newSet.push(images.images[i].imgName)
        numImgs = numImgs + 1
      }
    }
    fs.writeFileSync(DirPath + '.set', newSet.join('\n'))
  })

  analysis.get('modules', function (err, modules) {
    if (err) {
      console.log(err)
      res.render('constructions/errors')
    }
    set.create_set_array(sampleSess, '.set', function (err, projArray) {
      if (err) {
        console.log(err)
        res.render('constructions/errors')
      }
      set.create_proj_table(sampleSess, function (err, projectTable) {
        if (err) { console.log(err) }
        req.session.username = user
        res.render('sampledata/sample_analyze', {modules: modules, projects: projArray, chargecode: out, projTable: projectTable})
      })
    })
  })
})

router.get('/sample_analyze', function (req, res) {
  var sampleSess = req
  var user = req.session.username
  sampleSess.session.username = 'SampleDataUser'
  sampleSess.session.project_name = 'SampleDataProject'
  sampleSess.session.set_name = user
  var sess = sampleSess.session
  var out = { Code: '',
  username: 'SampleDataUser',
  dateCreated: 'Now',
  createBy: 'Rance_Nault',
  value: 2.00,
  dateExpired: '2017-10-4',
  description: 'Sample Dataset',
  charges: 0,
  balance: 2.00 }
  if (!sess.username) {
    res.render('users/login')
  } else {
    analysis.get('modules', function (err, modules) {
      if (err) {
        console.log(err)
        res.render('constructions/errors')
      }
      set.create_set_array(sampleSess, '.set', function (err, projArray) {
        if (err) {
          console.log(err)
          res.render('constructions/errors')
        }
        set.create_proj_table(sampleSess, function (err, projectTable) {
          if (err) { console.log(err) }
          req.session.username = user
          res.render('sampledata/sample_analyze', {modules: modules, projects: projArray, chargecode: out, projTable: projectTable})
        })
      })
    })
  }
})

router.get('/sample_results', function (req, res) {
  res.render('sampledata/sample_results')
})

router.get('/sample_metadata', function (req, res) {
  res.render('sampledata/sample_metadata')
})

router.post('/sample_download', function (req, res) {
  var file = 'public/cors_demo/SampleDataUser/results/results_metadata.csv'
  res.download(file)
})

router.get('/sample_disp_results', function (req, res) {
  res.render('sampledata/sample_disp_results')
})

router.post('/sample_watch_folder', function (req, res) {
  var jobstring = '1d40fcd7-598b-e705-f36d-acca0b96411d' 
  var zipArray = fs.readdirSync('public/cors_demo/SampleDataUser/results/' + jobstring)
  setTimeout(function () {
    for (var i in zipArray) {
      if (zipArray[i].indexOf('.jpeg') > -1) {
        req.io.broadcast('data', {value: '/cors_demo/SampleDataUser/results/' + jobstring + '/' + zipArray[i]})
      }
    }
  }, 1000)
  res.end()
})

router.post('/sample_download_zip', function (req, res) {
  var file = 'public/cors_demo/SampleDataUser/results/1d40fcd7-598b-e705-f36d-acca0b96411d.zip'
  res.download(file)
})

module.exports = router
