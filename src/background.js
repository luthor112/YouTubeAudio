function isContentTypeHeader(httpHeader) {
  return httpHeader.name === "content-type";
}

function audioRedir(requestDetails) {
  if (requestDetails.originUrl && requestDetails.url.indexOf("redirector.googlevideo.com") == -1 && requestDetails.statusCode == 200) {
    var contentTypeHeader = requestDetails.responseHeaders.find(isContentTypeHeader);
    if (contentTypeHeader) {
      if (contentTypeHeader.value.startsWith("audio")) {
        var audioURI = requestDetails.url;
        var rangeStart = audioURI.indexOf("range=");
        if (rangeStart != -1) {
          var rangeEnd = audioURI.indexOf("&", rangeStart);
          if (rangeEnd != -1) {
            audioURI = audioURI.substring(0, rangeStart) + audioURI.substring(rangeEnd + 1);
          } else {
            audioURI = audioURI.substring(0, rangeStart - 1);
          }
        }

        chrome.tabs.update(requestDetails.tabId, {
          url: audioURI
        });
      }
    }
  }
}

function toggleListener(tab) {
  if (chrome.webRequest.onHeadersReceived.hasListener(audioRedir)) {
    chrome.webRequest.onHeadersReceived.removeListener(audioRedir);
    chrome.browserAction.setTitle({title: "Enable redirection to audio"});
    chrome.browserAction.setIcon({path: "icons/redir_off.png"});
  } else {
    chrome.webRequest.onHeadersReceived.addListener(
      audioRedir,
      {urls: ["*://*.googlevideo.com/videoplayback*audio*"]},
      ["responseHeaders"]
    );
    chrome.browserAction.setTitle({title: "Disable redirection to audio"});
    chrome.browserAction.setIcon({path: "icons/redir_on.png"});
  }
}

chrome.browserAction.onClicked.addListener(toggleListener);