const alarmName = 'Update Yandex.Music playback';

var sendingUpdate = false;

function sendJson(dataType, payloadObject, callback){
  var jsonData = {
    type: dataType,
    payload: payloadObject
  };

  var encodedJson = encodeURIComponent(JSON.stringify(jsonData));
  var url = `http://localhost:8812/?json=${encodedJson}`;

  fetch(url).then((r) => r.text()).then((bodyText) => {
    if(callback != null && typeof(callback) == 'function'){
      var decoded = JSON.parse(bodyText);
      callback({isSuccess: decoded.code == 0, error: decoded.code, message: decoded.message});
    }
  }).catch((ex) => {
    console.error(ex);

    if(callback != null && typeof(callback) == 'function'){
      callback({isSuccess: false, error: -1, message: ex.toString()});
    }
  });
}

function sendUpdate() {
    if (sendingUpdate)
        return;

    sendingUpdate = true;

    var jsonData = {
      hello: 'there'
    };
    
    sendJson('updatePlayback', jsonData, (response) => {
        console.log(response)
        sendingUpdate = false;
      }
    );
}

chrome.alarms.clear();

for(var i = 0;i<60;i++){
  chrome.alarms.clear(alarmName + ' - ' + i)
  chrome.alarms.create(alarmName + ' - ' + i, {
    periodInMinutes: 1,
    when: Date.now() + (i * 1000)
  });
}

chrome.alarms.onAlarm.addListener(function(alarm){
  if(alarm.name.startsWith(alarmName)){
    sendUpdate();
  }
});