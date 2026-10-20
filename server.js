const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const API_KEY = process.env.OMDB_API_KEY;
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
};
const OMDB_PARAMETERS = new Set(["i", "page", "plot", "s", "type", "y"]);

if (!API_KEY) {
  throw new Error("OMDB_API_KEY is required. Set it in .env before starting the server.");
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname === "/api/omdb") {
    if (request.method !== "GET") {
      response.writeHead(405, { Allow: "GET" }).end("Method not allowed");
      return;
    }

    const parameters = new URLSearchParams({ apikey: API_KEY });
    for (const [name, value] of requestUrl.searchParams) {
      if (OMDB_PARAMETERS.has(name)) parameters.append(name, value);
    }

    try {
      const upstream = await fetch(`https://www.omdbapi.com/?${parameters}`);
      response.writeHead(upstream.status, {
        "Content-Type": "application/json; charset=utf-8",
      });
      response.end(await upstream.text());
    } catch (error) {
      console.error("OMDb request failed:", error);
      response.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Unable to reach OMDb.");
    }
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    response.writeHead(400).end("Invalid URL path");
    return;
  }

  if (pathname === "/" || pathname === "/index.html") pathname = "/html/index.html";
  else if (/^\/(details|genre|watchlist)\.html$/.test(pathname))
    pathname = `/html${pathname}`;

  const filePath = path.resolve(ROOT, `.${pathname}`);
  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    if (request.method === "HEAD") response.end();
    else fs.createReadStream(filePath).pipe(response);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`MovieSearch is available at http://localhost:${PORT}`);
});
