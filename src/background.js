var downloadLimit = undefined;

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

        if (downloadLimit) {
          if (downloadLimit.endsWith("s")) {
            var requestObject = new URL(requestDetails.url);
            var downloadLimitSec = Number(downloadLimit.substring(0, downloadLimit.length - 1));
            var oneSecondBytes = Number.parseInt(Number(requestObject.searchParams.get("clen")) / Number(requestObject.searchParams.get("dur")));
            var downloadLimitBytes = downloadLimitSec * oneSecondBytes;

            if (downloadLimitSec > 0) {
              audioURI = audioURI + "&range=0-" + downloadLimitBytes.toString();
            } else {
              audioURI = audioURI + "&range=0-" + (Number(requestObject.searchParams.get("clen")) + downloadLimitBytes).toString();
            }
          } else {
            audioURI = audioURI + "&range=0-" + downloadLimit;
          }
        }

        chrome.tabs.update(requestDetails.tabId, {
          url: audioURI
        });
      }
    }
  }
}

function storageListener(changes, storageArea) {
  if (changes["enabled"]) {
    if (changes["enabled"].newValue === false && chrome.webRequest.onHeadersReceived.hasListener(audioRedir)) {
      chrome.webRequest.onHeadersReceived.removeListener(audioRedir);
      chrome.browserAction.setIcon({path: "icons/redir_off.png"});
    } else if (changes["enabled"].newValue === true && !chrome.webRequest.onHeadersReceived.hasListener(audioRedir)) {
      chrome.webRequest.onHeadersReceived.addListener(
        audioRedir,
        {urls: ["*://*.googlevideo.com/videoplayback*audio*"]},
        ["responseHeaders"]
      );
      chrome.browserAction.setIcon({path: "icons/redir_on.png"});
    }
  }

  if (changes["limit"]) {
    if (changes["limit"].newValue === "" || changes["limit"].newValue === "undefined" || changes["limit"].newValue === "0" || changes["limit"].newValue === "0s") {
      downloadLimit = undefined;
    } else {
      downloadLimit = changes["limit"].newValue;
    }
  }
}

browser.storage.local.get().then(function(result) {
  storageListener({
      "enabled": {
          newValue: result.enabled || undefined
      },
      "limit": {
          newValue: result.limit || undefined
      }
  }, undefined);
});
browser.storage.onChanged.addListener(storageListener);