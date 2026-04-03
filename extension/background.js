chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'fact-check-selection') return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString().trim(),
    });
    const selectedText = results?.[0]?.result || '';
    if (!selectedText) {
      console.log('Kimi Is It Real: no text selected');
      return;
    }

    const DEFAULT_PREFIX = 'Аккуратно проверь корректность фактов в этом тексте:\n\n"';
    const DEFAULT_SUFFIX = '"\n\nНе удовлетворяйся одним источником на факт, ищи альтернативные. Приводи ссылки. В конце вынеси краткий вердикт по достоверности информации.';

    const { prefix = DEFAULT_PREFIX, suffix = DEFAULT_SUFFIX } = await chrome.storage.sync.get(['prefix', 'suffix']);
    const prompt = `${prefix}${selectedText}${suffix}`;
    const url = 'https://www.kimi.com/#kfc_prompt=' + encodeURIComponent(prompt);

    const newTab = await chrome.tabs.create({ url });

    // Workaround: после перезагрузки расширения content script иногда
    // не инжектируется автоматически в первую созданную вкладку.
    try {
      await chrome.scripting.executeScript({
        target: { tabId: newTab.id },
        files: ['kimi.js'],
      });
    } catch (e) {
      // ignore
    }
  } catch (err) {
    console.error('Kimi Is It Real error:', err);
  }
});
