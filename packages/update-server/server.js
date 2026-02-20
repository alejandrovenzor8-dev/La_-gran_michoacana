const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const RELEASES_DIR = path.join(__dirname, 'releases');

const MIME_TYPES = {
  '.yml': 'text/yaml',
  '.yaml': 'text/yaml',
  '.exe': 'application/octet-stream',
  '.blockmap': 'application/octet-stream',
  '.zip': 'application/zip',
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url);
  let filePath = path.join(RELEASES_DIR, decodeURIComponent(parsedUrl.pathname || '/'));

  // Security: prevent directory traversal
  if (!filePath.startsWith(RELEASES_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Root path: list files
  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '') {
    const files = fs.readdirSync(RELEASES_DIR);
    const links = files.map(f => `<li><a href="/${f}">${f}</a></li>`).join('\n');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<html><body><h1>Update Server</h1><ul>${links}</ul></body></html>`);
    return;
  }

  if (!fs.existsSync(filePath)) {
    console.log(`404: ${filePath}`);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  // Special handling for latest.yml to inject correct GitHub download URL
  if (parsedUrl.pathname === '/latest.yml') {
    let content = fs.readFileSync(filePath, 'utf-8');
    // Replace relative URL with full GitHub URL
    content = content.replace(
      /url: La-Gran-Michoacana-Setup-1\.0\.3\.exe/,
      'url: https://github.com/alejandrovenzor8-dev/La_-gran_michoacana/releases/download/v1.0.3/La-Gran-Michoacana-Setup-1.0.3.exe'
    );
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'text/yaml');
    res.setHeader('Content-Length', Buffer.byteLength(content));
    res.writeHead(200);
    res.end(content);
    console.log(`200: ${req.url} (dynamic content with GitHub URL)`);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // No-cache for latest.yml
  if (ext === '.yml' || ext === '.yaml') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
  });

  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
  console.log(`200: ${req.url} (${stat.size} bytes)`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Update server running on port ${PORT}`);
  const files = fs.readdirSync(RELEASES_DIR);
  console.log(`Serving ${files.length} files from releases/:`, files);
});
