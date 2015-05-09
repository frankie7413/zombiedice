var socket;

var main = function() {
	"use strict";

	///connect to this namespace 
	socket = io('http://localhost:3000/ingame');
	//socket = io('/ingame');

	$('#roll').click(function(){
		console.log('roll click works');
		$.getJSON('/rolldice', function(dicestats){
			//console.log('Brains ' + dicestats.dice10);
			//rollClicked(dicestats.dice10, dicestats.dice20, dicestats.dice30);
			socket.emit('diceroll', dicestats);
		});

	});


	socket.on('dicerollresult', function(dices, images) {
		console.log('data results received');
		$("div.dice1").text("Rolling...");
	    $("div.dice2").text("Rolling...");
	    $("div.dice3").text("Rolling...");


	    $("div.dice1").html(images[0]);
	    $("div.dice1_label").html(dices.dice10);
	    
	    $("div.dice2").html(images[1]);
	    $("div.dice2_label").html(dices.dice20);

	    $("div.dice3").html(images[2]);
	    $("div.dice3_label").html(dices.dice30);

	}); 

	// function rollClicked(firstDice, secondDice, thirdDice) {

	// 	var images = checkDice(firstDice, secondDice, thirdDice);

	// 	$("div.dice1").text("Rolling...");
	//     $("div.dice2").text("Rolling...");
	//     $("div.dice3").text("Rolling...");


	//     $("div.dice1").html(images[0]);
	//     $("div.dice1_label").html(firstDice);
	    
	//     $("div.dice2").html(images[1]);
	//     $("div.dice2_label").html(secondDice);

	//     $("div.dice3").html(images[2]);
	//     $("div.dice3_label").html(thirdDice);
	// }


	// function checkDice(firstDice, secondDice, thirdDice)
	// {
	// 	var array = [firstDice, secondDice, thirdDice];
	// 	var arraylen = array.length;
	// 	for(var i = 0; i < arraylen; i++){
	// 		if(array[i] === "Brain"){
	// 			array[i] = "<image src='images/brain_roll.jpg'>";
	// 		}
	// 		else if(array[i] === "Feet"){
	// 			array[i] = "<image src='images/foot_roll.jpg'>";
	// 		}
	// 		else
	// 		{
	// 			array[i] = "<image src='images/shotgun_roll.jpg'>";
	// 		}
	// 	}

	// 	return array;
	// }



	$('#stop').click(function(){
       stop();
    });
	
	//Login
	$("#lobbyreturn").click(function() {
		$(location).attr('href', "/lobby");
	});
	
	socket.on('handshake', function(sid, username, ret) {
		console.log("handshake received from " + sid);
		$("#opponentid").val(sid);
		$("#opponentname").empty();
		$("#opponentname").append(username);
		if (ret === 0) {
			socket.emit("return handshake", sid);
		}
	});



    $("div.turn").text("Turn: ");
    $("div.brains").text("Brains: 1");
    $("div.shotguns").text("Shotguns: 1");
}

$(document).ready(main);

// function roll () {
    
// };

function stop () {
	socket.on('stop', function(sid, username, ret) {
		
		var brains = 5;
		$("div.brains").text("Brains: " + brains);

		if (ret === 0) {
			socket.emit("stop and score", sid, brains);
		}
	});
};