// Code Review 01/31/17 - Daria Tarasova - Rance Nault

var fs = require('fs') // navigates in the filesystem

// Lists only projects
exports.list_projects = function (req, cb) {
  sess = req.session
  var DirPath = 'public/cors_demo/' + sess.username

  var prolist = []
  var symlist = []
  fs.readdir(DirPath, function (err, list) {
    if (err) {
      console.log(err)
    }
    list.forEach(function (filename) {
      checkSymLink = fs.lstatSync(DirPath + '/' + filename).isSymbolicLink()
      if (checkSymLink) {
        symlist.push(filename)
      } else {
        if (!/db|results|Monitoring|.db|.results/.test(filename)) {
          prolist.push(filename)
        }
      }
    })
  if (sess.sampleproj) {
    var ProjListOut = symlist
  } else {
    var ProjListOut = prolist
  }
  cb(null, ProjListOut)
  })
}

exports.create_set_array = function (req, type, cb) {
  sess = req.session
  var DirPath = 'public/cors_demo/' + sess.username
  var projArray = []
  var symlist = []
  var setArray = []
  var symsetArray = []
  var prolist = []
  fs.readdir(DirPath, function (err, list) {
    if (err) {
      console.log(err)
    }
    list.forEach(function (filename) {
      checkSymlink = fs.lstatSync(DirPath + '/' + filename).isSymbolicLink()
      if (checkSymlink) {
        var newpath = fs.readlinkSync(DirPath + '/' + filename)
        symlist.push(newpath)
      } else {
        if (!/db|results|Monitoring|.db|.results/.test(filename)) {
          prolist.push(filename)
        }
      }
    })

    if (sess.sampleproj) {
      for (var symproj in symlist) {
        var SetListsym = fs.readdirSync(symlist[symproj])
  
        for (var symset in SetListsym) {
          if (SetListsym[symset].indexOf(sess.set_name + type) > -1) {
            var SetStrsym = (SetListsym[symset]).replace(type,'')
            symsetArray.push(SetStrsym)
          }
        }
        var newval = symlist[symproj].replace('public/cors_demo/sampletest/','')
        if (newval.charAt(newval.length -1) == '/') {
          newval = newval.substring(0, newval.length -1)
        }
        projArray.push({project: newval, sets: symsetArray})
      }
    } else {    
      for (var proj in prolist) {
        var ProjPath = 'public/cors_demo/' + sess.username + '/' + prolist[proj]
        var SetList = fs.readdirSync(ProjPath)
        setArray=[]
        for (var set in SetList) {
          if (SetList[set].indexOf(type) > -1) {
            var SetStr = (SetList[set]).replace(type, '')
            setArray.push(SetStr)
          }
        }
        projArray.push({project: prolist[proj], sets: setArray})
      }
    }
    cb(null, projArray)
  })
}


// TODO: Do we really need 3 functions to do same thing?

exports.create_proj_table = function(req, cb) { // NOTE: consider using in db sets
  sess = req.session
  if (sess.sampleproj) {
    //var prolist = fs.readFileSync('public/cors_demo/sampletest/db/projects.json')
   if (fs.existsSync('public/cors_demo/' + sess.username + '/db/projects.json')) {
      // TODO: Create better alternative for sample project login welcome page
      var prolist = fs.readFileSync('public/cors_demo/' + sess.username +'/db/projects.json')
    } else {
      var prolist = {}
    }

  } else {
    if (fs.existsSync('public/cors_demo/' + sess.username + '/db/projects.json')) {
      var prolist = fs.readFileSync('public/cors_demo/' + sess.username +'/db/projects.json')
    } else {
      var prolist = {}
    }
  }
  cb(null, prolist)
}

exports.create_results_table = function(req, cb) {
  sess = req.session
  if (fs.existsSync('public/cors_demo/' + sess.username + '/db/results.json')) {
    var reslist = fs.readFileSync('public/cors_demo/' + sess.username + '/db/results.json')
  } else {
    var reslist = {}
  }
  cb(null, reslist)
}

exports.jsonToview = function (path, cb) {
  if (fs.existsSync(path)) {
    table = fs.readFileSync(path)
  } else {
    table = {}
  }
  cb(null, table) 
}
