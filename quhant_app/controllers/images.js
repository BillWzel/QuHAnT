// Code Review 01/31/17 - Daria Tarasova - Rance Nault 

var express = require('express')
var router = express.Router()
var Image = require('../models/image')
var set = require('../models/sets')
var chokidar = require('chokidar')
var fs = require('fs')
var results = require('../models/results')
var db = require('../db')

// Creates array of images and QC Information
// Goes to image display view
router.get('/display', function (req, res) {
  var sess = req.session
  if (!sess.username) {
    res.render('users/login')
  } else {
    req.session.project_name = sess.project_name
    Image.get(req, function (err, images) {
      if (err) {
        set.create_set_array(req, '.intermediate', function (err, projArray) {
          res.render('images/update_set', {projects: projArray, success: 'There was a problem with the project or set. Please try again. If the problem persists use the "contact us" page to report a problem', local: JSON.stringify(req.session)})
        })
      } else {
        if (!sess.set_name) {
          sess.set_name = sess.project_name + '_verified'
        }
        db.sets.AppendProj(req, 0, 'set', function(err, add) {
          if (err) {
            console.log(err)
          }
        })
        images = JSON.stringify(images)
        res.render('images/image', {img: images, set: sess.set_name})
      }
    })

    // Watching for new images and text files to appear from quality control
    chokidar.watch('public/cors_demo/' + sess.username + '/' + sess.project_name, {
      ignored: /node_modules|\.git/,
      persistent: true }).on('all', function (event, path) {
        path = path.replace('public', '')
        var txtpath = path.replace('.jpeg', '.txt')
        if ((event === 'change' || event === 'add') && path.indexOf('.jpeg') > -1) { // If it is a jpeg image send to view
          req.io.broadcast('image', {value: path})
        } else if ((event === 'change' || event === 'add') && path.indexOf('.txt') > -1) { // If it is a text file send to view
          fs.readFile('public' + txtpath, function (err, data) {
            if (err) {
              console.log(err)
            }
            var qcArray = data.toString().split('\n')
            var values = qcArray[0].split('\t')
            var idName = values[0].replace('.jpeg', '')
            req.io.broadcast('scores', {index: 1, imgName: idName})
            for (var i in qcArray) {
              var scoreArray = qcArray[i].split('\t')
              req.io.broadcast('scores', {index: 2, imgName: idName, metric: scoreArray[1], value: scoreArray[2]})
            }
          })
        }
      })
  }
})

// Goes to select_set view
router.get('/select_set', function (req, res) {
  var sess = req.session
  if (!sess.username) {
    res.render('users/login')
  } else {
    set.list_projects(req, function (err, ProjList) {
      if (err) {
        console.log(err)
      }
      res.render('images/select_set', {projects: ProjList, success: '', local: JSON.stringify(req.session)})
    })
  }
})

// Goes to update_set view
router.get('/update_set', function (req, res) {
  var sess = req.session
  if (!sess.username) {
    res.render('users/login')
  } else {
    set.create_set_array(req, '.intermediate', function (err, projArray) {
      if (err) {
        console.log(err)
      }
      res.render('images/update_set', {projects: projArray, success: '', local: JSON.stringify(req.session)})
    })
  }
})

router.post('/set_all', function(req, res) {
  Image.update_all(req, function(err,res) {
    if (err) {
      console.log(err)
    }
  })
  res.end()
})

// Updates text file from checkbox click
router.post('/update', function (req, res) {
  Image.update(req, function (err, res) {
    if (err) {
      console.log(err)
    }
  })
  res.end()
})

// Connects to display image page
router.post('/setSelection', function (req, res) {
  var sess = req.session
  sess.project_name = req.body.project_name
  sess.set_name = req.body.set_name
  // Return to login page if not already logged in.
  if (!sess.username) {
    res.render('users/login')
  } else {
    if (fs.existsSync('public/cors_demo/' + sess.username + '/' + sess.project_name + '/' + sess.set_name + '.intermediate')) { // Check if intermediate file exists
      // TODO: Replace with socket or other method not requiring to run the model again.
      set.list_projects(req, function (err, ProjList) {
        if (err) {
          console.log(err)
        }
        res.render('images/select_set', {projects: ProjList, success: 'Inputted set name already exists. Please try a new name.', local: JSON.stringify(req.session)}) // if it does exist, refresh and tell them it already exists
      })
    } else if (/[^A-Za-z0-9-_]/.test(sess.set_name)) {
      set.list_projects(req, function(err, ProjList) {
        if (err) {
          console.log(err)
        }
        res.render('images/select_set', {projects: ProjList, success: 'Inputted set name contains invalid characters. Please try a new name.', local: JSON.stringify(req.session)})
      })
    } else { // if intermediate doesn't exist get the images and create a new record in json database.
      db.sets.AppendProj(req, 0, 'set', function(err, add) {
        if (err) {
          console.log(err)
        }
      })
      // No need to call additional modules with redirect
      res.redirect('images/display')
    }
  }
})

// Connects to display image page with update set variables
router.post('/updateSet', function (req, res) {
  var sess = req.session
  sess.project_name = req.body.project
  sess.set_name = req.body.set
  if (!sess.username) {
    res.render('users/login')
  } else {
    var FilePath = 'public/cors_demo/' + sess.username + '/' + sess.project_name
    if (!fs.existsSync(FilePath + '/' + sess.set_name + '.set')) { // Check if there is an accepted set that exists
        res.redirect('images/display')
    } else {
      set.create_set_array(req, '.intermediate', function (err, projArray) {
        if (err) {
          console.log(err)
        }
        res.render('images/update_set', {projects: projArray, success: 'This set has already been accepted. Try a different set or create a new set.', local: JSON.stringify(req.session)})
      })
    }
  }
})

//change from sample mode to normal mode
router.post('/changemode', function (req, res) {
  req.session.sampleproj = false
  req.session.username = req.session.orig_user
  res.end()
})

// Accept a set as final
router.post('/accept', function (req, res) {
  var sess = req.session
  if (sess.sampleproj) {
    var RealPath = fs.readlinkSync('./public/cors_demo/' + sess.username + '/' + sess.project_name)
  } else { 
    var RealPath = './public/cors_demo/' + sess.username + '/' + sess.project_name + '/'
  }
  var DirPath = RealPath + '/' + sess.set_name
  var newSet = []
  var numImgs = 0
  // Obtains all the information from images and places "good" images into array
  Image.get(req, function (err, images) {
    if (err) {
      console.log(err)
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

  db.sets.edit_set(req, numImgs, 'Accepted', function(err, edit) {
    if (err) {
      console.log(err)
    }
  })
  // Get module names to present to user
  results.get('modules', function (err, modules) {
    if (err) {
      console.log(err)
    }
     // Generate the list of projects and sets available for analysis
    set.create_set_array(req, '.set', function (err, projArray) {
      if (err) {
        console.log(err)
      }
      // Updates the chargecode details before checking balance
      db.chargecodes.crossRefCode(sess.username, function (err, out) {
        if (err) { console.log(err) }
        // Find the CCode in use and check the balance
        db.chargecodes.findByCCode(sess.CCode, function (err, out) {
          if (err) { console.log(err) }
          // Not sure...
          set.create_proj_table(req, function (err, projectTable) {
            if (err) { console.log(err) }
            res.render('results/analyze', {modules: modules, projects: projArray, chargecode: out, projTable: projectTable, local: JSON.stringify(req.session)})
          })
        })
      })
    })
  })
})

module.exports = router
