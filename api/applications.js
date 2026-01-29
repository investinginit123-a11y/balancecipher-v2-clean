// api/applications.js
// Vercel Function (non-Next.js projects): req.body is NOT guaranteed.
// We must read + parse the raw body ourselves.

async function readRawBody(req) {
  return await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      // basic safety limit (~1MB)
      if (data.length > 1_000_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", (err) => reject(err));
  });
}

function safeJsonParse(s) {
  try {
    return { ok: true, value: JSON.parse(s) };
  } catch (e) {
    return { ok: false, error: e?.message || "Invalid JSON" };
  }
}

export default async function handler(req, res) {
  // Basic CORS (optional but often helpful)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const baseUrl = process.env.REPLIT_CRM_BASE_URL;
  const apiKey = process.env.REPLIT_NP_API_KEY;
  const debug = (process.env.CRM_RELAY_DEBUG || "").toLowerCase() === "true";

  if (!baseUrl || !apiKey) {
    return res.status(500).json({
      ok: false,
      error: "Missing REPLIT_CRM_BASE_URL or REPLIT_NP_API_KEY",
      missing: {
        REPLIT_CRM_BASE_URL: !baseUrl,
        REPLIT_NP_API_KEY: !apiKey,
      },
    });
  }

  // Read raw body (works reliably on Vercel Functions)
  let raw = "";
  try {
    raw = await readRawBody(req);
  } catch (e) {
    return res.status(400).json({ ok: false, error: e?.message || "Failed reading body" });
  }

  // If empty body, fail early with clarity
  if (!raw || !raw.trim()) {
    return res.status(400).json({
      ok: false,
      error: "Empty request body received by relay",
      hint: "Your frontend must POST JSON to /api/applications",
    });
  }

  // Parse JSON
  const parsed = safeJsonParse(raw);
  if (!parsed.ok) {
    return res.status(400).json({
      ok: false,
      error: "Invalid JSON body",
      detail: parsed.error,
      rawPreview: raw.slice(0, 500),
    });
  }

  const payload = parsed.value;

  try {
    const upstreamUrl = `${baseUrl.replace(/\/$/, "")}/api/applications`;

    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    let upstreamBody;
    try {
      upstreamBody = JSON.parse(text);
    } catch {
      upstreamBody = { raw: text };
    }

    if (!upstream.ok) {
      // IMPORTANT: return real upstream status/body so 502 stops being a mystery
      return res.status(502).json({
        ok: false,
        message: "Upstream CRM returned non-OK response",
        upstreamStatus: upstream.status,
        upstreamBody,
        ...(debug ? { upstreamUrl } : {}),
      });
    }

    return res.status(200).json({
      ok: true,
      upstream: upstreamBody,
      ...(debug ? { upstreamUrl } : {}),
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || "Unexpected relay error",
    });
  }
}
