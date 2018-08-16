var express = require('express')
var bodyParser = require('body-parser')
var port = process.env.PORT || 5000
var xmlparser = require('express-xml-bodyparser')
var session = require('express-session')
var path = require('path')
var nodemailer = require('nodemailer')
var fs = require('fs')
var logger = require('morgan')
var cookieparser = require('cookie-parser')
var access_logfile = fs.createWriteStream('./access.log', {flags: 'a'})

var app = require('express.io')()
app.http().io()

app.configure(function() {
  app.use(logger({stream: access_logfile }))
})


// app.set('views', __dirname + '/views')
app.set('views', path.join(__dirname, '/views'))
app.engine('jade', require('jade').__express)
app.set('view engine', 'jade')

// app.use(express.static(__dirname + '/public'))
app.use(express.static(path.join(__dirname, '/public')))
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({extended: true, limit: '50mb', parameterLimit: 50000}))
//app.use(session({ secret: 'keyboard cat' }))

// NEW
var RedisStore = require('connect-redis')(session)
app.use(cookieparser())
app.use(session({
  store: new RedisStore({
    host: 'localhost',
    port: 6379,
    db: 2,
    //pass: 'RedisPASS',
    ttl: 14400 // Expires in 4 hours - this could cause some upload issues
  }),
  secret: 'histologyiscool'
}))
// NEW

app.use(require('./controllers'))
app.use(xmlparser())


app.listen(port, function () {
  console.log('Listening on port ' + port)

  date = new Date()
  var nohup_Ar = fs.readFileSync('nohup.out').toString().split('\n')
  var nohupArray = nohup_Ar.splice(nohup_Ar.length - 100)
  var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'quhant@gmail.com',
      pass: 'MTRAC2016!'
    }
  })
  var mailOptions = {
    from: '"QuHAnT" <quhant@gmail.com>',
    to: 'quhant@gmail.com',
    subject: 'App Restarted',
    text: 'App Restarted on ' + date + '\n' + nohupArray
  }
  /* */
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error)
    } else {
      console.log('Message sent: ' + info.response)
    }
  }) 
  /* */
}) 

app.get('*', function (req, res) {
  var sess = req.session
   // res.send('Everything is awesome! How did you get here!?', 404)
  if (sess.username == null) {
    res.render('users/errors')
  } else {
    res.render('construction/errors')
  }
})
