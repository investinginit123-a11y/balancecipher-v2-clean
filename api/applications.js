export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const baseUrl = process.env.REPLIT_CRM_BASE_URL;
  const apiKey = process.env.REPLIT_NP_API_KEY;
  const debug = String(process.env.CRM_RELAY_DEBUG || "").toLowerCase() === "true";

  if (!baseUrl || !apiKey) {
    return res.status(500).json({
      ok: false,
      error: "Missing REPLIT_CRM_BASE_URL or REPLIT_NP_API_KEY",
      debug: debug
        ? { hasBaseUrl: Boolean(baseUrl), hasApiKey: Boolean(apiKey) }
        : undefined
    });
  }

  // Vercel may provide req.body as object OR string depending on runtime/config.
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      // keep as string
    }
  }

  try {
    const upstreamUrl = `${baseUrl.replace(/\/$/, "")}/api/applications`;

    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify(body ?? {})
    });

    const raw = await upstream.text();
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { raw };
    }

    if (!upstream.ok) {
      return res.status(502).json({
        ok: false,
        upstreamStatus: upstream.status,
        upstreamBody: parsed,
        debug: debug ? { upstreamUrl } : undefined
      });
    }

    return res.status(200).json({
      ok: true,
      upstream: parsed,
      debug: debug ? { upstreamUrl } : undefined
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || "Unexpected error",
      debug: debug ? { stack: e?.stack } : undefined
    });
  }
}
