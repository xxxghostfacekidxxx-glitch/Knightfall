/* Ash-Fall integration layer for the MIT-licensed 2048 game.
 * Upstream game logic is retained; this file adds account saves and scores.
 */
(() => {
  "use strict";
  const GAME_KEY = "classic-2048";
  const status = document.getElementById("arcade-account-status");
  let loadingCloud = true;
  let saveTimer = null;
  let lastRecorded = "";
  const setStatus = message => { if (status) status.textContent = message; };

  window.AshFall2048Ready = async manager => {
    const storage = manager.storageManager;
    const nativeSetup = manager.setup.bind(manager);
    const nativeActuate = manager.actuate.bind(manager);
    const nativeRestart = manager.restart.bind(manager);

    manager.actuate = function () {
      nativeActuate();
      if (loadingCloud) return;
      scheduleCloudSave();
      if (this.over || this.won) recordTerminalScore(this);
    };
    manager.restart = function () {
      lastRecorded = "";
      if (saveTimer) clearTimeout(saveTimer);
      nativeRestart();
    };

    const localSnapshot = () => ({
      gameState: manager.serialize(),
      bestScore: Number(storage.getBestScore()) || 0
    });

    function scheduleCloudSave() {
      if (!window.AshFallArcade?.user) return;
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        saveTimer = null;
        try {
          await window.AshFallArcade.saveProgress(GAME_KEY, localSnapshot(), "autosave", 1);
          setStatus("Progress synced to your Ash-Fall account.");
        } catch (error) {
          setStatus(error?.status === 409
            ? "A newer save exists on another device. Reload the game to use that save."
            : "Playing locally. Account sync will retry after your next move.");
        }
      }, 1300);
    }

    async function recordTerminalScore(game) {
      const signature = String(game.score) + ":" + String(game.over) + ":" + String(game.won);
      if (signature === lastRecorded) return;
      lastRecorded = signature;
      if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
      if (!window.AshFallArcade?.user) return;
      try {
        await window.AshFallArcade.recordScore(GAME_KEY, game.score, localSnapshot());
      } catch {
        setStatus("Game finished. The score remains saved on this device.");
      }
    }

    if (window.AshFallArcade?.ready) await window.AshFallArcade.ready;
    if (window.AshFallArcade?.user) {
      try {
        const cloud = await window.AshFallArcade.loadProgress(GAME_KEY);
        if (cloud && cloud.gameState && cloud.gameState.grid && Array.isArray(cloud.gameState.grid.cells)) {
          storage.setGameState(cloud.gameState);
          storage.setBestScore(Math.max(Number(storage.getBestScore()) || 0, Number(cloud.bestScore) || 0));
          loadingCloud = true;
          nativeSetup();
          setStatus("Cloud save loaded. Keep making questionable mathematical decisions.");
        } else {
          setStatus("Signed in. Your next moves will sync across devices.");
        }
      } catch {
        setStatus("Cloud save unavailable right now. Your local game still works.");
      }
    } else {
      setStatus("Sign in to sync progress and submit scores to the Ash-Fall leaderboard.");
    }

    loadingCloud = false;
    if (window.AshFallArcade?.user) scheduleCloudSave();
  };
})();
