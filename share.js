const shareTwitter = document.getElementById("shareTwitter");
const shareFacebook = document.getElementById("shareFacebook");
const shareCopy = document.getElementById("shareCopy");
const shareMessage = document.getElementById("shareMessage");

/* =========================
   SHARE HELPERS
========================= */
function getShareText() {
  const bestScore = localStorage.bestScore || 0;
  return `I scored ${Math.floor(score)} points (Best: ${Math.floor(bestScore)}) in VOID RUNNER! Can you beat me? 🚀`;
}

function getGameUrl() {
  return window.location.href;
}

/* =========================
   SHOW MESSAGE
========================= */
function showShareMessage(msg) {
  shareMessage.textContent = msg;
  shareMessage.classList.add("show");

  // Hide after 2 seconds
  setTimeout(() => shareMessage.classList.remove("show"), 2000);
}

/* =========================
   SHARE BUTTONS
========================= */
// Twitter
shareTwitter.onclick = () => {
  const text = encodeURIComponent(getShareText());
  const url = encodeURIComponent(getGameUrl());
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  showShareMessage("Sharing on X...");
};

// Facebook
shareFacebook.onclick = () => {
  const url = encodeURIComponent(getGameUrl());
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  showShareMessage("Sharing on Facebook...");
};

// Copy Link
shareCopy.onclick = async () => {
  try {
    await navigator.clipboard.writeText(`${getShareText()} ${getGameUrl()}`);
    showShareMessage("Link copied to clipboard! Share it with your friends! 🎮");
  } catch {
    showShareMessage("Failed to copy link. Try manually.");
  }
};
