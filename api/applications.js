export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const baseUrl = process.env.REPLIT_CRM_BASE_URL;
  const apiKey = process.env.REPLIT_NP_API_KEY;
  const debug = process.env.CRM_RELAY_DEBUG === "true";

  const safeDebug = debug
    ? {
        hasBaseUrl: !!baseUrl,
        hasApiKey: !!apiKey,
        apiKeyLen: apiKey ? String(apiKey).length : 0,
        apiKeyLast4: apiKey ? String(apiKey).slice(-4) : "",
        apiKeyPrefix8: apiKey ? String(apiKey).slice(0, 8) : "",
      }
    : undefined;

  if (!baseUrl || !apiKey) {
    return res.status(500).json({
      ok: false,
      error: "Missing REPLIT_CRM_BASE_URL or REPLIT_NP_API_KEY",
      ...(safeDebug ? { debug: safeDebug } : {}),
    });
  }

  try {
    const upstream = await fetch(`${baseUrl.replace(/\/$/, "")}/api/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(req.body),
    });

    const text = await upstream.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }

    if (!upstream.ok) {
      return res.status(502).json({
        ok: false,
        message: "Upstream CRM returned non-OK response",
        upstreamStatus: upstream.status,
        upstreamBody: parsed,
        upstreamUrl: `${baseUrl.replace(/\/$/, "")}/api/applications`,
        ...(safeDebug ? { debug: safeDebug } : {}),
      });
    }

    return res.status(200).json({
      ok: true,
      upstream: parsed,
      ...(safeDebug ? { debug: safeDebug } : {}),
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || "Unexpected error",
      ...(safeDebug ? { debug: safeDebug } : {}),
    });
  }
}
