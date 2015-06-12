
function GlowstepAgent() {
  this._colors = {
    1:{color:{r:0,g:0,b:0}, pins:{r:C8,g:C7,b:C6}},
    2:{color:{r:0,g:0,b:0}, pins:{r:C9,g:B3,b:B8}},
    3:{color:{r:0,g:0,b:0}, pins:{r:B9,g:A0,b:A1}}
  };
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
  if (typeof message === 'object') {
    message = JSON.stringify(message);
  }

  var channel = 1;
  if (alternateChannel === true) {
    channel = 2;
  }

  // typecast to string
  message = message + '';

  if (message.length > 80) {
    console.error("Message is too long, only 80 characters allowed, you have " + message.length + ":", message);
  }

  // send message
  Serial4.print(channel + message + String.fromCharCode(0));
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




function __initSensorDeck() {
  sensorIndex = 0;
  sensorDeck = [];
  for (var i = 0; i < sensorWindow; i++) {
    sensorDeck.push(0);
  }
}

function __setSensorWatch() {
  if (sensorWatch !== undefined) {
    clearInterval(sensorWatch);
  }
  sensorWatch = setInterval(function () {
    var sensorValue = analogRead(C4);
    sensorDeck[sensorIndex] = sensorValue;
    sensorIndex = (sensorIndex + 1) % sensorWindow;
    var value = 0;
    for (var i = 0; i < sensorWindow; i++) {
      value += sensorDeck[i];
    }
    value /= sensorWindow;
    if (value > SENSOR_THRESHOLD && steppedOnState === 0) {
      steppedOnState = 1;
      theAgent.steppedOn();
    }
    else if (value <= SENSOR_THRESHOLD && steppedOnState === 1) {
      theAgent.steppedOff();
      steppedOnState = 0;
    }
  },20);
}


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
      var meshOffset = 6; // 6 is MESH:x where x is the channel number;
      var messageContent = processedMessage.substr(meshIndex+meshOffset,processedMessage.length);
      checkForFirmware(messageContent);
      if (COLLECT_FIRMWARE === false) {
        theAgent.handleMessage(messageContent,LAST_RSSI_DISTANCE)
      }
    }
    else if (rssiIndex !== -1) {
      var rssiOffset = 5; // 5 is RSSI:
      LAST_RSSI = -1*Number(processedMessage.substr(rssiIndex+rssiOffset,processedMessage.length));
      LAST_RSSI_DISTANCE = Math.pow(Math.E, (((LAST_RSSI + 60) * Math.LN10)/(-20)));
    }
    else {
      console.log('other:',processedMessage);
    }
    handleUART(data.substr(data.indexOf(endString) + endString.length));
  }
}

function checkForFirmware(processedMessage) {
  // firmware symbol located.
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
      var localChecksum = getChecksum(seg);
      if (checksum != localChecksum) {
        console.log("INVALID:", seg, localChecksum, checksum)
        setInvalidFirmware();
      }
      else {
        FIRMWARE_MESSAGE = FIRMWARE_MESSAGE + processedMessage.substr(startOfFirmware, endOfFirmware - startOfFirmware);
      }
    }

  }

  if (firmwareComplete === true) {
    // remove the last 3 digits for the end of firmware code.
    FIRMWARE_MESSAGE = FIRMWARE_MESSAGE.substr(0,FIRMWARE_MESSAGE.length - FWtagLength);
    processFirmware(FIRMWARE_MESSAGE);
    COLLECT_FIRMWARE = false;
    FIRMWARE_MESSAGE = "";
  }
  return COLLECT_FIRMWARE;
}

function getChecksum(message) {
  var checksum = 0;
  for (var letter in message) {
    checksum += message.charCodeAt(letter);
  }
  return checksum;
}

function setReadingFirmware() {
  theAgent.setColor(0,255,0);
  setTimeout(function () {theAgent.setColor(0  ,0  ,0  );}.bind(this), 100);
  setTimeout(function () {theAgent.setColor(0  ,0  ,255);}.bind(this), 200);
  setTimeout(function () {theAgent.setColor(0  ,255,0  );}.bind(this), 300);
}

function setInvalidFirmware() {
  IGNORE_FIRMWARE = true;
  FIRMWARE_MESSAGE = "";
  console.log('INVALID_FIRMWARE');

  theAgent.setColor(255,0,0);
  setTimeout(function () {theAgent.setColor(0  ,0  ,0  );}.bind(this), 100);
  setTimeout(function () {theAgent.setColor(255,0  ,0  );}.bind(this), 200);
}

function processFirmware(firmwareString) {
  while (firmwareString.indexOf("@P@") != -1) {
    firmwareString = firmwareString.replace("@P@","%");
  }
  eval(firmwareString);
  GLOBAL_BEHAVIOUR = __behaviour;
  console.log("Firmware received, rebooting");
  save();
}

function bootAgent() {
  theAgent = new GlowstepAgent();
  theAgent.loadBehaviour(GLOBAL_BEHAVIOUR);
}

var sensorDeck = [];
var theAgent;
var sensorIndex = 0;
var sensorWindow = 5;
var steppedOnState = 0;
var SENSOR_THRESHOLD = 0.25;
var endString = String.fromCharCode(10);
var sensorWatch = undefined;
var UART_Message = "";
var FIRMWARE_MESSAGE = "";
var FWsymbol = "$";
var FWtag = "$$$";
var FWtagLength = FWtag.length;
var COLLECT_FIRMWARE = false;
var IGNORE_FIRMWARE = false;
var LAST_RSSI = 0;
var LAST_RSSI_DISTANCE = 0;
var AGENT_ID = 0;

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
  clearInterval();
  clearTimeout();
  clearWatch();

  sensorWatch = undefined;

  AGENT_ID = (Math.round(Math.random()*(36*36*36 - 1))).toString(32);

  Serial4.setup(9600,{rx:C11,tx:C10});
  Serial4.removeAllListeners('data');
  Serial4.on('data', function (data) {handleUART(data);});

  bootAgent();

  __initSensorDeck();
  __setSensorWatch();
}

save();