import React, { useEffect, useRef, useState } from "react";

type View = "landing" | "p2" | "p3" | "p4" | "p5" | "info";
type P5Stage = "email" | "code";
type SendState = "idle" | "sending" | "sent" | "error";

function safeTrimMax(v: string, maxLen: number) {
  return v.trim().slice(0, maxLen);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function safeJsonStringify(x: unknown) {
  try {
    return JSON.stringify(x);
  } catch {
    return "{}";
  }
}

function genRequestId(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = crypto;
    if (c?.randomUUID) return c.randomUUID();
  } catch {
    // ignore
  }
  return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// STAGE 5 CONVERSION — single source of truth for the app destination
const FINAL_APP_URL = "https://app.balancecipher.info/";

// ✅ CRM relay route (Vercel Serverless Function at /api/applications.js)
const RELAY_ROUTE = "/api/applications";

// Canon source for this funnel
const CRM_SOURCE = "balance-cypher-v2-clean";

type CrmCanonPayload = {
  source: string;
  requestId: string;
  startedAt: string;
  tracking: Record<string, unknown>;
  applicant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    consent: boolean;
    vehicleType: string;
    incomeAbove1800: string;
    monthlyIncome: string;
    yearsReceivingIncome: number;
    monthsReceivingIncome: number;
    dobMonth: number;
    dobDay: number;
    dobYear: number;
    companyName: string;
    jobTitle: string;
    housingPayment: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    yearsAtAddress: number;
    monthsAtAddress: number;
    ssn: string;
  };
};

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [fatalError, setFatalError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [codeInput, setCodeInput] = useState("");

  const [p2First, setP2First] = useState("");
  const [p5Stage, setP5Stage] = useState<P5Stage>("email");

  const [sendState, setSendState] = useState<SendState>("idle");
  const [sendMsg, setSendMsg] = useState<string>("");

  const p2FirstRef = useRef<HTMLInputElement | null>(null);
  const lastRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const codeRef = useRef<HTMLInputElement | null>(null);

  // Receivable overlay (B / A / L)
  const [rewardOn, setRewardOn] = useState(false);
  const [rewardLetter, setRewardLetter] = useState<"B" | "A" | "L" | null>(null);
  const [rewardCopy, setRewardCopy] = useState<string>("");
  const rewardTimerRef = useRef<number | null>(null);

  function clearRewardTimer() {
    if (rewardTimerRef.current) {
      window.clearTimeout(rewardTimerRef.current);
      rewardTimerRef.current = null;
    }
  }

  function showReward(letter: "B" | "A" | "L", copy: string, holdMs: number, after?: () => void) {
    clearRewardTimer();
    setRewardLetter(letter);
    setRewardCopy(copy);
    setRewardOn(true);

    rewardTimerRef.current = window.setTimeout(() => {
      setRewardOn(false);
      setRewardLetter(null);
      setRewardCopy("");
      rewardTimerRef.current = null;
      after?.();
    }, holdMs);
  }

  useEffect(() => {
    return () => clearRewardTimer();
  }, []);

  // Runtime crash catcher (shows the real error on the page)
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      const msg = [
        "Runtime error:",
        e.message || "(no message)",
        e.filename ? `File: ${e.filename}` : "",
        e.lineno ? `Line: ${e.lineno}:${e.colno || 0}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      setFatalError(msg);
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = typeof e.reason === "string" ? e.reason : safeJsonStringify(e.reason);
      setFatalError(`Unhandled promise rejection:\n${reason}`);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  // Tripwire: if ANY code path tries to hit submit-application, show it immediately.
  useEffect(() => {
    try {
      const origFetch = window.fetch.bind(window);
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
        if (url.includes("submit-application")) {
          setFatalError(
            `Tripwire: a request attempted "/api/submit-application"\n\nURL:\n${url}\n\nThis build is not using the correct relay route.\nSearch your project for "submit-application" and replace with "/api/applications".`
          );
        }
        return origFetch(input as any, init as any);
      };
      return () => {
        window.fetch = origFetch as any;
      };
    } catch {
      // ignore
    }
  }, []);

  function goTo(v: View) {
    setView(v);
    try {
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch {
      // ignore
    }
  }

  function resetFlow() {
    setP2First("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setAccessCode("");
    setCodeInput("");
    setP5Stage("email");
    setSendState("idle");
    setSendMsg("");
    clearRewardTimer();
    setRewardOn(false);
    setRewardLetter(null);
    setRewardCopy("");
    setFatalError(null);
  }

  function goToDecode() {
    resetFlow();
    goTo("p2");
  }

  function buildCanonPayload(params: { firstName: string; lastName: string; email: string; accessCode: string }): CrmCanonPayload {
    const requestId = genRequestId();
    const startedAt = new Date().toISOString();

    const ua = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
    const pageUrl = typeof window !== "undefined" ? window.location.href : undefined;
    const referrer = typeof document !== "undefined" ? document.referrer : undefined;

    return {
      source: CRM_SOURCE,
      requestId,
      startedAt,
      tracking: {
        event: "decode_email_submit",
        accessCode: params.accessCode,
        userAgent: ua,
        pageUrl,
        referrer,
      },
      applicant: {
        firstName: safeTrimMax(params.firstName, 40),
        lastName: safeTrimMax(params.lastName, 60),
        email: safeTrimMax(params.email, 120),

        phone: "",
        consent: true,
        vehicleType: "",
        incomeAbove1800: "",
        monthlyIncome: "",
        yearsReceivingIncome: 0,
        monthsReceivingIncome: 0,
        dobMonth: 0,
        dobDay: 0,
        dobYear: 0,
        companyName: "",
        jobTitle: "",
        housingPayment: "",
        street1: "",
        street2: "",
        city: "",
        state: "",
        zip: "",
        yearsAtAddress: 0,
        monthsAtAddress: 0,
        ssn: "",
      },
    };
  }

  async function postToCrm(payload: CrmCanonPayload) {
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();

    const res = await fetch(RELAY_ROUTE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const ms = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0);

    if (!res.ok) {
      let errorMsg = `CRM relay failed: ${res.status} ${res.statusText}`;
      try {
        const errorData = await res.json();
        const relayMsg =
          errorData?.message ||
          errorData?.error ||
          errorData?.detail ||
          (typeof errorData === "string" ? errorData : "");
        if (relayMsg) errorMsg = relayMsg;
        if (errorData?.requestId) errorMsg += ` (requestId: ${errorData.requestId})`;
      } catch {
        const text = await res.text().catch(() => "");
        if (text) errorMsg += ` — ${text}`;
      }
      errorMsg += ` — ${ms}ms`;
      throw new Error(errorMsg);
    }

    try {
      const out = await res.json();
      return { ok: true, ms, ...out };
    } catch {
      return { ok: true, ms };
    }
  }

  function submitFirstFromP2() {
    if (rewardOn) return;
    const fn = safeTrimMax(p2First, 40);
    if (!fn) return;

    setFirstName(fn);
    showReward("B", "", 950, () => goTo("p3"));
  }

  function submitLast() {
    if (rewardOn) return;
    const ln = safeTrimMax(lastName, 60);
    if (!ln) return;

    setLastName(ln);

    showReward(
      "A",
      "When was the last time you felt a shift inside you—and you knew you couldn’t go back?\nNot because life got easier. Because you finally saw it.",
      2300,
      () => goTo("p4")
    );
  }

  function continueFromAwakening() {
    if (rewardOn) return;
    setP5Stage("email");
    setSendState("idle");
    setSendMsg("");
    goTo("p5");
  }

  async function submitEmailFromP5() {
    if (rewardOn) return;
    if (sendState === "sending") return;

    const em = safeTrimMax(email, 120);
    if (!isValidEmail(em)) return;

    setEmail(em);

    const nextCode = accessCode || generateAccessCode();
    if (!accessCode) setAccessCode(nextCode);

    setSendState("sending");
    setSendMsg("Sending your map delivery request...");

    const payload = buildCanonPayload({
      firstName,
      lastName,
      email: em,
      accessCode: nextCode,
    });

    try {
      const result = await postToCrm(payload);
      const rid = result?.requestId ? ` (requestId: ${result.requestId})` : "";
      setSendState("sent");
      setSendMsg(`Request sent.${rid}`);

      showReward("L", "Map delivery unlocked.", 1150, () => {
        setP5Stage("code");
        setTimeout(() => codeRef.current?.focus(), 80);
      });
    } catch (err: any) {
      setSendState("error");
      setSendMsg(err?.message || "Failed to send. Open DevTools → Network to see the request.");
    }
  }

  function submitCode() {
    if (rewardOn) return;

    const expected = accessCode.trim().toUpperCase();
    const entered = codeInput.trim().toUpperCase();
    if (!entered) return;

    if (expected && entered !== expected) return;

    goTo("info");
  }

  function openFullMapApp() {
    try {
      window.location.assign(FINAL_APP_URL);
    } catch {
      window.location.href = FINAL_APP_URL;
    }
  }

  function onEnter(e: React.KeyboardEvent<HTMLInputElement>, action: () => void) {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  }

  // Focus management
  useEffect(() => {
    if (rewardOn) return;

    if (view === "p3") setTimeout(() => lastRef.current?.focus(), 60);

    if (view === "p5") {
      if (p5Stage === "email") setTimeout(() => emailRef.current?.focus(), 80);
      if (p5Stage === "code") setTimeout(() => codeRef.current?.focus(), 80);
    }
  }, [view, rewardOn, p5Stage]);

  // ✅ SPEED FIX: Step 2 cinematic reduced to ~18–19 seconds total
  // Old was ~36.5s before focusing input; now ~18.8s.
  useEffect(() => {
    if (view !== "p2") return;
    const t = setTimeout(() => p2FirstRef.current?.focus(), 18800);
    return () => clearTimeout(t);
  }, [view]);

  const canSubmitP2 = !!safeTrimMax(p2First, 40);
  const canSubmitLast = !!safeTrimMax(lastName, 60);
  const canSubmitEmail = isValidEmail(email);
  const canSubmitCode = !!codeInput.trim();

  return (
    <>
      <style>{`
        :root{
          --bg0:#050b14;
          --bg1:#000;

          --teal: rgba(40, 240, 255, 1);
          --tealSoft: rgba(40, 240, 255, 0.18);

          /* ✅ Richer gold (less “70s faded yellow”) */
          --brass:#f5c86a;
          --brass2:#d7a84a;
          --brassGlow: rgba(245, 200, 106, 0.48);

          --text: rgba(255,255,255,0.96);

          --uiFont: "Helvetica Neue", Helvetica, Arial, sans-serif;
        }

        *{ box-sizing:border-box; }
        html, body { height:100%; }

        body{
          margin:0;
          background:
            radial-gradient(900px 600px at 50% 30%, rgba(40,240,255,0.10), transparent 60%),
            radial-gradient(700px 500px at 50% 85%, rgba(40,240,255,0.06), transparent 60%),
            linear-gradient(180deg, var(--bg0), var(--bg1));
          color: var(--text);
          font-family: var(--uiFont);
          font-weight: 300;
          overflow-x: hidden;
          text-align:center;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        button, input {
          font: inherit;
          -webkit-font-smoothing: inherit;
          -moz-osx-font-smoothing: inherit;
        }

        @keyframes corePulse{
          0%, 100%{
            box-shadow: 0 0 62px rgba(40,240,255,0.20), inset 0 0 28px rgba(40,240,255,0.14);
            transform: scale(1.00);
          }
          50%{
            box-shadow: 0 0 90px rgba(40,240,255,0.32), inset 0 0 34px rgba(40,240,255,0.20);
            transform: scale(1.03);
          }
        }

        @keyframes slowDrift{
          0%, 100%{ transform: translate(-2%, -1%) rotate(12deg); opacity: 0.72; }
          50%{ transform: translate(2%, 1%) rotate(18deg); opacity: 0.92; }
        }

        /* ✅ Punchier BALANCE pulse + gold depth */
        @keyframes balancePulseAI{
          0%, 100%{
            transform: scale(1.00);
            opacity: 0.94;
            filter: drop-shadow(0 0 14px rgba(245,200,106,0.32));
          }
          50%{
            transform: scale(1.14);
            opacity: 1;
            filter: drop-shadow(0 0 26px rgba(245,200,106,0.62));
          }
        }

        /* Fatal error overlay */
        .fatalOverlay{
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.92);
          z-index: 10000;
          display:flex;
          align-items:center;
          justify-content:center;
          padding: 18px;
          text-align:left;
        }
        .fatalCard{
          width: min(860px, 96vw);
          border: 1px solid rgba(40,240,255,0.35);
          border-radius: 16px;
          background: rgba(5,11,20,0.72);
          box-shadow: 0 0 40px rgba(40,240,255,0.12);
          padding: 16px;
        }
        .fatalTitle{
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .fatalText{
          white-space: pre-wrap;
          font-size: 13px;
          line-height: 1.45;
          color: rgba(255,255,255,0.88);
        }
        .fatalBtn{
          margin-top: 12px;
          border-radius: 12px;
          border: 1px solid rgba(40,240,255,0.55);
          background: rgba(40,240,255,0.06);
          color: rgba(255,255,255,0.92);
          padding: 10px 12px;
          cursor: pointer;
          font-weight: 700;
        }

        /* Receivable overlay (B / A / L) */
        .rewardOverlay{
          position: fixed;
          inset: 0;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          z-index: 9999;
          pointer-events: none;
          padding: 18px;
        }

        @keyframes slamIn {
          0%   { opacity: 0; transform: translateY(18px) scale(0.86); filter: blur(2px); }
          45%  { opacity: 1; transform: translateY(0) scale(1.10); filter: blur(0px); }
          72%  { opacity: 1; transform: translateY(0) scale(0.99); }
          100% { opacity: 1; transform: translateY(0) scale(1.00); }
        }

        .rewardLetter{
          font-size: clamp(120px, 24vw, 220px);
          line-height: 0.95;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: rgba(255,255,255,0.96);
          text-shadow: 0 0 26px rgba(40,240,255,0.14);
          animation: slamIn 520ms cubic-bezier(0.18, 0.9, 0.22, 1) both;
          margin: 0;
        }

        .rewardCopy{
          margin-top: 12px;
          max-width: min(820px, 94vw);
          white-space: pre-line;
          font-size: clamp(18px, 4.6vw, 26px);
          line-height: 1.45;
          color: rgba(255,255,255,0.90);
          font-weight: 300;
          text-shadow: 0 0 22px rgba(40,240,255,0.10);
          padding: 0 10px;
        }

        /* Shared layout */
        .p1, .p2, .pX{
          min-height:100vh;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          padding: 34px 18px 84px;
          background: #000;
          text-align:center;
          position: relative;
          overflow:hidden;
        }

        .p1{ background: transparent; padding: 34px 18px 60px; }

        .p1Wrap{
          width: min(820px, 100%);
          display:flex;
          flex-direction:column;
          align-items:center;
          gap: 16px;
        }

        .core{
          width: 275px;
          height: 275px;
          border-radius: 999px;
          display:flex;
          align-items:center;
          justify-content:center;
          background: radial-gradient(circle, var(--tealSoft), transparent 68%);
          box-shadow: 0 0 62px rgba(40,240,255,0.20), inset 0 0 28px rgba(40,240,255,0.14);
          position: relative;
          overflow: hidden;
          animation: corePulse 3.8s ease-in-out infinite;
        }

        .core::before{
          content:"";
          position:absolute;
          inset:-40%;
          background: radial-gradient(circle, rgba(40,240,255,0.16), transparent 55%);
          transform: rotate(15deg);
          filter: blur(2px);
          opacity: 0.9;
          animation: slowDrift 9.5s ease-in-out infinite;
          pointer-events:none;
        }

        .coreSm{
          width: 220px;
          height: 220px;
          opacity: 0.86;
          animation: corePulse 3.5s ease-in-out infinite;
        }

        .emblemLg{
          width: 220px;
          height: 220px;
          object-fit: contain;
          filter: drop-shadow(0 0 20px rgba(40,240,255,0.60));
          position: relative;
          z-index: 2;
        }

        .emblemSm{
          width: 178px;
          height: 178px;
          opacity: 0.92;
          filter: drop-shadow(0 0 18px rgba(40,240,255,0.58));
        }

        .equation{
          display:flex;
          align-items: baseline;
          justify-content:center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 6px;
        }

        .eqText{
          font-size: 16px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.86);
          font-weight: 700;
        }

        .eqSym{
          font-size: 18px;
          color: rgba(255,255,255,0.62);
          font-weight: 700;
        }

        /* ✅ Rich gold gradient + stronger glow */
        .balance{
          font-size: 24px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 10px;
          animation: balancePulseAI 3.2s ease-in-out infinite;
          background: linear-gradient(180deg, var(--brass), var(--brass2));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 0 24px var(--brassGlow);
        }

        .cornerstone{
          margin-top: 6px;
          font-size: 15px;
          color: rgba(255,255,255,0.88);
          font-weight: 500;
        }

        .cornerstone strong{
          font-weight: 700;
          color: rgba(255,255,255,0.98);
        }

        .sub{
          width: min(640px, 100%);
          color: rgba(255,255,255,0.72);
          font-size: 16px;
          line-height: 1.55;
          margin-top: 8px;
          font-weight: 300;
        }

        .btn{
          padding: 16px 22px;
          border-radius: 999px;
          border: 1.5px solid rgba(40,240,255,0.75);
          color: rgba(255,255,255,0.96);
          background: linear-gradient(180deg, rgba(40,240,255,0.08), rgba(40,240,255,0.03));
          box-shadow: 0 0 24px rgba(40,240,255,0.18), 0 12px 30px rgba(0,0,0,0.35);
          cursor:pointer;
          font-weight: 700;
          font-size: 16px;
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
          max-width: min(560px, 100%);
          text-align:center;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .btn:hover{
          transform: translateY(-1px);
          box-shadow: 0 0 34px rgba(40,240,255,0.28), 0 14px 34px rgba(0,0,0,0.42);
          background: linear-gradient(180deg, rgba(40,240,255,0.12), rgba(40,240,255,0.04));
        }

        .btn:disabled{
          opacity: 0.55;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: 0 0 18px rgba(40,240,255,0.10), 0 10px 26px rgba(0,0,0,0.30);
        }

        .btnWide{
          width: min(560px, 90vw);
        }

        .hint{
          margin-top: 10px;
          font-size: 13px;
          color: rgba(255,255,255,0.58);
          font-weight: 300;
        }

        /* PAGE 2 */
        .p2{
          padding: 24px 18px 132px;
        }

        .p2Fade{
          position:absolute;
          inset:0;
          background:#000;
          opacity:1;
          animation: fadeOut 0.7s ease forwards;
          z-index: 20;
          pointer-events:none;
        }

        @keyframes fadeOut{ to { opacity: 0; } }

        .p2Wrap{
          width: min(820px, 100%);
          display:flex;
          flex-direction:column;
          align-items:center;
          gap: 6px;
          position: relative;
          z-index: 3;
        }

        .stage{
          width: min(780px, 100%);
          min-height: 150px;
          margin-top: -10px;
          position: relative;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:flex-start;
          gap: 12px;
        }

        /* ✅ Faster cinematic timing */
        @keyframes titleInOut{
          0%   { opacity:0; transform: translateY(10px); }
          16%  { opacity:1; transform: translateY(0); }
          76%  { opacity:1; transform: translateY(0); }
          100% { opacity:0; transform: translateY(-8px); }
        }

        @keyframes meaningInOut{
          0%   { opacity:0; transform: translateY(10px); }
          10%  { opacity:1; transform: translateY(0); }
          92%  { opacity:1; transform: translateY(0); }
          100% { opacity:0; transform: translateY(-8px); }
        }

        @keyframes sceneInStay{
          0%   { opacity:0; transform: translateY(10px); }
          100% { opacity:1; transform: translateY(0); }
        }

        .title{
          font-size: clamp(42px, 9.6vw, 60px);
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.96);
          opacity:0;
        }

        .meaning{
          font-size: clamp(24px, 6.2vw, 34px);
          font-weight: 300;
          color: rgba(255,255,255,0.90);
          text-shadow: 0 0 22px rgba(40,240,255,0.10);
          max-width: 780px;
          line-height: 1.6;
          opacity:0;
          padding: 0 6px;
        }

        /* ✅ New compact schedule (~18–19s total) */
        .scene1Title { animation: titleInOut 2.1s ease forwards; animation-delay: 0.8s; }
        .scene1Mean  { animation: meaningInOut 4.3s ease forwards; animation-delay: 2.8s; }

        .scene2Title { animation: titleInOut 2.1s ease forwards; animation-delay: 6.9s; }
        .scene2Mean  { animation: meaningInOut 4.0s ease forwards; animation-delay: 8.8s; }

        .scene3Title { animation: titleInOut 2.1s ease forwards; animation-delay: 12.6s; }
        .scene3Mean  { animation: meaningInOut 4.0s ease forwards; animation-delay: 14.5s; }

        .finalWrap{
          position:absolute;
          left:0; right:0;
          top: 0;
          display:flex;
          flex-direction:column;
          align-items:center;
          gap: 14px;
          opacity:0;
          animation: sceneInStay 0.75s ease forwards;
          animation-delay: 16.9s;
          pointer-events:none;
        }

        .finalRow{
          display:flex;
          align-items: baseline;
          justify-content:center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .finalWord{
          font-size: 22px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.92);
          font-weight: 700;
        }

        .finalSym{
          font-size: 22px;
          color: rgba(255,255,255,0.78);
          font-weight: 700;
        }

        .finalBalance{
          font-size: 38px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 900;
          background: linear-gradient(180deg, var(--brass), var(--brass2));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 0 26px var(--brassGlow);
          padding: 2px 10px;
          border-radius: 10px;
          animation: balancePulseAI 2.2s ease-in-out infinite;
        }

        .finalLine{
          font-size: 18px;
          color: rgba(40,240,255,0.70);
          line-height: 1.45;
          max-width: 780px;
          font-weight: 300;
        }

        .parenGroup{
          display:inline-flex;
          align-items: baseline;
          gap: 4px;
          white-space: nowrap;
        }

        .paren{
          font-size: 22px;
          color: rgba(255,255,255,0.78);
          font-weight: 700;
          margin: 0;
          padding: 0;
        }

        .parenText{
          font-size: 20px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: rgba(40,240,255,0.78);
        }

        .dock{
          position:absolute;
          left:0; right:0;
          bottom: 42px;
          display:flex;
          flex-direction:column;
          align-items:center;
          gap: 12px;
          opacity:0;
          transform: translateY(20px);
          animation: dockIn 0.50s ease forwards;
          animation-delay: 18.0s;
          z-index: 4;
        }

        @keyframes dockIn{
          to { opacity:1; transform: translateY(0); }
        }

        .unlockText{
          font-size: 22px;
          color: rgba(255,255,255,0.90);
          max-width: 780px;
          line-height: 1.45;
          padding: 0 8px;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .unlockSub{
          margin-top: 2px;
          font-size: 14px;
          color: rgba(255,255,255,0.62);
          font-weight: 500;
          letter-spacing: 0.04em;
        }

        /* Pages 3–6 */
        .contentLayer{
          position: relative;
          z-index: 2;
          width: 100%;
          display:flex;
          flex-direction:column;
          align-items:center;
        }

        .letterHeader{
          margin-top: 18px;
          display:flex;
          flex-direction:column;
          align-items:center;
          gap: 4px;
        }

        .bigLetter{
          font-size: clamp(88px, 20vw, 170px);
          line-height: 0.90;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.96);
          text-shadow: 0 0 26px rgba(40,240,255,0.14);
          margin: 0;
        }

        .bigSubline{
          font-size: 16px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 700;
          color: rgba(255,255,255,0.86);
          margin-top: 2px;
        }

        .breakTitle{
          font-weight: 500;
          font-size: clamp(24px, 5.8vw, 34px);
          max-width: 760px;
          line-height: 1.25;
          margin: 10px auto 10px;
          color: rgba(255,255,255,0.94);
          text-shadow: 0 0 22px rgba(40,240,255,0.08);
        }

        @keyframes breakItemIn {
          0%   { opacity: 0; transform: translateY(10px); filter: blur(1px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0px); }
        }

        .breakList{
          width: min(720px, 92vw);
          margin: 6px auto 14px;
          display:flex;
          flex-direction:column;
          gap: 8px;
        }

        .breakItem{
          opacity: 0;
          animation: breakItemIn 420ms ease forwards;
          animation-delay: var(--d, 0ms);
          font-size: clamp(16px, 4.2vw, 20px);
          line-height: 1.35;
          color: rgba(255,255,255,0.82);
          font-weight: 300;
          letter-spacing: 0.01em;
        }

        .breakItem strong{
          font-weight: 700;
          color: rgba(255,255,255,0.92);
        }

        .breakCloser{
          margin-top: 10px;
          font-size: clamp(16px, 4.2vw, 20px);
          color: rgba(40,240,255,0.70);
          font-weight: 500;
          letter-spacing: 0.01em;
          text-shadow: 0 0 20px rgba(40,240,255,0.10);
          opacity: 0;
          animation: breakItemIn 420ms ease forwards;
          animation-delay: 920ms;
        }

        .ctaStack{
          width: min(560px, 90vw);
          display:flex;
          flex-direction:column;
          align-items:center;
          gap: 10px;
          margin-top: 14px;
        }

        .stepInstruction{
          margin-top: 10px;
          font-size: 16px;
          color: rgba(255,255,255,0.78);
          max-width: 620px;
          line-height: 1.45;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .stepConfirm{
          margin-top: 6px;
          font-size: 14px;
          color: rgba(255,255,255,0.56);
          max-width: 520px;
          line-height: 1.45;
          font-weight: 300;
        }

        .tinyLink{
          margin-top: 8px;
          font-size: 12px;
          color: rgba(0,255,255,0.55);
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: lowercase;
        }

        .underlineOnly{
          width: min(560px, 90vw);
          background: transparent;
          border: none;
          border-bottom: 2px solid rgba(40,240,255,0.46);
          padding: 18px 10px 12px;
          color: rgba(255,255,255,0.94);
          font-size: 22px;
          font-weight: 500;
          text-align: center;
          outline: none;
          caret-color: rgba(40,240,255,0.95);
          transition: border-color 250ms ease, box-shadow 250ms ease;
        }

        .underlineOnly:focus{
          border-bottom-color: rgba(40,240,255,0.92);
          box-shadow: 0 14px 34px rgba(40,240,255,0.12);
        }

        /* Send status */
        .sendStatus{
          margin-top: 10px;
          font-size: 13px;
          max-width: 560px;
          line-height: 1.4;
          padding: 8px 10px;
          border-radius: 12px;
          border: 1px solid rgba(40,240,255,0.22);
          background: rgba(40,240,255,0.05);
          color: rgba(255,255,255,0.75);
        }
        .sendStatusError{
          border-color: rgba(255, 80, 80, 0.35);
          background: rgba(255, 80, 80, 0.08);
          color: rgba(255,255,255,0.82);
        }
        .sendStatusGood{
          border-color: rgba(40,240,255,0.38);
          background: rgba(40,240,255,0.06);
          color: rgba(255,255,255,0.86);
        }

        @media (max-width: 420px){
          .core{ width: 236px; height: 236px; }
          .emblemLg{ width: 188px; height: 188px; }
          .unlockText{ font-size: 20px; }
          .coreSm{ width: 206px; height: 206px; }
          .emblemSm{ width: 166px; height: 166px; }
        }
      `}</style>

      {fatalError ? (
        <div className="fatalOverlay" aria-label="App error overlay">
          <div className="fatalCard">
            <div className="fatalTitle">BALANCE — Runtime Error</div>
            <div className="fatalText">{fatalError}</div>
            <button className="fatalBtn" type="button" onClick={() => setFatalError(null)}>
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {rewardOn && rewardLetter ? (
        <div className="rewardOverlay" aria-label="Receivable reward overlay">
          <div className="rewardLetter">{rewardLetter}</div>
          {rewardCopy ? <div className="rewardCopy">{rewardCopy}</div> : null}
        </div>
      ) : null}

      {view === "landing" ? (
        <main className="p1">
          <div className="p1Wrap">
            <div className="core" aria-label="Cipher core">
              <img className="emblemLg" src="/brand/cipher-emblem.png" alt="BALANCE Cipher Core" loading="eager" />
            </div>

            <div className="equation" aria-label="Cipher equation">
              <span className="eqText">Cipher</span>
              <span className="eqSym">+</span>
              <span className="eqText">Co-Pilot</span>
              <span className="eqSym">+</span>
              <span className="eqText">You</span>
              <span className="eqSym">=</span>
              <span className="balance">BALANCE</span>
            </div>

            <div className="cornerstone">
              <strong>Are you ready to start decoding?</strong>
            </div>

            <div className="sub">
              The Cipher shows the pattern. The Co-Pilot makes it simple. You take the next step with clear direction.
            </div>

            <button className="btn" type="button" onClick={goToDecode}>
              Start the private decode
            </button>

            <div className="hint">No pressure. No shame. Just clarity.</div>
          </div>
        </main>
      ) : null}

      {view === "p2" ? (
        <main className="p2" aria-label="Private decode — Page 2">
          <div className="p2Fade" />

          <div className="p2Wrap">
            <div className="core" aria-label="Cipher core">
              <img
                className="emblemLg"
                src="/brand/cipher-emblem.png"
                alt="BALANCE Cipher Core"
                loading="eager"
                style={{ opacity: 0.92 }}
              />
            </div>

            <div className="stage" aria-label="Cinematic sequence">
              <div className="title scene1Title">Cipher</div>
              <div className="meaning scene1Mean">
                The first human intelligent device designed to crack the unbreakable codes.
              </div>

              <div className="title scene2Title">Co-Pilot + AI</div>
              <div className="meaning scene2Mean">AI. Built to complete once-impossible tasks in mere seconds.</div>

              <div className="title scene3Title">You</div>
              <div className="meaning scene3Mean">
                You are the most powerful of all three, and designed and built for endless potential.
              </div>

              <div className="finalWrap" aria-label="Final equation">
                <div className="finalRow" style={{ gap: 8 }}>
                  <span className="finalWord">Cipher</span>
                  <span className="parenGroup" aria-label="Cipher descriptor">
                    <span className="paren">(</span>
                    <span className="parenText">a pattern reader</span>
                    <span className="paren">)</span>
                  </span>

                  <span className="finalSym">+</span>

                  <span className="finalWord">AI Co-Pilot</span>
                  <span className="parenGroup" aria-label="AI Co-Pilot descriptor">
                    <span className="paren">(</span>
                    <span className="parenText">your AI power source</span>
                    <span className="paren">)</span>
                  </span>

                  <span className="finalSym">+</span>

                  <span className="finalWord">You</span>
                  <span className="parenGroup" aria-label="You descriptor">
                    <span className="paren">(</span>
                    <span className="parenText">endless potential</span>
                    <span className="paren">)</span>
                  </span>

                  <span className="finalSym">=</span>

                  <span className="finalBalance">BALANCE</span>
                </div>

                <div className="finalLine">This is your AI-powered guide.</div>
              </div>
            </div>
          </div>

          <div className="dock">
            <div className="unlockText">To unlock the next step, put your first name here.</div>
            <div className="unlockSub">Then tap Continue.</div>

            <input
              ref={p2FirstRef}
              className="underlineOnly"
              value={p2First}
              onChange={(e) => setP2First(e.target.value)}
              onKeyDown={(e) => onEnter(e, submitFirstFromP2)}
              aria-label="First name"
              autoComplete="given-name"
              placeholder=""
              disabled={rewardOn}
            />

            <button className="btn btnWide" type="button" onClick={submitFirstFromP2} disabled={rewardOn || !canSubmitP2}>
              Continue
            </button>
          </div>
        </main>
      ) : null}

      {view === "p3" ? (
        <main className="pX" aria-label="Private decode — Page 3">
          <div className="contentLayer">
            <div className="core coreSm" aria-label="Cipher core">
              <img className="emblemLg emblemSm" src="/brand/cipher-emblem.png" alt="BALANCE Cipher Core" loading="eager" />
            </div>

            <div className="letterHeader" aria-label="Break Free header">
              <div className="bigLetter">B</div>
              <div className="bigSubline">Break Free</div>
            </div>

            <div className="breakTitle">These are the first steps of Freedom.</div>

            <div className="breakList" aria-label="Break Free bullets">
              <div className="breakItem" style={{ ["--d" as any]: "120ms" }}>
                Break free from the <strong>chaos</strong>.
              </div>
              <div className="breakItem" style={{ ["--d" as any]: "240ms" }}>
                Break free from the <strong>stress</strong>.
              </div>
              <div className="breakItem" style={{ ["--d" as any]: "360ms" }}>
                Break free from the <strong>fog</strong> that keeps you guessing.
              </div>
              <div className="breakItem" style={{ ["--d" as any]: "480ms" }}>
                Break free from the <strong>doubt</strong> and the <strong>fear</strong>.
              </div>
              <div className="breakItem" style={{ ["--d" as any]: "600ms" }}>
                Break free from repeating the same <strong>cycle</strong>.
              </div>

              <div className="breakCloser">Imagine how it would feel to finally break free.</div>
            </div>

            <div className="ctaStack" aria-label="Last name entry">
              <input
                ref={lastRef}
                className="underlineOnly"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onKeyDown={(e) => onEnter(e, submitLast)}
                aria-label="Last name"
                autoComplete="family-name"
                placeholder=""
                disabled={rewardOn}
              />

              <button className="btn btnWide" type="button" onClick={submitLast} disabled={rewardOn || !canSubmitLast}>
                Continue
              </button>
            </div>

            <div className="stepInstruction">These are the first steps of Freedom. Enter your last name.</div>
            <div className="stepConfirm">Confirmed. No noise.</div>
          </div>
        </main>
      ) : null}

      {view === "p4" ? (
        <main className="pX" aria-label="Private decode — Page 4">
          <div className="contentLayer">
            <div className="core coreSm" aria-label="Cipher core">
              <img
                className="emblemLg emblemSm"
                src="/brand/cipher-emblem.png"
                alt="BALANCE Cipher Core"
                loading="eager"
                style={{ opacity: 0.9 }}
              />
            </div>

            <div className="letterHeader" aria-label="Awakening header">
              <div className="bigLetter">A</div>
              <div className="bigSubline">Awakening</div>
            </div>

            <div className="breakTitle">This is what Freedom starts to feel like when it turns on the lights.</div>

            <div className="breakList" aria-label="Awakening bullets">
              <div className="breakItem" style={{ ["--d" as any]: "120ms" }}>
                You stop <strong>guessing</strong> what’s wrong. You start seeing the <strong>pattern</strong>.
              </div>
              <div className="breakItem" style={{ ["--d" as any]: "240ms" }}>
                Your mind gets quieter. The <strong>noise</strong> backs off.
              </div>
              <div className="breakItem" style={{ ["--d" as any]: "360ms" }}>
                You feel the <strong>power of options</strong> again—real ones.
              </div>
              <div className="breakItem" style={{ ["--d" as any]: "480ms" }}>
                You can start to <strong>see</strong> what matters—and what doesn’t.
              </div>
              <div className="breakItem" style={{ ["--d" as any]: "600ms" }}>
                You don’t feel fixed. You feel <strong>alive—awakening</strong>.
              </div>

              <div className="breakCloser">Not because life just got easier. Because you can finally see it.</div>
            </div>

            <div className="ctaStack" aria-label="Continue from Awakening">
              <button className="btn btnWide" type="button" onClick={continueFromAwakening} disabled={rewardOn}>
                Continue
              </button>
            </div>

            <div className="stepInstruction">Awakening is the moment the fog lifts—and you understand. Keep going.</div>
            <div className="stepConfirm">Confirmed. No noise.</div>
          </div>
        </main>
      ) : null}

      {view === "p5" ? (
        <main className="pX" aria-label="Private decode — Page 5">
          <div className="contentLayer">
            <div className="core coreSm" aria-label="Cipher core">
              <img
                className="emblemLg emblemSm"
                src="/brand/cipher-emblem.png"
                alt="BALANCE Cipher Core"
                loading="eager"
                style={{ opacity: 0.88 }}
              />
            </div>

            <div className="letterHeader" aria-label="Learning header">
              <div className="bigLetter">L</div>
              <div className="bigSubline">Learning</div>
            </div>

            {p5Stage === "email" ? (
              <>
                <div className="breakTitle">
                  Learning is where the Cipher starts learning you—so your map can finally fit your life.
                </div>

                <div className="breakList" aria-label="Learning support bullets">
                  <div className="breakItem" style={{ ["--d" as any]: "120ms" }}>
                    It learns your <strong>pattern</strong>—what pulls you back, and what moves you forward.
                  </div>
                  <div className="breakItem" style={{ ["--d" as any]: "240ms" }}>
                    It learns what to ignore, so the <strong>noise</strong> stops winning.
                  </div>
                  <div className="breakItem" style={{ ["--d" as any]: "360ms" }}>
                    It turns confusion into <strong>clear next steps</strong>.
                  </div>
                  <div className="breakItem" style={{ ["--d" as any]: "480ms" }}>
                    So the Co-Pilot can deliver the map in a way that fits <strong>you</strong>.
                  </div>
                  <div className="breakCloser">The Cipher learns you so the Co-Pilot can deliver the map.</div>
                </div>

                <div className="ctaStack" aria-label="Email entry">
                  <div className="stepInstruction" style={{ marginTop: 0 }}>
                    Where do you want the full map delivered?
                  </div>

                  <input
                    ref={emailRef}
                    className="underlineOnly"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (sendState !== "idle") {
                        setSendState("idle");
                        setSendMsg("");
                      }
                    }}
                    onKeyDown={(e) => onEnter(e, submitEmailFromP5)}
                    aria-label="Email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder=""
                    disabled={rewardOn || sendState === "sending"}
                  />

                  <button
                    className="btn btnWide"
                    type="button"
                    onClick={submitEmailFromP5}
                    disabled={rewardOn || !canSubmitEmail || sendState === "sending"}
                  >
                    {sendState === "sending" ? "Sending..." : "Continue"}
                  </button>

                  {sendMsg ? (
                    <div
                      className={[
                        "sendStatus",
                        sendState === "error" ? "sendStatusError" : "",
                        sendState === "sent" ? "sendStatusGood" : "",
                      ].join(" ")}
                    >
                      {sendMsg}
                    </div>
                  ) : null}
                </div>

                <div className="stepConfirm">Confirmed. No noise.</div>
                <div className="tinyLink">app.balancecipher.info</div>
              </>
            ) : (
              <>
                <div className="breakTitle" style={{ marginTop: 14 }}>
                  Your map is opening.
                </div>

                <div className="stepConfirm" style={{ marginTop: 0 }}>
                  This code is the bridge between the decode and the app.
                </div>

                <div className="ctaStack" aria-label="Bridge code entry">
                  <input
                    ref={codeRef}
                    className="underlineOnly"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    onKeyDown={(e) => onEnter(e, submitCode)}
                    aria-label="Bridge code"
                    autoComplete="one-time-code"
                    placeholder=""
                    disabled={rewardOn}
                  />

                  <button className="btn btnWide" type="button" onClick={submitCode} disabled={rewardOn || !canSubmitCode}>
                    Cross the bridge
                  </button>
                </div>

                <div className="stepConfirm" style={{ marginTop: 10 }}>
                  One clean step. No noise.
                </div>

                <div className="tinyLink">app.balancecipher.info</div>

                <div className="stepConfirm" style={{ marginTop: 14 }}>
                  Preview code (temporary):{" "}
                  <strong style={{ fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
                    {accessCode || "(generated after email entry)"}
                  </strong>
                </div>
              </>
            )}
          </div>
        </main>
      ) : null}

      {view === "info" ? (
        <main className="pX" aria-label="Private decode — Final screen">
          <div className="contentLayer">
            <div className="core coreSm" aria-label="Cipher core">
              <img className="emblemLg emblemSm" src="/brand/cipher-emblem.png" alt="BALANCE Cipher Core" loading="eager" />
            </div>

            <div className="letterHeader" aria-label="Map unlocked header">
              <div className="bigLetter" style={{ letterSpacing: "0.04em" }}>
                MAP
              </div>
              <div className="bigSubline">Unlocked</div>
            </div>

            <div className="breakTitle">You made it through the private decode.</div>

            <div className="breakList" aria-label="Map unlocked bullets">
              <div className="breakItem" style={{ ["--d" as any]: "120ms" }}>
                The Cipher shows the <strong>pattern</strong>.
              </div>
              <div className="breakItem" style={{ ["--d" as any]: "240ms" }}>
                The Co-Pilot makes the next step <strong>simple</strong>.
              </div>
              <div className="breakItem" style={{ ["--d" as any]: "360ms" }}>
                You stay in control. <strong>No noise</strong>.
              </div>

              <div className="breakCloser">Final step: open the app.</div>
            </div>

            <div className="ctaStack" aria-label="Map actions">
              <button className="btn btnWide" type="button" onClick={openFullMapApp}>
                Open the full map page
              </button>

              <button className="btn btnWide" type="button" onClick={() => goTo("landing")}>
                Back to start
              </button>
            </div>

            <div className="stepConfirm" style={{ marginTop: 10 }}>
              Destination: <strong style={{ fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>{FINAL_APP_URL}</strong>
            </div>

            <div className="stepConfirm" style={{ marginTop: 10 }}>
              Session data (temporary):{" "}
              <strong style={{ fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
                {firstName ? `${firstName} ${lastName}`.trim() : "(name not captured)"}
              </strong>
            </div>
          </div>
        </main>
      ) : null}
    </>
  );
}
