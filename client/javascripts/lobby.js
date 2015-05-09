var socket;

var main = function() {
	"use strict";
	
	//socket = io();
	socket = io('http://localhost:3000/lobby');
	
	//Get user win/loss record
	$.getJSON("/getrecord", function (response) {
		$("#username").empty();
		$("#username").append(response.username);
		
		$("#wins").empty();
		$("#wins").append(response.wins);
		
		$("#losses").empty();
		$("#losses").append(response.losses);
	});
	
	//Login
	$("#Logoff").click(function() {
		$.get("/logoff", function(response) {
			if (response.logoff) {
				$(location).attr('href', "index.html");
			}
		});
	});
	
	//Send challenge
	$("#btnChallenge").click(function() {
		console.log("challenge button clicked");
		var sid = $("#onlineplayers").val();
		if (sid !== null) {
			$("#waitingpopup").show();
			socket.emit("challenge", sid);
			console.log("Challenge sent to :" + sid);
		} else {
			console.log ("nothing selected");
		}
	});
	
	//Decline challenge
	$("#challengepopup #chDecline").click(function() {
		var sid = $("#challengepopup #challengeid").val();
		$("#challengepopup").hide();
		socket.emit("declined", sid);
	});
	
	//Accept challenge
	$("#challengepopup #chAccept").click(function() {
		var sid = $("#challengepopup #challengeid").val();
		$("#challengepopup").hide();
		console.log("Challengers sid: " + sid);
		//socket.emit("accepted", sid);
		$(location).attr('href', "/startgame/" + sid);
	});
	
	//Close declined popup
	$("#btnDeclineClose").click(function() {
		$("#declinedpopup").hide();
	});
	
	//update available players area
	//player joins
	socket.on('user join', function(username, id) {
		var $messageUser;
		$messageUser = $("<option id= '" + id + "' value= '" + id + "'>").text(username + " is in the lobby.");
		$("#onlineplayers").append($messageUser);
	});
	
	//player leaves
	socket.on('user left', function(id) {
		console.log("Remove: " + "#" + id);
		$("#" + id).remove();
	});

	//show the current available players
	socket.on('current lobby', function(clients) {
		var $messageUser;
		for (var i in clients) {
			$messageUser = $("<option id= '" + clients[i].sid + "' value= '" + clients[i].sid + "'>").text(clients[i].username + " is in the lobby.");
			$("#onlineplayers").append($messageUser);
		}
	});
	
	//recieve a challenge request
	socket.on('challenge recieved', function(username, sid) {
		console.log("challenged recieved by " + username + " at " + sid);
		$("#challengepopup").show();
		$("#fade").show();
		$("#challengepopup #challenger").empty();
		$("#challengepopup #challenger").append(username);
		$("#challengepopup #challengeid").val(sid);
	});
	
	//recieve decline
	socket.on('challenge declined', function() {
		console.log("challenge declined");
		$("#waitingpopup").hide();
		$("#declinedpopup").show();
	});
	
	//recieve accept
	socket.on('challenge accepted', function(sid) {
		console.log("challenge accepted by " + sid);
		$("#waitingpopup").hide();
		//$(location).attr('href', "/game/" + sid);
	});
	
	//pull to game
	socket.on('pull to game', function(sid) {
		console.log("game sid: " + sid);
		$(location).attr('href', "/joingame/" + sid);
	});
};

$(document).ready(main);