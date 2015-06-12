/**
 * Created by Alex on 5/5/14.
 */



function GlowStep (id, x, y, container, options, nodesData, edgesData, agentPath) {
  this.agentPath = agentPath;
  console.log(agentPath);
  this.id = id;
  this.x = x;
  this.y = y;
  this.imagineX = 500;
  this.imagineY = 500;
  this.width = 75;
  this.height = 75;
  this.options = options;
  this.container = container;
  this.lightColor = "black";
  this.url = "http://" + computerAddress + ":3000/agents/" + id;
  this.initialized = false;
  this.nodesData = nodesData;
  this.edgesData = edgesData;
  this.create();
}


GlowStep.prototype.create = function () {
  this.htmlShadowElement = document.createElement("div");
  this.htmlShadowElement.className = 'shadow';
  this.htmlShadowElement.id = "shadow_" + this.id;
  this.htmlShadowElement.style.top = this.y + 1 + "px";
  this.htmlShadowElement.style.left = this.x + 1 + "px";
  this.container.appendChild(this.htmlShadowElement);

  this.htmlGlowElement = document.createElement("div");
  this.htmlGlowElement.className = 'glow';
  this.htmlGlowElement.id = "glow_" + this.id;
  this.htmlGlowElement.style.top = this.y + "px";
  this.htmlGlowElement.style.left = this.x + "px";
  this.container.appendChild(this.htmlGlowElement);

  this.htmlElement = document.createElement("div");
  this.htmlElement.className = 'glowstep';
  var color = '50,50,50'
  var mainBackground = '-webkit-radial-gradient(center, ellipse cover, rgba(20,20,20,1) 0%,rgba(40,40,40,1) 38%,rgba(60,60,60,1) 40%,rgba(0,0,0,0) 42%,rgba(0,0,0,0) 100%), url("./images/glowstep_inner_mask.png"), -webkit-radial-gradient(center, ellipse cover, rgba(' + color + ',0.8) 0%,rgba(255,255,255,0.4) 10%,rgba(255,255,255,0) 75%,rgba(255,255,255,0) 100%), url("./images/glowstep_outer_mask.png"), rgb(' + color + ')';

  this.htmlElement.id = this.id;
  this.htmlElement.style.top = this.y + "px";
  this.htmlElement.style.left = this.x + "px";
  this.htmlElement.style.background = mainBackground;
  this.container.appendChild(this.htmlElement);

  this.nodesData.add({id: this.id, label: this.id, x: this.imagineX, y: this.imagineY})

  this.hammer = Hammer(this.htmlElement, {prevent_default: true});

  var me = this;
  this.hammer.on('tap', me.steppedOn.bind(me));
  this.hammer.on('drag', me._onDrag.bind(me));
  this.hammer.on('dragend', me._onDragEnd.bind(me));
};

GlowStep.prototype.initialize = function () {
  this.initialized = true;
  addAgent(this.id, "./agents/games/" + this.agentPath + ".js");
  this.htmlElement.onclick = this.steppedOn.bind(this);
  this.updatePosition(true);
  console.log('initialized agent')
};

GlowStep.prototype.checkColor = function () {
  askAgent(this.url, "getColor", null, function (data) {
    me.changeColor.call(me, data.result);
  });
};

GlowStep.prototype.changeColor = function (color) {
  if (color == "0,0,0") {
    color = "50,50,50";
  } // not fully black
  var mainBackground = '-webkit-radial-gradient(center, ellipse cover, rgba(20,20,20,1) 0%,rgba(40,40,40,1) 38%,rgba(60,60,60,1) 40%,rgba(0,0,0,0) 42%,rgba(0,0,0,0) 100%), url("./images/glowstep_inner_mask.png"), -webkit-radial-gradient(center, ellipse cover, rgba(' + color + ',0.8) 0%,rgba(255,255,255,0.4) 10%,rgba(255,255,255,0) 75%,rgba(255,255,255,0) 100%), url("./images/glowstep_outer_mask.png"), rgb(' + color + ')';
  var glowBackground = '-webkit-radial-gradient(center, ellipse cover, rgba(255,255,255,1) 10%,rgba(255,255,255,0) 60%),  -webkit-radial-gradient(center, ellipse cover, rgb(' + color + ') 20%,rgba(255,255,255,0) 75%)';
  this.htmlElement.style.background = mainBackground;
  this.htmlGlowElement.style.background = glowBackground;
  this.nodesData.update({id: this.id, color: 'rgb(' + color + ')'});
};

GlowStep.prototype.getConnections = function () {
  var me = this;
  askAgent(this.url, "getConnectedNodes", null, function (data) {
    me.setConnections.call(me, data.result);
  }, false);
};

GlowStep.prototype.setConnections = function (connectedNodes) {
  var updateCommand = [];
  for (var i = 0; i < connectedNodes.length; i++) {
    updateCommand.push({from: this.id, to: connectedNodes[i].id});
  }
  this.edgesData.add(updateCommand);
};

GlowStep.prototype._getPointer = function (event) {
  return {x: event.gesture.center.pageX - this.container.offsetLeft,
    y: event.gesture.center.pageY - this.container.offsetTop};
};


/**
 * This function is called by _onDrag.
 * It is separated out because we can then overload it for the datamanipulation system.
 *
 * @private
 */
GlowStep.prototype._onDrag = function(event) {
  var allowDrag = false;
  if (this.initialized && this.options.shiftPressed == true) {
    allowDrag = true;
  }
  else if (!this.initialized) {
    allowDrag = true;
  }

  if (allowDrag) {
    var pointer = this._getPointer(event);
    this.x = pointer.x;
    this.y = pointer.y;
    this.htmlElement.style.top = (this.y - 0.5*this.height) + "px";
    this.htmlElement.style.left = (this.x - 0.5*this.width) + "px";
    this.htmlGlowElement.style.top =  (this.y - 0.5*this.height) + "px";
    this.htmlGlowElement.style.left = (this.x  - 0.5*this.width) + "px";
    this.htmlShadowElement.style.top =  (this.y  - 0.5*this.width) + 1 + "px";
    this.htmlShadowElement.style.left = (this.x  - 0.5*this.width) + 1 + "px";
  }
};

GlowStep.prototype._onDragEnd = function (event) {
  if (this.initialized == true) {
    this.updatePosition(false);
  }
};

GlowStep.prototype.steppedOn = function() {
  if (this.initialized && !this.options.shiftPressed == true) {
    var me = this;
    askAgent(this.url, "steppedOn", null, function(data) {
      me.changeColor.call(me,data.result); console.log(data.result, me.htmlElement.style.background);
    });
  }
};

GlowStep.prototype.updatePosition = function(initialSetup) {
  console.log(" updating pos")
  askAgent(this.url, "setPosition", {x:this.x, y:this.y, initialSetup:initialSetup}, null, false);
};

GlowStep.prototype.updateImaginedPosition = function(x,y) {
  this.nodesData.update({id:this.id, x: x, y: y})
};

function addAgent (name, implementation) {
  askAgent("http://" + computerAddress + ":3000/agents/admin",
    "addAgent",
    {name:name, agentClass:implementation},
    function (data) {
      console.log("agent added:", data);
    },
    false
  )
};



