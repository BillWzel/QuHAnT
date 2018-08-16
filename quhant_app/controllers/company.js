// Code Review 10/13/16 - Rance Nault
var express = require('express')
var router = express.Router()
var nodemailer = require('nodemailer')
var request = require('request')
var company = require('../models/company')

// ROUTES
router.get('/about_us', function (req, res) {
  var sess = req.session
  if (!sess.username) {
    res.render('users/login')
  } else {
    res.render('company/about_us')
  }
})

router.get('/faq', function (req, res) {
  var sess = req.session
  if (!sess.username) {
    res.render('users/login')
  } else {
    res.render('company/faq')
  }
})

router.get('/contact_us', function (req, res) {
  var sess = req.session
  if (!sess.username) {
    res.render('users/login')
  } else {
    res.render('company/contact_us', {success: ''})
  }
})

// Send an e-mail to the QuHAnT team.
router.post('/contacted', function (req, res) {
  // TODO: This should be a model
  var newdat=req.body.formdata
  var sess = req.session
  var SenderName = newdat[1].value
  var SenderSubject = 'QuHAnT contact request: ' + newdat[3].value
  var SenderMessage = newdat[4].value
  var SenderEmail = newdat[2].value
  var checkdata = newdat[0].value

  company.checkcaptcha(req,res,function(err, data) {
    if (data == 'pass' && checkdata == '0!lR3D0') {
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
        text: 'MESSAGE FROM CONTACT PAGE:\nEmail Address: ' + SenderEmail + '\nName: ' + SenderName + '\nSubmitter IP address: ' + req.connection.remoteAddress + '\n\nMessage: ' + SenderMessage + '\n\n---------------------------------------\nSession Information:\n\nUsername: ' + JSON.stringify(sess)
      }
      // Send e-mail
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          return console.log(error)
        } else {
          console.log('Message sent: ' + info.response)
          res.end()
        }
      })
    } else {
      console.log('CAPTCHA NOT CONFIRMED.. WHY???')
    }
  })
})

module.exports = router
