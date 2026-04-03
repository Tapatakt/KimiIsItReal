const prefixEl = document.getElementById('prefix');
const suffixEl = document.getElementById('suffix');
const saveBtn = document.getElementById('save');
const statusEl = document.getElementById('status');

const DEFAULT_PREFIX = 'Аккуратно проверь корректность фактов в этом тексте:\n\n"';
const DEFAULT_SUFFIX = '"\n\nНе удовлетворяйся одним источником на факт, ищи альтернативные. Приводи ссылки. В конце вынеси краткий вердикт по достоверности информации.';

async function load() {
  const result = await chrome.storage.sync.get(['prefix', 'suffix']);
  prefixEl.value = result.prefix ?? DEFAULT_PREFIX;
  suffixEl.value = result.suffix ?? DEFAULT_SUFFIX;
}

async function save() {
  await chrome.storage.sync.set({
    prefix: prefixEl.value,
    suffix: suffixEl.value,
  });
  statusEl.textContent = 'Сохранено!';
  setTimeout(() => {
    statusEl.textContent = '';
  }, 1500);
}

saveBtn.addEventListener('click', save);

load();
