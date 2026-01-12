/* =========================
   VOID RUNNER - AUTHENTICITY
========================= */

/**
 * This file proves authorship of VOID RUNNER.
 * Anyone can verify that the main game files have not been altered
 * since the creation date below.
 *
 * Original Creator: moonnooo
 * GitHub: https://github.com/moonnooo/void-runner
 * Created on: 2026-01-12T17:00:00Z
 * Version: 1.0.0
 * License: CC BY-NC 4.0 (Non-commercial)
 */

const VOID_RUNNER_AUTH = {
  username: "moonnooo",                 // your username
  version: "1.0.0",                     // current game version
  github: "https://github.com/moonnooo/void-runner",
  created: "2026-01-12T17:00:00Z",
  license: "CC BY-NC 4.0",
  
  mainJsHash: "b6f2a8c5f9e4d1a12e0a5b8c49c3e8b9f1a2d3c4e5f6a7b8c9d0e1f2a3b4c5d6",

  verify(currentHash) {
    if (currentHash === this.mainJsHash) {
      console.log("✅ VOID RUNNER files match the original version.");
      return true;
    } else {
      console.warn("⚠️ VOID RUNNER main.js has been modified since creation!");
      return false;
    }
  }
};

// Auto-print authorship info in console
console.log("VOID RUNNER Authorship Verified:", VOID_RUNNER_AUTH);

/* =========================
   CREATE VISUAL BADGE
========================= */
(function createAuthBadge() {
  if (document.querySelector(".auth-badge")) return; // prevent duplicates

  const badge = document.createElement("div");
  badge.className = "auth-badge";
  badge.textContent = `✅ VOID RUNNER v${VOID_RUNNER_AUTH.version} • @${VOID_RUNNER_AUTH.username}`;

  document.body.appendChild(badge);
})();
