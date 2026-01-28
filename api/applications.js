// /api/applications.js
// Vercel Serverless Function (Node.js)
// Endpoint: POST /api/applications
//
// Env vars required (Vercel Project Settings):
// - REPLIT_CRM_BASE_URL = https://crm.bastiansauto.com
// - REPLIT_NP_API_KEY   = <your key>
//
// Optional debug:
// - CRM_RELAY_DEBUG = true

export default async function handler(req, res) {
  const DEBUG = String(process.env.CRM_RELAY_DEBUG || "").toLowerCase() === "true";

  // Basic CORS (safe default)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

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
      ...(DEBUG ? { hint: "Set env vars in Vercel → Project → Settings → Environment Variables, then redeploy." } : {}),
    });
  }

  // Normalize base URL (no trailing slash)
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const targetUrl = `${normalizedBase}/api/applications`;

  // Vercel automatically parses JSON body when Content-Type: application/json
  // But we defensively handle string bodies as well.
  let incomingPayload = req.body;

  try {
    if (typeof incomingPayload === "string") {
      incomingPayload = JSON.parse(incomingPayload);
    }
  } catch (_e) {
    return res.status(400).json({
      ok: false,
      error: "Invalid JSON payload",
      ...(DEBUG ? { receivedType: typeof req.body, receivedBody: req.body } : {}),
    });
  }

  // Minimal shape validation (do NOT block real traffic—just sanity checks)
  // Expecting: { source, requestId, startedAt, tracking, applicant: {...} }
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
    let upstreamBody;

    if (contentType.includes("application/json")) {
      upstreamBody = await upstream.json();
    } else {
      upstreamBody = await upstream.text();
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        ok: false,
        error: "Upstream CRM rejected the request",
        status: upstream.status,
        ...(DEBUG
          ? {
              targetUrl,
              upstreamBody,
              sentPayload: incomingPayload,
            }
          : {
              upstreamBody: typeof upstreamBody === "string" ? upstreamBody.slice(0, 500) : upstreamBody,
            }),
      });
    }

    // Success
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
}

