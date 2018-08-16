// Code Review 02/03/17 - Daria Tarasova - Rance Nault

var fs = require('fs')
var db = require('../db')
// var express = require('express')
var jsonexport = require('jsonexport')
require('heapdump')


// Returns array of available modules for analysis
exports.get = function (id, cb) {
  var ModuleList = fs.readFileSync('public/cors_demo/analysis_modules/available_modules.txt').toString().split('\n')
  ModuleList = ModuleList.filter(function(x) { return x != ''})

  cb(null, ModuleList)
}

exports.createReport = function(req, DirPath, cb) {
  var all_json = []
  var dict = []
  //var sess = req.session
  var checkList = req.body.CheckedResults
  //var DirPath = 'public/cors_demo/' + sess.username + '/'
  
  for (var k in checkList) {
    var projInfo = checkList[k].split(',')
    var projStr = projInfo.toString()
    projStr = projStr.split('/')
    var project = projStr[0].trim()
    var set = projStr[1].trim()
    var setPath = DirPath + project + '/' + set + '.set'
    var imgList = fs.readFileSync(setPath).toString().split('\n')
    var fileList = fs.readdirSync(DirPath + project + '/');

    for (var i in imgList) {
      var tempList = fileList.filter(function(x) { return x.indexOf(imgList[i] + '.') > -1 && ((x.indexOf('summary.analysis.json') > -1) || (x.indexOf('metadata.json') > -1) || (x.indexOf('full.analysis.json') > -1))})
      for (var j in tempList) {
        var results = JSON.parse(fs.readFileSync(DirPath + project + '/' + tempList[j]))
        all_json.push(results)
      }
    }
  }
  for (var i in all_json) {
   if (!dict[all_json[i].type]) {
      dict[all_json[i].type] = []
    }
    dict[all_json[i].type].push(all_json[i].data)
  }
  for (var type in dict) {
    
    jsonexport(dict[type], function(err, csv) {
      if (err) { console.log('json export error: ' + err) }
      fs.writeFileSync('./public/cors_demo/' + req.session.username + '/results/results_' + type + '.csv', csv)
      if(type=='metadata'){
        fs.writeFileSync('./public/cors_demo/' + req.session.username + '/results/' + type + '.csv', csv)
      }
    })
  }
  cb(null, null)
}

exports.createMeta = function(req, cb) {
  sess = req.session
  var checkList = req.body.CheckedResults
  for (var k in checkList) {
    var projInfo = checkList[k].split(',')
    var projStr = projInfo.toString().split('/')
    var project = projStr[0].trim()
    var set = projStr[1].trim()
    var setPath = './public/cors_demo/' + sess.username + '/' + project + '/' + set + '.set'
    var imgList = fs.readFileSync(setPath).toString().split('\n')

    for (var i in imgList) {
      // create new json
      var imjson = {}
      imjson["type"] = "metadata"
      imjson["data"] = [{"Project":project,"Set":set,"IndividualID":"", "File":imgList[i]}]
      fs.writeFileSync('./public/cors_demo/' + sess.username + '/' + project + '/' + imgList[i] + '.metadata.json', JSON.stringify(imjson))  
    }
  }
  cb(null,null)
}

exports.checkSubmitted = function (req, res, cb) {
  var sess = req.session
  if (sess.sampleproj) {
    var RealPath = fs.readlinkSync('public/cors_demo/' + sess.username + '/' + sess.project_name)
    var ImgList = fs.readFileSync(RealPath + '/' + sess.set_name + '.set').toString().split('\n')
    ImgList = ImgList.filter(function(n) {return n != ''})
    var ImgNum = ImgList.length
    var out = [ImgNum, 0, ImgNum, 'N/A', 0.000001, sess.set_name, sess.project_name]
 
  } else {
    var RealPath = 'public/cors_demo/' + sess.username + '/' + sess.project_name + '/'
  
    var ImgList = fs.readFileSync(RealPath + sess.set_name + '.set').toString().split('\n')
    ImgList = ImgList.filter(function(n) {return n != ''})
    var ImgNum = ImgList.length
    var fileList = fs.readdirSync(RealPath)

    var notAnalyzed = []
    for (var i in ImgList) {
      var tempList = fileList.filter(function(x) { return x.indexOf(ImgList[i] + '.') > -1 && x.indexOf('summary.analysis.json') > -1 })
      if (tempList.length == 0) {
      //if (!(fs.existsSync(RealPath + ImgList[i] + '_full.txt') && fs.existsSync(RealPath+ ImgList[i] + '_summary.txt'))) {
        notAnalyzed.push(ImgList[i])
      }
    }
 
    var NumNotAnalyzed = notAnalyzed.length

    var cost = fs.readFileSync('public/imcost.txt')
    var totCost = NumNotAnalyzed*cost

    var out = [ImgNum, NumNotAnalyzed, ImgNum-NumNotAnalyzed, sess.CCode, totCost, sess.set_name, sess.project_name]
  } 

  res.setHeader('content-type', 'text/html')
  res.writeHead(200)
  res.write(out.toString())
}

exports.listAnalyzed = function (req, res, username, cb) {
  var sess = req.session
  var RealPath = 'public/cors_demo/' + username + '/' + sess.project_name + '/'
  var ImgList = fs.readFileSync(RealPath + sess.set_name + '.set').toString().split('\n')
  var fileList = fs.readdirSync(RealPath)
  var notAnalyzed = []
  for (var i in ImgList) {
    var tempList = fileList.filter(function(x) { return x.indexOf(ImgList[i] + '.') > -1 && x.indexOf('summary.analysis.json') > -1 })
    if (tempList.length == 0) {
      notAnalyzed.push(ImgList[i])
    }
  }
  cb(null, ImgList, notAnalyzed)
}

// TODO Outsource to controller -> db
exports.create_result_table = function (req, jobId, cb) {
  db.results.AppendRes(req, jobId, function (err, output) {
    if (err) {
      return(cb(err))
    }
    return cb(null, output)
  })
}

exports.updateResults = function (username, req, res, cb) {
  db.analyses.filterModules(username, req.session, function(err, matrix) {
    var x = {}
    var y = []
    var existing = 0
    for (var i in matrix) {
      y.push(i)
      x.test = matrix[i]
      modMatrix = matrix[i]
      for (var j in modMatrix) {
        if (modMatrix[j].jobStatus == 'running') {
          existing = existing + 1
          break
        }
      }
    }
    if (existing == 0) {
      matrix['state'] = 'done'
    } else {
      matrix['state'] = 'running'
    }
    res.setHeader('content-type', 'text/html; charset=UTF-8')
    res.writeHead(200)
    res.write(JSON.stringify(matrix))
    cb(null, res)
  })
}
