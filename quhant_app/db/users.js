fs = require('fs')
function checkUsers () {
  if (!fs.existsSync('./public/db/users.json')) {
    var records = [
      { id: 1, username: 'jack', password: 'secret', current_code: '', displayName: 'Jack', emails: 'jack@example.com', company: '', address_1: '123 Smith Ave', address_2: '', city: 'Chicago', state: 'IL', zip: '112233', country: 'US', phone: '8675309', newsletter: 'y'},
     { id: 2, username: 'jill', password: 'birthday', current_code: '', displayName: 'Jill', emails: 'jill@example.com', company: '', address_1: '123 Smith Ave', address_2: '', city: 'New York', state: 'NY', zip: '1425', country: 'US', phone: '123456789', newsletter: 'n'},
     { id: 3, username: 'guest', password: 'guest', current_code: '', displayName: 'Guest', emails: 'quhant@gmail.com', company: '', address_1: '1 Doe Rd', address_2: '11 Silicon Valley', city: 'San Francisco', state: 'CA', zip: '1234', country: 'US', phone: '0987654321', newsletter: 'y'}
    ]
    fs.writeFileSync('./public/db/users.json', JSON.stringify(records), 'utf8')
  } else {
    var jsonStr = fs.readFileSync('./public/db/users.json')
    records = JSON.parse(jsonStr)
  }
  return records
}
exports.findById = function (id, cb) {
  var records = checkUsers()
  process.nextTick(function () {
    var idx = id - 1
    if (records[idx]) {
      cb(null, records[idx])
    } else {
      cb(new Error('User ' + id + ' does not exist'))
    }
  })
}
exports.findByUsername = function (username, cb) {
  var records = checkUsers()
  process.nextTick(function () {
    for (var i = 0, len = records.length; i < len; i++) {
      var record = records[i]
      if (record.username === username) {
        return cb(null, record)
      }
    }
    return cb(null, null)
  })
}
exports.findByEmail = function (email, cb) {
  var records = checkUsers()
  process.nextTick(function () {
    for (var i = 0, len = records.length; i < len; i++) {
      var record = records[i]
      if (record.emails === email) {
        return cb(null, record)
      }
    }
    return cb(null, null)
  })
}
exports.newUser = function (req, userArray, cb) {
  var records = checkUsers()
  new_record = { id: records.length + 1, username: '', password: '', current_code: '', displayName: '', emails: '', company: '', address_1: '', address_2: '', city: '', state: '', zip: '', country: '', phone: '', newsletter: ''}
  if (userArray == null) {
    new_record.username = req.body.username
    new_record.password = req.body.password
    new_record.displayName = req.body.firstName
    new_record.emails = req.body.email
    new_record.company = req.body.company
    new_record.address_1 = req.body.address1
    new_record.address_2 = req.body.address2
    new_record.city = req.body.city
    new_record.state = req.body.state
    new_record.zip = req.body.zip
    new_record.country = req.body.country
    new_record.phone = req.body.phone
    if (req.body.mailing_list) {
      new_record.newsletter = 'y'
    } else {
      new_record.newsletter = 'n'
    }
    records.push(new_record)
  } else {
    new_record.username = userArray.username
    new_record.password = userArray.password
    new_record.displayName = userArray.displayName
    new_record.emails = userArray.email
    new_record.company = userArray.company
    new_record.address_1 = userArray.address1
    new_record.address_2 = userArray.address2
    new_record.city = userArray.city
    new_record.state = userArray.state
    new_record.zip = userArray.zip
    new_record.country = userArray.country
    new_record.phone = userArray.phone
    new_record.newsletter = userArray.newsletter
    records.push(new_record)
  }
  fs.writeFileSync('./public/db/users.json', JSON.stringify(records), 'utf8')
  return cb(null, 'user successfully created')
}
exports.saveInfoFromEmail = function (req, randomString, cb) {
  sess = req.session
  var records = checkUsers()
  process.nextTick(function () {
    for (var i = 0; i < records.length; i++) {
      var record = records[i]
      if (record.emails == req.body.email) {
        sess.username = record.username
        var time = new Date().getTime() + 3600000
        var dataArray = [sess.username, time]
        fs.writeFileSync('./public/db/' + randomString + '_password_recovery.json', dataArray.join('\n'))
      }
    }
  })
  return (cb(null, null))
}
exports.reset_password = function (username, password, cb) {
  var records = checkUsers()
  process.nextTick(function () {
    for (var i = 0; i < records.length; i++) {
      var record = records[i]
      if (record.username == sess.username) {
        record.password = password
        records.splice(i, 1)
        records.push(record)
        fs.writeFileSync('./public/db/users.json', JSON.stringify(records), 'utf8')
        return (cb(null, null))
      }
    }
  })
}
exports.change_email = function (username, email, cb) {
  var records = checkUsers()
  process.nextTick(function () {
    for (var i = 0; i < records.length; i++) {
      var record = records[i]
      if (record.username == sess.username) {
        record.emails = email
        records.splice(i, 1)
        records.push(record)
        fs.writeFileSync('./public/db/users.json', JSON.stringify(records), 'utf8')
        return (cb(null, null))
      }
    }
  })
}
exports.change_address = function (req, cb) {
  var records = checkUsers()
  process.nextTick(function () {
    for (var i = 0; i < records.length; i++) {
      var record = records[i]
      if (record.username == sess.username) {
        record.address_1 = req.body.add1
        record.address_2 = req.body.add2
        record.city = req.body.city
        record.state = req.body.state
        record.zip = req.body.zip
        record.country = req.body.country
        record.phone = req.body.phone
        records.splice(i, 1)
        records.push(record)
        fs.writeFileSync('./public/db/users.json', JSON.stringify(records), 'utf8')
        return (cb(null, null))
      }
    }
  })
}
exports.change_current_code = function (req, code, cb) {
  var sess = req.session
  req.session.CCode = code
  var records = checkUsers()
  process.nextTick(function () {
    for (var i = 0; i < records.length; i++) {
      var record = records[i]
      if (record.username == sess.username) {
        record.current_code = code
        records.splice(i, 1)
        records.push(record)
        fs.writeFileSync('./public/db/users.json', JSON.stringify(records), 'utf8')
        return (cb(null, null))
      }
    }
  })
}
exports.change_newsletter_status = function(req, cb) {
  var sess = req.session
  var records = checkUsers()
  if (req.body.subscribe_bool == true) {
    newsletter = 'y'
  } else {
    newsletter = 'n'
  }
  process.nextTick(function() {
    for (var i = 0; i < records.length; i++) {
      var record = records[i]
      if (record.username == sess.username) {
        record.newsletter = newsletter
        records.splice(i, 1)
        records.push(record)
        fs.writeFileSync('./public/db/users.json', JSON.stringify(records), 'utf8')
        return (cb(null, null))
      }
    }
  })
}

exports.delete_user = function(user, cb) {
  var records = checkUsers()
  var new_records = []
  process.nextTick(function() {
    for (var i = 0; i < records.length; i++) {
      var record = records[i]
      if (record.username != user) {
        new_records.push(record) 
      }
    }
    fs.writeFileSync('./public/db/users.json', JSON.stringify(new_records), 'utf8')
    return cb(null,null)
  })
}
