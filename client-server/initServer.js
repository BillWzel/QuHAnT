//Define Dependencies

//Module to run the app (lots of people recommended)
var express = require("express");
var path = require("path");
var ip = require("ip");
var passport = require('passport');//authentication
var Strategy = require('passport-local').Strategy;
//TODO: Change ./db to ./db/users (should be equivelent)
var db = require('./db'); //Local user database
var bodyparser = require('body-parser'); 
var xmlparser = require('express-xml-bodyparser');
var assert = require('assert');
var fs = require('fs'); //Navigate file system
var http = require('http');
var manta = require('manta');
var qs = require('querystring');
var url = require('url');
var chokidar = require('chokidar'); //real-time monitoring of directories and files
var d3 = require('d3'); //data visualization

app = require('express.io')(); //express app compatible with real-time updates
app.http().io() //allowing real-time updates

//Link to D3 plotting scripts
app.locals.barChartHelper = require('./bar_chart_helper');

//Add public to node.js path
app.use(express.static(path.join(__dirname, 'public')));
//Parse outgoing html?
app.use(bodyparser.urlencoded( {extended: true }));
//TODO: comment out and see if it still works.
app.use(bodyparser.json());
//Used to upload images.
app.use(xmlparser());

//This is here to get moving though links to work
app.set('views', __dirname + '/public/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine','html');

///--- Globals
var CORS_OPTIONS = {
	headers: {
		'access-control-allow-headers': 'access-control-allow-origin, accept, origin, content-type',
		'access-control-allow-methods': 'PUT,GET,HEAD,DELETE',
		'access-control-allow-origin': '*'
	}
};

//One global Manta client for all our code below
var CLIENT = manta.createClient({
	sign: manta.privateKeySigner({
		algorithm: 'RSA-SHA1',
		key: fs.readFileSync(process.env.HOME + '/.ssh/client_key', 'utf8'),
		keyId: process.env.MANTA_KEY_ID,
		user: process.env.MANTA_USER
	}),
	user: process.env.MANTA_USER,
	url: process.env.MANTA_URL
});

var DROPBOX = '/' + process.env.MANTA_USER + '/stor/cors_demo';
//var HTML = fs.readFileSync(path.resolve(__dirname, 'userindex.html'), 'utf8');
var ANALYSIS_JOB //JOBID for the analytics
var dispName
var in_keys = 0; //Number of files that should be uploaded
var prjid=''

function parseCookie(req) {
	var c = null;
	if (req.headers['cookie'])
		c = req.headers['cookie'].split('=').pop();
	return (c);
}

//---- Routes upload ---- //
//---- IMAGE UPLOAD ---- //
//handleSign will upload the images to the selected directory
function handleSign(req,res) {
	in_keys = in_keys+1
	//consider changing params to imagefile
	var params = req.body.file || {};
	if (!params) {
		res.error(409, 'Missing "file" parameter');
		return;
	}
	
	//signURL options, puts file on manta and signs it 	
	var opts = {
		expires: new Date().getTime() + 1000000,
		path: DROPBOX + '/' + displayName + '/' + prjid + '/' + params,
		method: ['OPTIONS', 'PUT'],
	};
	
	//signature variable is defined in the HTML
	CLIENT.signURL(opts, function (err, signature) {
		if (err) {
			res.error(500, err);
			return;
		}

		var signed = JSON.stringify({
			url: process.env.MANTA_URL + signature
		});

		res.setHeader('content-type', 'application/json');
		res.setHeader('content-length', Buffer.byteLength(signed));
		res.writeHead(200);
		res.end(signed); //????
	});


	//TODO: Prevent upload of images with spaces, parentheses. These characters appear to cause issues.
};

//Submit only images which passed the QC to the analytics
function quhantJob(in_list,module) {
	var opts_job = {
		phases: [{assets: ["/naultran/stor/QuHAnT/AnalysisModules/Analysis-Foreground.cpp","/naultran/stor/QuHAnT/AnalysisModules/makefile", "/naultran/stor/QuHAnT/AnalysisModules/ORO-Analysis.sh"],init: "cd /var/tmp && cp /assets/naultran/stor/QuHAnT/AnalysisModules/* ./", type: "map", exec: '/assets/naultran/stor/QuHAnT/AnalysisModules/ORO-Analysis.sh /var/tmp "$MANTA_INPUT_FILE"' }]
	};

	if (module == 'PicroSirius Red'){
		console.log('PSR')
        	var opts_job = {
                phases: [{assets: ["/naultran/stor/QuHAnT/AnalysisModules/Analysis-Foreground.cpp","/naultran/stor/QuHAnT/AnalysisModules/makefile", "/naultran/stor/QuHAnT/AnalysisModules/ORO-Analysis.sh"],init: "cd /var/tmp && cp /assets/naultran/stor/QuHAnT/AnalysisModules/* ./", type: "map", exec: '/assets/naultran/stor/QuHAnT/AnalysisModules/ORO-Analysis.sh /var/tmp "$MANTA_INPUT_FILE"' }]
        };
	};

	
	CLIENT.createJob(opts_job , function (err, jobId) {
		assert.ifError(err);
		ANALYSIS_JOB=jobId;
		console.log('Analysis job id = ' + ANALYSIS_JOB);
		for (i=0; i < in_list.length; i++) {
			analysisImg = '/naultran/stor/cors_demo/' + in_list[i].replace('.jpeg','.tif')
			console.log(analysisImg)
			CLIENT.addJobKey(ANALYSIS_JOB, analysisImg, function (err){
				assert.ifError(err);
			});
		};
	});
}

//---- AUTHENTICATION ----- //  
// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
  function(username, password, cb) {
    db.users.findByUsername(username, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != password) { return cb(null, false); }
      return cb(null, user);
    });
  }));
 
// Configure Passport authenticated session persistence.
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  db.users.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

//Initialize Passport and restore the authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

//Routes
app.get('/',function(req,res){
	res.sendFile("index.html", {user: req.user});
});

//Verifies authentication and re-directs to project listing
app.post('/login', passport.authenticate('local', { failureRedirect: '/' }), function(req,res){
	dispName = req.user.displayName
	res.cookie=(Math.floor(Math.random() *100))
	res.setHeader('set-cookie', 'name=' + res.cookie);
	displayName = req.user.displayName
	CLIENT.mkdirp(DROPBOX + '/' + req.user.displayName, CORS_OPTIONS, function (err) {
		assert.ifError(err);
	});
	
	if (!fs.existsSync('public/imgs/' + displayName)){
		fs.mkdirSync('public/imgs/' + displayName);
	};
	
	res.render('projectOverview.html', { displayName: req.user.displayName });
	setTimeout(function(){
	chokidar.watch('./public/imgs/' + displayName + '/', {
        ignored: /node_modules|\.git/,
        persistent: true,}).on('all', function(event, path) {
                path=path.replace('public/','');
                if (event == 'addDir') {
                console.log(event, path);
				req.io.broadcast('project',{value: path});
                };
                });
	},4000);
});

//TODO: CREATE NEW USER OPTION


//TODO: LOGOUT BUTTON
app.get('/logout',
	function(req, res){
		req.logout();
		res.redirect('/');
		console.log('get /logout');
	});

//Create new project and allow image uploading
app.post('/prjselect_new', function(req,res){
	//Create local directory for thumbnails
	if (!fs.existsSync('public/imgs/' + displayName + '/' + req.body.fname)){
		fs.mkdirSync('public/imgs/' + displayName + '/' + req.body.fname);
	};
	if (!fs.existsSync('public/results/' + displayName + '/' + req.body.fname)){
		fs.mkdirSync('public/results/' + displayName + '/' + req.body.fname);
		fs.writeFile('public/results/' + displayName + '/' + req.body.fname + '/summary_out.txt', 'name,count\n',function (err) {
			if (err) throw err;
			console.log('file saved');
		});
	};
	//create project specific manta directory
	CLIENT.mkdirp(DROPBOX + '/' + displayName + '/' + req.body.fname, CORS_OPTIONS, function (err) {
		if (err) {
			res._error(500, err);
		}
	});
	prjid = req.body.fname
	res.render('userindex.html', { displayName: req.body.fname });
})

//Upload Images 
app.post('/sign', function(req,res){
		console.log('post /sign');
		handleSign(req,res);
	});

//Use existing project and review QC (user can now return to see where it is at)
app.post('/prjselect_old', function(req,res){
	res.render('imgs-realtime.html');
	prjid = req.body.list;
	prjid = prjid.replace('imgs/','');
	prjid = prjid.replace(displayName + '/', '')
	setTimeout(function(){
		chokidar.watch('./public/' + req.body.list, {
        	ignored: /node_modules|\.git/,
        	persistent: true,}).on('all', function(event, path) {
                	path=path.replace('public/','');
			txtpath=path.replace('.jpeg','.txt');
                	if (event == 'add' && path.indexOf('.jpeg') > -1){
				console.log(event, path);
				req.io.broadcast('image',{value: path});
				} else if (event == 'add' && path.indexOf('.txt') > -1){
					fs.readFile('public/'+ txtpath, function(err, data){
						if(err) throw err;
						var qcArray = data.toString().split("\n");
						for (i in qcArray){
							scoreArray = qcArray[i].split('\t');
							req.io.broadcast('scores',{imname: scoreArray[0], metric: scoreArray[1], value: scoreArray[2]});
						}
					})
                		};
                	});
		},8000); //Timed to prevent page loading after finding files
	});

//Go to image display site after images are uploaded
app.post('/review', function(req,res) {
	res.render('imgs-realtime.html');
	setTimeout(function(){
		chokidar.watch('./public/imgs/' + displayName + '/' + prjid, {
        	ignored: /node_modules|\.git/,
        	persistent: true,}).on('all', function(event, path) {
		setTimeout(function(){
                	path=path.replace('public/','');
			txtpath=path.replace('.jpeg','.txt');
                	if (event == 'add' && path.indexOf('.jpeg') > -1){
				console.log(event, path);
				req.io.broadcast('image',{value: path});
				} else if (event == 'add' && path.indexOf('.txt') > -1){
					console.log(event, path);
					fs.readFile('public/'+ txtpath, function(err, data){
						if(err) throw err;
						var qcArray = data.toString().split("\n");
						for (i in qcArray){
							scoreArray = qcArray[i].split('\t');
							req.io.broadcast('scores',{imname: scoreArray[0], metric: scoreArray[1], value: scoreArray[2]});
						}
					})
                		};
			},6000);
		});
	},8000);
});

//Submit images for quantitative analysis
app.post('/quantitate', function(req,res) {
	console.log(req.body.QC)
	quhantJob(req.body.QC,req.body.module)
	chokidar.watch('./public/results/' + displayName + '/' + prjid, {
        	ignored: /node_modules|\.git/,
        	persistent: true,}).on('all', function(event, path) {
                	path=path.replace('public/','');
                	if (event == 'add' && path.indexOf('.jpeg') > -1){
				console.log(event, path);
				req.io.broadcast('image',{value: path});
				} else if (event == 'add' && path.indexOf('summary_out.txt') > -1){
					console.log(event, path);
					setTimeout(function(){				
						fs.readFile('./public/' + path, 'utf8', function(err, data) {
        					d3Data = d3.csv.parse(data);
        					res.render('disp-results', { fixtureData: d3Data });
        				});
				},15000);
			}
		})
});

//Display data in results page - real-time updating does not work here
app.post('/viewdat',function(req,res){
	fs.readFile('./public/results/' + displayName + '/' + prjid + '/summary_out.txt', 'utf8', function(err, data) {
        	d3Data = d3.csv.parse(data);
        		console.log(d3Data);
        		res.render('disp-results', { fixtureData: d3Data });
        	});
});

/*Run the server.*/
app.listen(3000,function(req,res){
    console.log(ip.address()+":3000");
});
