var fs = require('fs')

function checkProjects (user) {
  if (!fs.existsSync('./public/cors_demo/' + user + '/db/projects.json')) {
    var records = []
    fs.writeFileSync('./public/cors_demo/' + user + '/db/projects.json', JSON.stringify(records), 'utf8')
  } else {
    var projStr = fs.readFileSync('./public/cors_demo/' + user + '/db/projects.json')
    records = JSON.parse(projStr)
  }
  return records
}

exports.AppendProj = function (req, imgs, type, cb) {
  sess = req.session
  var records = checkProjects(sess.username)
  var initializeProject = 1
  var index
  for (i in records) {
    if (records[i].projectName == sess.project_name) {
      initializeProject = 0
      index = i
      break
    }
  }
  if (initializeProject == 1 && type == 'project') {
    new_record = {projectName: '', numImages: '', date: '', module: '', sets: ''}
    new_record.projectName = sess.project_name
    create_set = {'setName': '', 'setDate': '', 'setNumImgs': '', 'setStatus': ''}
    create_set.setName = sess.project_name + '_original'
    create_set.setDate = new Date()
    create_set.setNumImgs = imgs
    create_set.setStatus = 'Created'
    new_record.sets = []
    new_record.sets.push(create_set)
    new_record.numImages = imgs
    new_record.date = new Date()
    records.push(new_record)
  } else if (initializeProject == 0 && type == 'set') {
    var append_set = 1
    for (j in records[index].sets) {
      if (sess.set_name == records[index].sets[j].setName) {
        append_set = 0
      }
    }
    if (append_set == 1) {
      var current_sets = {'setName': '', 'setDate': '', 'setNumImgs': '', 'setStatus': ''}
      current_sets.setName = sess.set_name
      current_sets.setDate = new Date()
      current_sets.setNumImgs = imgs
      current_sets.setStatus = 'Created'

      records[index].sets.push(current_sets)
    } else {
      records[index].sets.setNumImgs = imgs
      records[index].sets.setStatus = 'Accepted'
    }
  }

  fs.writeFileSync('./public/cors_demo/' + sess.username + '/db/projects.json', JSON.stringify(records), 'utf8')
  cb(null, 'added')
}

exports.updateUserSets = function(user, cb) {
  var sets = checkProjects(user)
  return cb(null, null)
}

exports.edit_set = function (req, imgs, set_status, cb) {
  var sess = req.session
  var records = checkProjects(sess.username)
  for (i in records) {
    if (records[i].projectName == sess.project_name) {
      if (req.body.module) {
        records[i].module = req.body.module
      }
      for (j in records[i].sets) {
        var set = records[i].sets[j].setName
        if (set == sess.set_name) {
          if (imgs != null) {
            records[i].sets[j].setNumImgs = imgs
          }
          records[i].sets[j].setStatus = set_status
          break
        }
      }
    }
  }

  fs.writeFileSync('./public/cors_demo/' + sess.username + '/db/projects.json', JSON.stringify(records), 'utf8')
  cb(null, null)
}

exports.edit_project_imgs = function (req, imgs, cb) {
  sess = req.session
  var records = checkProjects(sess.username)
  for (i in records) {
    if (records[i].projectName == sess.project_name) {
      records[i].numImages = imgs
      for (j in records[i].sets) {
        if (records[i].sets[j].setName.indexOf('original') > -1) {
          records[i].sets[j].setNumImgs = imgs
          break
        }
      }
      break
    }
  }
  fs.writeFileSync('./public/cors_demo/' + sess.username + '/db/projects.json', JSON.stringify(records), 'utf8')
  cb(null, null)
}

exports.deleteProject = function (user, project, cb) {
  var records = checkProjects(user)
  for (i in records) {
    if (records[i].projectName == project) {
      records.splice(i,1)
      fs.writeFileSync('./public/cors_demo/' + user + '/db/projects.json', JSON.stringify(records), 'utf8')
      cb(null,null)
      break
    }
  }
}


exports.deleteSet = function (user, project, set, cb) {
  var records = checkProjects(user)
  for (i in records) {
    if (records[i].projectName == project) {
      newRecord = records[i].sets
      for (var j in newRecord) {
        if (newRecord[j].setName == set) {
          newRecord.splice(j,1)
          records[i].sets = newRecord
          fs.writeFileSync('./public/cors_demo/' + user + '/db/projects.json', JSON.stringify(records), 'utf8')
          cb(null,null)
          break
        }
      }
    }
  }
}
