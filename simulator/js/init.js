/**
 * Created by Alex on 4/8/2015.
 */

var simulationProxy;
var agents = {};
var container;
var amountOfAgents = 5;
var selectedGame;
var loadedScript = undefined;;

/**
 * based on http://www.javascriptkit.com/javatutors/loadjavascriptcss.shtml
 * @param filename
 * @param filetype
 */
function loadJS(filename){
  if (loadedScript !== undefined) {
    document.getElementsByTagName("head")[0].removeChild(loadedScript);
  }
  var fileref = document.createElement('script');
  fileref.setAttribute("type","text/javascript");
  fileref.setAttribute("src", filename);
  if (typeof fileref != "undefined")
    document.getElementsByTagName("head")[0].appendChild(fileref)

  loadedScript = fileref;
}

/**
 * Create a semi UUID
 * source: http://stackoverflow.com/a/105074/1262753
 * @return {String} uuid
 */
function randomUUID() {
  var S4 = function () {
    return Math.floor(
      Math.random() * 0x10000 /* 65536 */
    ).toString(16);
  };

  return (
  S4() + S4() + '-' +
  S4() + '-' +
  S4() + '-' +
  S4() + '-' +
  S4() + S4() + S4()
  );
};

function init() {
  eve.system.init({
    transports: [
      {
        type:'local'
      },
      {
        type: 'ws'
      }
    ]
  });

  container = document.getElementById('containerDiv');

  simulationProxy = new SimulatorProxy("proxy" + randomUUID(), container)
    .then(function (reply) {
      populateGamesList(reply);
    });
  createGrid();
}

function createGrid() {
  killAgents();

  var dimensions = container.getBoundingClientRect();

  var stepWidth = 75;
  var minX = 350;
  var usedX = dimensions.width-500;
  var xSpacing = Math.max(minX, usedX / (amountOfAgents-1));
  var ySpacing = 200;

  var nX = Math.floor((usedX / xSpacing)) + 1;
  var nY = nX < amountOfAgents ? Math.ceil(amountOfAgents/nX) : 1;

  var nLeft = amountOfAgents;
  var counter = 0;

  for (var i = 0; i < nY; i++) {
    for (var j = 0; j < nX; j++) {
      var x = 0.5*dimensions.width - 0.5*(nX-1)*xSpacing + j*xSpacing - 0.5*stepWidth;
      if (nLeft < nX) {
        x = 0.5*dimensions.width - 0.5*(nLeft-1)*xSpacing + j*xSpacing - 0.5*stepWidth;
      }
      var y = 0.5*dimensions.height - 0.5*(nY-1)*ySpacing + i*ySpacing + 0.9*stepWidth;
      var id = counter;
      agents[id] = new GlowstepAgent(id, container);
      agents[id]._x = x;
      agents[id]._y = y;
      agents[id]._createHTML();
      counter++;
      if (counter == amountOfAgents) {
        break;
      }
    }
    nLeft -= nX;
  }

  if (loadedScript !== undefined) {
    uploadToAgents();
  }
}

function createRandomly() {

}

function setAmount(amount) {
  document.getElementById('li_id_' + amountOfAgents).className = '';
  document.getElementById('li_id_' + amount).className = 'selected';
  document.getElementById('amountOfAgents').innerHTML = amount;
  amountOfAgents = amount;
  createGrid();
}

function killAgents() {
  for (var agentId in agents) {
    agents[agentId]._cleanupHTML();
    agents[agentId].disconnect();
  }
  agents = {};
}

function uploadToHardware() {

}

function loadGame(game) {
  selectedGame = game;
  document.getElementById("selectedGameSpan").innerHTML = game.replace('.js','');
  loadJS("./games/" + game);
  // wait for it to load.
  setTimeout(uploadToAgents,250);


}

function uploadToAgents() {
  // cache the state of the agents.
  var cachedStates = {};
  for (var agentId in agents) {
    var agent = agents[agentId];
    cachedStates[agentId] = {
      x: agent._x,
      y: agent._y,
      colors: {
        1: {r: agent._colors[1].r, g: agent._colors[1].g, b: agent._colors[1].b},
        2: {r: agent._colors[2].r, g: agent._colors[2].g, b: agent._colors[2].b},
        3: {r: agent._colors[3].r, g: agent._colors[3].g, b: agent._colors[3].b}
      }
    }
  }

  // remove all agents
  killAgents();

  // create new agents and restore the state (position and color)
  for (var agentId in cachedStates) {
    agents[agentId] = new GlowstepAgent(agentId, container);
    agents[agentId]._x = cachedStates[agentId].x;
    agents[agentId]._y = cachedStates[agentId].y;
    for (var colorIndex in cachedStates[agentId].colors) {
      agents[agentId]._colors[colorIndex].r = cachedStates[agentId].colors[colorIndex].r;
      agents[agentId]._colors[colorIndex].g = cachedStates[agentId].colors[colorIndex].g;
      agents[agentId]._colors[colorIndex].b = cachedStates[agentId].colors[colorIndex].b;
    }
    agents[agentId]._createHTML();

    // load the behaviour
    agents[agentId]._loadBehaviour(__behaviour);
  }
}

function populateGamesList(games) {
  var dropdown = document.getElementById('gamesList');
  for (var i = 0; i < games.length; i++) {
    var option = document.createElement('li');
    option.role = 'presentation';
    option.innerHTML = '<a role="menuitem" tabindex="-1" href="#">' + games[i] + '</a>';
    option.onclick = loadGame.bind(this,games[i]);
    dropdown.appendChild(option);
  }
}