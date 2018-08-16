// Code Review 01/31/17 - Daria Tarasova - Rance Nault
var fs = require('fs')
var sr = require('simple-random')

// Import the charge codes database
function checkCodes () {
  if (!fs.existsSync('./public/db/chargecodes.json')) {
    var ChargeCodes = [
      { Code: 'SampleDataSet', username: 'test', dateCreated: '', createBy: 'Rance', value: 0.00, dateExpired: '2050-01-01', description: 'Code for Sample Dataset', charges: 0, balance: 0}
    ]
    fs.writeFileSync('./public/db/chargecodes.json', JSON.stringify(ChargeCodes), 'utf8')
  } else {
    var jsonStr = fs.readFileSync('./public/db/chargecodes.json')
    ChargeCodes = JSON.parse(jsonStr)
  }
  return ChargeCodes
}

function giftCodes () {
    if (!fs.existsSync('./public/db/giftcodes.json')) {
    var ChargeCodes = [
      { giftCode:"SOT2017_Baltimore",purpose:"Marketing at the 2017 SOT annual meeting",createBy:"Rance",value:0.00,dateExpired:"2050-01-01",description:"SOT2017" }
    ]
    fs.writeFileSync('./public/db/giftcodes.json', JSON.stringify(ChargeCodes), 'utf8')
  } else {
    var jsonStr = fs.readFileSync('./public/db/giftcodes.json')
    ChargeCodes = JSON.parse(jsonStr)
  }
  return ChargeCodes
}

function chargeCodes (username) {
  var jsonStr = fs.readFileSync('./public/cors_demo/' + username + '/db/analyses.json')
  ChargeCodes = JSON.parse(jsonStr)
  return ChargeCodes
}

// EXPORTS
exports.createCCode = function (user, username, value, description) {
  var ChargeCodes = checkCodes()
  var CCode = sr()
  var createDate = new Date()
  var expireDate = (createDate.getFullYear() + 1) + '-' + (createDate.getMonth() + 1) + '-' + createDate.getDate()

  new_record = { Code: CCode, username: username, dateCreated: createDate, createBy: user, value: value, dateExpired: expireDate, description: description, charges: 0, balance: 0 }
  ChargeCodes.push(new_record)

  fs.writeFileSync('./public/db/chargecodes.json', JSON.stringify(ChargeCodes), 'utf8')

  return CCode

  //TODO: NEED TO VERIFY THAT IT DOESN'T EXIST
}

exports.findByCCode = function (CCode, cb) {
  var ChargeCodes = checkCodes()
    for (var i = 0, len = ChargeCodes.length; i < len; i++) {
      var record = ChargeCodes[i]
      if (record.Code === CCode) {
        return cb(null, record)
      }
    }
}

exports.findGiftCode = function (string, cb) {
  var GiftCodes = giftCodes()
  for (var i = 0, len = GiftCodes.length; i < len; i++) {
    var record = GiftCodes[i]
    if (record.giftCode === string) {
      return cb(null, record)
    }
  }
  return cb(null,'none')
}

exports.findByUser = function (username, cb) {
  var NewCodeRecord = checkCodes()
  var userListing = []
  for (var i = 0, len = NewCodeRecord.length; i < len; i++) {
    var record = NewCodeRecord[i]
    if (record.username === username) {
      userListing.push(record)
    }
  }
  return cb(null, userListing)
}

exports.findByDescription = function (username, description, cb) {
  var NewCodeRecord = checkCodes()
  for (var i = 0, len = NewCodeRecord.length; i < len; i++) {
    var record = NewCodeRecord[i]
    if (record.username === username && record.description === description) {
      return cb(null, true)
    }
  }
  return cb(null, false)
}

exports.crossRefCode = function (user, cb) {
  // Set databases as variables
  var analysisRecord = chargeCodes(user)
  var CCodeRecord = checkCodes()

  // Callback Function
  function display (record, i, user, totCharges) {
    if (totCharges >= CCodeRecord[i].charges) { // If new charges are greater than current charges
      CCodeRecord[i].charges = totCharges // replace the charge value of the record
      CCodeRecord[i].balance = CCodeRecord[i].value - totCharges
    }
    fs.writeFileSync('./public/db/chargecodes.json', JSON.stringify(CCodeRecord), 'utf8') // rewrite the database
  }

  function getAnalyses (record, j, user, callback) {
    //var analysisRecord = chargeCodes(user) // Get the analysis database for specific user
    //var pendingCharges
    process.nextTick(function () {
      var pendingCharges = 0
      for (var i = 0, len = analysisRecord.length; i < len; i++) {
        var arecord = analysisRecord[i] // This is a specific analysis record
        if (arecord.chargecode === record.Code) { // If the analysis was charged to this same code
          var estimate = arecord.estimate
          pendingCharges = pendingCharges + estimate // Add up the total charges
        }
      }
      callback(record, j, user, pendingCharges)
    })
  }


  // For each charge code belonging to a user
  process.nextTick(function () {
    for (var i = 0, len = CCodeRecord.length; i < len; i++) {
      var record = CCodeRecord[i]
      if (record.username == user) { // If the charge code username matched the logged in username
        var currrentRecord = record
        getAnalyses(record, i, user, display) // Lookup analyses charge to the code
      }
    }
    return cb(null, '')
  })
}

exports.checkBalance = function (CCode, estCost, cb) {
  var ChargeCodes = checkCodes()
  for (var i = 0, len = ChargeCodes.length; i < len; i++) {
    var record = ChargeCodes[i]
    var NewBalance = record.charges + estCost
    if (record.Code == CCode && NewBalance <= record.value) {
      return cb(null, true)
    } else if (record.Code == CCode && NewBalance > record.value) {
      return cb(null, false)
    }
  }
}
