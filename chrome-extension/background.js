const alarmName = 'Update Yandex.Music playback';
var sendingUpdate = false;
var requestingActions = false;
var tabId = undefined;
var postponedTabMessages = [];

var currentPlayback = {
  pageOpened: false,
  controls: null,
  isPlaying: false,
  currentTrack: null,
  nextTrack: null
}

function sendJson(dataType, payloadObject, callback) {
  var jsonData = {
    type: dataType,
    payload: payloadObject
  };

  //var encodedJson = encodeURIComponent(JSON.stringify(jsonData));
  var url = `http://localhost:8812/?postJson`;

  var settings = {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jsonData)
  };

  fetch(url, settings).then((r) => r.text()).then((bodyText) => {
    if (callback != null && typeof (callback) == 'function') {
      var decoded = JSON.parse(bodyText);
      callback({ isSuccess: decoded.code == 0, error: decoded.code, message: decoded.message });
    }
  }).catch((ex) => {
    console.error(ex);

    if (callback != null && typeof (callback) == 'function') {
      callback({ isSuccess: false, error: -1, message: ex.toString() });
    }
  });
}

function sendMessage(msg, handleAnswerCallback) {
  if (tabId === undefined) {
    console.log('Tab is undefined, postponing');
    postponedTabMessages.push({ msg: msg, handleAnswerCallback: handleAnswerCallback });
    return;
  }

  chrome.tabs.sendMessage(tabId, msg, function (response) {
    if (handleAnswerCallback != null && typeof (handleAnswerCallback) == 'function') {
      handleAnswerCallback(response);
    } else {
      console.log('Read response', response);
    }
  });
}

function sendMusicUpdate() {
  sendMessage({ type: 'get-playlist-force' }, (answer) => {
    if (answer == null)
      return;

    if (sendingUpdate == false) {
      sendingUpdate = true;
      sendJson('updatePlayback', answer, (response) => {
        sendingUpdate = false;
      });
    }
  });
}

function handleActions(actions) {
  if (actions == null || actions.length <= 0)
    return;

  for (var i = 0; i < actions.length; i++) {
    var action = actions[i];
    if (action == null || action.action == null || action.action.length <= 0)
      continue;

    //console.log('Handling action', { type: action.action, extra: extra });
    sendMessage({ type: action.action, extra: action.extra }, (a) => { console.log(`Action ${action} reply`, a) });
  }
}

function requestActions() {
  if (requestingActions === true)
    return;

  requestingActions = true;
  sendJson('getActions', {}, (response) => {
    requestingActions = false;
    if (response == null)
      return;


    if (response.isSuccess !== true) {
      console.error('got actions error', response);
      return;
    }

    console.log(response.message);
    handleActions(response.message);
  });
}

function checkTab() {
  chrome.tabs.query({ url: 'https://music.yandex.ru/*' }, (tabs) => {
    if (tabs === undefined) {
      return;
    }

    if (tabs.length <= 0) {
      tabId = undefined;
      return;
    }

    tabId = tabs[0].id;
  });
}

function sendPostponedMessages() {
  if (tabId == undefined)
    return;

  postponedTabMessages.forEach((action) => {
    sendMessage(action.msg, action.handleAnswerCallback);
  })

  postponedTabMessages = [];
}

function loop() {
  checkTab();
  requestActions();
  sendMusicUpdate();
  sendPostponedMessages();
}

chrome.alarms.clear();

for (var i = 0; i < 60; i++) {
  chrome.alarms.clear(alarmName + ' - ' + i)
  chrome.alarms.create(alarmName + ' - ' + i, {
    periodInMinutes: 1,
    when: Date.now() + (i * 1000)
  });
}

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name.startsWith(alarmName)) {
    loop();
  }
});