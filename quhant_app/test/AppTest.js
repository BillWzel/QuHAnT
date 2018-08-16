
controller = require('../controllers/')
  , http_mocks = require('node-mocks-http')
  , should = require('should')

function buildResponse() {
  return http_mocks.createResponse({eventEmitter: require('events').EventEmitter})
}

describe('Welcome Controller Tests', function() {

  it('hello', function(done) {
    var response = buildResponse()
    var request  = http_mocks.createRequest({
      method: 'GET',
      url: '/users/login_welcome',
    })

    response.on('end', function() {
      response._getData().should.equal('world');
      done()
    })

    controller.handle(request, response)
  })

  it('hello fail', function(done) {
    var response = buildResponse()
    var request  = http_mocks.createRequest({
      method: 'POST',
      url: '/hello',
    })

    response.on('end', function() {
      done(new Error("Received a response"))
    })

    controller.handle(request, response, function() {
      done()
    })
  })

  it('upper', function(done) {
    var response = buildResponse()
    var request  = http_mocks.createRequest({
      method: 'GET',
      url: '/upper/monkeys',
    })

    response.on('end', function() {
      response._getData().should.equal('MONKEYS');
      done()
    })

    controller.handle(request, response)
  })
})







/*
var request = require('supertest')
var app = require('../mocha')
var cheerio = require('cheerio')



describe('loading express', function () {
  var server;
  beforeEach(function () {
    server = require('../mocha');
  });
  afterEach(function () {
    server.close();
  });
  it('responds to /', function testSlash(done) {
  request(server)
    .get('/')
    .expect(200, done);
  });
  it('404 everything else', function testPath(done) {
    request(server)
      .get('/foo/bar')
      .expect(404, done);
  });
});


describe('GET ', function() {
  it('should do something', function(done) {
    var req = request(app)
    var response = {
      viewname: "",
      data: {},
      render: function(view, viewData) {
        this.viewName = view
        this.data = viewData
      }
    }
    req.post('/users/login_welcome')
    // .send("session-ra")
      .send({"username":"naultran", "password":"QwertY11"})
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err)
        console.log(res._data)
        done()
      })
  })
})

 
describe('api', function() {
	beforeEach(function() {
		this.request = sinon.stub(http, 'request');
	});
 
	afterEach(function() {
		http.request.restore();
	});
 
        it('should convert get result to object', function(done) {
		var expected = { hello: 'world' };
		var response = new PassThrough();
		response.write(JSON.stringify(expected));
		response.end();
 
		var request = new PassThrough();
 
		this.request.callsArgWith(1, response)
	            .returns(request);
 
		api.get(function(err, result) {
			assert.deepEqual(result, expected);
			done();
		});
	}); 
*/
