/**
 * This is the code that should be stored on the USB connected espruino.
 * The IPE shield has to be connected to this espruino (the one with the RFDUINO module)
 *
 * @param data
 */

function handleUART(data) {
  UART_Message += data;
  var endIndex = UART_Message.indexOf(endString);
  if (endIndex != -1) { // end of message received
    var fullMessage = UART_Message;
    var dataArray = fullMessage.split(endString);
    var processedMessage = dataArray[0];
    UART_Message = "";
    console.log(processedMessage); // this logs it to the RFModule
    handleUART(data.substr(data.indexOf(endString) + endString.length));
  }
}

var endString = String.fromCharCode(10);
var UART_Message = "";

function onInit() {
  clearInterval();
  clearTimeout();
  clearWatch();

  Serial4.setup(4800,{rx:C11,tx:C10});
  Serial4.removeAllListeners('data');
  Serial4.on('data', function (data) {handleUART(data);});
}

save();