
function ViewerProxy(id) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout:200000}); // option 1

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  this.register();
}

// extend the eve.Agent prototype
ViewerProxy.prototype = Object.create(eve.Agent.prototype);
ViewerProxy.prototype.constructor = ViewerProxy;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
ViewerProxy.prototype.register = function() {
  return this.rpc.request("ws://127.0.0.1:3000/agents/listener", {method:'register', params:{}});
}

ViewerProxy.prototype.rpcFunctions = {};


ViewerProxy.prototype.rpcFunctions.incomingMessage = function (params,sender) {
  if (params.message.indexOf("RSSI") === -1 && params.message.substr(0,1) !== ">" && params.message.substr(0,1) !== "=" && params.message.substr(0,1) !== "[") {
    items.add({start:new Date().valueOf(), content:params.message});
    var range = timeline.getWindow();

    if (range.end < new Date().valueOf()) {
      timeline.fit();
    }
  }
}




