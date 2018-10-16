fs = require('fs')
manta = require('manta')

// FUNCTION
function checkJSON (username) {
  if (!fs.existsSync('./public/cors_demo/' + username + '/db/analyses.json')) {
    var analyses = []
    fs.writeFileSync('./public/cors_demo/' + username + '/db/analyses.json', JSON.stringify(analyses), 'utf8')
  } else {
    var jsonStrA = fs.readFileSync('./public/cors_demo/' + username + '/db/analyses.json')
    analyses = JSON.parse(jsonStrA)
  }
  return analyses
}

function importJobs () {
  if (!fs.existsSync('./public/db/jobcosts.json')) {
    var filelist = []
    fs.writeFileSync('./public/db/jobcosts.json', JSON.stringify(filelist), 'utf8')
  } else {
    var jsonStrA = fs.readFileSync('./public/db/jobcosts.json')
    filelist = JSON.parse(jsonStrA)
  }
  return filelist
}


function connectManta () {
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
} 

// EXPORTED FUNCTIONS
exports.userSetUp = function (user, cb) {
  var analyses = checkJSON(user)
  return cb(null, null)
}

exports.findBySetId = function (user, id, cb) {
  var analyses = checkJSON(user)
  process.nextTick(function () {
    for (var i = 0, len = analyses.length; i < len; i++) {
      var record = analyses[i]
      if (record.set_id == id) {
        return cb(null, id)
      }
    }
    return cb(null, null)
  })
}

exports.findByAnalysed = function (username, cb) {
  var analyses = checkJSON(username)
  var matrix = []
  process.nextTick(function () {
    for (var i = 0, len = analyses.length; i < len; i++) {
      var record = analyses[i]
      if (record.analyzed === 'true') {
        n_mat = []

        n_mat.push(record.set_id)
        n_mat.push(record.analysis_id)
        matrix.push(n_mat)
      }
    }
    return cb(null, matrix)
  })
}

exports.appendAnalysis = function (req, jobid, type, imnum, cb) {
  if (!req.session.sampleproj) {
    var analyses = checkJSON(req.session.username)
    new_record = {set_id: '', project_name: '', set_name: '', module: '', analyzed: 'true', analysis_id: '', analysisType: '', chargecode: '', analysis_date: '', inputs: 0, output: 0, jobStatus: '', estimate: 0}
    sess = req.session
    if (imnum == 0) {
      new_record.jobStatus = 'done'
    }
    new_record.inputs = imnum
    new_record.set_id = sess.project_name + '/' + sess.set_name
    new_record.project_name = sess.project_name
    new_record.set_name = sess.set_name
    new_record.module = req.body.module
    new_record.analysis_id = jobid
    new_record.analysis_date = new Date()
    new_record.analysisType = type
    if (new_record.analysisType === 'ANALYSIS') {
      var realcost = fs.readFileSync('public/imcost.txt')
      new_record.estimate = (req.session.analysisinput * realcost)
    } else {
      new_record.estimate = (req.session.analysisinput * 1.45)
    }
    new_record.chargecode = req.session.CCode
    analyses.push(new_record)

    fs.writeFileSync('./public/cors_demo/' + sess.username + '/db/analyses.json', JSON.stringify(analyses), 'utf8')
  } 
  return cb(null, null)
}

exports.sampleAnalyses = function (req, project_name, set_name, cb) {
  // TODO : import module
  var analyses = checkJSON('sampletest')
  new_record = {set_id: '', project_name: '', set_name: '', module: '', analyzed: 'true', analysis_id: '', analysisType: '', chargecode: '', analysis_date: '', inputs: 0, output: 0, jobStatus: 'done', estimate: 0}
  sess = req.session
  new_record.inputs = 0
  new_record.set_id = project_name + '/' + set_name
  new_record.project_name = project_name
  new_record.set_name = set_name
  new_record.analysis_id = 000000000
  new_record.analysis_date = new Date()
  new_record.analysisType = 'ANALYSIS'
  new_record.estimate = 0.00
  new_record.chargecode = 'SampleProj'
  analyses.push(new_record)

  fs.writeFileSync('./public/cors_demo/' + sess.username + '/db/analyses.json', JSON.stringify(analyses), 'utf8')
  return cb(null, null)
}


exports.updateUserTable = function (user, cb) {
  var analyses = checkJSON(user)
  var joblist = importJobs()
  connectManta()

  // This will update the array
  function crossref(analyses, i, cb) {
    var jobrecord = false
    process.nextTick(function () {
      for (var j = 0, len = joblist.length; j < len; j++) {
        jobrecord = joblist[j]
        if ( analyses[i].analysis_id == jobrecord.jobid ) {
          analyses[i].jobStatus = jobrecord.state
          fs.writeFileSync('./public/cors_demo/' + user + '/db/analyses.json', JSON.stringify(analyses), 'utf8')
          jobrecord = true
          cb(null, jobrecord)
        }
      }
    })
    cb(null, jobrecord)
  }

  function checkManta(analyses, i, cb) {
    CLIENT.job(String(analyses[i].analysis_id), function (err, job) {
      if (err) {
        crossref(analyses, i, function (err, out) {
          if (out) {
          } else { 
            analyses[i].jobStatus = 'error'
            fs.writeFileSync('./public/cors_demo/' + user + '/db/analyses.json', JSON.stringify(analyses), 'utf8')
          }
        })
      } else {
        if (job.stats.errors > 0) {
          job.state = 'error'
        }
        analyses[i].jobStatus = job.state 
        fs.writeFileSync('./public/cors_demo/' + user + '/db/analyses.json', JSON.stringify(analyses), 'utf8')
      }
    })
  }

  process.nextTick(function () {
    for (var i = 0, len = analyses.length; i < len; i++) {
      var record = analyses[i]
      if (record.jobStatus == "") {
        checkManta(analyses, i, function (err, answer) {
          return cb(null, null)
        })
      }
    }
    return cb(null, null)
  })
}

exports.costSummary = function (tempPath, cb) {
  var joblist = importJobs()
  var jsonStrA = fs.readFileSync(tempPath)
  var filelist = JSON.parse(jsonStrA)
  var today = new  Date()
  var dd = today.getDate()
  var mm = today.getMonth()+1
  if (dd<10) {
    dd='0'+dd
  }
  if (mm<10){
    mm='0'+mm
  }
  var yyyy = today.getFullYear()
  
  function findUserRecord(inputRecords, item, cb) {
    var jsonStrA = fs.readFileSync(tempPath)
    var filelist = JSON.parse(jsonStrA)
    var flag = null
    for (var j = 0, len = filelist.length-10; j < len; j++) {
      if (inputRecords[item].jobid == filelist[j].analysis_id) {
        flag='match'
        createFile(inputRecords, filelist, item, j) 
        cb(null,flag)
        break
      }
    }
    cb(null, flag)
  }

  function createFile(record, userRecord, iter, jiter) {
    console.log(' -------- 1 ----- db/analyses ----------')
    console.log(record[iter].jobid + '\t' + record[iter].timeCreated + '\t' + record[iter].state + '\t' + record[iter].name + '\t' + record[iter].jobCost + '\t' +  record[iter].tasks + '\t' + userRecord[jiter].estimate)
  }

  process.nextTick(function () {
    for (var i = 0, len = joblist.length-10; i < len; i++) {
      findUserRecord(joblist, i, function (err, output) {
        if (output == null) {
          console.log(' -------- 2 -------- db/analyses -------')
          console.log(joblist[i].jobid + '\t' + joblist[i].timeCreated + '\t' + joblist[i].state + '\t' + joblist[i].name + '\t' + joblist[i].jobCost + '\t' + joblist[i].tasks)
        }
      })
    }
  })
}

exports.deleteAnalysisProject = function(user, project, cb) {

  var analyses = checkJSON(user)
  for (i in analyses) {
    if (analyses[i].project_name == project) {
      analyses.splice(i, 1)
    }
  }
  fs.writeFileSync('./public/cors_demo/'+user+'/db/analyses.json', JSON.stringify(analyses), 'utf8')
  cb(null, null)
}

exports.deleteAnalysisSet = function( user, project, set, cb) {
  
  var analyses = checkJSON(user)
  for (i in analyses) {
    if (analyses[i].project_name == project) {
      newRecord = analyses[i].sets
      for ( var j in newRecord) {
        if (newRecord[i].set_name == set) {
          newRecord.splice(j,1)
          records[i].sets = newRecord
        }
      }
    }
  }
  fs.writeFileSync('./public/cors_demo/'+user+'/db/analyses.json', JSON.stringify(analyses), 'utf8')
  cb(null, null)
}

/*
// List all modules used by a user
exports.usermodules = function (user, cb) {
  var moduleList = []
  var analyses = checkJSON(user)
  for (i in analyses) {
    var mod = analyses[i].module
    if (!mod) {
      mod = 'ORO'
    }
    var filteredList = moduleList.filter(function (x) { return x.indexOf(mod) > -1})
    if (filteredList.length == 0) {
      moduleList.push(mod)
    }
  }
  cb(null, moduleList)
}

exports.findByModule = function (module, user, cb) {
  var projlist = []
  var analyses = checkJSON(user)
  for (i in analyses) {
    var analysis = analyses[i]
    if (analysis.module == module) {
      projlist.push(analysis)
    }
  }
  cb(null, projlist)
}
*/

exports.filterModules = function (user, sess, cb) {
  var dict = []
  var analyses = checkJSON(user)
  dictarr = {}
  for (var i in analyses) {
    if (sess.sampleproj) {
      analyses[i].set_name = sess.orig_user
    }
    var mod = analyses[i].module
    if (!dict[mod]) {
      dict[mod] = []
      dictarr[mod] = []
    }
    //dict[mod].push([analyses[i].project_name, analyses[i].set_name])
    dict[mod].push(analyses[i])
    dictarr[mod].push(analyses[i])
  }
  cb(null, dictarr)
}
