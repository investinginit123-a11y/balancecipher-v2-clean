// /api/applications.js
// Vercel Serverless Function (CommonJS-safe)
// Endpoint: POST /api/applications

module.exports = async function handler(req, res) {
  const DEBUG = String(process.env.CRM_RELAY_DEBUG || "").toLowerCase() === "true";

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method Not Allowed",
      allowed: ["POST"],
    });
  }

  const baseUrl = (process.env.REPLIT_CRM_BASE_URL || "").trim();
  const apiKey = (process.env.REPLIT_NP_API_KEY || "").trim();

  if (!baseUrl || !apiKey) {
    return res.status(500).json({
      ok: false,
      error: "Missing required environment variables",
      missing: {
        REPLIT_CRM_BASE_URL: !baseUrl,
        REPLIT_NP_API_KEY: !apiKey,
      },
      ...(DEBUG ? { hint: "Set env vars in Vercel → Settings → Environment Variables, then redeploy." } : {}),
    });
  }

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const targetUrl = `${normalizedBase}/api/applications`;

  let incomingPayload = req.body;
  try {
    if (typeof incomingPayload === "string") incomingPayload = JSON.parse(incomingPayload);
  } catch (_e) {
    return res.status(400).json({
      ok: false,
      error: "Invalid JSON payload",
      ...(DEBUG ? { receivedType: typeof req.body, receivedBody: req.body } : {}),
    });
  }

  const hasApplicant = incomingPayload && typeof incomingPayload === "object" && incomingPayload.applicant;
  if (!hasApplicant) {
    return res.status(400).json({
      ok: false,
      error: "Payload missing required 'applicant' object",
      ...(DEBUG ? { receivedPayload: incomingPayload } : {}),
    });
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(incomingPayload),
    });

    const contentType = upstream.headers.get("content-type") || "";
    const upstreamBody = contentType.includes("application/json") ? await upstream.json() : await upstream.text();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        ok: false,
        error: "Upstream CRM rejected the request",
        status: upstream.status,
        ...(DEBUG ? { targetUrl, upstreamBody, sentPayload: incomingPayload } : { upstreamBody }),
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Relayed to CRM successfully",
      ...(DEBUG ? { targetUrl, upstreamBody } : {}),
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Relay failed (network/runtime error)",
      ...(DEBUG ? { details: String(err), targetUrl } : {}),
    });
  }
};
