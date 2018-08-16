var fs = require('fs')
var jsonexport = require('jsonexport')

var j = 'PSR'

var module = require('./' + j + '/analysis')
opts_job=module.opts_job
console.log(opts_job)
