var eve = require('evejs');
var fs = require('fs');
var FirmwareWriter = require('../firmwareWriter');
var Promise = require('promise');

function SimulatorProxy(id, transport) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout:200000}); // option 1

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  this.games = [];
  this.transport = transport;

  // reset crownstone
  var msg = 'Serial4.print(String.fromCharCode(3));\n';
  this.activePort = this.transport.activePort;

  // check if there is an active port, if not, we cannot upload
  if (this.activePort === undefined) {
    console.info("Has the USB receiver been plugged in? Could not setup USB communication. If you want to be able to upload the game, check the connection and restart the server.")
  }
  else {
    this.transport.connections[this.activePort].write(msg);
  }

  this.getGames();

  console.log("starting SimulationProxy");
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


/**
 * This reads the harddrive for games and notifies the simulator which ones exist
 */
SimulatorProxy.prototype.getGames = function () {
  var me = this;
  fs.readdir('./games/', function (err, files) {
    me.games = files;
  })
}


/**
 * Upload the game to the steps.
 * @param params
 * @param sender
 * @returns {*}
 */
SimulatorProxy.prototype.rpcFunctions.uploadGame = function(params, sender) {
  console.log("received command to upload game");
  if (this.activePort === undefined) {
    this.rpc.request(sender,{method:"errorInUpload", params:{message:"Cannot connect to USB module. Make sure the module is plugged in and restart the server."}}).done();
    return;
  }

  var game = params.game;
  return this.uploadGame(game)
    //.then(function () {
    //  console.log('passing the second time to make sure.', sender);
    //  this.rpc.request(sender,{method:"uploadHalfway", params:{}}).done();
    //  return this.uploadGame(game);
    //}.bind(this))
    .then(function () {
      console.log("sending finish notification")
      this.rpc.request(sender,{method:"finishedUpload", params:{}}).done();
    }.bind(this))
    .catch(function (err) {
      console.log("sending error notification", err)
      this.rpc.request(sender,{method:"errorInUpload", params:{}}).done();
  }.bind(this));
}

SimulatorProxy.prototype.uploadGame = function (game) {
  return new Promise(function (resolve, reject) {
    var writer = new FirmwareWriter(this.transport);
    writer.upload('./games/' + game).done(function () {
      console.log('finished')
      this.transport.unregister("fwWriter")
      resolve();
    }.bind(this));
  }.bind(this))
}

module.exports = SimulatorProxy;
