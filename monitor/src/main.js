const { app, BrowserWindow, dialog, ipcMain, powerMonitor, screen } = require("electron");
const { exec, execFile } = require("node:child_process");
const path = require("node:path");

const DEFAULT_BACKEND_URL = process.env.ASSESSNOVA_BACKEND_URL || "https://assessnova-ai-starter.vercel.app";
const BROWSER_APPS = {
  chrome: "Google Chrome",
  firefox: "Mozilla Firefox",
  msedge: "Microsoft Edge",
  brave: "Brave",
  opera: "Opera",
};
const BLOCKED_APPS = [
  "notepad.exe",
  "calc.exe",
  "winword.exe",
  "excel.exe",
  "powerpnt.exe",
  "teams.exe",
  "discord.exe",
  "telegram.exe",
  "whatsapp.exe",
];
const ACTIVE_BROWSER_SCRIPT = `
Add-Type -AssemblyName UIAutomationClient
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class AssessNovaForegroundWindow {
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();

  [DllImport("user32.dll")]
  public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out int processId);
}
"@

$handle = [AssessNovaForegroundWindow]::GetForegroundWindow()
$processId = 0
[AssessNovaForegroundWindow]::GetWindowThreadProcessId($handle, [ref]$processId) | Out-Null
$process = Get-Process -Id $processId -ErrorAction SilentlyContinue
$result = [ordered]@{
  processName = ""
  title = ""
  url = ""
  browser = $false
}

if ($process) {
  $result.processName = $process.ProcessName
  $result.title = $process.MainWindowTitle
}

$browserNames = @("chrome", "firefox", "msedge", "brave", "opera")
if ($process -and $browserNames -contains $process.ProcessName.ToLowerInvariant()) {
  $result.browser = $true
  try {
    $element = [System.Windows.Automation.AutomationElement]::FromHandle($handle)
    $condition = New-Object System.Windows.Automation.PropertyCondition -ArgumentList ([System.Windows.Automation.AutomationElement]::ControlTypeProperty), ([System.Windows.Automation.ControlType]::Edit)
    $edits = $element.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condition)

    for ($index = 0; $index -lt $edits.Count; $index++) {
      $pattern = $null
      if ($edits.Item($index).TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$pattern)) {
        $value = $pattern.Current.Value
        if ($value -and ($value -match '^(https?|file)://|^[A-Za-z0-9.-]+\\.[A-Za-z]{2,}(/|$)')) {
          $result.url = $value
          break
        }
      }
    }
  } catch {}
}

[pscustomobject]$result | ConvertTo-Json -Compress
`;
const state = {
  backendUrl: DEFAULT_BACKEND_URL,
  token: "",
  user: null,
  session: null,
  riskScore: 0,
  online: false,
  lastActivityAt: Date.now(),
  blockedAppsSeen: new Set(),
  browserActivity: null,
  lastBrowserActivityKey: "",
};

let mainWindow;
let pollTimer;
let inactivityTimer;
let appScanTimer;
let browserScanTimer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 680,
    minWidth: 780,
    minHeight: 560,
    title: "AssessNova Monitor",
    backgroundColor: "#f8fafc",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "renderer.html"));

  mainWindow.on("blur", () => recordEvent("BROWSER_FOCUS_LOSS", "Exam browser or monitor lost focus."));
  mainWindow.on("minimize", () => recordEvent("WINDOW_MINIMIZE", "AssessNova Monitor window was minimized."));
  mainWindow.on("close", (event) => {
    if (state.session?.active) {
      event.preventDefault();
      recordEvent("EXAM_CLIENT_CLOSED", "Student attempted to close the assessment integrity client.");
      mainWindow.show();
      dialog.showMessageBox(mainWindow, {
        type: "warning",
        title: "Assessment in progress",
        message: "Keep AssessNova Monitor open until your exam is submitted.",
      });
    }
  });
}

async function request(endpoint, options = {}) {
  const response = await fetch(`${state.backendUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    },
  });

  state.online = response.ok;
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed with ${response.status}`);
  }

  return response.json();
}

function sendStatus(extra = {}) {
  mainWindow?.webContents.send("monitor:status", {
    backendUrl: state.backendUrl,
    user: state.user,
    session: state.session,
    riskScore: state.riskScore,
    online: state.online,
    browserActivity: state.browserActivity,
    ...extra,
  });
}

async function recordEvent(eventType, details, options = {}) {
  if (!state.session?.active || !state.user) return;

  try {
    const result = await request("/api/monitor/logs", {
      method: "POST",
      body: JSON.stringify({
        quiz_id: state.session.quiz_id,
        event_type: eventType,
        source: "desktop",
        details,
      }),
    });

    state.riskScore = result.totalRisk;
    sendStatus({
      lastEvent: {
        eventType,
        details,
        risk: result.risk,
        riskScore: result.totalRisk,
        at: new Date().toLocaleTimeString(),
      },
    });

    if (options.silent) return;

    if (result.totalRisk > 15) {
      dialog.showMessageBox(mainWindow, {
        type: "error",
        title: "High assessment risk",
        message: "Your risk score exceeded the allowed threshold. The website will submit the exam automatically.",
      });
    } else {
      dialog.showMessageBox(mainWindow, {
        type: "warning",
        title: "Assessment integrity warning",
        message: details,
      });
    }
  } catch (error) {
    state.online = false;
    sendStatus({ error: error.message });
  }
}

async function pollSession() {
  if (!state.token) return;

  try {
    const payload = await request("/api/monitor/session");
    state.session = payload.session;
    state.riskScore = state.session?.risk_points_total || state.riskScore;
    sendStatus();
    if (state.session?.active) {
      checkDisplays();
    }
  } catch (error) {
    state.online = false;
    sendStatus({ error: error.message });
  }
}

function checkDisplays() {
  if (screen.getAllDisplays().length > 1) {
    recordEvent("MULTIPLE_MONITORS", "Multiple monitor setup detected during the exam.");
  }
}

function normalizeUrl(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";
  if (/^(https?|file):\/\//i.test(trimmed)) return trimmed;
  if (/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}(\/|$)/.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function formatBrowserActivity(activity) {
  const page = activity.url || "URL unavailable";
  const title = activity.title ? ` | Title: ${activity.title}` : "";
  return `${activity.browser} active tab: ${page}${title}`;
}

function scanActiveBrowser() {
  if (!state.session?.active || process.platform !== "win32") return;

  execFile(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ACTIVE_BROWSER_SCRIPT],
    { timeout: 2500, windowsHide: true },
    (error, stdout) => {
      if (error || !stdout.trim()) return;

      let payload;
      try {
        payload = JSON.parse(stdout.trim().split(/\r?\n/).pop());
      } catch {
        return;
      }

      const processName = String(payload.processName || "").toLowerCase();
      const browser = BROWSER_APPS[processName];
      if (!payload.browser && !browser) return;

      const activity = {
        browser: browser || payload.processName || "Browser",
        processName,
        title: String(payload.title || "").trim(),
        url: normalizeUrl(payload.url),
        at: new Date().toLocaleTimeString(),
      };

      if (!activity.url && !activity.title) return;

      const key = `${activity.processName}|${activity.url}|${activity.title}`;
      if (key === state.lastBrowserActivityKey) return;

      state.lastBrowserActivityKey = key;
      state.browserActivity = activity;
      sendStatus({ browserActivity: activity });
      recordEvent("BROWSER_TAB_CHANGE", formatBrowserActivity(activity), { silent: true });
    },
  );
}

function scanBlockedApps() {
  if (!state.session?.active || process.platform !== "win32") return;

  exec("tasklist /fo csv /nh", (error, stdout) => {
    if (error) return;
    const lowerOutput = stdout.toLowerCase();
    BLOCKED_APPS.forEach((appName) => {
      if (lowerOutput.includes(appName) && !state.blockedAppsSeen.has(appName)) {
        state.blockedAppsSeen.add(appName);
        recordEvent("BLOCKED_APP_OPEN", `Blocked application detected: ${appName}`);
      }
    });
  });
}

function startMonitoringLoops() {
  clearInterval(pollTimer);
  clearInterval(inactivityTimer);
  clearInterval(appScanTimer);
  clearInterval(browserScanTimer);

  pollTimer = setInterval(pollSession, 3000);
  inactivityTimer = setInterval(() => {
    const idleSeconds = powerMonitor.getSystemIdleTime();
    if (state.session?.active && idleSeconds >= 60) {
      recordEvent("INACTIVITY", `No keyboard or mouse activity for ${idleSeconds} seconds.`);
    }
  }, 15000);
  appScanTimer = setInterval(scanBlockedApps, 5000);
  browserScanTimer = setInterval(scanActiveBrowser, 2500);
}

ipcMain.handle("monitor:login", async (_event, payload) => {
  state.backendUrl = payload.backendUrl || DEFAULT_BACKEND_URL;
  const result = await request("/api/monitor/login", {
    method: "POST",
    body: JSON.stringify({ email: payload.email, password: payload.password }),
  });
  state.token = result.token;
  state.user = result.user;
  state.riskScore = 0;
  state.browserActivity = null;
  state.lastBrowserActivityKey = "";
  startMonitoringLoops();
  await pollSession();
  return { user: state.user, session: state.session, backendUrl: state.backendUrl };
});

ipcMain.handle("monitor:manual-event", async (_event, eventType) => {
  await recordEvent(eventType, "Manual test event from AssessNova Monitor.");
  return true;
});

ipcMain.handle("monitor:logout", () => {
  state.token = "";
  state.user = null;
  state.session = null;
  state.riskScore = 0;
  state.browserActivity = null;
  state.lastBrowserActivityKey = "";
  clearInterval(pollTimer);
  clearInterval(inactivityTimer);
  clearInterval(appScanTimer);
  clearInterval(browserScanTimer);
  sendStatus();
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
