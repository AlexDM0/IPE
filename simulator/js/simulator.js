/**
 * Created by Alex on 5/2/14.
 */
var glowSteps = {};
var computerAddress = "127.0.0.1";

var options = {shiftPressed:false};
this.onkeydown = function (evt) {
  var evt2 = evt || window.event;
  var keyCode = evt2.keyCode || evt2.which;
  if (keyCode == 16) {
    options.shiftPressed = true;
  }
};
this.onkeyup = function () {
  options.shiftPressed = false;
};

window.onload = function () {

  var nodesData = new vis.DataSet();
  var edgesData = new vis.DataSet();
  var visContainer = document.getElementById("visContainer");
  var visData = {
    nodes: nodesData,
    edges: edgesData
  };
  var visOptions = {
    edges: {color: {color: 'white', highlight: 'red'}},
    stabilize: false
  };
  var graph = new vis.Network(visContainer, visData, visOptions);
  var stepSize = 48;

  var buttonStartSimulation = document.getElementById("buttonStartSimulation");
  var buttonGrid = document.getElementById("buttonGrid");
  var buttonRandomly = document.getElementById("buttonRandom");
  var numberOfStepsInput = document.getElementById("numberOfSteps");
  var initializationDiv = document.getElementById("initializationDescription");
  var initializationButtonDiv = document.getElementById("controlButtons");
  var simulationDiv = document.getElementById("simulationDescription");
  var agentPathInput = document.getElementById("agentPath");

  var containerDiv = document.getElementById("containerDiv");
  var controlDiv = document.getElementById("controlDiv");
  var headerDiv = document.getElementById("headerDiv");

  var width = containerDiv.offsetWidth - stepSize;
  var height = containerDiv.offsetHeight - stepSize;


  buttonRandomly.onclick = function () {
    nodesData.clear();
    edgesData.clear();
    var numberOfSteps = numberOfStepsInput.value;
    glowSteps = {};
    containerDiv.innerHTML = "";

    var positions = [];
    for (var i = 0; i < numberOfSteps; i++) {
      var left = Math.random() * width;
      var top = Math.random() * height;

      var positionFound = false;
      while (positionFound == false) {
        positionFound = true;
        for (var j = 0; j < positions.length; j++) {
          if (Math.abs(left - positions[j].left) < stepSize && Math.abs(top - positions[j].top) < stepSize) {
            left = Math.random() * width;
            top = Math.random() * height;
            positionFound = false;
            break;
          }
        }
      }
      positions.push({left: left, top: top});
      var agentPath = agentPathInput.value;
      glowSteps['glowstep_' + i] = new GlowStep('glowstep_' + i, left, top, containerDiv, options, nodesData, edgesData, agentPath);
    }
    this.blur();
    buttonStartSimulation.disabled = false;
    graph.zoomExtent();
  }

  buttonGrid.onclick = function () {
    nodesData.clear();
    edgesData.clear();
    var numberOfSteps = numberOfStepsInput.value;
    containerDiv.innerHTML = "";
    glowSteps = {};

    var ratio = width / height;
    var horizontalCount = Math.floor(Math.sqrt(numberOfSteps) * ratio);
    var verticalCount = (numberOfSteps / horizontalCount);
    var xSpacing = width / horizontalCount;
    var ySpacing = height / verticalCount;

    var j = 0;
    var stepId = 0;

    while (stepId < numberOfSteps) {
      for (var i = 0; i < horizontalCount; i++) {
        var left = xSpacing * i + xSpacing * 0.5;
        var top = ySpacing * j + ySpacing * 0.5 - 0.5 * stepSize;
        var agentPath = agentPathInput.value;
        glowSteps['glowstep_' + stepId] = new GlowStep('glowstep_' + stepId, left, top, containerDiv, options, nodesData, edgesData, agentPath);
        stepId += 1;
        if (stepId >= numberOfSteps) {
          break;
        }
      }
      j++;
    }
    this.blur();
    buttonStartSimulation.disabled = false;
    graph.zoomExtent();
  }

  buttonStartSimulation.onclick = function () {
    askAgent("http://" + computerAddress + ":3000/agents/admin",
      "removeAgents",
      null,
      function () {
        for (var glowstepId in glowSteps) {
          if (glowSteps.hasOwnProperty(glowstepId)) {
            glowSteps[glowstepId].initialize();
          }
        }
        askAgent("http://" + computerAddress + ":3000/agents/admin",
          "connectNodes",
          null,
          function () {
            for (var nodeId in glowSteps) {
              if (glowSteps.hasOwnProperty(nodeId)) {
                glowSteps[nodeId].getConnections();
              }
            }
            ;
            setInterval(function () {
              askAgent("http://" + computerAddress + ":3000/agents/admin",
                "getStates",
                null,
                function (data) {
                  for (var stepId in data.result) {
                    if (data.result.hasOwnProperty(stepId)) {
                      if (glowSteps[stepId] !== undefined) {
                        glowSteps[stepId].changeColor(data.result[stepId].color);
                        glowSteps[stepId].updateImaginedPosition(data.result[stepId].x, data.result[stepId].y);
                      }
                    }
                  }
                });
            }, 100);
            initializationButtonDiv.style.display = "none";
            initializationDiv.style.display = "none";
            simulationDiv.style.display = "block";
          }
        );
      }
    )
  }


};