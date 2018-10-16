// Code Review 07/21/16 Daria Tarasova - Anna Schmidt - Jingyi Liu - Rance Nault
// Modules to import
var db = require('../db') // User database
var express = require('express')
var router = express.Router()
var user = require('../models/user')
var set = require('../models/sets')
var manta = require('../models/upload_model')
var nodemailer = require('nodemailer')
var sr = require('simple-random')
var fs = require('fs')
var del = require('../models/delete')
var spawn = require('child_process').spawn

// ROUTES//
router.get('/signup_welcome', function (req, res) {
  var sess = req.session
  if (!sess.username) {
    res.render('users/login')
  } else {
    db.results.updateUserResults(sess.username, function (err, results) {
      db.analyses.updateUserTable(sess.username, function (err, out) {
        db.sets.updateUserSets(sess.username, function(err, out) {
          fs.mkdirSync('./public/cors_demo/'+sess.username+'/Monitoring/')
          res.render('users/signup_welcome', {username: sess.displayName})
        })
      })
    })
  }
})

router.get('/login_welcome', function (req, res) {
  var sess = req.session
  if (!sess.username) {
    res.render('users/login')
  } else {
    db.results.updateUserResults(sess.username, function (err, results) {
      db.analyses.updateUserTable(sess.username, function (err, out) {
        set.create_proj_table(req, function (err, projectTable) {
          set.create_results_table(req, function (err, resultsTable) {
            set.jsonToview('public/cors_demo/' + sess.username + '/db/analyses.json', function (err, receipts) {
              set.jsonToview('public/cors_demo/' + sess.username + '/db/storage.json', function (err, storage) {
                user.add_code_to_session(req, function (err, output) {})
                res.render('users/login_welcome', {username: sess.username, projTable: projectTable, resTable: resultsTable, analyses: receipts, storage: storage})
              })
            })
          })
        })
      })
    })
  }
})

// Brings user to login page
router.get('/login', function (req, res) {
  var sess = req.session
  // Login to start new session
  res.render('users/login', {success: ''})
})

// Bring user to signup page
router.get('/signup', function (req, res) {
  res.render('users/signup', {success: '', request: req})
})

// Receives login request
router.post('/login_welcome', function (req, res) {
  var sess = req.session
  // Verifies credentials
  user.login(req.body, function (err, accept) {
    if (err) {
      console.log(err)
    }
    if (accept == false) {
      res.render('users/login', {success: 'Login Failed. Check username and password and Try Again. If this is your first time to login to QuHAnT, note that a validation e-mail was sent to your e-mail.'})
    } else {
      sess.accept = true
      // Creating session for user
      sess.username = req.body.username
      // Redirecting user to page, ONLY WORKS FOR CREATING PROJECT PAGE
      if (sess.redirect) {
        res.render(sess.redirect, sess.parameters)
      } else {
        // Direct user to welcome page
        var senderMessage = 'Log In Information: \n\n req.body: \n' + JSON.stringify(req.body) + '\n\n\nSession Information: \n' + JSON.stringify(req.session)
        user.sendmail(sess.username, 'Log In Information', senderMessage, 'quhant@gmail.com', req, function(err, sent) {
          if (err) { console.log(err)}
        })

        db.results.updateUserResults(sess.username, function (err, results) {
          db.analyses.updateUserTable(sess.username, function (err, out) {
            set.create_proj_table(req, function (err, projectTable) {
              set.create_results_table(req, function (err, resultsTable) {
                set.jsonToview('public/cors_demo/' + sess.username + '/db/analyses.json', function (err, receipts) {
                    set.jsonToview('public/cors_demo/' + sess.username + '/db/storage.json', function (err, storage) {
                    user.add_code_to_session(req, function (err, output) {})
                    res.render('users/login_welcome', {username: sess.username, projTable: projectTable, resTable: resultsTable, analyses: receipts, storage: storage})
                  })
                })
              })
            })
          })
        })
      }
    }
  })
})

// Verifies a username
router.post('/check_username', function (req, res) {
  user.checkUsername(req, res, function (err, res) {
    if (err) {
      console.log(err)
      res.render('constructions/errors')
    }
  })
  res.end()
})

// Creates a new user
router.post('/newUser', function (req, res) {
  var sess = req.session
  var UsernameCheck = ''
  var PasswordCheck = ''
  var EmailCheck = ''

  function validation (callback) {
    db.users.findByUsername(req.body.username, function (err, userName) {
      if (err) {
        console.log(err)
        res.render('construction/errors')
      }
      user.checkEmail(req, function (err, emailExist) {
        if (err) {
          console.log(err)
          res.render('construction/errors')
        }
        user.passwordMatch(req, function (err, matchExist) {
          if (err) {
            console.log(err)
            res.render('construction/errors')
          }
          if (!userName) {
            UsernameCheck = true
          } else {
            UsernameCheck = false
          }
          if (emailExist === false) {
            EmailCheck = true
          } else {
            EmailCheck = false
          }
          if (matchExist === true) {
            PasswordCheck = true
          } else {
            PasswordCheck = false
          }
          callback()
        })
      })
    })
  }

  function evaluation () {
    if (PasswordCheck === false) {
      res.render('users/signup', {success: "Passwords Don't Match", request: req})
    } else if (UsernameCheck === false) {
      res.render('users/signup', {success: 'Username Is Not Available', request: req})
    } else if (EmailCheck === false) {
      res.render('users/signup', {success: 'Email Is Already in Use. Log In With Existing Email Or Sign Up With A Different Email.', request: req})
    } else if (req.body.email != req.body.confirm_email) {
      res.render('users/signup', {success: "Emails Don't Match", request: req})
    } else {
      var userArray = {username: '', password: '', current_code: '', displayName: '', emails: '', company: '', address_1: '', address_2: '', city: '', state: '', zip: '', country: '', phone: ''}


      userArray.username = req.body.username
      userArray.password = req.body.password
      userArray.displayName = req.body.firstName
      userArray.email = req.body.email
      userArray.company = req.body.company
      userArray.address1 = req.body.address1
      userArray.address2 = req.body.address2
      userArray.city = req.body.city
      userArray.state = req.body.state
      userArray.zip = req.body.zip
      userArray.country = req.body.country
      userArray.phone = req.body.phone
      if (req.body.mailing_list) {
        userArray.newsletter = 'y'
      } else {
        userArray.newsletter = 'n'
      }
 
      var randomString = sr()
      fs.writeFileSync('public/db/'+randomString+'_sign_up.json', JSON.stringify(userArray), 'utf8')
      var senderMessage = 'Sign Up Information: \n\n req.body: \n' + JSON.stringify(req.body) + '\n\n\nSession Information: \n' + JSON.stringify(req.session)
      user.sendmail(req.body.firstName, 'Sign Up Information', senderMessage, 'quhant@gmail.com', req, function(err, sent) {
       if (err) { console.log(err)} 
      })
      
      domain = fs.readFileSync('public/domain.txt').toString()

      var message = 'Hi ' +req.body.firstName + ',\nWelcome to QuHAnT. Follow the link below to verify your email.\n' + app.locals.site + '/users/' +randomString+' \n\nHave fun,\nThe QuHAnT Team.' 
      user.sendmail(req.body.firstName, "Confirm Your Email for QuHAnT", message, req.body.email, req, function(err, sent) {
        if (err) {console.log(err)}
        res.render('users/signup', {success: 'We have sent you an email to confirm your account. Please check your inbox.', request: req})
      })
    }      


  }

  function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  if (validateEmail(req.body.email) && !(req.body.username == '' || req.body.username == null) && !(req.body.password == '' || req.body.password == null)) {
    validation(evaluation)
  } else {
    res.render('users/signup', {success: "Invalid username, email, or password!", request: req})
  }
})
// Send user to password recovery page
router.get('/password_recovery', function (req, res) {
  res.render('users/password_recovery', {success: ''})
})

router.post('/email_recover_password', function (req, res) {
  sess = req.session
  user.checkEmail(req, function (err, emailExist) {
    if (err) {
      console.log(err)
      res.render('construction/errors')
    }
    if (emailExist == false) {
      res.render('users/password_recovery', {success: ' Email is not in our database. Try signing up first'})
    } else {
      var randomString = sr()

      user.getInfoFromEmail(req, randomString, function (err, file) {
        if (err) {
          console.log(err)
          res.render('construction/errors')
        }
      })

      domain = fs.readFileSync('public/domain.txt').toString()

      var link = app.locals.site + '/users/password_reset/' + randomString
      // Node Mailer module used to send email
      var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'quhant@gmail.com',
          pass: 'MTRAC2016!'
        }
      })
      var mailOptions = {
        from: '"QuHAnT" <quhant@gmail.com>',
        to: req.body.email,
        subject: 'Recover Password',
        text: 'Hello,\n Please use the following link to reset your password: ' + link + '\n The link expires an hour after it has been requested. \n If you did not request to reset your password, feel free to ignore it or contact us.\n\n Thanks, \n QuHAnT'
      }

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          return console.log(error)
        } else {
          console.log('Message sent: ' + info.response)
        }
      })
      res.render('users/password_recovery', {success: 'An e-mail has been sent to ' + req.body.email})
    }
  })
})

router.get('/password_reset/:random_string', function (req, res) {
  sess = req.session
  var random_string = req.params.random_string
  user.get_user_from_randomString(req, random_string, function (err, username) {
    sess.username = username
    res.render('users/reset_password', {success: '', user: username})
  })
})

router.post('/reset_password', function (req, res) {
  user.passwordMatch(req, function (err, matchExist) {
    if (err) {
      console.log(err)
      res.render('construction/errors')
    } if (matchExist == true) {
      user.password_reset(req, function (err, reset) {
        if (err) {
          console.log(err)
          res.render('construction/errors')
        } else {
          res.render('users/reset_password', {success: 'Successfully changed password', user: sess.username})
        }
      })
    } else {
      res.render('users/reset_password', {success: 'Passwords Need to Match. Try Again', user: sess.username})
    }
  })
})

router.get('/billing', function (req, res) {
  sess = req.session
  if (!sess.username) {
    res.render('users/login')
  } else {
    user.get_user_array(req, function (err, record) {
      db.chargecodes.crossRefCode(sess.username, function (err, output) {
        db.chargecodes.findByUser(sess.username, function (err, ArrayOut) {
          res.render('users/billing', {user_array: record, charge_array: ArrayOut})
        })
      })
    })
  }
})

router.post('/check_email', function (req, res) {
  sess = req.session
  var email = req.body.email
  user.checkEmail(req, function (err, exist) {
    if (err) {
      console.log(err)
      res.render('construction/errors')
    } else if (exist == false) {
      req.io.broadcast('email_exist', {output: 'no'})
    } else if (exist == true) {
      req.io.broadcast('email_exist', {output: 'exist'})
    }
  })
})

router.post('/change_password', function (req, res) {
  user.password_reset(req, function (err, reset) {
    if (err) {
      console.log(err)
      res.render('construction/errors')
    } else {
      req.io.broadcast('feedback', {output: 'success'})
    }
    res.end()
  })
})

router.post('/change_email', function (req, res) {
  user.reset_email(req, function (err, reset) {
    if (err) {
      console.log(err)
      res.render('construction/errors')
    } else {
      req.io.broadcast('email_edit', {output: 'changed'})
    }
    res.end()
  })
})

router.post('/change_address', function (req, res) {
  user.edit_address(req, function (err, output) {
    if (err) {
      console.log(err)
      res.render('construction/errors')
    } else {
      req.io.broadcast('address_change', {out: 'changed'})
    }
  })
})


router.post('/change_code', function (req, res) {
  user.edit_code(req, function (err, output) {
    if (err) {
      console.log(err)
      res.render('construction/errors')
    }
  })
  res.end()
})

router.get('/contact', function(req, res) {
  res.render('users/contact', {success: ''})
})

/*
router.post('/contacted', function(req, res) {
  var SenderName = req.body.name
  var SenderSubject = 'QuHAnT contact request: ' + req.body.subject
  var SenderMessage = req.body.message
  var SenderEmail = req.body.email
  // sender details
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
    to: 'quhant@gmail.com',
    subject: SenderSubject,
    text: 'MESSAGE FROM NON-SESS CONTACT PAGE:\nEmail Address: ' + SenderEmail + '\nName: ' + SenderName + '\n\nMessage: ' + SenderMessage + '\n\n'
  }
  // Send e-mail
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error)
    } else {
      console.log('Message sent: ' + info.response)
    }
  })
  res.render('users/contact', {success: 'Sent'})
})
*/
// Get giftcode page
router.get('/codeinput', function(req, res) {
  sess = req.session
  if (!sess.username) {
    res.render('users/login')
  } else {
  res.render('users/giftcode')
  }
})

// Check gift code and create charge code
router.post('/GiftCode', function(req, res) {
  user.validategift(req, res, function (err, res) {
    if (err) {
      console.log(err)
      res.render('constructions/errors')
    }
  })
  res.end()
})

// Delete Project
router.post('/DeleteProject', function(req, res) {
  var shortPath = req.session.username + '/' + req.body.project
  var randomString = sr()
  //fs.writeFileSync('public/db/'+randomString+'_deleteproj.json', JSON.stringify(shortPath), 'utf8')
  db.sets.deleteProject(req.session.username, req.body.project, function (err, out1) {
    db.analyses.deleteAnalysisProject(req.session.username, req.body.project, function(out) {
      del.AddMantaIgnore(shortPath, function (err, out) {
        var deploySh = spawn('sh', [process.env.HOME + '/quhant-joyent/quhant_app/delete_rem_copy.sh', shortPath])
        res.end()
      })
    })
  })
})

router.post('/DeleteSet', function(req, res) {
  setPath = req.body.set
  setDetails = setPath.split('/')
  req.body.project = setDetails[0]
  req.body.set = setDetails[1]
  var setPaths = []
  var shortPath = req.session.username + '/' + req.body.project + '/' + req.body.set
  db.sets.deleteSet(req.session.username, req.body.project, req.body.set, function (err, out1) {
    db.analyses.deleteAnalysisSet(req.session.username, req.body.project, req.body.set, function(err, out) {
        var deploySh = spawn('sh', [process.env.HOME + '/quhant-joyent/quhant_app/delete_rem_copy.sh', shortPath])
      res.end()
    })
  })
})


// Keep at end always
router.get('/:userstring', function(req, res) {
  var sess = req.session
  
  if (!fs.existsSync('public/db/'+req.params.userstring+'_sign_up.json')) {
    if (!sess.username) {
      res.render('users/errors') 
    } else {
      res.render('construction/errors')
    }
  } else {
    var getArray = fs.readFileSync('public/db/'+req.params.userstring+'_sign_up.json')
    var userArray = JSON.parse(getArray)
    db.users.newUser(req, userArray, function (err, cb) {
      if (err) {
        console.log(err)
        res.render('construction/errors')
      }
    })
    sess.username = userArray.username
    sess.displayName = userArray.displayName
    manta.connect('1234', function (err, output) {
      if (err) {
        console.log(err)
   
      }
      manta.create_dir(req, sess.username, function (err, cb) {
        if (err) {
          console.log(err)
          res.render('construction/errors')
        }
        manta.create_dir(req, sess.username + '/db', function (err, cb) {
          if (err) {
            console.log(err)
            res.render('construction/errors')
          }
        })
        manta.create_dir(req, sess.username + '/results', function (err, cb) {
          if (err) {
            console.log(err)
            res.render('construction/errors')
          }
        })
      })

      fs.readdir('public/cors_demo/sampletest/', function (err, list) {
        if (err) {
          console.log(err)
        }
        list.forEach(function (filename) {
        if (fs.statSync('public/cors_demo/sampletest/' + filename).isDirectory()) {
          if (!/db|results|.db|.results/.test(filename)) {
            fs.symlinkSync('public/cors_demo/sampletest/' + filename,'public/cors_demo/' + sess.username + '/' + filename)
          }
        }
        })
      })
    })

    db.analyses.userSetUp(sess.username, function (err, cb) {
      if (err) {
        console.log(err)
        res.render('construction/errors')
      }
    })
    fs.writeFileSync('./public/cors_demo/'+sess.username+'/db/ignore_manta_to_local.sync', '.json ')
    fs.writeFileSync('./public/cors_demo/'+sess.username+'/db/ignore_manta_to_manta.sync', '')
    fs.writeFileSync('./public/cors_demo/'+sess.username+'/results/ignore_manta_to_manta.sync', '.jpeg .txt metadata.csv .out.csv .R .RData')
    fs.writeFileSync('./public/cors_demo/'+sess.username+'/results/ignore_manta_to_local.sync', '')
    var code = db.chargecodes.createCCode('Default', sess.username, 0, 'Sample Dataset Code')
    db.users.change_current_code(req, code, function (err, output) {
      if (err) {
        console.log(err)
        res.render('construction/errors')
      }
      sess.CCode = code
      res.redirect('users/signup_welcome')
    })
  }
})

module.exports = router
