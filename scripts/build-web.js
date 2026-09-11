const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..');
const destDir = path.resolve(__dirname, '..', 'www');

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir, { recursive: true });

const filesToCopy = ['index.html', 'manifest.json', 'sw.js'];
const dirsToCopy = ['assets', 'css', 'js'];

filesToCopy.forEach(file => {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} -> www/`);
  }
});

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

dirsToCopy.forEach(dir => {
  const src = path.join(srcDir, dir);
  const dest = path.join(destDir, dir);
  if (fs.existsSync(src)) {
    copyDirRecursive(src, dest);
    console.log(`Copied ${dir}/ -> www/${dir}/`);
  }
});

// Sync to Android assets folder if android platform exists
const androidAssetsPublic = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public');
const androidAssets = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'assets');

if (fs.existsSync(path.resolve(__dirname, '..', 'android'))) {
  if (fs.existsSync(androidAssetsPublic)) {
    fs.rmSync(androidAssetsPublic, { recursive: true, force: true });
  }
  fs.mkdirSync(androidAssetsPublic, { recursive: true });

  copyDirRecursive(destDir, androidAssetsPublic);

  // Copy capacitor.config.json to android assets
  const capConfig = path.resolve(__dirname, '..', 'capacitor.config.json');
  if (fs.existsSync(capConfig)) {
    fs.copyFileSync(capConfig, path.join(androidAssets, 'capacitor.config.json'));
  }

  // Ensure capacitor.plugins.json exists
  const capPlugins = path.join(androidAssets, 'capacitor.plugins.json');
  if (!fs.existsSync(capPlugins)) {
    fs.writeFileSync(capPlugins, '[]', 'utf8');
  }

  console.log('Android assets synced successfully to android/app/src/main/assets/public/');
}

console.log('Web assets built successfully to www/');
