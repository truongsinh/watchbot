var UI = require('ui');
var Accel = require('ui/accel');
var Settings = require('settings');

function getUrlFor(command){
  var name    = Settings.data('name');
  var host    = Settings.data('host');
  var port    = Settings.data('port');
  var device  = Settings.data('device');

  return host + ":" + port + "/api/robots/" + name + "/devices/" + device + "/commands/" + command;
}

function publishEvent(event_name, data) {
  var params = '{"name":"' + event_name+ '", "data":"' + data + '"}';
  var req    = new XMLHttpRequest();

  req.open('POST', getUrlFor('publish_event'), true);
  req.setRequestHeader("Content-type", "application/json");
  req.send(params);
}

function pollForMessages() {
  var req = new XMLHttpRequest();

  req.open('GET', getUrlFor('pending_message'), true);
  req.onload = function(e) {
    if (req.readyState == 4) {
      if(req.status == 200) {
        var response = JSON.parse(req.responseText);
        var message = response.result;
        if (message !== null && message !== '') {
          console.log(message);
          Pebble.showSimpleNotificationOnPebble("Robot", message.toString());
        }
      } else {
        console.log("Error");
      }
    }
  };
  req.send(null);
  setTimeout(function() {
    pollForMessages();
  }, 600);
}

Pebble.addEventListener("ready", function() {
  pollForMessages();
});

Pebble.addEventListener("showConfiguration", function() {
  var html = '<html> <head> <title>watchbot configuration</title> <meta charset="utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1"> </head> <style> body, textarea, button { font-size: 20px; font-family: monospace; text-align: center; } textarea { resize: none; padding-top: 15px; } button { padding: 15px; } </style> <body> <div data-role="page" id="main"> <div data-role="header" class="jqm-header"> <h1>Configure watchbot</h1> </div> <div data-role="content"> <div data-role="fieldcontain"> <label for="name">Robot name is:</label> <textarea cols="24" name="name" id="name"></textarea> </div> <div data-role="fieldcontain"> <label for="host">Robot API host:</label> <textarea cols="24" name="host" id="host"></textarea> </div> <div data-role="fieldcontain"> <label for="port">Robot API port:</label> <textarea cols="24" name="port" id="port"></textarea> </div> <div data-role="fieldcontain"> <label for="device">Robot API device:</label> <textarea cols="24" name="device" id="device"></textarea> </div> <br/> <div class="ui-body ui-body-b"> <button type="submit" data-theme="a" id="b-submit">Submit</button> </div> </div> </div> <script> window.onload = function () { "use strict"; document.getElementById("name").value    = NAME; document.getElementById("host").value    = HOST; document.getElementById("port").value    = PORT; document.getElementById("device").value  = DEVICE;}; function saveOptions() { "use strict"; var options = { "name":    document.getElementById("name").value, "host":    document.getElementById("host").value, "port":    document.getElementById("port").value, "device":  document.getElementById("device").value }; return options; } document.getElementById("b-submit").addEventListener("click", function () { "use strict"; console.log("Submit"); var location = "pebblejs://close#" + encodeURIComponent(JSON.stringify(saveOptions())); console.log("Warping to: " + location); console.log(location); document.location = location; }); </script> </body> </html><!--.html';

  html = html.replace("NAME", '"' + (Settings.data('name') || "pebble") + '"');
  html = html.replace("HOST", '"' + (Settings.data('host') || "http://0.0.0.0") + '"');
  html = html.replace("PORT", '"' + (Settings.data('port') || "8080") + '"');
  html = html.replace("DEVICE", '"' + (Settings.data('device') || "pebble") + '"');

  Pebble.openURL('data:text/html,' + encodeURI(html));
});

Pebble.addEventListener("webviewclosed", function(e) {
  var options = JSON.parse(decodeURIComponent(e.response));

  Settings.data('host', options.host);
  Settings.data('name', options.name);
  Settings.data('port', options.port);
  Settings.data('device', options.device);
});

Accel.init();
Accel.config({rate: 10, samples: 1});

var main = new UI.Menu({
  sections: [{
    items: [{
      title: 'Events',
      subtitle: 'Listen to button + tap events'
     }, {
      title: 'Accelerometer',
      subtitle: 'Get accelerometer information'
     }, {
      title: 'Commands',
      subtitle: 'Execute custom actions'
     }]
   }]
});

main.on('select', function(e) {
    if (e.itemIndex === 0) {
      var events = new UI.Card();
      events.title('Events');
      events.subtitle('Listening to bottons and tap');
      events.show();

      events.on('click', 'up', function(e) {
        publishEvent("button", "up");
      });
      events.on('click', 'select', function(e) {
        publishEvent("button", "select");
      });
      events.on('click', 'down', function(e) {
        publishEvent("button", "down");
      });
      events.on('accelTap', function(e) {
       publishEvent("tap", "");
      });
    } else if (e.itemIndex === 1) {
      var accel = new UI.Card();
      accel.title('Accelerometer');
      accel.subtitle('Sending data');
      accel.show();

      accel.on('accelData', function(e) {
        var accel = e.accels[0];
        var data = accel.x + "," + accel.y + "," + accel.z;
        publishEvent("accel", data);
      });
    } else if (e.itemIndex === 2) {
      var commands = new UI.Card();
      commands.title('Coming soon');
      commands.show();
    }
  });

main.show();
