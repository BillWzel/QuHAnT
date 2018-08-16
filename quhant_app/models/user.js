// Code review 02/03/17 Daria Tarasova - Rance Nault

var db = require('../db')
var express = require('express')
var nodemailer = require('nodemailer')
var manta = require('manta')
var app = express()

// Verifies the username and password
exports.login = function (credentials, cb) {
  db.users.findByUsername(credentials.username, function (err, user) {
    if (err) { return cb(err) }
    if (!user) { return cb('user does not exist', false) }
    if (user.password != credentials.password) { return cb('wrong password', false) }

    cb(null, credentials.username)
  })
}

exports.checkUsername = function (req, res, cb) {
  var username = req.body.user
  db.users.findByUsername(username, function (err, user) {
    if (err) { return cb(err) }
    if (!user) {
      res.setHeader('content-type', 'text/html')
      res.writeHead(200)
      res.write('yes')
    } else {
      res.setHeader('content-type', 'text/html')
      res.writeHead(200)
      res.write('no')
    }

    cb(null, res)
  })
}

exports.checkEmail = function (req, cb) {
  var email = req.body.email
  db.users.findByEmail(email, function (err, mail) {
    if (err) { cb(err) }
    if (!mail) { cb(null, false) }
    else { cb(null, true) }
  })
}

exports.passwordMatch = function (req, cb) {
  var firstPassword = req.body.password
  var secondPassword = req.body.confirmPassword

  if (firstPassword == secondPassword) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

exports.getInfoFromEmail = function(req, randomString, cb) {
  db.users.saveInfoFromEmail(req, randomString, function(err, mail) {
    if (err) { cb(err) }
    else { cb(null, null) }
  })
}

exports.get_user_from_randomString = function(req, random_string, cb) { 
  if (fs.existsSync('public/db/' + random_string + '_password_recovery.json')) {
    var user = fs.readFileSync('public/db/' + random_string + '_password_recovery.json').toString().split('\n')
    if( user[1] >= new Date().getTime()) {
      cb(null, user[0])    
    } else {
      cb(null, 'expired')
    }
  } else {
    cb(null, 'expired')
  }
}

exports.password_reset = function(req, cb) {
  var password = req.body.password
  db.users.reset_password(sess.username, password, function(err, reset) {
    if (err) { cb(err) }
    else { cb(null, null) }
  })
}

exports.get_user_array = function(req, cb) {
  sess = req.session
  db.users.findByUsername(sess.username, function(err, user) {
    if (err) {return cb(err) }
    cb(null, user)
  })
}

exports.reset_email = function(req, cb) {
  sess = req.session
  var email = req.body.email
  db.users.change_email(sess.username, email, function(err, output) {
    if (err) { return(cb(err))}
     cb(null,null)
  })
}

exports.edit_address = function(req, cb) {
  db.users.change_address(req, function(err, output) {
    if (err) {return(cb(err))}
    cb(null, null)
  })
}

exports.edit_code = function(req, cb) {
  var code = req.body.code
  db.users.change_current_code(req, code, function(err, output) {
    if (err) {return(cb(err))}
    cb(null, null)
  })
}

exports.add_code_to_session = function(req, cb) {
  var sess = req.session

  var userArray = fs.readFileSync('public/db/users.json')
  var array_user = JSON.parse(userArray)
  for (i in array_user) {
    if (array_user[i].username == sess.username) {
      sess.CCode = array_user[i].current_code
      cb(null,null)
    }
  }
  cb(null,null)
}

exports.sendmail = function(SenderName, SenderSubject, SenderMessage, SenderEmail, req, cb) {
  var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'quhant@gmail.com',
      pass: 'MTRAC2016!'
    }
  })
  // Email content
  var mailOptions = {
    from: '"QuHAnT" <quhant@gmail.com>',
    to:  SenderEmail,
    subject: SenderSubject,
    text: SenderMessage 
  }
  // Send e-mail
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error)
    } else {
      cb(null,null)
    }
  })  
}

exports.validategift = function (req, res, cb) {
  var string = req.body.giftcode
  db.chargecodes.findGiftCode(string, function(err, gift) {
    if (err) {console.log(err)}
    if (gift == 'none') { 
      res.setHeader('content-type', 'text/html')
      res.writeHead(200)
      res.write('false')
    } else {
      db.chargecodes.findByDescription(req.session.username, gift.description, function(err, status) {
        if (status) {
          res.setHeader('content-type', 'text/html')
          res.writeHead(200)
          res.write('false')
        } else {
          res.setHeader('content-type', 'text/html')
          res.writeHead(200)
          res.write('true')
          var newCode = db.chargecodes.createCCode(gift.createBy,req.session.username, gift.value, gift.description)
          req.session.CCode = newCode
          db.users.change_current_code(req, newCode, function(err, output) {
            if (err) {return(cb(err))}
            cb(null, null)
          })
        }
      })
     }
     cb(null, res)
  })
}

exports.add_proj_to_json = function (req, imgs, type, cb) {
  db.sets.AppendProj(req, imgs, type, function(err, add) {
  if (err) {
    cb(err)
  } 
    cb(null, add)
  })
}
