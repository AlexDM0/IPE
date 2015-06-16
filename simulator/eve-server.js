"use strict"

var eve = require('evejs');
var Promise = require("promise");
var SimulatorProxy = require('./agents/simulatorProxy');
var Actuator = require('./agents/actuator');
var Listener = require('./agents/listener');
var SerialTransport = require('./serialTransport');

// configure eve
eve.system.init({
  transports: [
    {
      type: 'ws',
      url: 'ws://localhost:3000/agents/:id'
    }
  ]
});


var transport = new SerialTransport();
//var transport = new SerialTransport('/dev/ttyACM1');
transport.connect().then(function() {
  var proxy = new SimulatorProxy('proxy',transport);
  var listener = new Listener('listener',transport);
  var actuator = new Actuator('actuator',transport);
}).done();


