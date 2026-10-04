const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createWriteStream } = require('fs');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const stageDir = path.join(distDir, 'package');
const zipPath = path.join(distDir, 'function.zip');

const excludeNames = new Set([
    'node_modules',
    'dist',
    '.git',
    '.github',
    'terraform',
    'scripts',
    '.env',
    '.gitignore',
    'package-lock.json'
]);

function rmrf(target) {
    fs.rmSync(target, { recursive: true, force: true });
}

function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
            if (excludeNames.has(entry)) continue;
            if (entry.endsWith('.md')) continue;
            copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
        return;
    }
    fs.copyFileSync(src, dest);
}

async function zipDirectory(sourceDir, outPath) {
    let archiver;
    try {
        archiver = require('archiver');
    } catch {
        execSync('npm install archiver --no-save', { cwd: rootDir, stdio: 'inherit' });
        archiver = require('archiver');
    }

    await new Promise((resolve, reject) => {
        const output = createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

async function main() {
    rmrf(distDir);
    fs.mkdirSync(stageDir, { recursive: true });

    fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(stageDir, 'package.json'));
    const lockFile = path.join(rootDir, 'package-lock.json');
    if (fs.existsSync(lockFile)) {
        fs.copyFileSync(lockFile, path.join(stageDir, 'package-lock.json'));
    }

    execSync('npm ci --omit=dev', { cwd: stageDir, stdio: 'inherit' });
    copyRecursive(rootDir, stageDir);

    await zipDirectory(stageDir, zipPath);

    const sizeMb = (fs.statSync(zipPath).size / (1024 * 1024)).toFixed(2);
    console.log(`Built ${zipPath} (${sizeMb} MB)`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
