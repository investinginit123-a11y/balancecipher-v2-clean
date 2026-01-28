export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const baseUrl = process.env.REPLIT_CRM_BASE_URL;
  const apiKey = process.env.REPLIT_NP_API_KEY;

  if (!baseUrl || !apiKey) {
    return res.status(500).json({
      ok: false,
      error: "Missing REPLIT_CRM_BASE_URL or REPLIT_NP_API_KEY",
    });
  }

  try {
    const upstream = await fetch(`${baseUrl.replace(/\/$/, "")}/api/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
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
        upstreamStatus: upstream.status,
        upstreamBody: parsed,
      });
    }

    return res.status(200).json({ ok: true, upstream: parsed });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || "Unexpected error" });
  }
}
