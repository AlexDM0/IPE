"use strict"

//var codein = require("node-codein");
var eve = require('evejs');
var Promise = require("promise");
var SimulatorProxy = require('./agents/simulatorProxy');
var SerialTransport = require('./serialTransport');
var FirmwareWriter = require('./firmwareWriter');

var transport = new SerialTransport('/dev/ttyACM0');
transport.connect()
  .then(function () {
    var writer = new FirmwareWriter(transport);
    writer.upload('toggle').then(function () {
      console.log("Finished!");
      transport.closePort();
    });
  })
  .done();
