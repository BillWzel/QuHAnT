// Code Review 07/25/16 - Daria Tarasova - Anna Schmidt - Jingyi Liu

var express = require('express')
var router = express.Router()
var analysis = require('../models/results')
var set = require('../models/sets')
var manta = require('../models/upload_model')
var chokidar = require('chokidar')
var extract = require('extract-zip')
var fs = require('fs')
var db = require('../db')


router.get('/analyze', function (req, res) {
  var sess = req.session
  if (!sess.username) {
    res.render('users/login')
  } else {
    analysis.get('modules', function (err, modules) {
      if (err) {
        console.log(err)
      }
      set.create_set_array(req, '.set', function (err, projArray) {
        if (err) {
          console.log(err)
        }
        db.chargecodes.crossRefCode(sess.username, function (err, out) {
          if (err) { console.log(err) }
          db.chargecodes.findByCCode(sess.CCode, function (err, out) {
            if (err) { console.log(err) }
            set.create_proj_table(req, function (err, projectTable) {
              if (err) { console.log(err) }
              res.render('results/analyze', {modules: modules, projects: projArray, chargecode: out, projTable: projectTable, local: JSON.stringify(req.session)})
            })
          })
        })
      })
    })
  }
})

router.get('/results', function(req, res) {
  var sess = req.session
  if (sess.sampleproj) {
    var RealUser = 'sampletest'
  } else {
    var RealUser = sess.username
  }
  if (!sess.username) {
    res.render('users/login')
  } else {
    manta.connect('1234', function(err, output) {
      manta.listAnalyzed(RealUser, function (err, mat) {
        db.analyses.filterModules(RealUser, sess, function(err, matrix) {
          var x = {}
          var y = []
          var existing = 0
          for (var i in matrix) {
            y.push(i)
            x.test = matrix[i]
            modMatrix = matrix[i]
            for (var j in modMatrix) {
              if (modMatrix[j].jobStatus == 'running') {
                existing = existing + 1
              }
            }
          }
          if (existing == 0) {
            res.render('results/results', {modules: y, sets: JSON.stringify(matrix), local: JSON.stringify(req.session), check: false})
          } else {
            res.render('results/results', {modules: y, sets: JSON.stringify(matrix), local: JSON.stringify(req.session), check: true})
          }
        })
      })
    })
  }
}) 

// Renders datasheets
router.post('/metadata', function (req, res) {
  sess = req.session
  sess.module = req.body.module
  
  if (!sess.sampleproj) {
    var RealPath = 'public/cors_demo/' + sess.username + '/'
    analysis.createMeta(req, function (err, metadata) {
      analysis.createReport(req,RealPath, function (err, metadata) {
        manta.mput_all_csv(req, true, function(err, output) {
        })
      })
    })
  } else {
    var RealPath = 'public/cors_demo/sampletest/'
    analysis.createReport(req, RealPath, function (err, metadata) {
      manta.mput_all_csv(req, true, function(err, output) {
      })
    })
  }
  res.render('results/metadata')
})

// Display Results
router.post('/disp_results', function (req, res) {
  if (!req.session.sampleproj) {
    manta.data_analyze(req, function (err, jobId) {
      if (err) {
        console.log(err)
      }
      req.session.job = jobId
      db.results.AppendRes(req, jobId, function(err, output) {
        res.render('results/display_results', {job: String(sess.job)})
      })
    })
  }
  else {
    var jobString = 'f58c39ad-35ac-e2cd-cbbc-ed476e722109'
    req.session.job = jobString 
    res.render('results/display_results', {job: jobString, local: JSON.stringify(req.session)})
  }
})

// Submit metadata
router.post('/sign', function (req, res) {
  req.session.project_name = 'results'
  manta.connect('1234', function (err, output) {
    if (err) {
      console.log(err)
    }
    manta.upload(req, res, function (err, res) {
      if (err) {
        console.log(err)
      }
      res.end()
    })
  })
})

router.get('/disp_results', function (req, res) {
  var sess = req.session
  if (!sess.username) {
    res.render('users/login')
  } else {
    res.render('results/display_results', {'job': String(sess.job), 'local': JSON.stringify(req.session)})
  }
})

// Watch for data zip directories.
router.post('/watch_folder', function (req, res) {
  var sess = req.session
  var monitor = chokidar.watch('public/cors_demo/' + sess.username + '/results', {
    ignored: /node_modules|\.git/,
    persistent: true }).on('all', function (event, path) {
      if (event === 'add' && path.indexOf('.zip') > -1 && path.indexOf(sess.job) > -1) {
        setTimeout(function () {
          extract(path, {dir: 'public/cors_demo/' + sess.username + '/results'}, function (err) {
            if (err) console.log(err)
            else {
              monitor.close() // Stops watching after zip is found
              var zipArray = fs.readdirSync('public/cors_demo/' + sess.username + '/results/' + sess.job)
              for (var i in zipArray) {
                if (zipArray[i].indexOf('.jpeg') > -1) {
                  req.io.broadcast('zipper', {value: '/cors_demo/' + sess.username + '/results/' + sess.job + '/' + zipArray[i]})
                }
              }
            }
          })
        }, 10000)
      }
    })
  res.end()
})

router.post('/checkSubmitted', function (req, res) {
  var sess = req.session
  sess.project_name = req.body.proj
  sess.set_name = req.body.sets

  analysis.checkSubmitted(req, res, function (err, output) {
    if (err) {
      console.log(err)
      res.render('constructions/errors')
    }
  })
  res.end()
})

router.post('/analyze_set', function (req, res) {
  req.session.module = req.body.module
  var sess = req.session
  
  if (sess.sampleproj) {
    var RealUser = 'sampletest'
  } else {
    var RealUser = sess.username

    db.sets.edit_set(req, null, 'Analyzed', function(err, edit) {
      if (err) {
        console.log(err)
      }
    })
  }

  analysis.listAnalyzed(req, res, RealUser, function (err, ImgList, NotAnalyzed) {
    manta.connect('1234', function (err, output) {
      manta.analyze2(req, RealUser, ImgList, NotAnalyzed, function (err, output) {
       res.end()
      })
    })
  })
})

router.post('/download', function (req, res) {
  var sess = req.session
  for (var i in req.body) {
    if (req.body[i] == 'Export') {
      sess.job = i
    }
  }
  if (!sess.job) {
    var file = 'public/cors_demo/' + sess.username + '/results/metadata.csv'
  } else {
    file = 'public/cors_demo/' + sess.username + '/results/' + sess.job + '.zip'
  }
  if (fs.existsSync(file)) {
    res.download(file)
  } else { // TODO: come up with better solution in case of file not existing
    res.redirect('results/results')
  }
})

router.get('/metadata', function (req, res) {
  var sess = req.session
  if (!sess.username) {
    res.render('users/login')
  } else {
    sess.job = null
    res.render('results/metadata')
  }
})

// Watch for addition or change of metadata.csv
router.post('/watch_metadata', function (req, res) {
  var sess = req.session
  var local_path = 'public/cors_demo/' + sess.username + '/results/results_metadata.csv'
  if (fs.existsSync(local_path)) {
    // Check if old metadata exists and remove due to slow sync
    manta.connect('1234', function (err, output) {
      if (err) {
        console.log(err)
      }
    })
    manta.remove('results_metadata', req, res, function (err, res) {
      if (err) {
        console.log("CSV FILE NOT ON MANTA -- NOT AN ISSUE")
      }
    })
    fs.unlinkSync(local_path)
  }
  var monitor = chokidar.watch('public/cors_demo/' + sess.username + '/results/results_metadata.csv', {
    ignored: /node_modules|\.git/,
    persistent: true }).on('all', function (event, path) {
      if (event == 'add' || event == 'change') {
        req.io.broadcast('data', {value: true})
      }
    })
  res.end()
})

router.post('/skip_metadata', function(req, res) {
  var sess = req.session
  manta.connect('1234', function (err, out) {
    if (err) {
      console.log(err)
    }
  })
  
  sess = req.session
  if (!sess.sampleproj) {
    var RealPath = 'public/cors_demo/' + sess.username + '/'
    analysis.createMeta(req, function (err, metadata) {
      analysis.createReport(req,RealPath, function (err, metadata) {
        manta.mput_all_csv(req, false, function(err, output) {
          analyze_info()
        })
      })
    })
  } else {
    /*var RealPath = 'public/cors_demo/sampletest/'
    analysis.createReport(req, RealPath, function (err, metadata) {
      manta.mput_all_csv(req, false, function(err, ouput) {
        analyze_info()
      })
    })
    */
    req.session.job = '1d40fcd7-598b-e705-f36d-acca0b96411d'
    res.render('results/display_results')
  }

  function analyze_info() {
    // Submits job to analyze summaries with R code
    manta.data_analyze(req, function (err, jobId) {
      if (err) {
        console.log(err)
      }
      req.session.job = jobId
      analysis.create_result_table(req, jobId, function (err, output) {
        if (err) {
          console.log(err)
        }
      })
      res.render('results/display_results')
    })
  }
})

// Check the status of the figure generation
router.post('/checkStatus', function (req, res) {
  manta.connect('1234', function (err, out) {
    if (err) {
      console.log(err)
    }
  })
  db.results.updateUserResults(req.session.username, function(err, out) {
    manta.statusCheck(req, res, function (err, output) {
      if (err) {
        console.log(err)
      }
      res.end()
    })
  })
})

// Updates the status of jobs for the results page
router.post('/results_post', function(req, res) {
  var sess = req.session
  if (sess.sampleproj) {
    var RealUser = 'sampletest'
  } else {
    var RealUser = sess.username
  }
  manta.connect('1234', function(err, output) {
    manta.listAnalyzed(RealUser, function (err, mat) {
      analysis.updateResults(RealUser, req, res, function(err,res) {
      })
    })
  })
  res.end()
}) 


//KEEP THIS ROUTE FOR LAST
router.get('/:jobstring', function (req, res) {
  var sess = req.session
  if (!sess.username) {
    res.render('users/login')
  } else {
    dispResults = fs.readdirSync('public/cors_demo/' + sess.username + '/results/').toString()
    if (dispResults.indexOf(req.params.jobstring) > -1) {
      req.session.job = req.params.jobstring
      res.render('results/display_results', {job: String(req.params.jobstring)})
    } else {
      res.render('users/errors') 
    }
  }
})

module.exports = router
