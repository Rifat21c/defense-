const loginPanel = document.querySelector("#loginPanel");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#loginForm");
const loginError = document.querySelector("#loginError");
const backendUrl = document.querySelector("#backendUrl");
const email = document.querySelector("#email");
const password = document.querySelector("#password");
const studentName = document.querySelector("#studentName");
const connectionStatus = document.querySelector("#connectionStatus");
const examTitle = document.querySelector("#examTitle");
const riskScore = document.querySelector("#riskScore");
const browserPage = document.querySelector("#browserPage");
const browserUrl = document.querySelector("#browserUrl");
const sessionNotice = document.querySelector("#sessionNotice");
const events = document.querySelector("#events");

function addEvent(message) {
  const item = document.createElement("li");
  item.textContent = message;
  events.prepend(item);
  while (events.children.length > 8) events.lastChild.remove();
}

function renderStatus(status) {
  if (status.user) {
    loginPanel.classList.add("hidden");
    dashboard.classList.remove("hidden");
    studentName.textContent = status.user.name;
  }

  connectionStatus.textContent = status.online ? "Connected" : "Reconnecting";
  connectionStatus.className = status.online ? "good" : "warn";
  examTitle.textContent = status.session?.quiz_title || "Waiting";
  riskScore.textContent = status.riskScore || 0;
  browserPage.textContent = status.browserActivity?.title || status.browserActivity?.browser || "Not detected";
  browserUrl.textContent = status.browserActivity?.url || status.browserActivity?.processName || "";
  sessionNotice.textContent = status.session?.active
    ? "Active exam detected. Keep this client open until submission."
    : "No active exam session detected. Start an exam on the website to begin monitoring.";

  if (status.lastEvent) {
    addEvent(`${status.lastEvent.at} · ${status.lastEvent.eventType} · ${status.lastEvent.details}`);
  }

  if (status.error) addEvent(`Connection issue: ${status.error}`);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";

  try {
    const result = await window.assessNovaMonitor.login({
      backendUrl: backendUrl.value.trim(),
      email: email.value.trim(),
      password: password.value,
    });
    renderStatus({ ...result, online: true, riskScore: 0 });
  } catch (error) {
    loginError.textContent = error.message;
  }
});

document.querySelector("#logoutButton").addEventListener("click", async () => {
  await window.assessNovaMonitor.logout();
  dashboard.classList.add("hidden");
  loginPanel.classList.remove("hidden");
});

document.querySelector("#testAltTab").addEventListener("click", () => {
  window.assessNovaMonitor.sendTestEvent("TAB_SWITCH");
});

document.querySelector("#testBlockedApp").addEventListener("click", () => {
  window.assessNovaMonitor.sendTestEvent("BLOCKED_APP_OPEN");
});

document.querySelector("#testInactive").addEventListener("click", () => {
  window.assessNovaMonitor.sendTestEvent("INACTIVITY");
});

window.assessNovaMonitor.onStatus(renderStatus);
