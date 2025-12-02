const OP_USER = "landonorris";
const OP_PASS = "nickinicole";

const serverStatusEl = document.getElementById("server-status");
const serverUptimeEl = document.getElementById("server-uptime");
const serverStartEl = document.getElementById("server-start-time");
const cpuUsageEl = document.getElementById("cpu-usage");
const memoryUsageEl = document.getElementById("memory-usage");
const logOutputEl = document.getElementById("log-output");
const stopPassword = document.getElementById("stop-password");
const stopBtn = document.getElementById("stop-btn");

function getAuthHeaders() {
  return {
    "X-OP-USER": OP_USER,
    "X-OP-PASS": OP_PASS,
    "Content-Type": "application/json",
  };
}

function showToast(message, type = "info", duration = 4000) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.classList.add("toast", `toast-${type}`);
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "transform 0.3s ease, opacity 0.3s ease";
    toast.style.transform = "translateX(100%)";
    toast.style.opacity = "0";

    toast.addEventListener("transitionend", () => {
      toast.remove();
    });
  }, duration);
}

async function fetchServerStatus() {
  try {
    const response = await fetch(
      `https://127.0.0.1:8443/api/admin/server-status`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch server status");
    }

    const data = await response.json();

    serverStatusEl.textContent = data.running ? "Running" : "Stopped";
    serverUptimeEl.textContent = data.uptime || "--";
    serverStartEl.textContent = data.startTime
      ? new Date(data.startTime).toLocaleString()
      : "--";

    cpuUsageEl.textContent = data.cpuLoad
      ? `${data.cpuLoad.toFixed(2)}%`
      : "--";

    if (data.memoryUsage) {
      const usedMB = (data.memoryUsage.used / 1024 / 1024).toFixed(1);
      const maxMB = (data.memoryUsage.max / 1024 / 1024).toFixed(1);
      const availableMB = (maxMB - usedMB).toFixed(1);

      memoryUsageEl.textContent = `${usedMB} / ${maxMB} MB (Available: ${availableMB} MB)`;
    }
  } catch (err) {
    console.error(err);
    serverStatusEl.textContent = "Error";
  }
}

stopBtn.addEventListener("click", async () => {
  const password = stopPassword.value;

  if (!password) {
    showToast("Please enter the stop password", "error");
    return;
  }

  try {
    const response = await fetch(
      `https://127.0.0.1:8443/api/admin/stop-server`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ password }),
      }
    );
    const data = await response.json();
    showToast(data.message || data.error || "An unexpected error occurred", "error");
    fetchServerStatus();
  } catch (err) {
    console.error(err);
    showToast("Failed to stop server", "error");
  }
});

async function fetchServerLogs() {
  try {
    const response = await fetch(`https://127.0.0.1:8443/api/admin/logs`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) return;
    const logs = await response.text();
    logOutputEl.innerHTML = logs.replace(/\n/g, "<br>");
    logOutputEl.scrollTop = logOutputEl.scrollHeight;
  } catch (err) {
    console.error(err);
  }
}

setInterval(() => {
  fetchServerStatus();
  fetchServerLogs();
}, 5000);

fetchServerStatus();
fetchServerLogs();
