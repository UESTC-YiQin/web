import { config } from './public-key.mjs';
import { encryptSecret } from './encrypt.mjs';
const $ = id => document.getElementById(id);
let busy = false;
if (!globalThis.isSecureContext || !globalThis.crypto?.subtle) {
  $('status').textContent = '请使用现代浏览器打开 HTTPS 网站。';
  $('encrypt').disabled = true;
} else if (!config) {
  $('status').textContent = '管理员尚未配置公钥，请暂时不要填写密钥。';
  $('encrypt').disabled = true;
  $('secret').disabled = true;
} else {
  $('fingerprint').textContent = config.kid.slice(0, 20);
}
$('secret').addEventListener('input', () => {
  $('result').value = ''; $('copy').disabled = true;
  $('download').disabled = true; $('status').textContent = '';
});
$('encrypt').addEventListener('click', async () => {
  if (busy) return;
  busy = true; $('encrypt').disabled = true;
  $('result').value = ''; $('copy').disabled = true; $('download').disabled = true;
  try {
    $('result').value = await encryptSecret($('secret').value, config);
    $('secret').value = '';
    $('copy').disabled = false; $('download').disabled = false;
    $('status').textContent = '加密完成。复制下方密文，通过 QQ 私聊发给管理员。';
  } catch (e) {
    $('status').textContent = e.message || '加密失败，请刷新后重试。';
  } finally { busy = false; $('encrypt').disabled = false; }
});
$('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('result').value);
    $('status').textContent = '已复制密文。请通过 QQ 私聊发送。';
  } catch {
    $('result').focus(); $('result').select();
    $('status').textContent = '请长按或按 Ctrl+C，复制已选中的密文。';
  }
});
$('download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([$('result').value],{type:'text/plain;charset=utf-8'}));
  const a = document.createElement('a'); a.href=url; a.download='encrypted-key.txt'; a.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
});
window.addEventListener('pagehide', () => { $('secret').value=''; $('result').value=''; });
