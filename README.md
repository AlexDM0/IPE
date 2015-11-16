# IPE
Simulator environment for interactive play design

# Setup
Before you can start the server you need to install NPM and NodeJS (Tested with nodeJS 0.12).
- Open a terminal and navigate to the root of this repo (where package.json is living)
- npm install
- woohoo!

## Setting up the USB module
The USB module is an espruino connected to a custom shield created for IPE. This shield has a RFDUINO module loaded with custom bluenet code,
which can be found here: https://github.com/AlexDM0/bluenet/tree/mesh

The USB module should be loaded with the code in ./espruino/simpleForwarder.js
How to load code onto an espruino is described on www.espruino.com

## Setting up the tiles
The tiles contain the same modules as the USB forwarder. These need to be loaded with the code in ./espruino/espruinoLib.js


# Connecting through USB
Depending if you're running Windows or Unix, you may have to change the code in ./simulator/eve-server.js a bit.

Windows:
```
var transport = new SerialTransport();
```

UNIX:
```
var transport = new SerialTransport('/dev/ttyACM1');
```

For UNIX you may have to match the address (ttyACM1) to the correct port.

# Creating new games
The folder games (./simulator/games) contains the games. A game is contained in a json file like so:
```
// important! the name of the JSON variable has to be __behaviour
var __behaviour = {
  init: function() {},          // automatically called when the node is started
  steppedOn: function() {},     // automatically called when the node is stepped on
  steppedOff: function() {},    // automatically called when a user steps off the node
  handleMessage: function(message, rssi) {}  // automatically called when the a message comes in
}

// API: These methods can be called within the game. (this.sendMessage(...) etc)
//      sendMessage(message)  --> send a message to everyone (max length = 80 characters), string or object.
//      setColor(r,g,b,index) --> set one of the colors (r,g,b [0..255], index [1..3])
//      setColors(r,g,b)      --> set all of the colors at once (r,g,b [0..255])
```

A few games are prepared as examples.

# Starting the server
Before you can start the server you need to install NPM and NodeJS (Tested with nodeJS 0.12).
- Open a terminal and navigate to ./simulator/
- node eve-server
- woohoo!

# Starting the simulator
This is an easy one. Open ./simulator/index.html in the Chrome Browser. Make sure the server is running.
Refresh the simulator in case something goes wrong.

# Using the simulator
- You can click on a node to "step" on it.
- When you release the click, the node fires steppedOff.
- You can hold shift and drag the nodes around with the mouse.

# Using the actuator
With the actuator you can manually send messages to the mesh network. To run the example,
open the actuator.html (./simulator/actuator.html) in the Chrome browser. Make sure the eve-server is also running.

# Using the viewer
The viewer is just listening for messages on the mesh network and sending showing them as they come by. To run the example,
open the viewer.html (./simulator/viewer.html) in the Chrome browser. Make sure the eve-server is also running.



