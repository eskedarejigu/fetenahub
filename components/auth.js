export async function telegramLogin() {
  try {
    const initData = window.Telegram.WebApp.initData;

    const res = await fetch("https://<YOUR_BACKEND_URL>/functions/v1/telegram-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData })
    });

    const session = await res.json();

    if (!session || session.error) throw new Error(session.error || "No session");

    window.sessionData = session;

    console.log("Logged in silently!", session);
    return true;

  } catch (err) {
    console.error("Telegram login failed:", err);
    return false;
  }
}
