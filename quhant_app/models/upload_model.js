// Code Review 07/22/16 Daria Tarasova - Jingyi Liu - Anna Schmidt
var express = require('express')
  , bodyParser = require('body-parser')
  , app = express()
  , manta = require('manta')
  , fs = require('fs')
  , xmlparser = require('express-xml-bodyparser')
  , assert = require('assert')
  , path = require('path')
  , MemoryStream = require('memorystream')
  , db = require('../db')
  , sr = require('simple-random')

// Connect to manta
exports.connect = function (id, cb) {
  // /--- Globals
  global.CORS_OPTIONS = {
    headers: {
      'access-control-allow-headers': 'access-control-allow-origin, accept, origin, content-type',
      'access-control-allow-methods': 'PUT,GET,HEAD,DELETE',
      'access-control-allow-origin': '*'
    }
  }

  global.CLIENT = manta.createClient({
    sign: manta.privateKeySigner({
      algorithm: 'RSA-SHA1',
      key: fs.readFileSync(process.env.HOME + '/.ssh/client_key', 'utf8'),
      keyId: process.env.MANTA_KEY_ID,
      user: process.env.MANTA_USER
    }),
    user: process.env.MANTA_USER,
    url: process.env.MANTA_URL
  })
  DROPBOX = '/' + process.env.MANTA_USER + '/stor/cors_demo'
  
  cb(null, [])
}

// Creates new directory
exports.create_dir = function (req, dir_path, cb) {
  var d = new Date()
  CLIENT.mkdirp('/' + process.env.MANTA_USER + '/stor/cors_demo/' + dir_path, CORS_OPTIONS, function (err) {
    assert.ifError(err)
  })
  if (!fs.existsSync('./public/cors_demo/' + dir_path)) {
    fs.mkdirSync('./public/cors_demo/' + dir_path)
  }
  cb(null)
}

// Creates blank file on manta
exports.create_file = function (req, project, file, message, cb) {
  sess = req.session
  var dir_path = sess.username + '/' + project
  var opts = {
    copies: 3,
    mkdirs: true,
    header: {
      'access-control-allow-headers': 'access-control-allow-origin, accept, origin, content-type',
      'access-control-allow-methods': 'PUT,GET,HEAD,DELETE',
      'access-control-allow-origin': '*'
    }
  }
  var stream = new MemoryStream()
  CLIENT.put('/' + process.env.MANTA_USER + '/stor/cors_demo/' + dir_path + '/' + file, stream, opts, function (err) {
    assert.ifError(err)
    cb(null, '')
  })
  stream.end(message)
}


// New streaming function
exports.stream = function (req, cb) {
  sess = req.session
  var fileData = req.body.fileArray
  var dir_path = sess.username + '/' + sess.project_name

  if (!fs.existsSync('./public/cors_demo/' + dir_path)) {
    fs.mkdirSync('./public/cors_demo/' + dir_path)
  }

  fs.unlink('./public/cors_demo/'+sess.username+'/Monitoring/status.log', function(err) {
    if (err) console.log(err)
  })
  fs.writeFileSync('./public/cors_demo/' + dir_path + '/' + sess.project_name + '_original.set', fileData.join('\n'))
}

// Upload images to manta
exports.upload = function (req, res, cb) {
  sess = req.session
  // Consider changing params to imagefile
  var params = req.body.file || {}
  if (!params) {
    res.error(409, 'Missing "file" parameter')
    return
  }
  // signURL options, puts file on manta and signs it
  var opts = {
    expires: new Date().getTime() + 100000000,
    path: DROPBOX + '/' + sess.username + '/' + sess.project_name + '/' + params,
    method: ['OPTIONS', 'PUT'],
    headers: {
      'access-control-allow-headers': 'access-control-allow-origin, accept, origin, content-type',
      'access-control-allow-methods': 'PUT,GET,HEAD,DELETE',
      'access-control-allow-origin': '*'
    }

  }
  // signature variable is defined in the HTML
  CLIENT.signURL(opts, function (err, signature) {
    if (err) {
      res.error(500, err)
      return
    }
    var signed = JSON.stringify({
      url: process.env.MANTA_URL + signature
    })
    res.setHeader('content-type', 'application/json')
    res.setHeader('content-length', Buffer.byteLength(signed))
    res.writeHead(200)
    res.end(signed)
  })
  cb(null, res)
}

// Upload images to manta
exports.upload_zip = function (req, res, cb) {
  sess = req.session
  // Consider changing params to imagefile
  var params = req.body.file || {}
  if (!params) {
    res.error(409, 'Missing "file" parameter')
    return
  }
  // signURL options, puts file on manta and signs it
  var opts = {
    expires: new Date().getTime() + 100000000,
    path: DROPBOX + '/' + sess.username + '/' + params,
    method: ['OPTIONS', 'PUT'],
    headers: {
      'access-control-allow-headers': 'access-control-allow-origin, accept, origin, content-type',
      'access-control-allow-methods': 'PUT,GET,HEAD,DELETE',
      'access-control-allow-origin': '*'
    }

  }

  // signature variable is defined in the HTML
  CLIENT.signURL(opts, function (err, signature) {
    if (err) {
      res.error(500, err)
      return
    }
    var signed = JSON.stringify({
      url: process.env.MANTA_URL + signature
    })
    res.setHeader('content-type', 'application/json')
    res.setHeader('content-length', Buffer.byteLength(signed))
    res.writeHead(200)
    res.end(signed)
  })
  cb(null, res)
}

exports.analyze2 = function (req, username, ImgList, NotAnalyzed, cb) {
  if (NotAnalyzed.length == 0) {
    db.analyses.appendAnalysis(req, sr(), 'ANALYSIS', 0, function(err, answer) {
      cb(null, '')
    })
  } else {
    var d = new Date()
    var sess = req.session
    var ANALYSIS_JOB
  
    var module = require('../public/cors_demo/analysis_modules/' + req.body.module + '/analysis2')
    //var opts_job = module.opts_job
    var opts_job = module(sess.set_name)

    CLIENT.createJob(opts_job, function (err, jobId) {
      assert.ifError(err)
      var ANALYSIS_JOB = jobId
      console.log('Started analysis job: ' + ANALYSIS_JOB + '. Date: ' + d)
      db.analyses.appendAnalysis(req, jobId, 'ANALYSIS', NotAnalyzed.length, function (err, answer) {
        for (var i = 0; i < NotAnalyzed.length; i++) {
          var analysisImg = '/billwzel/stor/cors_demo/' + username + '/' + sess.project_name + '/' + NotAnalyzed[i] + '.tif'
          CLIENT.addJobKey(ANALYSIS_JOB, analysisImg, function (err) {
            assert.ifError(err)
          })
          if (i == NotAnalyzed.length-1) {
            setTimeout(function() {
              CLIENT.endJob(String(ANALYSIS_JOB), function (err) {
                assert.ifError(err)
              })
            }, 20000)
          }
        }
      })
      cb(null, '')
    })
  }
}

// Check which sets are processing/done and return matrix
exports.listAnalyzed = function (username, cb) {
  function checkJob (mat) {
    var jobId = mat.splice(-1, 1)

    CLIENT.job(String(jobId), function (err, job) {
      var path = 'public/cors_demo/' + username + '/db/analyses.json'
      if (fs.existsSync(path)) {
        var jsonArray = fs.readFileSync(path).toString()
      } else {
        var jsonArray = []
      }
      var dbArray = JSON.parse(jsonArray)

      if(err) {
        for (i in dbArray) {
          if (dbArray[i].analysis_id == jobId) {
            mat.push(0)
            mat.push(dbArray.jobStatus)
            break
          }
        }
        matrixOut.push(mat)
        return mat
      } else {
        errNumber = job.stats.errors
        jobStatus = job.state
        mat.push(errNumber)
        mat.push(jobStatus)

        for (i in dbArray) {
          if(dbArray[i].analysis_id == jobId) {
            if (job == undefined) {
              jobStatus = 'error'
            }
            dbArray[i].jobStatus = jobStatus
            fs.writeFileSync(path, JSON.stringify(dbArray),'utf8')
          }
        }
        matrixOut.push(mat)
        return mat
      }
    })
  }

  matrixOut = []
  db.analyses.findByAnalysed(username, function (err, matrix) {
    var errNumber
    var jobStatus
    var mLength = matrix.length
    if (mLength > 0) {
      for (i in matrix) {
        var new_val = checkJob(matrix[i])
      }
    } else {
      matrixOut = matrix
    }
  })
  cb(null, matrixOut)
}


// Create data results by calling job and R code to analyze tables
exports.data_analyze = function (req, cb) {
  var sess = req.session

  if (req.body.module) {
    mod = req.body.module
  } else {
    mod = sess.module
  }

  var ANALYSIS_JOB
  var module = require('../public/cors_demo/analysis_modules/' + mod + '/data_analysis')
  var opts_job = module(sess.username)

  CLIENT.createJob(opts_job, function (err, jobId) {
    assert.ifError(err)
    ANALYSIS_JOB = jobId
    sess.job = ANALYSIS_JOB
    cb(null, ANALYSIS_JOB)
    var jobInput = '/billwzel/stor/cors_demo/' + sess.username + '/results/results_summary.csv'
    CLIENT.addJobKey(ANALYSIS_JOB, jobInput, function (err) {
      assert.ifError(err)
      CLIENT.endJob(String(ANALYSIS_JOB), function (err) {
        assert.ifError(err)
      })
    })
    //setTimeout(function () {
    //  CLIENT.endJob(String(ANALYSIS_JOB), function (err) {
    //    assert.ifError(err)
    //  })
    //}, 4000)
  })
}

exports.remove = function(filename, req, res, cb) {
  sess = req.session
  CLIENT.unlink('/billwzel/stor/cors_demo/'+sess.username+'/results/'+filename+'.csv', function(err) {
    console.log(err)
  })
  cb(null,null)
}

exports.project_imgs_json = function(req, imgs, cb) {
  db.sets.edit_project_imgs(req, imgs, function(err, cb) {
    if (err) {
      return cb(err)
    }
    return cb(null, 'add')
  })
}

exports.statusCheck = function(req, res, cb) {
  var jobId = req.body.job
  var user = req.session.username

  db.results.getJobStatus(req.session.username, jobId, function(err, job) {
    if (job) {
      res.setHeader('content-type', 'text/html')
      res.writeHead(200)
      res.write(job)
      //cb(null, null)
    } else {
      res.setHeader('content-type', 'text/html')
      res.writeHead(200)
      res.write('error')
      // does not need cb in here. causes can't set headers after sent error
    }
    cb(null, null)
  })
}

exports.mput_all_csv = function (req, ignoremeta, cb) {
  var sess = req.session
  var dirPath = 'public/cors_demo/' + sess.username + '/results/'
  fileList = fs.readdirSync(dirPath)

  var templist = fileList.filter(function(x) { return x.indexOf('.csv') > -1})
  if (ignoremeta) {
    templist = templist.filter(function(x) {return x!='results_metadata.csv'})
  }
  for (i in templist) {
    var msg = fs.readFileSync(dirPath + templist[i]).toString()
    exports.create_file(req, 'results', templist[i], msg, function(err, output) {
    })
  }
  cb(null, null)
}

exports.zipextract = function (req, zipfile, cb) {
  var d = new Date()
  var sess = req.session
  var RealPath = '/billwzel/stor/cors_demo/' + sess.username + '/' + zipfile
  var ANALYSIS_JOB
  
  var filename = zipfile.replace('.tar',' ') 
  var module = require('../public/cors_demo/analysis_modules/qualitycontrol/unzip')
  var opts_job = module(filename)

  CLIENT.createJob(opts_job, function (err, jobId) {
    assert.ifError(err)
    var ANALYSIS_JOB = jobId
    console.log('Started zip extract job: ' + ANALYSIS_JOB + '. Date: ' + d)

    // Need to do the project json stuff if successful

    CLIENT.addJobKey(ANALYSIS_JOB, RealPath, function (err) {
      assert.ifError(err)
      setTimeout(function() {
        CLIENT.endJob(String(ANALYSIS_JOB), function(err) {
          if (err) {
            assert.ifError(err)
          } else {
            fs.unlinkSync('./public/cors_demo/'+sess.username+'/Monitoring/status.log')
          }
        })
      }, 20000)
    })
    //setTimeout(function () {
    //  CLIENT.endJob(String(ANALYSIS_JOB), function (err) {
    //    assert.ifError(err)
    //  })
    //}, 10000)
  })
  cb(null, '')
}
