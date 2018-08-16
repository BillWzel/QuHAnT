var express = require('express')
var router = express.Router()

// The require listed below refers to its folder
// in models
router.use('/images', require('./images'))
router.use('/users', require('./users'))
router.use('/project', require('./project'))
router.use('/upload', require('./upload_controller'))
router.use('/results', require('./results'))
router.use('/analyze', require('./results')) // TODO:Replace this analyze term for easier development
router.use('/company', require('./company'))
router.use('/sample_project', require('./sample_project'))
// router.use('/socktest', require('./socktest'))

// Initialize session variables
router.get('/', function (req, res) {
  if (!req.session.username) {
    req.session.username = null 
    req.session.set_name = null 
    res.render('index')
  } else {
    res.render('users/signup_welcome')
  }
})

// Log user out by deleting session information
router.post('/logout', function (req, res) {
  req.session.destroy()
})

module.exports = router
