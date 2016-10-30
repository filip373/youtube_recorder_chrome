console.log("initialize background");

var playingTabs = {};

var send = function(url, time) {
  $.ajax({
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    url: "http://channel-recorder-server.herokuapp.com/api/watchedMovies",
    method: "POST",
    data: JSON.stringify({watchingTime: Math.round(time / 1000), movieId: url})
  }).always(function(data, status, jqXHR) {
    console.log(status);
  });
};

var handleCloseVideo = function(tabId) {

  playingTab = playingTabs[tabId];
  // if the video was playing -> add played time
  if (playingTab.state === "play") {
    playingTab.time += Date.now() - playingTab.start;
  }

  // send msg to server
  console.log("sending " + playingTab.url + " " + playingTab.time);
  send(playingTab.url, playingTab.time);

  // remove tab from playing tabs
  chrome.tabs.onRemoved.removeListener(playingTab.listener);

  delete playingTabs[tabId];
};

chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
  if (playingTabs[details.tabId]) {
    console.log("new video -> sending previous");
    handleCloseVideo(details.tabId);
  }

  if (details.url.startsWith("https://www.youtube.com/watch")) {
    chrome.tabs.sendMessage(details.tabId, {action: "active"}, function(response) {
      console.log("new video started")
      if (!response) {
          console.log("executing content scripts")
          chrome.tabs.executeScript(details.tabId, {file: "jquery-3.1.1.min.js"});
          chrome.tabs.executeScript(details.tabId, {file: "yt_content.js"});
      }
    });
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if(request.action !== "video") return;

  var playingTab = playingTabs[sender.tab.id];
  // if video is already playing
  if (playingTab) {
    // if paused -> add time and change state
    if (request.state === "pause") {
      if (playingTab.state === "play") {
        playingTab.state = "pause";
        playingTab.time += request.time;
        console.log("paused, adding " + request.time);
      }
    } else {
    // else -> add start time
      playingTab.state = "play";
      playingTab.start = request.time;
      console.log("playing started at " + request.time);
    }
  } else {
    var senderTabId = sender.tab.id;
    playingTabs[senderTabId] = {
      url: sender.tab.url,
      state: request.state,
      time: 0,
      start: request.time,
      listener: function(tabId) {
        if (tabId === senderTabId) {
          console.log("closing tab -> sending video")
          handleCloseVideo(tabId);
        }
      }
    };

    chrome.tabs.onRemoved.addListener(playingTabs[senderTabId].listener);

    console.log("new video " + sender.tab.url);
  }
});



