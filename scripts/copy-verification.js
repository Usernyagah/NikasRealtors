import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildDir = path.join(__dirname, '..', 'dist');
const scriptsDir = path.join(buildDir, 'scripts');

// Create scripts directory in build if it doesn't exist
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

// Copy verification script to build directory
const sourceFile = path.join(__dirname, 'verify-theme.js');
const destFile = path.join(scriptsDir, 'verify-theme.js');

fs.copyFileSync(sourceFile, destFile);
console.log('✅ Theme verification script copied to build directory');

const appleTouch = path.join(__dirname, '..', 'public', 'favicon', 'apple-touch-icon.png');
if (fs.existsSync(appleTouch) && fs.existsSync(buildDir)) {
  fs.copyFileSync(appleTouch, path.join(buildDir, 'apple-touch-icon.png'));
  fs.copyFileSync(appleTouch, path.join(buildDir, 'apple-touch-icon-precomposed.png'));
  console.log('✅ Copied apple-touch-icon files to build root');
}

// Also add it to the index.html
const indexPath = path.join(buildDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Add the script right before the closing </body> tag
  if (!html.includes('verify-theme.js')) {
    const scriptTag = '\n    <script type="module" src="/scripts/verify-theme.js"></script>\n  </body>';
    html = html.replace('</body>', scriptTag);
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log('✅ Added theme verification script to index.html');
  } else {
    console.log('ℹ️ Theme verification script already exists in index.html');
  }
}
