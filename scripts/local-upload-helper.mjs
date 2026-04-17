import http from "node:http";
import { Readable } from "node:stream";
import sharp from "sharp";

const host = "127.0.0.1";
const port = Number(process.env.LOCAL_UPLOAD_HELPER_PORT ?? "3210");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Expose-Headers": "X-Output-Filename",
  "Cache-Control": "no-store",
};

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    ...corsHeaders,
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(`${JSON.stringify(payload)}\n`);
}

function fileBaseName(fileName) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
}

const server = http.createServer(async (request, response) => {
  if (!request.url) {
    writeJson(response, 400, { error: "Missing request URL." });
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204, corsHeaders);
    response.end();
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    writeJson(response, 200, { ok: true });
    return;
  }

  if (request.method !== "POST" || request.url !== "/convert") {
    writeJson(response, 404, { error: "Not found." });
    return;
  }

  try {
    const formRequest = new Request(`http://${host}:${port}${request.url}`, {
      method: request.method,
      headers: request.headers,
      body: Readable.toWeb(request),
      duplex: "half",
    });
    const formData = await formRequest.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      writeJson(response, 400, { error: "Expected a file upload." });
      return;
    }

    const extension = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
      : "";
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await sharp(inputBuffer, {
      animated: file.type === "image/gif" || extension === ".gif",
      limitInputPixels: false,
    })
      .rotate()
      .webp({
        quality: 90,
        effort: 6,
      })
      .toBuffer();

    response.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "image/webp",
      "X-Output-Filename": `${fileBaseName(file.name)}.webp`,
    });
    response.end(outputBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Conversion failed.";
    writeJson(response, 500, { error: message });
  }
});

server.listen(port, host, () => {
  console.log(`[local-upload-helper] listening on http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => {
      process.exit(0);
    });
  });
}
