'use strict'

/**
 * Custom agent prototype
 * @param {String} id
 * @constructor
 * @extend eve.Agent
 */
function GlowstepAgent(id, container) {
  // execute super constructor
  eve.Agent.call(this, id);

  // connect to all transports configured by the system
  this.connect(eve.system.transports.getAll());

  this.container = container;
  this._x = 50;
  this._y = 50;
  this._colors = {
    1:{html:undefined,color:{r:0,g:0,b:0},pos:{x:12, y:-15}},
    2:{html:undefined,color:{r:0,g:0,b:0},pos:{x:-10,y:24}},
    3:{html:undefined,color:{r:0,g:0,b:0},pos:{x:35, y:24}}
  };

  this._created = false;
  this._distanceList = [];
  this._distanceFactor = 0.01;
}

// extend the eve.Agent prototype
GlowstepAgent.prototype = Object.create(eve.Agent.prototype);
GlowstepAgent.prototype.constructor = GlowstepAgent;


/**
 * Handle incoming greetings. This overloads the default receive,
 * @param {String} from     Id of the sender
 * @param {*} message       Received message, a JSON object (often a string)
 */
GlowstepAgent.prototype.receive = function(from, message) {
  if (this._distanceList[from] === undefined) {
    this._distanceList[from] = {r:message.r};
  }
  this._distanceList[from].r = 0.9*this._distanceList[from].r + 0.1*message.r;

  this.handleMessage(message.c, from, message.r);
};

/**
 * Create the HTML elements
 * @private
 */
GlowstepAgent.prototype._createHTML = function () {
  this._cleanupHTML();

  this.htmlGlowElementBackground = document.createElement("div");
  this.htmlGlowElementBackground.className = 'glowBackground';
  this.htmlGlowElementBackground.id = "glowBack_" + this.id;
  this.container.appendChild(this.htmlGlowElementBackground);

  for (var color in this._colors) {
    this._colors[color].html = document.createElement('div');
    this.container.appendChild(this._colors[color].html);
  }

  this._updateColor(1);
  this._updateColor(2);
  this._updateColor(3);

  this.htmlElement = document.createElement("div");
  this.htmlElement.className = 'glowstep';
  this.htmlElement.id = this.id;
  this.container.appendChild(this.htmlElement);

  this._moveStep();

  this.hammer = Hammer(this.htmlElement, {prevent_default: true});

  var me = this;
  this.hammer.on('touch', me.onClick.bind(me));
  this.hammer.on('release', me.onRelease.bind(me));
  this.hammer.on('drag', me._onDrag.bind(me));
  this._created = true;
};

/**
 * remove hammer and all html elements
 * @private
 */
GlowstepAgent.prototype._cleanupHTML = function () {
  if (this.hammer !== undefined) {
    this.hammer.dispose();
    this.hammer = undefined;
  }

  if (this._created === true) {
    this.container.removeChild(this.htmlGlowElementBackground);
    this.container.removeChild(this.htmlElement);
    this.container.removeChild(this._colors[1].html);
    this.container.removeChild(this._colors[2].html);
    this.container.removeChild(this._colors[3].html);
  }
}

/**
 * update the color div for the selected color
 * @param index
 * @private
 */
GlowstepAgent.prototype._updateColor = function (index) {
  var html = this._colors[index].html;
  var color = this._colors[index].color;
  var brightness = Math.min(1.0,(color.r + color.g + color.b) / (1.5*255));
  brightness = 1 - 0.3*(1-brightness);
  var opacity = Math.min(1.0,(color.r + color.g + color.b) / (0.5*255));

  html.className = 'glow';
  html.style.background = '-webkit-radial-gradient(center, ellipse cover, rgba(255,255,255,0.8) ' + brightness*10 + '%,' +
  'rgba(255,255,255,0) ' + brightness*70 + '%),' +
  '-webkit-radial-gradient(center, ellipse cover, rgb(' +
  color.r + ',' +
  color.g + ',' +
  color.b + ') ' + brightness*40 + '%,rgba(255,255,255,0) ' + brightness*75 + '%)';
  html.style.opacity = opacity;
}


/**
 * Move all html elements to the new position because of a dragging the step
 * @private
 */
GlowstepAgent.prototype._moveStep = function () {
  for (var color in this._colors) {
    var html = this._colors[color].html;
    html.style.left = this._colors[color].pos.x + this._x + 'px';
    html.style.top  = this._colors[color].pos.y + this._y + 'px';
  }
  this.htmlGlowElementBackground.style.top  = this._y + "px";
  this.htmlGlowElementBackground.style.left = this._x + "px";

  this.htmlElement.style.top  = this._y + "px";
  this.htmlElement.style.left = this._x + "px";
}


/**
 * Forward a click ("stepped on") event to the API
 */
GlowstepAgent.prototype.onClick = function () {
  if (shiftPressed === false) {
    this.steppedOn();
  }
}

GlowstepAgent.prototype.onRelease = function() {
  if (shiftPressed === false) {
    this.steppedOff();
  }
}

/**
 * Binder for moving the step with the mouse. This needs shift to be pressed.
 * @private
 */
GlowstepAgent.prototype._onDrag = function () {
  var allowDrag = false;
  if (shiftPressed == true) {
    allowDrag = true;
  }

  if (allowDrag == true) {
    var pointer = {
      x: event.gesture.center.pageX - this.container.offsetLeft,
      y: event.gesture.center.pageY - this.container.offsetTop
    };
    this._x = pointer.x-38;
    this._y = pointer.y+60;
    this._moveStep();
  }
}


/**
 * Load a game into the glowstep. CLeanup is not required. Before loading the stepAgents are created anew.
 * @param behaviour
 * @private
 */
GlowstepAgent.prototype._loadBehaviour = function(behaviour) {
  for (var fn in behaviour) {
    if (behaviour.hasOwnProperty(fn)) {
      this[fn] = behaviour[fn];
    }
  }
  clearInterval();
  clearTimeout();
  behaviour.init.call(this);
}


/**
 * Set the color of one of the lights. A glowstep has 3 lights.
 * @param {Number} r [0..255]
 * @param {Number} g [0..255]
 * @param {Number} b [0..255]
 * @param {Number} index  [1..3]
 */
GlowstepAgent.prototype._setColor = function(r,g,b,index) {
  if (this._colors[index] !== undefined) {
    this._colors[index].color.r = r;
    this._colors[index].color.g = g;
    this._colors[index].color.b = b;
    this._updateColor(index);
  }
  else {
    console.error("invalid index!", index);
  }
}

//********************* <API> *********************//

/**
 * This adds the envelope containing a faked distance value
 * @param message
 */
GlowstepAgent.prototype.sendMessage = function(message) {
  if (typeof message === 'object') {
    message = JSON.stringify(message);
  }

  // typecast to string
  message = message + '';

  if (message.length > 80) {
    console.error("Message is too long, only 80 characters allowed, you have " + message.length + ":", message);
  }

  this._lastMessage = new Date().valueOf();
  var envelope = {c:message,r:0};

  for (var agentId in agents) {
    if (agentId !== this.id) {
      var dx = this._x - agents[agentId]._x;
      var dy = this._y - agents[agentId]._y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      envelope.r = Math.round(distance * (0.2 + 1.6 * Math.random()) / this._distanceFactor); // factor between 0.2 and 1.8
      this.send(agentId, envelope).done();
    }
  }
}


/**
 * Set the color of all the 3 lights
 * @param {Number} r [0..255]
 * @param {Number} g [0..255]
 * @param {Number} b [0..255]
 */
GlowstepAgent.prototype.setColor = function(r,g,b,index) {
  if (index === undefined) {
    this._setColor(r,g,b,1);
    this._setColor(r,g,b,2);
    this._setColor(r,g,b,3);
  }
  else {
    this._setColor(r,g,b,index);
  }
}

/**
 * get the distance to the agent
 * @param agentId
 * @returns {*|number}
 */
GlowstepAgent.prototype.getDistance = function(agentId) {
  console.log('distance',this._distanceList[agentId].r)
  return this._distanceList[agentId].r;
}

/**
 * get the distance to the agent
 * @param agentId
 * @returns {*|number}
 */
GlowstepAgent.prototype.getRandomAgent = function() {
  var ids = Object.keys(this._distanceList);
  return ids[Math.floor(Math.random() * ids.length)];
}



//********************* <OVERLOADABLES> *********************//
GlowstepAgent.prototype.steppedOn = function () {
  console.log("steppedOn not overloaded");
  swal("Select the game first :)", "The steps don't know what to do...","error");
}

GlowstepAgent.prototype.steppedOff = function () {
  console.log("steppedOff not overloaded");
  //alert("Select a game first.");
}

GlowstepAgent.prototype.handleMessage = function (message, distance) {
  console.log("handleMessage not overloaded", message, distance);
}
//********************* </OVERLOADABLES> *********************//

//********************* </API> *********************//