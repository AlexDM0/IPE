/**
 * This software should be installed on the step modules. It loads a behaviour which can be uploaded as a game.
 *
 * DOT NOT ALTER UNLESS YOU KNOW WHAT YOU'RE DOING!
 * @constructor
 */




function GlowstepAgent() {
  this._colors = {
    1:{color:{r:0,g:0,b:0}, pins:{r:C6,g:C7,b:C8}},
    2:{color:{r:0,g:0,b:0}, pins:{r:B8,g:B3,b:C9}},
    3:{color:{r:0,g:0,b:0}, pins:{r:A1,g:A0,b:B9}}
  };
  this.setColor(0,0,0);
  this._distanceList = {};
}

/**
 * Load a game into the glowstep. Cleanup is not required. Before loading the stepAgents are created anew.
 * @param behaviour
 * @private
 */
GlowstepAgent.prototype.loadBehaviour = function(behaviour) {
  if (Object.keys(behaviour) > 0) {
    for (var fn in behaviour) {
      if (behaviour.hasOwnProperty(fn)) {
        this[fn] = behaviour[fn];
      }
    }

    this.init.call(this);
  }
};


/**
 * Set the color of one of the lights. A glowstep has 3 lights.
 * @param {Number} r [0..255]
 * @param {Number} g [0..255]
 * @param {Number} b [0..255]
 * @param {Number} index  [1..3]
 */
GlowstepAgent.prototype._setColor = function(r,g,b,index) {
  if (this._colors[index] !== undefined) {
    analogWrite(this._colors[index].pins.r, r/255);
    analogWrite(this._colors[index].pins.g, g/255);
    analogWrite(this._colors[index].pins.b, b/255);
  }
  else {
    console.error("invalid index!", index);
  }
};

//********************* <API> *********************//

/**
 * This adds the envelope containing a faked distance value
 * @param message
 */
GlowstepAgent.prototype.sendMessage = function(message, alternateChannel) {
  var channel = 1;
  if (alternateChannel === true) {
    channel = 2;
  }

  // wrap in envelope
  message = JSON.stringify({n:AGENT_ID, m:message});

  if (message.length > 80) {
    console.error("Message is too long, only 80 characters allowed, you have " + message.length + ":", message);
  }
  // send message
  Serial4.print(channel + message + String.fromCharCode(0));
};

GlowstepAgent.prototype.processIncomingMessage = function(message, distance) {
  var messageObj = JSON.parse(message);
  if (messageObj !== undefined) {
    if (messageObj.n !== undefined) {
      if (this._distanceList[messageObj.n] === undefined) {
        this._distanceList[messageObj.n] = {avg: 0, deck: [0, 0, 0, 0, 0], index: 0};
      }
      var entree = this._distanceList[messageObj.n];
      entree.deck[entree.index] = distance;
      entree.index = (entree.index + 1) % entree.deck.length;

      entree.avg = 0;
      for (var i = 0; i < entree.deck.length; i++) {
        entree.avg += entree.deck[i];
      }
      entree.avg /= entree.deck.length;

      this.handleMessage(messageObj.m, distance);
    }
  }
};


/**
 * Set the color of all the 3 lights
 * @param {Number} r [0..255]
 * @param {Number} g [0..255]
 * @param {Number} b [0..255]
 */
GlowstepAgent.prototype.setColor = function(r,g,b,index) {
  if (index === undefined) {
    this._setColor(r,g,b,1);
    this._setColor(r,g,b,2);
    this._setColor(r,g,b,3);
  }
  else {
    this._setColor(r,g,b,index);
  }
};


/**
 * get the distance to the agent
 * @param agentId
 * @returns {*|number}
 */
GlowstepAgent.prototype.getDistance = function(agentId) {
  console.log('distance',this._distanceList[agentId].r);
  return this._distanceList[agentId].r;
};

/**
 * get the distance to the agent
 * @param agentId
 * @returns {*|number}
 */
GlowstepAgent.prototype.getRandomAgent = function() {
  var ids = Object.keys(this._distanceList);
  return ids[Math.floor(Math.random() * ids.length)];
};



//********************* <OVERLOADABLES> *********************//
GlowstepAgent.prototype.init = function () {
  //console.log("init is not overloaded.");
}

GlowstepAgent.prototype.steppedOn = function () {
  //console.log("steppedOn not overloaded");
  //alert("Select a game first.");
};

GlowstepAgent.prototype.steppedOff = function () {
  //console.log("steppedOff not overloaded");
  //alert("Select a game first.");
};



GlowstepAgent.prototype.handleMessage = function (message, distance) {
  console.log("hanldeMessage not overloaded", message, distance);
};
//********************* </OVERLOADABLES> *********************//

//********************* </API> *********************//


/**
 * setup sensor data structure, used for step detection.
 * @private
 */
function __initSensorDeck() {
  sensorIndex = 0;
  sensorDeck = [];
  for (var i = 0; i < sensorWindow; i++) {
    sensorDeck.push(0);
  }
}


/**
 *
 * The sensor will be calibrated based on the step. This may need to be updated
 * if different step detection hardware is used.
 * @type {number}
 */
var sensorLow = 0.2;
var sensorHigh = 0.6;
function __setSensorWatch() {
  setInterval(function () {
    var sensorValue = analogRead(C4);
    sensorDeck[sensorIndex] = sensorValue;
    sensorIndex = (sensorIndex + 1) % sensorWindow;
    var value = 0;
    for (var i = 0; i < sensorWindow; i++) {
      value += sensorDeck[i];
    }
    value /= sensorWindow;


    if (steppedOnState == 0) {
      sensorLow += 0.0005;
      sensorLow = sensorLow > value ? value : sensorLow;
    }
    else {
      sensorHigh -= 0.0005;
      sensorHigh = sensorHigh < value ? value : sensorHigh;
    }

    var diff = sensorHigh - sensorLow;
    var sensorThreshold = sensorLow + 0.5 * diff;
    //console.log(value,sensorThreshold,sensorHigh,sensorLow, steppedOnState);

    if (value > sensorThreshold && steppedOnState === 0) {
      steppedOnState = 1;
      theAgent.steppedOn();
    }
    else if (value < sensorThreshold && steppedOnState === 1) {
      theAgent.steppedOff();
      steppedOnState = 0;
    }
  },20);

}

/**
 * this will give a rough estimate of distance based off the RSSI
 * @param rssi
 */
function processRSSI(rssi) {
  LAST_RSSI_DISTANCE = Math.pow(Math.E, (((rssi + 60) * Math.LN10)/(-20)));
  console.log('parsed RSSI:', rssi, LAST_RSSI_DISTANCE);
}


/**
 * This handles the incoming data.
 * The data can be segmented in chunks
 * @param data
 */
function handleUART(data) {
  UART_Message += data;
  var endIndex = UART_Message.indexOf(endString);
  if (endIndex != -1) { // end of message received
    var fullMessage = UART_Message;
    var dataArray = fullMessage.split(endString);
    var processedMessage = dataArray[0];
    UART_Message = "";
    var meshIndex = processedMessage.indexOf("MESH:");
    var rssiIndex = processedMessage.indexOf("RSSI:");
    if (meshIndex !== -1) {
      var meshOffset = 6; // 6 is the length "MESH:x" where x is the channel number;
      var messageContent = processedMessage.substr(meshIndex+meshOffset,processedMessage.length);
      checkForFirmware(messageContent);
      if (COLLECT_FIRMWARE === false) {
        theAgent.processIncomingMessage(messageContent,LAST_RSSI_DISTANCE)
      }
    }
    else if (rssiIndex !== -1) {
      var rssiOffset = 5; // 5 is the length of "RSSI:"
      processRSSI(-1*Number(processedMessage.substr(rssiIndex+rssiOffset,processedMessage.length)));
    }
    else {
      console.log('other:',processedMessage); // do not know how to process this.
    }
    handleUART(data.substr(data.indexOf(endString) + endString.length));
  }
}

/**
 * this checks if this message is part of a firmware upload and checks the validity of the firmware.
 * it collects the firmware chunks and validates with checksum to avoid dropped bits messing up the code.
 * @param processedMessage
 * @returns {boolean}
 */
function checkForFirmware(processedMessage) {
  // check if firmware symbol is found. tag is $$$
  var firmwareComplete = false;
  var startOfFirmware = 0;
  var endOfFirmware = processedMessage.indexOf("@@@");
  if (processedMessage.indexOf(FWsymbol) !== -1) {
    var tagLocated = false;
    if (processedMessage.substr(0, FWtagLength) === FWtag) {
      if (COLLECT_FIRMWARE === true) {
        setInvalidFirmware();
      }
      else {
        setReadingFirmware();
        COLLECT_FIRMWARE = true;
        tagLocated = true;
        IGNORE_FIRMWARE = false;
        FIRMWARE_MESSAGE = "";
        startOfFirmware = FWtagLength;
        console.log("FOUND STARTER TAG", startOfFirmware);
      }
    }

    if (processedMessage.substr(endOfFirmware - FWtagLength, FWtagLength) === FWtag && IGNORE_FIRMWARE === false && COLLECT_FIRMWARE === true) { // successful finisher
      tagLocated = true;
      firmwareComplete = true;
      console.log("FOUND ENDING TAG");
    }

    if (tagLocated === false && COLLECT_FIRMWARE === true) { // invalid firmware, ignore
      setInvalidFirmware();
      COLLECT_FIRMWARE = false;
    }
    else if (tagLocated === false && COLLECT_FIRMWARE === false) { // invalid start of firmware collection, ignore
      setInvalidFirmware();
    }
  }

  if (COLLECT_FIRMWARE === true && IGNORE_FIRMWARE === false) {
    if (endOfFirmware === -1) {
      setInvalidFirmware();
    }
    else {
      var checksum = processedMessage.substr(endOfFirmware+3, processedMessage.length - endOfFirmware);
      var seg = processedMessage.substr(0, endOfFirmware);
      var localChecksum = _getChecksum(seg);
      if (checksum != localChecksum) {
        console.log("INVALID:", seg, localChecksum, checksum)
        setInvalidFirmware();
      }
      else {
        FIRMWARE_MESSAGE = FIRMWARE_MESSAGE + processedMessage.substr(startOfFirmware, endOfFirmware - startOfFirmware);
      }
    }

  }

  if (firmwareComplete === true && IGNORE_FIRMWARE === false) {
    // remove the last 3 digits for the end of firmware code.
    FIRMWARE_MESSAGE = FIRMWARE_MESSAGE.substr(0,FIRMWARE_MESSAGE.length - FWtagLength);
    theAgent.setColor(0,0,255);
    processFirmware(FIRMWARE_MESSAGE);
    COLLECT_FIRMWARE = false;
    FIRMWARE_MESSAGE = "";
  }
  else if (firmwareComplete === true) {
    onInit();
  }
  return COLLECT_FIRMWARE;
}

/**
 * get a checksum
 * @param message
 * @returns {number}
 * @private
 */
function _getChecksum(message) {
  var checksum = 0;
  for (var letter in message) {
    checksum += message.charCodeAt(letter);
  }
  return checksum;
}

/**
 * enable the reading firmware mode
 */
function setReadingFirmware() {
  clearInterval();
  clearTimeout();
  clearWatch();
  GLOBAL_COUNTER = 1;

  setInterval(function () {
    theAgent.setColor(0, 0, 0);
    theAgent.setColor(0, 255, 0, GLOBAL_COUNTER);
    GLOBAL_COUNTER = (GLOBAL_COUNTER % 3) + 1;
  }, 300);
}


/**
 * set the failed firmware upload mode
 */
function setInvalidFirmware() {
  IGNORE_FIRMWARE = true;
  FIRMWARE_MESSAGE = "";
  console.log('INVALID_FIRMWARE');
  clearInterval();

  theAgent.setColor(255,0,0);
  setTimeout(function () {theAgent.setColor(0  ,0  ,0  );}.bind(this), 100);
  setTimeout(function () {theAgent.setColor(255,0  ,0  );}.bind(this), 200);
}


/**
 * update the firmware based off the firmware string. Percent sign can mess things up to it has been escaped.
 * @param firmwareString
 */
function processFirmware(firmwareString) {
  while (firmwareString.indexOf("@P@") != -1) {
    firmwareString = firmwareString.replace("@P@","%");
  }
  eval(firmwareString);
  GLOBAL_BEHAVIOUR = __behaviour;
  console.log("Firmware received, rebooting");
  save();
}

/**
 * start the agent with its new behaviour
 */
function bootAgent() {
  theAgent = new GlowstepAgent();
  theAgent.loadBehaviour(GLOBAL_BEHAVIOUR);
}

var sensorDeck = [];
var theAgent;
var sensorIndex = 0;
var sensorWindow = 5;
var steppedOnState = 0;
var endString = String.fromCharCode(10);
var UART_Message = "";
var FIRMWARE_MESSAGE = "";
var FWsymbol = "$";
var FWtag = "$$$";
var FWtagLength = FWtag.length;
var COLLECT_FIRMWARE = false;
var IGNORE_FIRMWARE = false;
var LAST_RSSI_DISTANCE = 0;
var AGENT_ID = 0;
var GLOBAL_COUNTER = 0;

if (typeof GLOBAL_BEHAVIOUR === 'undefined') {
  var GLOBAL_BEHAVIOUR = {
    init: function() {
      this.colors = [
        {r:255,g:0,b:0},
        {r:0,g:255,b:0},
        {r:0,g:0,b:255},
        {r:0,g:0,b:0}
      ];
      this.colorIndex = 0;
      this.setColor(255,100,200);
    },

    steppedOn: function() {
      var color = this.colors[this.colorIndex];
      this.setColor(color.r,color.g,color.b);
      this.sendMessage("I was stepped on!");
      console.log("stepOn");
      this.colorIndex = (this.colorIndex + 1) % this.colors.length;
    },

    steppedOff: function() {
      console.log("stepOff");
    },

    handleMessage: function(message, distance) {
      console.log("I have a message!");
    }
  };
}

function onInit() {
  UART_Message = '';
  FIRMWARE_MESSAGE = '';
  clearInterval();
  clearTimeout();
  clearWatch();

  AGENT_ID = Math.round(Math.random() * (36*36*36-1)).toString(36);

  Serial4.setup(9600,{rx:C11,tx:C10});
  Serial4.removeAllListeners('data');
  Serial4.on('data', function (data) {handleUART(data);});

  bootAgent();

  __initSensorDeck();
  __setSensorWatch();
}

save();