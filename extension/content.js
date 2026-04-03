(function () {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'get-selection') {
      sendResponse({ text: window.getSelection().toString().trim() });
    }
    return true;
  });
})();
