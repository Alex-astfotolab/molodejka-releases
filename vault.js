// Secrets stay in IndexedDB, never URLs or localStorage. localStorage holds only
// the non-secret active database name, shared between launch contexts.
let youthReleaseWriter;
// Capture and erase a one-use invitation before Flutter/worker network activity.
let youthLastInvitation = null;
let youthLastInvitationTime = 0;
function captureYouthInvitation(notify, event) {
  const hash = event?.newURL ? new URL(event.newURL).hash : location.hash;
  const invitation = new URLSearchParams(hash.slice(1)).get('join');
  if (!invitation) return;
  // External QR links are connection commands, not Flutter navigation routes.
  // Listen in capture phase so popstate cannot rebuild/dispose the app root
  // while it is saving data before joining the next host.
  event?.stopImmediatePropagation();
  if (new URLSearchParams(location.hash.slice(1)).has('join')) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  const now = Date.now();
  if (notify && invitation === youthLastInvitation && now - youthLastInvitationTime < 1000) return;
  youthLastInvitation = invitation;
  youthLastInvitationTime = now;
  window.youthInitialInvitation = invitation;
  if (notify) window.dispatchEvent(new Event('youth-invitation'));
}
window.youthInitialInvitation = null;
captureYouthInvitation(false);
window.addEventListener('popstate', event => captureYouthInvitation(true, event), true);
window.addEventListener('hashchange', event => captureYouthInvitation(true, event), true);
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
