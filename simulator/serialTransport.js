'use strict';

var Promise = require('promise');
var serialPort = require('serialport');
var SerialPort = require('serialport').SerialPort;

function SerialTransport(activePort) {
  this.activePort = activePort;

  this.availablePorts = {};
  this.connections = {};

  this.UART_Message = '';
  this.endString = String.fromCharCode(10);
  this.listeners = {};
}

SerialTransport.prototype.connect = function () {
  return this.scanAvailablePorts()
    .then(function () {
      return this.scanAndConnect(this.activePort);
    }.bind(this));
}


SerialTransport.prototype.scanAvailablePorts = function() {
  return new Promise(function (resolve, reject) {
    serialPort.list(function (err, ports) {
      ports.forEach(function(port) {
        this.availablePorts[port.comName] = {port:port, connected:false};
      }.bind(this));
      resolve();
    }.bind(this));
  }.bind(this));
};

SerialTransport.prototype.scanAndConnect = function() {
  for (var port in this.availablePorts) {
    if (this.availablePorts.hasOwnProperty(port)) {
      if (this.activePort === undefined || this.activePort === port) {
        var portData = this.availablePorts[port];
        if (portData.connected != true) {
          if (this.activePort === undefined) {
            this.activePort = portData.port.comName;
          }
          this.connections[portData.port.comName] = new SerialPort(portData.port.comName, {baudrate: 4800}, false);
        }
      }
    }
  }

  var promiseBin = [];
  for (port in this.connections) {
    promiseBin.push(this.connectToSerial(port));
  }

  return Promise.all(promiseBin);
};

SerialTransport.prototype.connectToSerial = function(port) {
  return new Promise(function (resolve, reject) {
    this.connections[port].open(function (error) {
      if (error) {
        console.log('ERROR in connection with:' + port);
        reject('failed to open: ' + error);
      }
      else {
        console.log('opened connection with:' + port);
        this.connections[port].on('data', function (d) {this.handleUART(d + '')}.bind(this));
        resolve();
      }
    }.bind(this));
  }.bind(this));
};

SerialTransport.prototype.handleUART = function(data) {
  this.UART_Message += data;
  var endIndex = this.UART_Message.indexOf(this.endString);
  if (endIndex != -1) { // end of message received
    var fullMessage = this.UART_Message;
    var dataArray = fullMessage.split(this.endString);
    var processedMessage = dataArray[0];
    this.UART_Message = '';
    this.handleMessage(processedMessage);
    this.handleUART(data.substr(data.indexOf(this.endString) + this.endString.length));
  }
};

SerialTransport.prototype.register = function(id,callback) {
  this.listeners[id] = callback;
}

SerialTransport.prototype.unregister = function(id) {
  this.listeners[id] = undefined;
  delete this.listeners[id];
}

SerialTransport.prototype.handleMessage = function(message) {
  for (var listener in this.listeners) {
    this.listeners[listener](message);
  }
}

SerialTransport.prototype.closePort = function() {
  this.connections[this.activePort].close();
};

module.exports = SerialTransport;