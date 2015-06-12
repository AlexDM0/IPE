var eve = require('evejs');
var fs = require('fs');


function SimulatorProxy(id) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout:2000}); // option 1

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  this.games = [];
  this.getGames();

}

// extend the eve.Agent prototype
SimulatorProxy.prototype = Object.create(eve.Agent.prototype);
SimulatorProxy.prototype.constructor = SimulatorProxy;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
SimulatorProxy.prototype.rpcFunctions = {};
SimulatorProxy.prototype.rpcFunctions.getGames = function (params, sender) {
  return this.games;
};

SimulatorProxy.prototype.getGames = function () {
  var me = this;
  fs.readdir('./games/', function (err, files) {
    me.games = files;
  })
}


module.exports = SimulatorProxy;
