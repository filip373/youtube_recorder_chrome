console.log("initialize content");

var current = 0;

var handlePlaying = function() {
  current = Date.now();
  chrome.runtime.sendMessage({action: "video", state: "play", time: current});
  console.log("started playing");
};

var handlePaused = function() {
  if(current > 0) {
    chrome.runtime.sendMessage({action: "video", state: "pause", time: Date.now() - current});
    console.log("paused");
  }
};

var registerVideo = function(video) {
  video.on("playing", handlePlaying).on("pause waiting", handlePaused);
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "active") {
    sendResponse({active: true});
  }
});
  
console.log("waiting for video player");
var checkExist = setInterval(function() {
  var video = $("video.html5-main-video");
  if (video.length) {
    console.log("video player loaded");
    clearInterval(checkExist);
    registerVideo(video);
    handlePlaying();
  }
}, 100); // check every 100ms