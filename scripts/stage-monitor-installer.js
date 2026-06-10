const { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } = require("node:fs");
const { basename, join } = require("node:path");

const distDir = join(process.cwd(), "monitor", "dist");
const publicDownloadsDir = join(process.cwd(), "public", "downloads");
const publicFileName = "assessnova-monitor-setup.exe";

function findInstaller() {
  if (!existsSync(distDir)) return null;

  return readdirSync(distDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const filePath = join(distDir, entry.name);
      const stats = statSync(filePath);
      return {
        filePath,
        name: entry.name,
        setupScore: /setup|installer/i.test(entry.name) ? 2 : 1,
        mtimeMs: stats.mtimeMs,
        size: stats.size,
      };
    })
    .filter((entry) => /\.(exe|msi)$/i.test(entry.name) && entry.size > 0)
    .sort((a, b) => b.setupScore - a.setupScore || b.mtimeMs - a.mtimeMs)[0];
}

const installer = findInstaller();

if (!installer) {
  console.error("No monitor installer found. Run `npm run monitor:build` first.");
  process.exit(1);
}

mkdirSync(publicDownloadsDir, { recursive: true });

const targetPath = join(publicDownloadsDir, publicFileName);
copyFileSync(installer.filePath, targetPath);

writeFileSync(
  join(publicDownloadsDir, "monitor.json"),
  `${JSON.stringify(
    {
      sourceFile: basename(installer.name),
      downloadFile: publicFileName,
      size: installer.size,
      stagedAt: new Date().toISOString(),
    },
    null,
    2,
  )}\n`,
);

console.log(`Staged ${installer.name} as public/downloads/${publicFileName}`);
