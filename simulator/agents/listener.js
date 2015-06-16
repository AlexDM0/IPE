var eve = require('evejs');
var Promise = require('promise');

function Listener(id, transport) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout:200000}); // option 1

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  this.listeners = {};
  this.transport = transport;
  this.transport.register('listener', this.handleMessage.bind(this));

  console.log("starting listener")

}

// extend the eve.Agent prototype
Listener.prototype = Object.create(eve.Agent.prototype);
Listener.prototype.constructor = Listener;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
Listener.prototype.handleMessage = function (message) {
  //console.log("received message:", message);
  for (var listener in this.listeners) {
    this.rpc.request(listener, {method:"incomingMessage",params:{message:message}}).then().catch(function (err) {
      delete this.listeners[listener];
      console.log("removing listener:", listener);
    });
  }
};

Listener.prototype.rpcFunctions = {};
Listener.prototype.rpcFunctions.register = function(params,sender) {
  this.listeners[sender] = sender;
};

module.exports = Listener;
