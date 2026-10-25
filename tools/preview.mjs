import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = "127.0.0.1";
const requestedPort = Number(process.env.PORT || process.argv[2] || 4174);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};
const publicFiles = new Set([
  "index.html",
  "styles.css",
  "app.js",
  "feedback-pack.js",
  "feedback-model.js",
  "assets/valkyries_hub_icon.png",
  "assets/qq-group-583558357.jpg",
]);
if (
  !Number.isInteger(requestedPort) ||
  requestedPort < 1 ||
  requestedPort > 65535
)
  throw new Error("Invalid preview port");

function listen(port) {
  const server = http.createServer((req, res) => {
    let filename;
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, `http://${host}`).pathname,
      );
      filename = pathname === "/" ? "index.html" : pathname.slice(1);
    } catch {
      res.writeHead(400);
      res.end("Bad request");
      return;
    }
    if (!publicFiles.has(filename)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405, { Allow: "GET, HEAD" });
      res.end();
      return;
    }
    fs.readFile(path.join(root, filename), (error, data) => {
      if (error) {
        res.writeHead(500);
        res.end("Could not read file");
        return;
      }
      res.writeHead(200, {
        "Content-Type":
          types[path.extname(filename)] || "application/octet-stream",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    });
  });
  server.on("error", (error) => {
    if (
      error.code === "EADDRINUSE" &&
      port < Math.min(requestedPort + 20, 65535)
    )
      listen(port + 1);
    else {
      console.error(error.message);
      process.exitCode = 1;
    }
  });
  server.listen(port, host, () => {
    console.log(`Battle Valkyries Feedback: http://${host}:${port}/`);
    console.log("Press Ctrl+C to stop.");
  });
}
listen(requestedPort);
