
function SimulatorProxy(id) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout:200000}); // option 1

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  this.games = [];

}

// extend the eve.Agent prototype
SimulatorProxy.prototype = Object.create(eve.Agent.prototype);
SimulatorProxy.prototype.constructor = SimulatorProxy;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
SimulatorProxy.prototype.rpcFunctions = {};

SimulatorProxy.prototype.getGames = function () {
  return this.rpc.request("ws://127.0.0.1:3000/agents/proxy", {method:'getGames', params:{}});
}


SimulatorProxy.prototype.uploadGame = function (game) {
  return this.rpc.request("ws://127.0.0.1:3000/agents/proxy", {method:'uploadGame', params:{game:game}});
}

SimulatorProxy.prototype.rpcFunctions.finishedUpload = function (params, sender) {
  uploadSuccess();
}

SimulatorProxy.prototype.rpcFunctions.uploadHalfway = function (params, sender) {
  uploadHalfway();
}

SimulatorProxy.prototype.rpcFunctions.errorInUpload = function (params, sender) {
  uploadFailed(params.message);
}



