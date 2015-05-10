// Server-side code
/* jshint node: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */
var express = require("express"),
	http = require("http"),
	bodyParser = require("body-parser"),
	session = require("express-session"),
	MongoClient = require("mongodb").MongoClient,
	app = express(),
	server = http.createServer(app);
		
	//redis = require("redis"),
	//redisstore = require("socket.io-redis"),

	server.listen(3000);
	
	app.use(express.static(__dirname + "/client"));
	app.use(bodyParser.urlencoded({extended: false}));

	app.use(session({
		secret: "1029384756",
		resave: false,
		saveUninitialized: true,
		cookie: { maxAge: 3600000 }
	})); 
	

var	socketIO = require("socket.io"),
	io = socketIO(server),
	nspLobby = io.of("/lobby"),
	nspGame = io.of("/ingame");

var sess;
var lobbyclients = [];
var gameclients = [];
var dicestats = {};
var ran = 0,  //track of run times
    human,
  	humanname = "",
    humanbrains = 0,
		zombie,
		zombiename = "",
		zombiebrains = 0;

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
		var collection = db.collection("users");
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
				collection.insert(doc, {w:1}, function(err) {
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

//increment wins or looses
function increaseGame(collection, gameusername){
	collection.findOne({username: gameusername}, function(err) {
		if(!err) {
			collection.update({username: gameusername}, {$inc: {wins: 1}});
			console.log("Game Stats Updated " + gameusername);
		}	
	});
}

function decreseGame(collection, gameusername){
	collection.findOne({username: gameusername}, function(err) {
		if(!err) {
			collection.update({username: gameusername}, {$inc: {losses: 1}});
			console.log("Game Stats Updated " + gameusername);
		}	
	});
}

//routing
app.post("/updategamestats", function(req, res){
	var temp = req.body;
	var sendname = "";
	var sendloss = "";
	console.log("Transfered: " + temp.sid);
	if(temp.sid === zombie){
		sendname = zombiename;
		sendloss = humanname;
	}
	else{
		sendname = humanname;
		sendloss = zombiename;
	}

	console.log("Updating: " + sendname);

	//update winner by 1 & looses by 1 
	connectDB(increaseGame, sendname, req, res);
	connectDB(decreseGame, sendloss, req, res);

});


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

app.get("/getrecord", function(req, res) {
	sess=req.session;
	connectDB(record, sess, req, res);
});

app.get("/startgame/*", function(req, res) {
	sess = req.session;
	sess.opponentlobbyid = req.param(0);
	sess.opponentgameid = null;
	res.redirect("/gameboard.html");
});

app.get("/joingame/*", function(req, res) {
	sess = req.session;
	sess.opponentlobbyid = null;
	sess.opponentgameid = req.param(0);
	res.redirect("/gameboard.html");
});

app.get("/lobby", function(req, res) {
	console.log("returning to lobby");
	sess = req.session;
	if (sess.username) {
		res.redirect("/lobby.html");
	} else {
		res.redirect("/index.html");
	}
});

app.post("/registration", function (req,res) {
	
	//var valid = true;
	var reginfo = req.body;
	var registration;

	registration = new newUser(reginfo.username, reginfo.password, reginfo.email);
	
	connectDB(register, registration, req, res);
});

app.post("/userlogin", function (req,res) {
	
	var userinfo = req.body;
	connectDB(login, userinfo, req, res);
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


app.get("/rolldice", function(req, res){
	console.log("Dice Rolling");
	rollDice();
	res.json(dicestats);
});

function checkDice(firstDice, secondDice, thirdDice) {	
	var array = [firstDice, secondDice, thirdDice];
	var arraylen = array.length;
	for(var i = 0; i < arraylen; i++){
		if(array[i] === "Brain"){
			array[i] = "<image src='images/brain_roll.png'>";
		}
		else if(array[i] === "Feet"){
			array[i] = "<image src='images/foot_roll.png'>";
		}
		else
		{
			array[i] = "<image src='images/shotgun_roll.png'>";
		}
	}

	return array;
}

function countDice(firstDice, secondDice, thirdDice){
	var result = {};
	result.shotgun = 0;
	result.feet = 0;
	result.brain = 0;

	var myarry = [firstDice, secondDice, thirdDice];
	var arrlen = myarry.length;
	for(var i = 0; i < arrlen; i++){
		if(myarry[i] === "Brain"){
			result.brain++;
		}
		else if(myarry[i] === "Feet"){
			result.feet++;
		}
		else{
			result.shotgun++;
		}
	}

	return result;
}

///////////////////////////////////////////////////



//lobby socket io interaction
nspLobby.on("connection", function(socket) {
	console.log(sess.username + " connected to lobby");
	
	//get display of current users in lobby
	nspLobby.connected[socket.id].emit("current lobby", lobbyclients);
	
	//add new user to clients
	lobbyclients.push({sid: socket.id, username: sess.username});
	
	//lets other users know someone has joined lobby
	socket.broadcast.emit("user join", sess.username, socket.id);
	
	//let other players know someone left
	socket.on("disconnect", function () {
		var index = findIndex(lobbyclients, "sid", socket.id);
		console.log(lobbyclients[index].username + " left lobby");
		lobbyclients.splice(index, 1);
		socket.broadcast.emit("user left", socket.id);
	});
	
	//send challenge request
	socket.on("challenge", function(sid) {
		console.log("recieved challenge for " + sid);
		var index = findIndex(lobbyclients, "sid", socket.id);
		nspLobby.connected[sid].emit("challenge recieved", lobbyclients[index].username, socket.id);
	});
	
	//send decline
	socket.on("declined", function(sid) {
		console.log(sid + " declined challenge");
		nspLobby.connected[sid].emit("challenge declined");
	});
});

//game io interaction
nspGame.on ("connection", function(socket) {
	console.log(sess.username + " joined game");
	
	//add new user to clients
	gameclients.push({sid: socket.id, username: sess.username});
	
	if (sess.opponentlobbyid !== null) {
		console.log("Calling other player");
		//call opponent to game
		nspLobby.connected[sess.opponentlobbyid].emit("pull to game", socket.id);
	} else {
		console.log("Other player has arrived");
		//make connection to other player
		var opponentid = sess.opponentgameid;
		var username = sess.username;
		nspGame.connected[opponentid].emit("handshake", socket.id, username, 0);

		//labeling the variables for both players 
		human = opponentid;
		zombie = socket.id;
		zombiename = username;

		//testing is the person that was challenged? zombie challenge human -> opponentid is human!
		
		//nspGame.emit("Player", opponentid, socket.id, username);
		nspGame.emit("Player", socket.id, username, 0);
		console.log("opponentid " + opponentid);
		console.log("socket.id " + socket.id);

		//console.log("human" + human);
		nspGame.connected[human].emit("disable");
	}
	


	///changed the bottom half of this functions
	socket.on("return handshake", function(sid) {
		console.log("handshake returned");
		var index = findIndex(gameclients, "sid", socket.id);
		var username = gameclients[index].username;
		nspGame.connected[sid].emit("handshake", socket.id, username, 1);

		//you get human name from here
		humanname = username;

		//verify got right player playing
		console.log("Human " + human);
		console.log("humanname " + humanname);
		console.log("Zombie " + zombie);
		console.log("zombiename " + zombiename);
	});


	/////dice rolling code and stop button actions 
	socket.on("diceroll", function(data){
		console.log("dice json recieved");
		var images = checkDice(data.dice10, data.dice20, data.dice30);
		var numberofresult = countDice(data.dice10, data.dice20, data.dice30);
		nspGame.emit("dicerollresult", data, images);
		nspGame.emit("countScore", numberofresult);
	});

	//track of how many brains when player presses stop
	socket.on("TrackScore", function(sid, numberofbrains){
		if(sid === zombie){
			zombiebrains = numberofbrains;
		}
		else{
			humanbrains = numberofbrains;
		}
	});


	socket.on("stopScore", function(sid) {
		console.log("sid when stopScore " + sid);
		var username, 
			sendbrains = 0;

		//check for turns 
		if(sid === zombie){
			console.log("disable zombie player");
			sid = human;
			username = humanname;
			sendbrains = humanbrains;
			nspGame.connected[zombie].emit("disable");  //disable prev player
		}
		else {
			console.log("disable human player");
			sid = zombie;
			username = zombiename;
			sendbrains = zombiebrains;
			nspGame.connected[human].emit("disable"); 
		}

		nspGame.emit("Player", sid, username, sendbrains);
		nspGame.connected[sid].emit("enable");
		console.log("Current Player " + sid);
		console.log("Current brains " + sendbrains);
	});


	socket.on("winner", function(sid){
		//var sendname;
		zombiebrains = 0;
		humanbrains = 0;
		//need to make a looser update
		//run twice ran workaround to only let winnderupdate run once
		nspGame.connected[sid].emit("disable");
		nspGame.connected[sid].emit("winnerUpdate", ran);
		ran++;
	});

	socket.on("clearBoard", function(){
		nspGame.emit("resetStats");
	});

	socket.on("disconnect", function () {
		console.log("someone disconnected");
		ran = 0; //resets winner runtime count 
	});
});
