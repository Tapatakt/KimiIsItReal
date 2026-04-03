(function () {
  if (window.__kimiIsItRealListenersAdded) return;
  window.__kimiIsItRealListenersAdded = true;

  function findInput() {
    return (
      document.querySelector('.chat-input-editor') ||
      document.querySelector('[data-lexical-editor="true"]') ||
      document.querySelector('div[contenteditable="true"]')
    );
  }

  function findSendButton() {
    return (
      document.querySelector('.send-button-container:not(.disabled)') ||
      document.querySelector('[class*="send-button"]:not([class*="disabled"])') ||
      document.querySelector('svg[name="Send"]')?.closest('div, button')
    );
  }

  function simulatePaste(element, text) {
    element.focus();
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', text);
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: dataTransfer,
    });
    element.dispatchEvent(pasteEvent);
  }

  function insertHtml(element, text) {
    element.focus();
    const html = text
      .split('\n')
      .map(line => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`)
      .join('');
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('delete', false, null);
    document.execCommand('insertHTML', false, html);
  }

  function setText(element, text) {
    simulatePaste(element, text);
    const afterPaste = element.innerText || element.textContent;
    if (!afterPaste || !afterPaste.includes(text.trim().slice(0, 20))) {
      insertHtml(element, text);
    }
  }

  async function clickSendButton(maxAttempts = 20) {
    for (let i = 0; i < maxAttempts; i++) {
      const btn = findSendButton();
      if (btn) {
        console.log('Kimi Is It Real: send button found, clicking');
        btn.click();
        const input = findInput();
        if (input) {
          input.dispatchEvent(new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
          }));
          input.dispatchEvent(new KeyboardEvent('keyup', {
            bubbles: true,
            cancelable: true,
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
          }));
        }
        return;
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    console.log('Kimi Is It Real: send button not found or still disabled');
  }

  function handlePrompt(prompt) {
    let inserted = false;
    let attempts = 0;
    const maxAttempts = 60;

    async function tryInsert() {
      if (inserted) return true;
      const input = findInput();
      if (input) {
        console.log('Kimi Is It Real: input found');
        setText(input, prompt);
        inserted = true;
        setTimeout(clickSendButton, 600);
        return true;
      }
      return false;
    }

    (async () => {
      if (await tryInsert()) return;

      console.log('Kimi Is It Real: input not found, observing DOM');
      const intervalId = setInterval(async () => {
        attempts++;
        if (await tryInsert()) {
          clearInterval(intervalId);
          observer.disconnect();
          return;
        }
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          observer.disconnect();
          console.log('Kimi Is It Real: input field not found after max attempts');
        }
      }, 500);

      const observer = new MutationObserver(async () => {
        if (await tryInsert()) {
          clearInterval(intervalId);
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    })();
  }

  // Слушаем сообщения от background.js
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'insert-prompt') {
      handlePrompt(request.prompt);
      sendResponse({ success: true });
      return true;
    }
  });

  // Читаем промпт из hash
  function getPromptFromHash() {
    try {
      if (location.hash.startsWith('#kfc_prompt=')) {
        return decodeURIComponent(location.hash.slice('#kfc_prompt='.length));
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  function consumeHash() {
    try {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    } catch (e) {
      // ignore
    }
  }

  // При загрузке страницы
  const promptOnLoad = getPromptFromHash();
  if (promptOnLoad) {
    console.log('Kimi Is It Real: prompt found in hash on load');
    consumeHash();
    handlePrompt(promptOnLoad);
  }

  // При изменении hash (SPA navigation)
  window.addEventListener('hashchange', () => {
    const prompt = getPromptFromHash();
    if (prompt) {
      console.log('Kimi Is It Real: prompt found in hashchange');
      consumeHash();
      handlePrompt(prompt);
    }
  });
})();
