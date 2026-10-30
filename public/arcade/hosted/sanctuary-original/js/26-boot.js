/* ---- async GPU bootstrap (Phase 1b / R4) ----
   WebGPURenderer.init() is async; ALL GPU-dependent setup must run AFTER it resolves on BOTH backends (the WebGL2 fallback is
   just as uninitialized at parse time). So buildEnv (PMREM/env), applyPostFX + buildPipeline (RenderPipeline), the first shadow
   render, the first frame, and the menu loop are all gated behind init().then(...). renderer.backend (and isWebGPUBackend) does
   not exist to read until init resolves. Non-GPU DOM (slots, diff/sound labels) is fine to set synchronously. */
renderSlots();
document.getElementById('diffBtn').textContent = difficulty; document.getElementById('soundBtn').textContent = SAVE._data.settings.muted ? '🔇' : '🔊';
const _bootT0 = (typeof performance !== 'undefined') ? performance.now() : 0; /* Phase 0 rig: boot-timing mark. performance.now() is relative to nav start, so the value logged once the menu shows == time-to-interactive-menu (scenario e). */
renderer.init().then(async () => {
  /* Phase 4 (4.6): yield a rAF between the heavy GPU-setup steps so the loading spinner keeps painting and
     first paint precedes the heaviest pipeline compile (applyAllGfx → buildPipeline). Order preserved by the
     awaits (single-threaded, menu loop not yet started) — this only spreads the same sequence across frames. */
  const _raf = () => new Promise(r => requestAnimationFrame(() => r()));
  isWebGPUBackend = !!(renderer.backend && renderer.backend.isWebGPUBackend); /* read ONCE, post-init; pre-init always reports WebGPU even on fallback. */
  _tsSupported = _perf && !!(renderer.hasFeature && renderer.hasFeature('timestamp-query')); /* Phase 0 rig: GPU timestamps only when perf mode AND the backend supports them (WebGL2 fallback often won't). */
  if (_perf || SAVE._data.settings.perfHud) { _dbgOn = true; const _d = document.getElementById('dbg'); if (_d) _d.style.display = 'block'; } /* perf mode OR the persisted opt-in perfHud setting auto-shows the always-available overlay */
  console.log('[Sanctuary] renderer backend:', isWebGPUBackend ? 'WebGPU' : 'WebGL2 (fallback)', _perf ? ('· perf rig ON, gpu-timestamps ' + (_tsSupported ? 'supported' : 'unavailable')) : '');
  _refreshAnisotropy();             /* re-resolve max anisotropy now that the backend is known (parse-time read may have been 1). */
  buildEnv();                       /* IBL env (PMREM via EnvironmentNode) - GPU-dependent. */
  resolveQuality(); SAVE.persist(); /* Phase 2: resolve the quality tier (Auto auto-downgrades on the WebGL2 fallback) before applying graphics. */
  await _raf();                     /* let the spinner paint before the heavy pipeline compile */
  applyAllGfx();                    /* applyGraphics + shadowSize + lights + buildPipeline + applyPostFX + reflections + grade (GPU-dependent — runs post-init). */
  placeCamera(player);
  if (renderer.shadowMap.enabled) moon.shadow.needsUpdate = true; /* render the moon shadow map on the first frame (sampler2DShadow placeholder fix; see menuLoop). */
  await _raf();
  renderFrame();
  document.getElementById('loading').style.display = 'none';
  show('selectScreen'); startMenu();
  if (_perf) console.log('[Sanctuary] time-to-menu: ' + (performance.now() - _bootT0).toFixed(0) + 'ms'); /* Phase 0 rig: scenario (e) boot metric */
}).catch(err => { console.error('[Sanctuary] renderer.init() failed:', err); const title=document.getElementById('loadtitle');if(title)title.textContent='Graphics initialization failed. Try updating your browser or enabling hardware acceleration.';const loading=document.getElementById('loading');if(loading){loading.setAttribute('role','alert');loading.setAttribute('aria-live','assertive');const retry=document.createElement('button');retry.type='button';retry.textContent='Retry loading';retry.style.cssText='display:block;margin:1rem auto;padding:.8rem 1.3rem;cursor:pointer';retry.addEventListener('click',()=>location.reload());loading.appendChild(retry);} });
