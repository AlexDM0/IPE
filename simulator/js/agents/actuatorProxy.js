
function ActuatorProxy(id) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout:200000}); // option 1

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());
}

// extend the eve.Agent prototype
ActuatorProxy.prototype = Object.create(eve.Agent.prototype);
ActuatorProxy.prototype.constructor = ActuatorProxy;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
ActuatorProxy.prototype.setRed = function() {
  console.log("hello RED")
  return this.rpc.request("ws://127.0.0.1:3000/agents/actuator",{method:'sendToMesh',params:{color:'red'}});
}
ActuatorProxy.prototype.setGreen = function() {
  return this.rpc.request("ws://127.0.0.1:3000/agents/actuator",{method:'sendToMesh',params:{color:'green'}});
}

ActuatorProxy.prototype.rpcFunctions = {};




