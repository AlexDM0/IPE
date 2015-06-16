/**
 * Created by Alex on 4/9/2015.
 */

var __behaviour = {

  init: function() {
    this.state = 0;
    this.activeState = false;
    this.blocked = false;
    this.timer = undefined;
    this.startTimerOnRelease = false;

    this.resetTimer();
  },

  resetTimer: function() {
    this.cancelTimer();
    this.timer = setTimeout(this.activate.bind(this), 1000 + Math.random() * 6000)
  },

  cancelTimer: function() {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  },

  activate: function() {
    if (this.activeState === false && this.blocked !== true) {
      this.setColor(0, 255, 255);
      this.activeState = true;
      this.sendMessage('stepActive');
      this.timer = undefined;
      setTimeout(this.deactivate.bind(this), 3000);
    }
  },

  deactivate: function() {
    if (this.activeState === true && this.blocked !== true) {
      this.setColor(0, 0, 0);
      this.activeState = false;
      this.sendMessage('resetTimer');
      this.resetTimer();
    }
  },


  steppedOn: function() {
    if (this.activeState === true) {
      this.flash();
      this.sendMessage('flash');
      this.activeState = false;
    }
    else {
      this.blocked = true;
      this.setColor(255,0,0);
    }
    this.sendMessage("stepped On")
  },

  steppedOff: function() {
    if (this.blocked === true) {
      this.blocked = false;
      this.setColor(0,0,0);
      if (this.startTimerOnRelease === true) {
        this.resetTimer();
      }
    }
  },

  flash: function() {
    this.setColor(255,255,255);
    setTimeout(function () {this.setColor(0,0,0);}.bind(this), 100);
    setTimeout(function () {this.setColor(255,255,255);}.bind(this), 200);
    setTimeout(function () {this.setColor(0,0,0);}.bind(this), 300);
    this.resetTimer();
  },

  handleMessage: function(message, distance) {
    if (typeof message === 'string') {
      if (message === 'stepActive') {
        this.cancelTimer();
      }
      if (message === 'resetTimer') {
        if (this.blocked === false) {
          this.resetTimer();
        }
        else {
          this.startTimerOnRelease = true;
        }
      }
      if (message === 'flash') {
        this.flash();
      }
    }

    if (typeof message === 'object') {
      if (this.id === message.t) {

      }
    }
  }

}




// API: sendMessage(message)    --> send a message to everyone (max length = 20), string or object.
//      setColor(r,g,b,[index]) --> set one of the colors (r,g,b [0..255], index [1..3])
//      getDistance(sender)     --> gives a distance in meters (approximated and averaged)
//      getRandomAgent()        --> Get an ID of a random agent that we've met

//      steppedOn()             --> fired when someone steps on the step
//      steppedOff()            --> fired when someone steps off the step
//      handleMessage(message,from) --> fired when there is an incoming message