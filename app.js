import { telegramLogin } from "./components/auth.js";
import { uploadInit } from "./components/upload.js";
import { feedInit } from "./components/feed.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Step 1: Telegram silent login
  const loginSuccess = await telegramLogin();

  if (loginSuccess) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("upload-section").style.display = "block";
    document.getElementById("feed-section").style.display = "block";

    // Initialize uploads
    uploadInit();

    // Initialize feed (placeholder for now)
    feedInit();
  } else {
    document.getElementById("login-msg").innerText = "Login failed. Please try again.";
  }
});
