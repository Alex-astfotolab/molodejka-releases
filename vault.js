// Secrets stay in IndexedDB, never URLs or localStorage. localStorage holds only
// the non-secret active database name, shared between launch contexts.
let youthReleaseWriter;
// Capture and erase a one-use invitation before Flutter/worker network activity.
function captureYouthInvitation(notify) {
  const invitation = new URLSearchParams(location.hash.slice(1)).get('join');
  if (!invitation) return;
  history.replaceState(null, '', location.pathname + location.search);
  window.youthInitialInvitation = invitation;
  if (notify) window.dispatchEvent(new Event('youth-invitation'));
}
window.youthInitialInvitation = null;
captureYouthInvitation(false);
window.addEventListener('hashchange', () => captureYouthInvitation(true));
window.youthAcquireWriter = () => new Promise((resolve, reject) => {
  if (!navigator.locks) { reject(new Error('Web Locks unavailable')); return; }
  navigator.locks.request('molodezhka-writer-v1', {mode:'exclusive', ifAvailable:true}, async lock => {
    if (!lock) { resolve(false); return; }
    resolve(true);
    await new Promise(done => { youthReleaseWriter = done; });
  }).catch(reject);
});
window.youthDownload = (bytes, name) => {
  const url = URL.createObjectURL(new Blob([bytes], {type:'application/octet-stream'}));
  const a = document.createElement('a'); a.href=url; a.download=name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};
window.youthPersistStorage = async () => !!(navigator.storage && await navigator.storage.persist());
