var express = require('express')
var bodyParser = require('body-parser')
var port = process.env.PORT || 80
var xmlparser = require('express-xml-bodyparser')
var session = require('express-session')
var path = require('path')
var nodemailer = require('nodemailer')
var fs = require('fs')
var logger = require('morgan')
var cookieparser = require('cookie-parser')
var access_logfile = fs.createWriteStream('./Monitoring/express-access.log', {flags: 'a'})
var helmet = require('helmet')
var https = require('https')
var ipfilter = require('express-ipfilter').IpFilter;
require('heapdump')

// Incorprate into requests http://scottksmith.com/blog/2014/09/04/simple-steps-to-secure-your-express-node-application/
 
//var csrf = require('csurf')

var app = require('express.io')()
app.http().io()

var ips = ['54.235.163.229','192.3.26.211','162.213.1.246', '82.80.249.211','83.208.252.31','85.73.176.118','85.93.218.204','69.58.178.58','148.153.8.138','202.46.50.83']
app.use(ipfilter(ips, {log: false}))

app.configure(function() {
  app.use(logger("default",{stream: access_logfile }))
})

// app.set('views', __dirname + '/views')
app.set('views', path.join(__dirname, '/views'))
app.engine('jade', require('jade').__express)
app.set('view engine', 'jade')

// app.use(express.static(__dirname + '/public'))
app.use(express.static(path.join(__dirname, '/public')))
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({extended: true, limit: '50mb', parameterLimit: 50000}))

// Session setting
var RedisStore = require('connect-redis')(session)
app.use(cookieparser())
app.use(session({
  store: new RedisStore({
    secure: true,
    httpOnly: true,
    host: 'localhost',
    port: 6379,
    db: 4,
    pass: 'hist0l0gy!sC00l',
    ttl: 1800  // Expires in 4 hours - this could cause some upload issues
  }),
  secret: 'histologyiscool'
}))

app.use(require('./controllers'))
app.use(xmlparser())
app.use(helmet())
//app.use(csrf())

//app.use(function(req, res, next) {
//  res.locals._csrf = req.csrfToken()
//  next()
//})

/*var ssl = {
  key: fs.readFileSync('/etc/letsencrypt/live/quhant.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/quhant.com/fullchain.pem'),
  ca: fs.readFileSync('/etc/letsencrypt/live/quhant.com/chain.pem')
}*/

app.set('trust proxy', true)
app.set('trust proxy', 'loopback')

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
  
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error)
    } else {
      console.log('Message sent: ' + info.response)
    }
  }) 
}) 

app.locals({
  site: "165.225.131.50",
  owner: "billwzel"
});

// https.createServer(ssl, app).listen(process.env.PORT || 8443)

app.get('*', function (req, res) {
  var sess = req.session
   // res.send('Everything is awesome! How did you get here!?', 404)
  if (!sess.username) {
    res.render('users/errors')
  } else {
    res.render('construction/errors')
  }
})
