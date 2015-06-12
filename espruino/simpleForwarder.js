function handleUART(data) {
  UART_Message += data;
  var endIndex = UART_Message.indexOf(endString);
  if (endIndex != -1) { // end of message received
    var fullMessage = UART_Message;
    var dataArray = fullMessage.split(endString);
    var processedMessage = dataArray[0];
    UART_Message = "";
    console.log(processedMessage);
    handleUART(data.substr(data.indexOf(endString) + endString.length));
  }
}

var endString = String.fromCharCode(10);
var UART_Message = "";

function onInit() {
  clearInterval();
  clearTimeout();
  clearWatch();

  Serial4.setup(9600,{rx:C11,tx:C10});
  Serial4.removeAllListeners('data');
  Serial4.on('data', function (data) {handleUART(data);});
}

save();