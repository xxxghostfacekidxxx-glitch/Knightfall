/* Knightfall Embervale save menu. Original game logic remains in game.js (MIT).
   This UI never sends a save to a server; the player controls their backup. */
(() => {
  'use strict';
  const saves = window.EmbervaleSaves;
  const saveButton = document.getElementById('save-game');
  const loadButton = document.getElementById('continue-game');
  const backupButton = document.getElementById('backup-save');
  const restoreButton = document.getElementById('restore-save');
  const restoreFile = document.getElementById('restore-save-file');
  const status = document.getElementById('save-status');
  const menu = document.getElementById('save-menu');
  if (!saves || !saveButton || !loadButton || !backupButton || !restoreButton || !restoreFile || !status || !menu) return;

  let noticeTimeout;
  const notice = (message, error = false) => {
    clearTimeout(noticeTimeout);
    status.hidden = false;
    status.textContent = message;
    status.dataset.error = String(error);
    noticeTimeout = setTimeout(() => { status.hidden = true; }, 6000);
  };
  saveButton.addEventListener('click', () => {
    if (saves.saveNow()) notice('✓ Progress saved on this device');
    else notice(saves.state() === 'title' ? 'Start or continue a game before saving.' : 'Save unavailable. Check browser storage permissions.', true);
  });
  loadButton.addEventListener('click', () => {
    if (!saves.hasSave()) { notice('No saved adventure on this device.', true); return; }
    if (saves.state() !== 'title' && !confirm('Load your last save? Progress since that save will be lost.')) return;
    if (saves.resume()) { menu.open = false; notice('✓ Saved adventure loaded'); }
    else notice('Could not open the saved adventure.', true);
  });
  backupButton.addEventListener('click', () => {
    const text = saves.exportSave();
    if (!text) { notice('Play or load an adventure before downloading a backup.', true); return; }
    const blob = new Blob([text], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'embervale-save-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    menu.open = false;
    notice('✓ Save backup downloaded');
  });
  restoreButton.addEventListener('click', () => restoreFile.click());
  restoreFile.addEventListener('change', async () => {
    const file = restoreFile.files?.[0];
    restoreFile.value = '';
    if (!file) return;
    if (file.size > 250000) { notice('Save file too large. Expected an Embervale JSON backup.', true); return; }
    try {
      const text = await file.text();
      if (!confirm('Restore this Embervale save? Your current local save will be replaced.')) return;
      if (saves.importSave(text)) {
        menu.open = false;
        notice('✓ Backup restored. Adventure resumed.');
      } else notice('Not a valid Embervale backup, or browser storage is blocked.', true);
    } catch {
      notice('Could not read the selected save file.', true);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
})();
