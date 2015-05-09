function newRegistration() {
	var username, pw1, pw2, email, reginfo;

	username = $("#registrationarea #username").val();
	pw1 = $("#registrationarea #password").val();
	pw2 = $("#registrationarea #password2").val();
	email = $("#registrationarea #email").val();

	if (username === "") {
		alert("Username cannot be empty");
	} else if (pw1 === "" || pw2 === "") {
		alert("Password cannot be empty");
	} else if (email === "") {
		alert("Email cannot be empty");
	} else if (pw1 !== pw2) {
		alert("Passwords must match");
	} else {
		reginfo = {"username":username, "password":pw1, "email": email};
		$.post("/registration", reginfo, function(response) {
			if (response.registration) {
				//alert("Registration Complete, Please log in to continue");
				$("#registrationarea").hide();
				$("#regSuccessful").show();
			}
			else {
				alert("Username already in use");
			}
		});

	}
}

function logon() {
	username = $("#registrationarea #username").val();
	pw1 = $("#registrationarea #password").val();
	reginfo = {"username":username, "password":pw1};
	
	console.log(reginfo);
	
	$.post("/userlogin", reginfo, function(response) {
		if (response.logon) {
			$(location).attr('href', "lobby.html");
		}
	});
}

var main = function() {
	"use strict"
	
	//register
	$("#RegSubmit").click(function() {
		newRegistration();
	});
	
	//Cancel
	$("#RegCancel").click(function() {
		$(location).attr('href', "index.html");
	});
	
	//Login
	$("#Login").click(function() {
		logon();
	});
};

$(document).ready(main);