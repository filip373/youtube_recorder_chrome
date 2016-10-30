console.log("initialize content");

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "active") {
    sendResponse({active: true});
  }
});

var current = 0;

$("video").on("playing", function() {
  current = Date.now();
	chrome.runtime.sendMessage({action: "video", state: "play", time: current});
  console.log("started playing");
});

$("video").on("pause waiting", function() {
	if(current > 0) {
		chrome.runtime.sendMessage({action: "video", state: "pause", time: Date.now() - current});
		console.log("paused");
	}
});