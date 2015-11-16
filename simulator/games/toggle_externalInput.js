/**
 * Created by Alex on 4/9/2015.
 */

var __behaviour = {

  init: function() {
    this.colors = [
      {r:255,g:0,b:0},
      {r:0,g:255,b:0},
      {r:0,g:0,b:255},
      {r:0,g:0,b:0}
    ];
    this.colorIndex = 0;

    this.setColor(0,255,255);
  },

  steppedOn: function() {
    var color = this.colors[this.colorIndex];
    this.setColor(color.r,color.g,color.b);
    this.sendMessage("I was stepped on!");
    this.colorIndex = (this.colorIndex + 1) % this.colors.length;
  },

  steppedOff: function() {

  },

  handleMessage: function(message, rssi) {
    if (message.indexOf("red") !== -1) {
      this.setColor(255,0,0);
    }
    if (message.indexOf('green') !== -1) {
      this.setColor(0,255,0);
    }
    if (message.indexOf('off') !== -1) {
      this.setColor(0,0,0);
    }
  }
}

// API: sendMessage(message)  --> send a message to everyone (max length = 20), string or object.
//      setColor(r,g,b,index) --> set one of the colors (r,g,b [0..255], index [1..3])
//      setColors(r,g,b)      --> set all of the colors at once (r,g,b [0..255])