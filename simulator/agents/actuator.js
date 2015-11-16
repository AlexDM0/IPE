var eve = require('evejs');
var Promise = require('promise');

function Actuator(id, transport) {
  // execute super constructor
  eve.Agent.call(this, id);
  this.transport = transport;
  this.activePort = this.transport.activePort;

  // in case there are no ports but the address is hardcoded (unix)
  if (Object.keys(this.transport.availablePorts).length == 0) {
    this.activePort = undefined;
  }

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout:200000}); // option 1

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  this.listeners = {};
  this.transport = transport;

  console.log("starting actuator")

}

// extend the eve.Agent prototype
Actuator.prototype = Object.create(eve.Agent.prototype);
Actuator.prototype.constructor = Actuator;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.

Actuator.prototype.rpcFunctions = {};
Actuator.prototype.rpcFunctions.sendToMesh = function(params,sender) {
  if (this.activePort === undefined) {
    console.info("Could not connect with the USB module. Check conenction and restart the server.");
  }
  else {
    var msg = "Serial4.print(\'1" + JSON.stringify({
        n: "pc",
        m: params.message
      }) + "\'" + "+ String.fromCharCode(0));\n";
    this.transport.connections[this.activePort].write(msg);
  }
};

module.exports = Actuator;
