#!/usr/bin/env node

var WSCCP = require('../..');
var _ = require('underscore');

var wsccp = new WSCCP();

wsccp.findAllCars(function(results) {
	console.log(results.length,"CARS FOUND");
},{
	fnProgress: function(progress,current,total,searchTerm) {
		console.log(Math.floor(progress*100)+"%",searchTerm);
	},
	fnCarFound: function(result) {
		console.log("Found car ["+result.plate+"]")
	}
});