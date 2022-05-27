function saveOptions() {
    browser.storage.local.set({
        enabled: document.getElementById("extension-enable").checked,
        limit: document.getElementById("download-limit").value
    });
}

function restoreOptions() {
    browser.storage.local.get("enabled").then(function(result) {
        document.getElementById("extension-enable").checked = result.enabled;
    });
    browser.storage.local.get("limit").then(function(result) {
        document.getElementById("download-limit").value = result.limit;
    });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("extension-enable").addEventListener("click", saveOptions);
document.getElementById("download-limit").addEventListener("change", saveOptions);