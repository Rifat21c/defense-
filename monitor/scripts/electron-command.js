const { spawn } = require("node:child_process");

const [tool, ...toolArgs] = process.argv.slice(2);

if (!tool) {
  console.error("Usage: node scripts/electron-command.js <electron|electron-builder> [...args]");
  process.exit(1);
}

// Some shells inherit this from Electron-based tools. It makes Electron behave
// like plain Node, so the monitor loses BrowserWindow/ipcMain at startup.
delete process.env.ELECTRON_RUN_AS_NODE;

let command;
let args = toolArgs;

if (tool === "electron") {
  command = require("electron");
} else if (tool === "electron-builder") {
  command = process.execPath;
  args = [require.resolve("electron-builder/cli.js"), ...toolArgs];
} else {
  console.error(`Unsupported Electron tool: ${tool}`);
  process.exit(1);
}

const child = spawn(command, args, {
  env: process.env,
  stdio: "inherit",
  windowsHide: false,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
