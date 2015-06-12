'use strict';

var Promise = require('promise');
var SimulatorProxy = require('./agents/simulatorProxy');
var minify = require('minify');

function FirmwareWriter(transport) {
  this.transport = transport;
  this.transport.handleMessage = this.handleMessage.bind(this);
  this.activePort = this.transport.activePort;

  this.availablePorts = {};
  this.connections = {};
  this.queue = [];
  this.judgementFunctions = {};
  this.chunksize = 80;
  this.defaultChannel = '1';
  this.uartTimeout = 600; // ms between sending packages that go over the mesh

  this.UART_Message = '';
  this.endString = String.fromCharCode(10);
  this.firmwareCode = '$$$';
  this.crcCode = '@@@';
}

FirmwareWriter.prototype.upload = function(game) {
  return new Promise(function(resolve, reject) {
    minify('games/' + game + '.js', function(error, data) {
      if (error) {
        console.error(error.message);
        reject (error.message);
      }
      else {
        var processedData = data.replace(/(\$)/g,'R');
        processedData = processedData.replace(/(@)/g,'D');
        processedData = processedData.replace(/(%)/g,'@P@');
        var correctedData = this.firmwareCode + processedData + this.firmwareCode;
        this.send(correctedData)
          .done(function () {
            resolve();
          }.bind(this));
      }
    }.bind(this))
  }.bind(this));
}

FirmwareWriter.prototype.send = function(message) {
  return new Promise(function (resolve, reject) {
    this.queue = [];
    this.judgementFunctions = {};

    if (message.length > this.chunksize) {
      var amountOfSends = Math.ceil(message.length / this.chunksize);
      for (var i = 0; i < Math.ceil(amountOfSends); i++) {
        var chunk = message.substr(this.chunksize * i, this.chunksize);
        this.prepareMessage(chunk,i);
      }
    }
    this.queue.push({func:resolve, end:true, pending:false, completed:false, index:i+1});
    this.runQueue();
  }.bind(this));
};

FirmwareWriter.prototype.runQueue = function() {
  for (var i = 0; i < this.queue.length; i++) {
    if (this.queue[i].completed === false) {
      setTimeout(this.queue[i].func.bind(this), 5 * i);
      this.queue[i].pending = true;
      if (this.queue[i].end === true) {
        break;
      }
    }
  }
};

FirmwareWriter.prototype.prepareMessage = function(message,index) {
  var subsegmentLength = this.chunksize;
  if (message.length - subsegmentLength < 10) {
    subsegmentLength -= 10;
  }
  var checksum = this.getChecksum(message);

  // append channel 1
  message = this.defaultChannel + message;

  var amountOfSends = Math.ceil(message.length / subsegmentLength);
  for (var i = 0; i < amountOfSends; i++) {
    var subsample = message.substr(i * subsegmentLength, subsegmentLength);
    this.generateWriteFunction(subsample, i == amountOfSends - 1, checksum, index);
  }
  this.generateJudgementFunction(index);
};

FirmwareWriter.prototype.generateWriteFunction = function(message, triggerEnd, checksum, index) {
  var writeFunction = function () {
    var msg = 'Serial4.print(\"' + message.replace(/(")/g,'\\"');
    if (triggerEnd === true) {
      msg += this.crcCode + checksum + '\" + String.fromCharCode(1))\n';
    }
    else {
      msg += '\")\n';
    }
    this.transport.connections[this.activePort].write(msg);
    //console.log("sending:", msg);
  }.bind(this);

  this.queue.push({func:writeFunction, end:triggerEnd, pending:false, completed:false, index:index});
};

FirmwareWriter.prototype.generateJudgementFunction = function(index) {
  var passFunction = function () {
    var msg = 'Serial4.print(String.fromCharCode(0));\n';
    this.transport.connections[this.activePort].write(msg);
    console.log('PASSED');
  }.bind(this);

  var failFunction = function () {
    var msg = 'Serial4.print(String.fromCharCode(2));\n';
    this.transport.connections[this.activePort].write(msg);
    console.log('FAILED, retrying...');
  }.bind(this);

  this.judgementFunctions[index] = {pass:passFunction, fail:failFunction};
};

FirmwareWriter.prototype.getChecksum = function(message) {
  var checksum = 0;
  for (var letter in message) {
    checksum += message.charCodeAt(letter);
  }
  return checksum;
};


FirmwareWriter.prototype.repeatChunk = function() {
  var failed = false;
  for (var i = 0; i < this.queue.length; i++) {
    if (this.queue[i].pending === true) {
      var index = this.queue[i].index;
      this.queue[i].pending = false;
      this.queue[i].completed = false;
      if (failed == false) {
        this.judgementFunctions[index].fail();
        failed = true;
      }
    }
  }

  setTimeout(this.runQueue.bind(this), this.uartTimeout);
};

FirmwareWriter.prototype.nextChunk = function() {
  var passed = false;
  for (var i = 0; i < this.queue.length; i++) {
    if (this.queue[i].pending === true) {
      var index = this.queue[i].index;
      this.queue[i].pending = false;
      this.queue[i].completed = true;
      if (passed == false) {
        this.judgementFunctions[index].pass();
        passed = true;
      }
    }
  }
  setTimeout(this.runQueue.bind(this), this.uartTimeout);
};


FirmwareWriter.prototype.handleMessage = function(message) {
  if (message != '=undefined\r') {
    var crcPrefix = message.indexOf('CRC:');
    if (message.substr(crcPrefix,4) == 'CRC:') {
      var remoteCRC = message.substr(message.indexOf(this.crcCode)+this.crcCode.length, message.length - (message.indexOf(this.crcCode) + this.crcCode.length + 1));
      var localCRC = this.getChecksum(message.substr(crcPrefix + 5, message.indexOf(this.crcCode)- (crcPrefix + 5)));
      if (remoteCRC == localCRC) {
        this.nextChunk();
      }
      else {
        this.repeatChunk();
      }
    }
    else {
      console.log(message);
    }
  }
};


module.exports = FirmwareWriter;