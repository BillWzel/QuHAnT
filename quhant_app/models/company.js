// Code review 02/03/17 Daria Tarasova - Rance Nault

var db = require('../db')
var express = require('express')
var nodemailer = require('nodemailer')
var manta = require('manta')
var app = express()
var request = require('request')

exports.checkcaptcha = function (req, res, cb) {
  if(req.body.secret === undefined || req.body.secret === null) {
    cb(null,'fail')
  }
  var secretKey = '6LfiwmYUAAAAAAdZnGnhjGgnSDaNulm5XFMjkerF'

  var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body.secret

  request(verificationUrl,function(error,response,body) {
    body = JSON.parse(body);
    if(body.success !== undefined && !body.success) {
      cb(null,'fail')
    } else {
      cb(null,'pass')
    }
  })
}
