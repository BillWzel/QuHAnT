// Code Review 07/21/16 Daria Tarasova - Anna Schmidt - Jingyi Liu

var express = require('express')
var fs = require('fs')
var router = express.Router()
var user = require('../models/user')
var manta = require('../models/upload_model')
var db = require('../db')
var set = require('../models/sets')

// Checking if user is logged in and leads to project page
router.get('/project', function (req, res) {
  var sess = req.session
  if (!sess.username) {
    sess.parameters = {username: sess.username}
    res.render('users/login')
  } else {
    sess.project_name = null
    sess.set_name = null
    user.add_code_to_session(req, function (err, output) {})
    db.chargecodes.crossRefCode(sess.username, function (err, out) {
      if (err) { console.log(err) }
      // Number "1" is the  padding between remaining money and what we allow for next analysis (e.g. don't allow to create project if less than 1$ remaining. 
      db.chargecodes.checkBalance(sess.CCode, 1, function (err, answer) {
        res.render('project/project', {success: '', storageStatus: answer})
      })
    })
  }
})

// Creates a project
router.post('/create_project', function (req, res) {
  var sess = req.session
  manta.connect('1234', function (err, output) {
    if (err) {
      console.log(err)
      res.render('constructions/errors')
    }
  })
  sess.project_name = req.body.project_name
  sess.set_name = null

  if (sess.project_name.indexOf('(') > -1 || sess.project_name.indexOf(')') > -1) {
    res.render('project/project', {success: 'Recommended that parentheses are not present in project aname'})
  } else if (sess.project_name.indexOf(' ') > -1) {
    res.render('project/project', {success: 'Recommended that spaces are not present in  project name.'})
  } else if (/[^A-Za-z0-9-_]/.test(sess.project_name)) {
    res.render('project/project', {success: 'Recommended that punctuation is not present in project name.'})
  } else if (fs.existsSync('public/cors_demo/' + sess.username + '/' + sess.project_name)) {
    res.render('project/project', {success: 'Project already exists. Please try a new name.'})
  } else {
    function CreateDir (callback) {
      sess.file_name = sess.project_name + '_original.set'
      manta.create_file(req, sess.project_name, sess.file_name, null, function (err, cb) {
        if (err) {
          console.log(err)
          res.render('constructions/errors')
        }
      })
      user.add_proj_to_json(req, 0, 'project', function (err, cb) {
        if (err) {
          console.log(err)
          res.render('constructions/errors')
        }
      })
      // TODO: Create set timeout
      setTimeout(function () {
        var DirName = sess.username + '/' + sess.project_name
        manta.create_dir(req, DirName, function (err, cb) {
          if (err) {
            console.log(err)
            res.render('constructions/errors')
          }
        })
      }, 5000)
      callback()
    }

    function sync () {
      fs.mkdirSync('./public/cors_demo/'+sess.username+'/'+sess.project_name+'/')
      fs.writeFileSync('./public/cors_demo/'+sess.username+'/'+sess.project_name+'/ignore_manta_to_local.sync', '.tif .set ')
      fs.writeFileSync('./public/cors_demo/'+sess.username+'/'+sess.project_name+'/ignore_manta_to_manta.sync', '.jpeg .txt .json')
      req.session.sampleproj = false
      res.render('upload/upload_view', {username: sess.username, setName: sess.project_name})
    }

    CreateDir(sync)
  }
})

router.get('/sample_project', function (req, res) {
  req.session.orig_user = req.session.username
  req.session.username = 'SampleDataUser'
  req.session.project_name = 'SampleDataProject'
  req.session.set_name = req.session.orig_user 
  req.session.sampleproj = true
  var sess = req.session
  if (!sess.username) {
    sess.parameters = {username: sess.username}
    res.render('users/login')
  } else {
    set.list_projects(req, function (err, ProjList) {
      if (err) {
        console.log(err)
      }
      res.render('images/select_set', {projects: ProjList, success: '', local: JSON.stringify(req.session)})
    })
  }
})

router.get('/zipproject', function (req, res) {
  var sess = req.session
  if (!sess.username) {
    sess.parameters = {username: sess.username}
    res.render('users/login')
  } else {
      res.render('upload/zip_upload_view', {username: sess.username, setName: sess.project_name})
  }
})

module.exports = router
