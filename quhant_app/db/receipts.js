fs = require('fs')

// Import JSON array monitoring storage
function importStorageCosts () {
  if (!fs.existsSync('./public/db/storagebilling.temp')) {
    var StorageBilling = []
    fs.writeFileSync('./public/db/storagebilling.temp', JSON.stringify(StorageBilling), 'utf8')
  } else {
    var jsonStrA = fs.readFileSync('./public/db/storagebilling.temp')
    StorageBilling = JSON.parse(jsonStrA)
  }
  return StorageBilling
}

function userStorage (username) {
  if (!fs.existsSync('./public/cors_demo/'+ username + '/db/storage.json')) {
    var userStorage = []
    fs.writeFileSync('./public/cors_demo/'+ username + '/db/storage.json', JSON.stringify(userStorage), 'utf8')
  } else {
    var jsonStrA = fs.readFileSync('./public/cors_demo/'+ username + '/db/storage.json')
    userStorage = JSON.parse(jsonStrA)
  }
  return userStorage
}

exports.CalcUserStorage = function (user, cb) {
  var storage = importStorageCosts()
  var userInfo = userStorage(user)
  var totalBytes = 0
  var date = ''
  process.nextTick(function () {
    for (var i = 0, len = storage.length; i < len; i++) {
      var record = storage[i]
      if (record.username == user) {
        totalBytes = totalBytes + record.bytes
        date = record.date
      }
    }
    if (totalBytes < 1000) { 
      totalBytes = totalBytes
      unit = 'b'
      pricing = 0*totalBytes
    } else if (totalBytes > 1000 && totalBytes < 1000000) {
      totalBytes = totalBytes/1000
      unit = 'kb'
      pricing = 0*totalBytes
    } else if (totalBytes > 1000000 && totalBytes < 1000000000) {
      totalBytes = totalBytes/1000000
      unit = 'Mb'
      pricing = 0.000000000129*totalBytes
    } else if (totalBytes > 1000000000 && totalBytes < 1000000000000) {
      totalBytes = totalBytes/1000000000
      unit = 'Gb'
      pricing = 0.000000000129*totalBytes
    } else if (totalBytes > 1000000000000 && totalBytes < 1000000000000000) {
      totalBytes = totalBytes/1000000000000
      unit = 'Tb'
      pricing = 0.000000000129*totalBytes
      //email us
    }

    newRecord = {username: user, date: date, bytes: totalBytes.toFixed(2) + unit, estimate: pricing.toFixed(2)}
    userInfo.push(newRecord)
    fs.writeFileSync('./public/cors_demo/' + user + '/db/storage.json', JSON.stringify(userInfo), 'utf8')
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

exports.appendAnalysis = function (req, cb) {
  var analyses = checkJSON(req.session.username)
  new_record = {set_id: '', project_name: '', set_name: '', analyzed: 'true', analysis_id: '', analysisType: '', chargecode: '', analysis_date: '', inputs: 0, output: 0, jobStatus: '', estimate: 0}
  sess = req.session
  new_record.inputs = req.session.analysisinput
  new_record.set_id = sess.project_name + '/' + sess.set_name
  new_record.project_name = sess.project_name
  new_record.set_name = sess.set_name
  new_record.analysis_id = sess.job
  new_record.analysis_date = new Date()
  new_record.analysisType = req.session.analysisType
  if (new_record.analysisType === 'ANALYSIS') {
    new_record.estimate = (req.session.analysisinput * 0.87)
  } else {
    new_record.estimate = (req.session.analysisinput * 1.45)
  }
  new_record.chargecode = 'TEST'
  analyses.push(new_record)

  fs.writeFileSync('./public/cors_demo/' + sess.username + '/db/analyses.json', JSON.stringify(analyses), 'utf8')
  return cb(null, null)
}

