#!/usr/bin/env node

var app = require('express')()
   ,server = require('http').createServer(app)
   ,io = require('socket.io').listen(server,{'log level':0})
   ,express = require('express')
   ,WSCCP = require('../..');

app.use(express.static('static'));
app.get('/',function(req,res) { res.sendfile('static/index.html'); });

io.sockets.on('connection',function(socket) {
	socket.on('start',function() {
		var wsccp = new WSCCP();
		wsccp.findAllCars(function(results){
			console.log("DONE");
		},{
			fnProgress: function(progress) {
				socket.emit('progress',Math.floor(progress*100)+'%');
			},
			fnCarFound: function(result) {
				console.log("FOUND CAR");
				socket.emit('car',result);
			}
		});
	});
});

server.listen('12333');