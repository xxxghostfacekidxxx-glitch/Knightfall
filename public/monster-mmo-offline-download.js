(() => {
  "use strict";
  const button = document.getElementById("mmo-download");
  const status = document.getElementById("mmo-admin-status");
  if (!button || !status) return;
  async function load(path) {
    const response = await fetch(path, { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error(path + " returned HTTP " + response.status);
    return response.text();
  }
  button.addEventListener("click", async () => {
    if (button.disabled) return;
    button.disabled = true;
    status.textContent = "Packaging Hell & High Orbit for offline testing…";
    try {
      const [html, css, js, pixelWorld, pixelBattle, spriteAtlas, pauseMenu, dialogue] = await Promise.all([
        load("/monster-mmo.html"),
        load("/monster-mmo.css"),
        load("/monster-mmo.js"),
        load("/monster-mmo-pixel-world.js"),
        load("/monster-mmo-pixel-battle.js"),
        load("/monster-mmo-sprite-atlas.js"),
        load("/monster-mmo-pause-menu.js"),
        load("/monster-mmo-dialogue.js")
      ]);
      const cssTag = '<link rel="stylesheet" href="/monster-mmo.css">';
      const jsTag = '<script type="module" src="/monster-mmo.js"></script>';
      const pixelTag = '<script src="/monster-mmo-pixel-world.js" defer></script>';
      const battleTag = pixelTag.replace('pixel-world', 'pixel-battle');
      const spriteTag = pixelTag.replace('pixel-world', 'sprite-atlas');
      const pauseTag = pixelTag.replace('pixel-world', 'pause-menu');
      const dialogueTag = pixelTag.replace('pixel-world', 'dialogue');
      if (!html.includes(cssTag) || !html.includes(jsTag) || !html.includes(pixelTag) || !html.includes(battleTag) || !html.includes(spriteTag) || !html.includes(pauseTag) || !html.includes(dialogueTag)) {
        throw new Error("Game asset references changed. The offline bundle needs updating.");
      }
      // Inline the entire game so a file:// launch needs no web server.
      // Escape closing tags to prevent asset text from prematurely ending a block.
      const safeCss = css.replace(/<\/style/gi, "<\\/style");
      const safePixel = pixelWorld.replace(/<\/script/gi, "<\\/script");
      const safeBattle = pixelBattle.replaceAll('</scr' + 'ipt', '<\\/scr' + 'ipt');
      const safeSprites = spriteAtlas.replaceAll('</scr' + 'ipt', '<\\/scr' + 'ipt');
      const safePause = pauseMenu.replace(/<\/script/gi, "<\\/script");
      const safeDialogue = dialogue.replace(/<\/script/gi, "<\\/script");
      const safeJs = js.replace(/<\/script/gi, "<\\/script");
      let bundled = html.replace(cssTag, "<style>" + safeCss + "</style>")
        .replace(jsTag, "<script>" + safeJs + "</script>")
        .replace(pixelTag, "<script defer>" + safePixel + "</script>")
        .replace(battleTag, '<script defer>' + safeBattle + '</script>')
        .replace(spriteTag, '<script defer>' + safeSprites + '</script>')
        .replace(pauseTag, '<script defer>' + safePause + '</script>')
        .replace(dialogueTag, '<script defer>' + safeDialogue + '</script>');
      // The offline package never attempts staging authentication or multiplayer.
      bundled = bundled.replace(/<section class="panel" data-pause-section="settings"><h2>Multiplayer staging<\/h2>[\s\S]*?<\/section>/,
        '<section class="panel" data-pause-section="settings"><h2>Offline test build</h2><p class="hint">This self-contained file runs without internet. Progress is stored locally in this browser when storage is available. Cloud saves and multiplayer are disabled.</p><div id="players" hidden></div></section>');
      bundled = bundled.replace(/<a href="\/chaos-cartridge.html">[^<]*<\/a>/,
        '<span class="tag">STANDALONE OFFLINE TEST BUILD</span>');
      // Remove online-only buttons and listeners from the self-contained build.
      bundled = bundled.replace("$(\"connect\").addEventListener(\"click\",connect);$(\"disconnect\").addEventListener(\"click\",disconnect);", "");
      if (bundled.includes('id="connect"') || bundled.includes('src="/monster-mmo.js"') ||
          bundled.includes('href="/monster-mmo.css"') || bundled.includes('src="/monster-mmo-pixel-world.js"') || bundled.includes('src="/monster-mmo-pixel-battle.js"') || bundled.includes('src="/monster-mmo-sprite-atlas.js"') || bundled.includes('src="/monster-mmo-pause-menu.js"') || bundled.includes('src="/monster-mmo-dialogue.js"')) {
        throw new Error("Offline packaging did not remove all online-only assets.");
      }
      const blob = new Blob([bundled], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "ash-fall-hell-and-high-orbit-offline.html";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      status.textContent = "Offline HTML package prepared. Open the downloaded file in your browser to test.";
    } catch (error) {
      status.textContent = "Offline download failed: " + error.message;
    } finally {
      button.disabled = false;
    }
  });
})();
