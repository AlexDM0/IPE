/**
 * Created by Alex on 4/9/2015.
 */

var __behaviour = {

  init: function() {
    console.log("i have been updated. MUHAHAHA");
    this.colors = [
      {r:255,g:0,b:0},
      {r:0,g:255,b:0},
      {r:0,g:0,b:255},
      {r:0,g:0,b:0}
    ];
    this.colorIndex = 0;
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
    console.log("I have a message!");
  }
}

// API: sendMessage(message)  --> send a message to everyone (max length = 20), string or object.
//      setColor(r,g,b,index) --> set one of the colors (r,g,b [0..255], index [1..3])
//      setColors(r,g,b)      --> set all of the colors at once (r,g,b [0..255])