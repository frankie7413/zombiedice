var express = require("express"),
	http = require("http"),
	redis = require("redis"),
	redisstore = require("socket.io-redis"),
	bodyParser = require("body-parser"),
	session = require("express-session"),
	MongoClient = require('mongodb').MongoClient,
	app = express(),
	server = http.createServer(app);
	
	server.listen(3000);
	
	app.use(express.static(__dirname + "/client"));
	app.use(bodyParser.urlencoded({extended: false}));

	app.use(session({
		secret: '1029384756',
		resave: false,
		saveUninitialized: true,
		cookie: { maxAge: 3600000 }
	})); 
	

var	socketIO = require('socket.io'),
	io = socketIO(server),
	nspLobby = io.of('/lobby'),
	nspGame = io.of('/ingame');

var sess;
var lobbyclients = [];
var gameclients = [];
var dicestats = {};

console.log("Server is listening at http://localhost:3000/");

/* Constructors */
//new registration constructor
function newUser(username, password, email) {
	this.username = username;
	this.password = password;
	this.email = email;
}
/* End constructors */

//make connection to db
function connectDB(process, obj, req, res) {
	var mongourl = "mongodb://localhost/zombiedice";
	MongoClient.connect(mongourl, function(err, db) {
		if(err) {
			return console.dir(err);
		}
		var collection = db.collection('users');
		process(collection, obj, req, res);
	});
}

//search array for key
function findIndex (toSearch, key, value) {
	for (var i = 0; i < toSearch.length; i++) {
		if (toSearch[i][key] === value) {
			return i;
		}
	}
	return null;
}

//insert user into db
var register = function(collection, obj, req, res) { 
	var doc = {username: obj.username, password: obj.password, wins: 0, losses: 0};
	
	//see if user name already in use
	collection.findOne({username : obj.username}, function(err, item) {
		if(!err) {
			if (item !== null) {
				//name already in use
				console.log(obj.username + " already in db");
				res.json({"registration": false});
			} else {
				//insert new user into db
				collection.insert(doc, {w:1}, function(err, result) {
					if(!err) {
						console.log(obj.username + " Inserted");
						res.json({"registration": true});
					}
				}); 
			}	
		}			
	});
};

//search for item in db
var login = function(collection, obj, req, res) {
	collection.findOne({username : obj.username}, function(err, item) {
		if(!err) {
			if (item !== null) {
				if (obj.password === item.password) {
					sess=req.session;
					sess.username=obj.username;
					res.json({"logon":true});
				}
				else {
					res.json({"logon":false});
				}
			} else {
				res.json({"logon":false});
			}			
		}			
	});
};

//get current record for user
var record = function(collection, obj, req, res) {
	collection.findOne({username : obj.username}, function(err, item) {
		if(!err) {
			res.json({"username": item.username, "wins": item.wins, "losses": item.losses});
		}	
	});
};

//routing
app.get("/",function(req,res){
	console.log("inside /");
	sess=req.session;
	
	if(sess.username){
		res.redirect("/lobby.html");
	} else {
		res.redirect("/index.html");
	}
}); 

app.get("/logoff",function(req,res) {
	req.session.destroy(function(err){
		if(err){
			console.log(err);
		} else {
			res.json({"logoff":true});
		}
	});
});

app.get('/getrecord', function(req, res) {
	sess=req.session;
	connectDB(record, sess, req, res);
});

app.get('/startgame/*', function(req, res) {
	sess = req.session;
	sess.opponentlobbyid = req.param(0);
	sess.opponentgameid = null;
	res.redirect("/gameboard.html");
});

app.get('/joingame/*', function(req, res) {
	sess = req.session;
	sess.opponentlobbyid = null;
	sess.opponentgameid = req.param(0);
	res.redirect("/gameboard.html");
});

app.get('/lobby', function(req, res) {
	console.log("returning to lobby");
	sess = req.session;
	if (sess.username) {
		res.redirect("/lobby.html");
	} else {
		res.redirect("/index.html");
	}
});


////////////////rolling dice ///////////////////////
function rollDice(){
	dicestats.dice10 = "";
	dicestats.dice20 = "";
	dicestats.dice30 = "";

	var options = ["brain", "brain", "feet", "feet", "shotgun", "shotgun"];
	var dice1 = options[Math.floor((Math.random() * options.length))]; 
	var dice2 = options[Math.floor((Math.random() * options.length))]; 
	var dice3 = options[Math.floor((Math.random() * options.length))]; 

	if(dice1 === "brain"){
		dicestats.dice10 = "Brain";
	}else if(dice1 === "feet"){
		dicestats.dice10 = "Feet";
	}
	else
	{
		dicestats.dice10 = "Shotgun";
	}

	if(dice2 === "brain"){
		dicestats.dice20 = "Brain";
	}else if(dice2 === "feet"){
		dicestats.dice20 = "Feet";
	}
	else
	{
		dicestats.dice20 = "Shotgun";
	}

	if(dice3 === "brain"){
		dicestats.dice30 = "Brain";
	}else if(dice3 === "feet"){
		dicestats.dice30 = "Feet";
	}
	else
	{
		dicestats.dice30 = "Shotgun";
	}

}


app.get('/rolldice', function(req, res){
	console.log("Dice Rolling");
	rollDice();
	res.json(dicestats);
});



function checkDice(firstDice, secondDice, thirdDice) {
	var array = [firstDice, secondDice, thirdDice];
	var arraylen = array.length;
	for(var i = 0; i < arraylen; i++){
		if(array[i] === "Brain"){
			array[i] = "<image src='images/brain_roll.jpg'>";
		}
		else if(array[i] === "Feet"){
			array[i] = "<image src='images/foot_roll.jpg'>";
		}
		else
		{
			array[i] = "<image src='images/shotgun_roll.jpg'>";
		}
	}

	return array;
}

///////////////////////////////////////////////////

app.post("/registration", function (req,res) {
	
	var valid = true;
	var reginfo = req.body;
	var registration;

	registration = new newUser(reginfo.username, reginfo.password, reginfo.email);
	
	connectDB(register, registration, req, res);
});

app.post("/userlogin", function (req,res) {
	
	var userinfo = req.body;
	connectDB(login, userinfo, req, res);
});

//lobby socket io interaction
nspLobby.on('connection', function(socket) {
	console.log(sess.username + ' connected to lobby');
	
	//get display of current users in lobby
	nspLobby.connected[socket.id].emit('current lobby', lobbyclients);
	
	//add new user to clients
	lobbyclients.push({sid: socket.id, username: sess.username});
	
	//lets other users know someone has joined lobby
	socket.broadcast.emit('user join', sess.username, socket.id);
	
	//let other players know someone left
	socket.on('disconnect', function () {
		var index = findIndex(lobbyclients, "sid", socket.id);
		console.log(lobbyclients[index].username + ' left lobby');
		lobbyclients.splice(index, 1);
		socket.broadcast.emit('user left', socket.id);
	});
	
	//send challenge request
	socket.on('challenge', function(sid) {
		console.log("recieved challenge for " + sid);
		var index = findIndex(lobbyclients, "sid", socket.id);
		nspLobby.connected[sid].emit("challenge recieved", lobbyclients[index].username, socket.id);
	});
	
	//send decline
	socket.on('declined', function(sid) {
		console.log(sid + " declined challenge");
		nspLobby.connected[sid].emit("challenge declined");
	});
});

//game io interaction
nspGame.on ('connection', function(socket) {
	console.log(sess.username + ' joined game');
	var p1Brains = 0,
		p2Brains = 0,
		currentPlayer,
		dice1, dice2, dice3;
	
	//add new user to clients
	gameclients.push({sid: socket.id, username: sess.username});
	
	if (sess.opponentlobbyid !== null) {
		console.log("Calling other player");
		//call opponent to game
		nspLobby.connected[sess.opponentlobbyid].emit('pull to game', socket.id);
	} else {
		console.log("Other player has arrived");
		//make connection to other player
		var opponentid = sess.opponentgameid;
		var username = sess.username;
		nspGame.connected[opponentid].emit('handshake', socket.id, username, 0);
	}
	
	socket.on('return handshake', function(sid) {
		console.log("handshake returned");
		var index = findIndex(gameclients, "sid", socket.id);
		var username = gameclients[index].username;
		nspGame.connected[sid].emit("handshake", socket.id, username, 1);
	});


	socket.on('diceroll', function(data){
		console.log('dice json recieved');
		var images = checkDice(data.dice10, data.dice20, data.dice30);
		nspGame.emit('dicerollresults', data, images);
	});

	socket.on('stop and score', function(sid) {
		console.log("score saved");
		var index = findIndex(gameclients, "sid", socket.id);
		var username = gameclients[index].username;
		nspGame.connected[sid].emit("stop", socket.id, username, 1);
	});
	
	socket.on('disconnect', function () {
		console.log('someone disconnected');
	});
});
