var fs = require('fs')
  //})
var manta = require('manta')

// Initiates the JSON database for results
function checkResults (user) {
  if (!fs.existsSync('./public/cors_demo/' + user + '/db/results.json')) {
    var records = []
    fs.writeFileSync('./public/cors_demo/' + user + '/db/results.json', JSON.stringify(records), 'utf8')
  } else {
    var resStr = fs.readFileSync('./public/cors_demo/' + user + '/db/results.json')
    records = JSON.parse(resStr)
  }
  return records
}

function importJobs () {
  if (!fs.existsSync('./public/db/jobcosts.json')) {
    var filelist = []
    fs.writeFileSync('./public/db/jobcosts.json', JSON.stringify(filelist), 'utf8')
  } else {
    var jsonStrA = fs.readFileSync('./public/db/jobcosts.json')
    filelist = JSON.parse(jsonStrA)
    //filelist = jsonStrA
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


exports.AppendRes = function (req, jobId, cb) {
  var sess = req.session
  if (!sess.sampleproj) {
    var records = checkResults(sess.username)

    var new_record = {fileName: '', sets: '', date: '', jobStatus: ''}
    new_record.fileName = jobId

    var setArray = fs.readFileSync('./public/cors_demo/' + sess.username + '/results/results_metadata.csv').toString().split('\n')
    var nameArray = []
    for (var i in setArray) {
      if (i != 0) {
        var names = setArray[i].split(',')
        if (nameArray.indexOf(names[1]) == -1) {
          nameArray.push(names[1])
        }
      }
    }
    new_record.sets = nameArray
    new_record.date = new Date()
    records.push(new_record)
    fs.writeFileSync('./public/cors_demo/' + sess.username + '/db/results.json', JSON.stringify(records), 'utf8')
  }
  cb(null, 'added')
}

exports.getJobStatus = function (user, jobId, cb) {
  var analyses = checkResults(user)
  for (var i = 0, len = analyses.length; i < len; i++) {
    var record = analyses[i]
    if (record.fileName == jobId) { //!= "") {
      if (record.jobStatus != '') {
        cb(null, record.jobStatus)
      } else {
        cb(null, 'running')
      }
      break
    }
  }
}

exports.updateUserResults = function (user, cb) {
  var analyses = checkResults(user)
  var joblist = importJobs()
  connectManta()

  // This will update the array
  function crossref(analyses, i, cb) {
    var jobrecord = false
    process.nextTick(function () {
      for (var j = 0, len = joblist.length; j < len; j++) {
        jobrecord = joblist[j]
        if ( analyses[i].fileName == jobrecord.jobid ) {
          analyses[i].jobStatus = jobrecord.state
          fs.writeFileSync('./public/cors_demo/' + user + '/db/results.json', JSON.stringify(analyses), 'utf8')
          jobrecord = true
          cb(null, jobrecord)
        }
      }
    })
    cb(null, jobrecord)
  }

  function checkManta(analyses, i, cb) {
    CLIENT.job(String(analyses[i].fileName), function (err, job) {
      if (err) {
        crossref(analyses, i, function (err, out) {
          if (out) {
          } else {
            analyses[i].jobStatus = 'error'
            fs.writeFileSync('./public/cors_demo/' + user + '/db/results.json', JSON.stringify(analyses), 'utf8')
          }
        })
      } else {
        if (job.stats.errors > 0) {
          job.state = 'error'
        }
        analyses[i].jobStatus = job.state
        fs.writeFileSync('./public/cors_demo/' + user + '/db/results.json', JSON.stringify(analyses), 'utf8')
      }
    })
  }

  process.nextTick(function () {
    for (var i = 0, len = analyses.length; i < len; i++) {
      var record = analyses[i]
      if (record.jobStatus == "" || record.jobStatus == 'running') {
        checkManta(analyses, i, function (err, answer) {
          return cb(null, null)
        })
      }
    }
    return cb(null, null)
  })
}

