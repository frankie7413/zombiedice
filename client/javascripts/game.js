var main = function () {
    "use strict";

    $("div.dice1").text("Rolling...");
    $("div.dice2").text("Rolling...");
    $("div.dice3").text("Rolling...");

    setInterval(function () {
        $("div.dice1").html("<image src='images/brain_roll.jpg'>");
        $("div.dice1_label").html("BRAIN");
    }, 1000);
    
    setInterval(function () {
        $("div.dice2").html("<image src='images/shotgun_roll.jpg'>");
        $("div.dice2_label").html("SHOTGUN");
    }, 2000);
    
    setInterval(function () {
        $("div.dice3").html("<image src='images/foot_roll.jpg'>");
        $("div.dice3_label").html("FEET");
    }, 3000);
    
};

$(document).ready(main);

function roll () {
    
};

function stop () {
    
};
