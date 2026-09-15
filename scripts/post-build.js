const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist', 'hi-tech');
const browserDir = path.join(distDir, 'browser');

if (fs.existsSync(distDir)) {
  // 1. Ensure browser/ directory has a copy of all root files
  if (!fs.existsSync(browserDir)) {
    fs.mkdirSync(browserDir, { recursive: true });
  }
  const files = fs.readdirSync(distDir);
  for (const file of files) {
    if (file !== 'browser') {
      const src = path.join(distDir, file);
      const dest = path.join(browserDir, file);
      fs.cpSync(src, dest, { recursive: true });
    }
  }

  // 2. Also ensure root dist/hi-tech has a copy if files were built into browser/
  if (fs.existsSync(browserDir)) {
    const browserFiles = fs.readdirSync(browserDir);
    for (const file of browserFiles) {
      const src = path.join(browserDir, file);
      const dest = path.join(distDir, file);
      if (!fs.existsSync(dest)) {
        fs.cpSync(src, dest, { recursive: true });
      }
    }
  }

  // 3. Create 404.html as a fallback for SPA routing on static hosting providers
  const indexHtml = path.join(distDir, 'index.html');
  const notFoundHtml = path.join(distDir, '404.html');
  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, notFoundHtml);
  }
  const browserNotFoundHtml = path.join(browserDir, '404.html');
  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, browserNotFoundHtml);
  }

  console.log('Post-build: Dual directory distribution & 404 fallback prepared successfully.');
}
