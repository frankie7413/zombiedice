function logon() {
	username = $("#loginarea #username").val();
	pw1 = $("#loginarea #password").val();
	info = {"username":username, "password":pw1};
	
	$.post("/userlogin", info, function(response) {
		if (response.logon) {
			$("#wrongunpw").hide();
			$(location).attr('href', "lobby.html");
		} else {
			console.log("wrong username/password");
			$("#wrongunpw").show();
		}
	});
}

var main = function () {
	"use strict";
    
	//Login
	$("#loginsubmit").click(function() {
		logon();
	});
};

$(document).ready(main);