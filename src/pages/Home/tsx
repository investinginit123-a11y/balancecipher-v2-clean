import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * BALANCE CIPHER — Landing Page (TikTok-native + adult)
 * - Fast hook (less formal, more momentum)
 * - "Tap to Reveal" decode moment (alive, not stiff)
 * - Decode Preview stays the centerpiece
 * - No dependency sprawl; no App.tsx coupling
 */

const ROUTES = {
  overview: "/overview",
  reversal: "/reversal",
  vitReact: "/vit-react",
} as const;

const ANCHORS = {
  decode: "bc-decode",
  how: "bc-how",
  next: "bc-next",
} as const;

const BALANCE_APP = {
  baseUrl: "", // optional later: "https://your-balance-app.vercel.app"
  applyPath: "/?start=decode",
} as const;

type GoalKey = "raise" | "approve" | "lower" | "calm";
type TimelineKey = "fast" | "steady";
type FrictionKey = "confused" | "overwhelmed" | "noPlan" | "noFollowThrough";

type Pillar = { title: string; body: string };
type Card = { title: string; body: string };

const LABELS: {
  goal: Record<GoalKey, string>;
  timeline: Record<TimelineKey, string>;
  friction: Record<FrictionKey, string>;
} = {
  goal: {
    raise: "Raise my score",
    approve: "Get approved",
    lower: "Lower my rate",
    calm: "Stop the chaos",
  },
  timeline: { fast: "Fast", steady: "Steady" },
  friction: {
    confused: "Confused",
    overwhelmed: "Overwhelmed",
    noPlan: "No plan",
    noFollowThrough: "No follow-through",
  },
};

const COPY = {
  hero: {
    kicker: "BALANCE Cipher",
    headline: "Stop guessing. Start decoding.",
    subhead:
      "This is not another tip list. The Cipher is the map. Your AI Co-Pilot has the goods to decode it through the BALANCE Formula—into plain language and one next move you can do today.",
    micro: "Decoding is solving. Not fixing.",
    ctaPrimary: "Start decoding",
    ctaSecondary: "Show me how it works",
    trust: "Adult. Calm. No hype. No shame.",
  },

  painSnap: {
    title: "If this is you, you’re in the right place",
    bullets: [
      "You start… then life happens.",
      "You Google, you scroll, you get 20 answers… and still feel stuck.",
      "You know what you should do, but follow-through keeps breaking.",
    ],
    line:
      "The difference is not motivation. It is having the right decoder—so clarity shows up fast and momentum holds.",
  },

  tapReveal: {
    title: "Tap once. Get the truth.",
    subtitle:
      "This is what “AI-powered” actually means here: fast translation into a next best move.",
    button: "Tap to reveal a decode",
    revealedLabel: "Decoded in plain language",
    revealedBody:
      "You don’t need 15 steps today. You need the one lever that matters most right now—and a clean move you can finish.",
    revealedNextLabel: "Next best move",
    revealedNextBody:
      "Pick one lever. Do one action. Record progress. Repeat tomorrow. That’s how the Cipher becomes results.",
  },

  next: {
    kicker: "What happens next",
    title: "A simple 3-step loop that actually holds",
    steps: [
      { title: "Decode", body: "Your Co-Pilot turns the Cipher into plain language." },
      { title: "Do one move", body: "One action you can finish today (not 12 actions)." },
      { title: "Momentum holds", body: "The plan stays alive after day one." },
    ] as Pillar[],
  },

  decodePreview: {
    kicker: "Decode preview",
    title: "Try a 10-second decode",
    subtitle:
      "Pick what you want, your timeline, and what keeps getting in the way. Your Co-Pilot translates that into clarity and a next best move.",
    outputTitle: "Your decode",
    decodedLabel: "Decoded truth",
    nextLabel: "Next best move",
    ctaPrimary: "Apply this decode",
    ctaSecondary: "Start with the basics",
  },

  how: {
    kicker: "How it works",
    title: "The linkage is the product",
    subtitle:
      "A cipher is sophisticated. That’s the point. It unlocks simple concepts and simple wording—when the right decoder is present.",
    equation: { left: "AI Co-Pilot", plus1: "BALANCE Cipher", plus2: "BALANCE Formula", equals: "Solutions" },
    pillars: [
      { title: "Cipher", body: "A sophisticated map that unlocks simple, usable truth." },
      { title: "Co-Pilot", body: "The only guide that has the goods to decode the Cipher into a next best move." },
      { title: "Formula", body: "Turns complexity into a plan you can execute without overwhelm." },
    ] as Pillar[],
  },

  outcomes: {
    title: "What changes today",
    subtitle: "Not someday. Today.",
    cards: [
      { title: "Minutes to clarity", body: "No more guessing what matters first." },
      { title: "One next best move", body: "A clean step you can actually finish." },
      { title: "Follow-through that sticks", body: "Momentum holds after day one." },
    ] as Card[],
  },

  footer: {
    line:
      "The Cipher gives you the map. The Co-Pilot has the goods to decode it—through the BALANCE Formula—into simple steps.",
  },
} as const;

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function safeJoinUrl(baseUrl: string, pathWithQuery: string): string {
  const base = baseUrl.trim();
  if (!base) return "";
  const baseNoSlash = base.endsWith("/") ? base.slice(0, -1) : base;
  const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  return `${baseNoSlash}${path}`;
}

function buildAppApplyHref(args: { goal: GoalKey; timeline: TimelineKey; friction: FrictionKey }): string {
  const urlBase = safeJoinUrl(BALANCE_APP.baseUrl, BALANCE_APP.applyPath);
  if (!urlBase) return "";
  const qp = new URLSearchParams();
  qp.set("goal", args.goal);
  qp.set("timeline", args.timeline);
  qp.set("friction", args.friction);
  return `${urlBase}${urlBase.includes("?") ? "&" : "?"}${qp.toString()}`;
}

function getGoalRoute(goal: GoalKey): string {
  switch (goal) {
    case "approve":
      return ROUTES.overview;
    case "lower":
      return ROUTES.reversal;
    case "calm":
      return ROUTES.vitReact;
    case "raise":
    default:
      return ROUTES.overview;
  }
}

function buildDecodeOutput(goal: GoalKey, timeline: TimelineKey, friction: FrictionKey): { decoded: string; next: string } {
  let decoded = "";
  let next = "";

  switch (goal) {
    case "raise":
      decoded =
        "Raising your score is usually one or two levers: on-time payments and how much credit you’re using.";
      next = "Pick one lever first. Do one clean step today that moves it.";
      break;
    case "approve":
      decoded =
        "Approval is proof, not luck. Lenders want a clean story: stability, ability to pay, low risk.";
      next = "Choose what you want approval for. Then follow one step that strengthens your story.";
      break;
    case "lower":
      decoded =
        "Lower rates come when you look less risky. That usually means a stronger score and lower pressure.";
      next = "Identify your current rate. Then do one step that reduces risk and improves leverage.";
      break;
    case "calm":
    default:
      decoded =
        "Chaos doesn’t stop when you try harder. It stops when you have one clear plan and one move you can finish.";
      next = "Name the loudest pressure point. Then take one small step you can complete today.";
      break;
  }

  const timelineAdd =
    timeline === "fast"
      ? "We prioritize the highest-impact move you can do now."
      : "We build a steady path you can repeat without burnout.";

  let frictionAdd = "";
  let frictionNext = "";

  switch (friction) {
    case "confused":
      frictionAdd = "If you feel confused, we remove jargon and focus on one lever only.";
      frictionNext = "One lever. One move. That’s the win.";
      break;
    case "overwhelmed":
      frictionAdd = "If you feel overwhelmed, we shrink the problem until it fits into 10 minutes.";
      frictionNext = "Make it small enough to finish. Done creates confidence.";
      break;
    case "noPlan":
      frictionAdd = "If you have no plan, we turn the mess into a clean 3-step map.";
      frictionNext = "You don’t need perfect. You need next.";
      break;
    case "noFollowThrough":
    default:
      frictionAdd = "If follow-through breaks, we set a small step and a simple check-in so momentum holds.";
      frictionNext = "Choose a step you can finish today. Repeat tomorrow.";
      break;
  }

  return { decoded: `${decoded} ${timelineAdd} ${frictionAdd}`, next: `${next} ${frictionNext}` };
}

export default function Home() {
  const [goal, setGoal] = useState<GoalKey>("raise");
  const [timeline, setTimeline] = useState<TimelineKey>("fast");
  const [friction, setFriction] = useState<FrictionKey>("overwhelmed");
  const [revealed, setRevealed] = useState<boolean>(false);

  const goalRoute = useMemo(() => getGoalRoute(goal), [goal]);
  const decodeOut = useMemo(() => buildDecodeOutput(goal, timeline, friction), [goal, timeline, friction]);

  const applyDecodeHref = useMemo(
    () => buildAppApplyHref({ goal, timeline, friction }),
    [goal, timeline, friction]
  );

  const goalKeys: GoalKey[] = ["raise", "approve", "lower", "calm"];
  const timelineKeys: TimelineKey[] = ["fast", "steady"];
  const frictionKeys: FrictionKey[] = ["confused", "overwhelmed", "noPlan", "noFollowThrough"];

  return (
    <main className="bc-page">
      <style>{CSS}</style>
      <div className="bc-bg" aria-hidden="true" />

      <div className="bc-container">
        {/* HERO */}
        <header className="bc-hero">
          <div className="bc-heroCard">
            <div className="bc-heroTop">
              <span className="bc-kickerPill">{COPY.hero.kicker}</span>
              <span className="bc-trust">{COPY.hero.trust}</span>
            </div>

            <h1 className="bc-h1">{COPY.hero.headline}</h1>
            <p className="bc-lead">{COPY.hero.subhead}</p>

            <div className="bc-heroMicro">
              <span className="bc-microDot" aria-hidden="true" />
              <span>{COPY.hero.micro}</span>
            </div>

            <div className="bc-ctaRow" aria-label="Primary actions">
              <ActionButton variant="primary" onClick={() => scrollToId(ANCHORS.decode)} title="Start decoding (scroll)">
                {COPY.hero.ctaPrimary}
              </ActionButton>

              <ActionButton variant="secondary" onClick={() => scrollToId(ANCHORS.how)} title="How it works (scroll)">
                {COPY.hero.ctaSecondary}
              </ActionButton>
            </div>
          </div>

          {/* “Snap” strip (TikTok-native: fast recognition) */}
          <div className="bc-snapStrip" aria-label="Recognition strip">
            <div className="bc-snapTitle">{COPY.painSnap.title}</div>
            <ul className="bc-snapList">
              {COPY.painSnap.bullets.map((b: string) => (
                <li key={b} className="bc-snapItem">
                  <span className="bc-snapDot" aria-hidden="true" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="bc-snapLine">{COPY.painSnap.line}</div>
          </div>
        </header>

        {/* Tap-to-Reveal (makes it feel alive) */}
        <section className="bc-section bc-reveal" aria-label="Tap to reveal decode">
          <div className="bc-sectionHeader">
            <div className="bc-kicker">{COPY.tapReveal.title}</div>
            <h2 className="bc-h2">Your first “this is different” moment</h2>
            <p className="bc-p">{COPY.tapReveal.subtitle}</p>
          </div>

          <div className="bc-revealCard">
            {!revealed ? (
              <button
                type="button"
                className="bc-revealBtn"
                onClick={() => setRevealed(true)}
                aria-label="Tap to reveal a decode"
              >
                <span className="bc-play" aria-hidden="true" />
                <span className="bc-revealBtnText">{COPY.tapReveal.button}</span>
                <span className="bc-revealHint">One tap. No lecture.</span>
              </button>
            ) : (
              <div className="bc-revealed">
                <div className="bc-revRow">
                  <div className="bc-revLabel">{COPY.tapReveal.revealedLabel}</div>
                  <div className="bc-revText">{COPY.tapReveal.revealedBody}</div>
                </div>
                <div className="bc-revRow">
                  <div className="bc-revLabel">{COPY.tapReveal.revealedNextLabel}</div>
                  <div className="bc-revText">{COPY.tapReveal.revealedNextBody}</div>
                </div>
                <div className="bc-revActions">
                  <ActionButton variant="primary" onClick={() => scrollToId(ANCHORS.decode)}>
                    Go to the full decode
                  </ActionButton>
                  <ActionButton variant="secondary" onClick={() => setRevealed(false)}>
                    Reset
                  </ActionButton>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* What happens next */}
        <section className="bc-section" id={ANCHORS.next} aria-labelledby="next-title">
          <div className="bc-sectionHeader">
            <div className="bc-kicker">{COPY.next.kicker}</div>
            <h2 className="bc-h2" id="next-title">{COPY.next.title}</h2>
          </div>

          <div className="bc-loop" role="list" aria-label="Decode loop">
            {COPY.next.steps.map((s: Pillar) => (
              <div className="bc-loopCard" key={s.title} role="listitem">
                <div className="bc-loopTitle">{s.title}</div>
                <div className="bc-loopBody">{s.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Decode Preview (main conversion engine) */}
        <section className="bc-section" id={ANCHORS.decode} aria-labelledby="decode-title">
          <div className="bc-sectionHeader">
            <div className="bc-kicker">{COPY.decodePreview.kicker}</div>
            <h2 className="bc-h2" id="decode-title">{COPY.decodePreview.title}</h2>
            <p className="bc-p">{COPY.decodePreview.subtitle}</p>
          </div>

          <div className="bc-split">
            <div className="bc-previewControls" aria-label="Decode preview controls">
              <div className="bc-controlBlock">
                <div className="bc-controlLabel">Goal</div>
                <div className="bc-chipGrid" role="radiogroup" aria-label="Choose a goal">
                  {goalKeys.map((k: GoalKey) => (
                    <ChipRadio key={k} label={LABELS.goal[k]} checked={goal === k} onClick={() => setGoal(k)} />
                  ))}
                </div>
              </div>

              <div className="bc-controlRow">
                <div className="bc-controlBlock">
                  <div className="bc-controlLabel">Timeline</div>
                  <div className="bc-chipRow" role="radiogroup" aria-label="Choose a timeline">
                    {timelineKeys.map((k: TimelineKey) => (
                      <ChipRadio key={k} label={LABELS.timeline[k]} checked={timeline === k} onClick={() => setTimeline(k)} />
                    ))}
                  </div>
                </div>

                <div className="bc-controlBlock">
                  <div className="bc-controlLabel">What gets in the way</div>
                  <div className="bc-chipGrid" role="radiogroup" aria-label="Choose a friction">
                    {frictionKeys.map((k: FrictionKey) => (
                      <ChipRadio key={k} label={LABELS.friction[k]} checked={friction === k} onClick={() => setFriction(k)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bc-panel" aria-label="Decode preview output">
              <div className="bc-panelLabel">{COPY.decodePreview.outputTitle}</div>
              <div className="bc-panelTitle">
                {LABELS.goal[goal]} · {LABELS.timeline[timeline]} · {LABELS.friction[friction]}
              </div>

              <div className="bc-outputBlock">
                <div className="bc-outputLabel">{COPY.decodePreview.decodedLabel}</div>
                <div className="bc-outputText">{decodeOut.decoded}</div>
              </div>

              <div className="bc-outputBlock">
                <div className="bc-outputLabel">{COPY.decodePreview.nextLabel}</div>
                <div className="bc-outputText">{decodeOut.next}</div>
              </div>

              <div className="bc-ctaRow">
                <ActionLink
                  variant="primary"
                  external
                  href={applyDecodeHref}
                  fallbackTo={goalRoute}
                  title="Apply this decode (deep-link optional)"
                >
                  {COPY.decodePreview.ctaPrimary}
                </ActionLink>

                <ActionLink variant="secondary" to={ROUTES.reversal}>
                  {COPY.decodePreview.ctaSecondary}
                </ActionLink>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bc-section" id={ANCHORS.how} aria-labelledby="how-title">
          <div className="bc-sectionHeader">
            <div className="bc-kicker">{COPY.how.kicker}</div>
            <h2 className="bc-h2" id="how-title">{COPY.how.title}</h2>
            <p className="bc-p">{COPY.how.subtitle}</p>
          </div>

          <div className="bc-equation" aria-label="Mechanism equation">
            <span className="bc-eqItem">{COPY.how.equation.left}</span>
            <span className="bc-eqOp" aria-hidden="true">+</span>
            <span className="bc-eqItem">{COPY.how.equation.plus1}</span>
            <span className="bc-eqOp" aria-hidden="true">+</span>
            <span className="bc-eqItem">{COPY.how.equation.plus2}</span>
            <span className="bc-eqEq" aria-hidden="true">=</span>
            <span className="bc-eqResult">{COPY.how.equation.equals}</span>
          </div>

          <div className="bc-grid3" role="list" aria-label="Cipher, Co-Pilot, Formula">
            {COPY.how.pillars.map((p: Pillar) => (
              <div className="bc-stepCard" key={p.title} role="listitem">
                <div className="bc-stepTitle">{p.title}</div>
                <div className="bc-stepBody">{p.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Outcomes */}
        <section className="bc-section" aria-labelledby="outcomes-title">
          <div className="bc-sectionHeader">
            <h2 className="bc-h2" id="outcomes-title">{COPY.outcomes.title}</h2>
            <p className="bc-p">{COPY.outcomes.subtitle}</p>
          </div>

          <div className="bc-grid3" role="list" aria-label="What changes today">
            {COPY.outcomes.cards.map((c: Card) => (
              <div className="bc-card" key={c.title} role="listitem">
                <div className="bc-cardTitle">{c.title}</div>
                <div className="bc-cardBody">{c.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="bc-footer">
          <div className="bc-footerLine">{COPY.footer.line}</div>
          <div className="bc-footerSmall">© {new Date().getFullYear()} BALANCE Cipher</div>
        </footer>
      </div>
    </main>
  );
}

/* UI */

function ActionButton(props: { variant: "primary" | "secondary"; onClick: () => void; title?: string; children: ReactNode }) {
  const className = props.variant === "primary" ? "bc-btn bc-btnPrimary" : "bc-btn bc-btnSecondary";
  return (
    <button type="button" className={className} onClick={props.onClick} title={props.title}>
      {props.children}
    </button>
  );
}

function ActionLink(props: {
  variant: "primary" | "secondary";
  to?: string;
  external?: boolean;
  href?: string;
  fallbackTo?: string;
  title?: string;
  children: ReactNode;
}) {
  const className = props.variant === "primary" ? "bc-btn bc-btnPrimary" : "bc-btn bc-btnSecondary";

  if (props.external) {
    const href = (props.href || "").trim();
    if (href) {
      return (
        <a className={className} href={href} target="_blank" rel="noopener noreferrer" title={props.title}>
          {props.children}
        </a>
      );
    }
    const fallback = props.fallbackTo || props.to || "/";
    return (
      <Link className={className} to={fallback} title="Fallback route (app URL not configured yet)">
        {props.children}
      </Link>
    );
  }

  return (
    <Link className={className} to={props.to || "/"} title={props.title}>
      {props.children}
    </Link>
  );
}

function ChipRadio(props: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`bc-chip ${props.checked ? "isActive" : ""}`}
      role="radio"
      aria-checked={props.checked}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

/* CSS */

const CSS = `
:root{
  --bg:#050B18;
  --panel: rgba(255,255,255,0.04);
  --panel2: rgba(0,0,0,0.22);
  --border: rgba(255,255,255,0.10);
  --border2: rgba(0,255,220,0.18);
  --text: rgba(255,255,255,0.92);
  --muted: rgba(255,255,255,0.74);
  --teal: rgba(0,255,220,0.92);
  --teal2: rgba(0,190,255,0.82);
  --shadow: 0 18px 50px rgba(0,0,0,0.35);
  --r16: 16px;
  --r18: 18px;
  --r20: 20px;
}

.bc-page{ min-height:100vh; background: var(--bg); color: var(--text); position:relative; overflow-x:hidden; }
.bc-bg{
  position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(900px 520px at 14% 10%, rgba(0,255,220,0.22), transparent 55%),
    radial-gradient(780px 520px at 86% 18%, rgba(0,190,255,0.14), transparent 55%),
    radial-gradient(900px 760px at 50% 96%, rgba(255,180,70,0.06), transparent 55%);
}

.bc-container{ position:relative; max-width:1120px; margin:0 auto; padding: 22px 16px 40px; }

.bc-hero{ padding-top:10px; }
.bc-heroCard{
  border-radius: var(--r20);
  background: linear-gradient(180deg, rgba(0,255,220,0.08), rgba(255,255,255,0.04));
  border: 1px solid rgba(0,255,220,0.18);
  padding: 20px;
  box-shadow: var(--shadow);
}

.bc-heroTop{ display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:10px; }
.bc-kickerPill{
  font-size:12px; letter-spacing:0.10em; text-transform:uppercase;
  padding:7px 10px; border-radius:999px;
  background: rgba(0,255,220,0.12);
  border:1px solid rgba(0,255,220,0.25);
}
.bc-trust{ font-size:12px; color: rgba(255,255,255,0.70); }

.bc-h1{ font-size: clamp(30px, 5vw, 52px); line-height:1.04; margin: 8px 0 10px; letter-spacing:-0.03em; }
.bc-lead{ font-size: 16px; line-height:1.6; color: rgba(255,255,255,0.80); margin: 0 0 12px; max-width: 980px; }

.bc-heroMicro{
  display:inline-flex; align-items:center; gap:10px;
  padding: 10px 12px; border-radius: 14px;
  background: rgba(0,0,0,0.22);
  border: 1px solid rgba(255,255,255,0.10);
  margin-bottom: 12px;
  font-weight: 900;
}
.bc-microDot{ width:10px; height:10px; border-radius:50%; background: rgba(0,255,220,0.90); box-shadow: 0 0 18px rgba(0,255,220,0.35); }

.bc-ctaRow{ display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-top:10px; }

.bc-btn{
  display:inline-flex; align-items:center; justify-content:center;
  padding: 12px 14px; border-radius: 14px;
  font-weight: 950;
  border: 1px solid transparent;
  transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
  cursor:pointer;
  text-decoration:none;
}
.bc-btn:focus-visible{ outline: 2px solid rgba(0,255,220,0.65); outline-offset: 3px; }
.bc-btn:hover{ transform: translateY(-1px); }
.bc-btnPrimary{
  color: rgba(0,0,0,0.92);
  background: linear-gradient(180deg, var(--teal), var(--teal2));
  box-shadow: 0 12px 28px rgba(0,255,220,0.18);
}
.bc-btnSecondary{
  color: rgba(255,255,255,0.92);
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.12);
}

.bc-snapStrip{
  margin-top: 12px;
  border-radius: var(--r20);
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.10);
  padding: 16px;
  box-shadow: 0 18px 50px rgba(0,0,0,0.20);
}
.bc-snapTitle{ font-weight: 950; font-size: 15px; margin-bottom: 10px; }
.bc-snapList{ list-style:none; padding:0; margin:0 0 10px; display:grid; gap:8px; }
.bc-snapItem{ display:flex; gap:10px; align-items:flex-start; color: rgba(255,255,255,0.78); line-height:1.45; }
.bc-snapDot{ width:8px; height:8px; border-radius:999px; background: rgba(0,255,220,0.85); margin-top:6px; box-shadow: 0 0 14px rgba(0,255,220,0.22); }
.bc-snapLine{ font-size: 13px; color: rgba(255,255,255,0.72); }

.bc-section{
  margin-top:18px; border-radius: var(--r20);
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.10);
  padding: 18px;
  box-shadow: 0 18px 50px rgba(0,0,0,0.20);
}
.bc-sectionHeader{ margin-bottom: 12px; max-width: 980px; }
.bc-kicker{ font-size:12px; letter-spacing:0.10em; text-transform:uppercase; color: rgba(0,255,220,0.75); margin-bottom:10px; }
.bc-h2{ font-size: 24px; margin:0 0 8px; letter-spacing:-0.01em; }
.bc-p{ margin:0; font-size:14px; line-height:1.65; color: rgba(255,255,255,0.74); }

.bc-revealCard{
  border-radius: var(--r18);
  border: 1px solid rgba(0,255,220,0.18);
  background: radial-gradient(520px 320px at 30% 20%, rgba(0,255,220,0.14), transparent 55%),
              rgba(0,0,0,0.18);
  padding: 14px;
}
.bc-revealBtn{
  width: 100%;
  border-radius: 16px;
  padding: 18px 14px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.92);
  display:flex;
  flex-direction:column;
  gap:10px;
  align-items:center;
  justify-content:center;
  cursor:pointer;
}
.bc-play{
  width: 46px;
  height: 46px;
  border-radius: 999px;
  background: rgba(0,255,220,0.14);
  border: 1px solid rgba(0,255,220,0.25);
  position: relative;
  box-shadow: 0 0 22px rgba(0,255,220,0.18);
}
.bc-play:after{
  content:"";
  position:absolute;
  left: 18px;
  top: 14px;
  width: 0; height: 0;
  border-top: 9px solid transparent;
  border-bottom: 9px solid transparent;
  border-left: 14px solid rgba(0,255,220,0.85);
}
.bc-revealBtnText{ font-weight: 950; font-size: 16px; }
.bc-revealHint{ font-size: 12px; color: rgba(255,255,255,0.70); }

.bc-revealed{ display:grid; gap:12px; }
.bc-revRow{
  border-radius: 16px;
  padding: 12px;
  background: rgba(0,0,0,0.20);
  border: 1px solid rgba(255,255,255,0.10);
}
.bc-revLabel{
  font-size: 11px; letter-spacing:0.10em; text-transform:uppercase;
  color: rgba(255,255,255,0.65);
  margin-bottom: 8px;
}
.bc-revText{ font-size: 13px; line-height:1.6; color: rgba(255,255,255,0.80); }
.bc-revActions{ display:flex; flex-wrap:wrap; gap:10px; }

.bc-loop{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px; margin-top: 10px; }
.bc-loopCard{
  border-radius: var(--r18);
  padding: 14px;
  background: rgba(0,0,0,0.18);
  border: 1px solid rgba(255,255,255,0.10);
}
.bc-loopTitle{ font-weight: 950; margin-bottom: 8px; }
.bc-loopBody{ font-size: 13px; color: rgba(255,255,255,0.74); line-height:1.5; }

.bc-split{ display:grid; grid-template-columns: 1.15fr 0.85fr; gap:14px; align-items:start; }

.bc-previewControls{
  border-radius: var(--r18);
  padding: 14px;
  background: rgba(0,0,0,0.18);
  border: 1px solid rgba(255,255,255,0.10);
}
.bc-controlBlock{ margin-bottom: 12px; }
.bc-controlRow{ display:grid; grid-template-columns: 1fr; gap: 12px; }
.bc-controlLabel{
  font-size: 12px; letter-spacing:0.10em; text-transform:uppercase;
  color: rgba(255,255,255,0.70);
  margin-bottom: 10px;
}
.bc-chipRow{ display:flex; flex-wrap:wrap; gap:10px; }
.bc-chipGrid{ display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:10px; }

.bc-chip{
  width: 100%;
  border-radius: 14px;
  padding: 12px 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.90);
  font-weight: 950;
  text-align: left;
  cursor:pointer;
}
.bc-chip.isActive{
  background: rgba(0,255,220,0.10);
  border: 1px solid rgba(0,255,220,0.26);
  box-shadow: 0 14px 30px rgba(0,255,220,0.10);
}

.bc-panel{
  border-radius: var(--r18);
  padding: 14px;
  background: radial-gradient(520px 320px at 30% 20%, rgba(0,255,220,0.10), transparent 55%),
              rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.12);
}
.bc-panelLabel{
  font-size:12px; letter-spacing:0.10em; text-transform:uppercase;
  color: rgba(255,255,255,0.65);
  margin-bottom:10px;
}
.bc-panelTitle{ font-size:16px; font-weight: 950; margin-bottom:10px; }

.bc-outputBlock{
  border-radius: 16px;
  padding: 12px;
  background: rgba(0,0,0,0.20);
  border: 1px solid rgba(255,255,255,0.10);
  margin-top: 10px;
}
.bc-outputLabel{
  font-size: 11px; letter-spacing:0.10em; text-transform:uppercase;
  color: rgba(255,255,255,0.65);
  margin-bottom: 8px;
}
.bc-outputText{ font-size: 13px; line-height:1.6; color: rgba(255,255,255,0.80); }

.bc-grid3{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:12px; margin-top:12px; }
.bc-stepCard{
  border-radius: var(--r18);
  padding: 14px;
  background: linear-gradient(180deg, rgba(0,255,220,0.06), rgba(0,0,0,0.22));
  border: 1px solid rgba(0,255,220,0.14);
}
.bc-stepTitle{ font-size:14px; font-weight: 980; margin-bottom:8px; }
.bc-stepBody{ font-size:13px; line-height:1.55; color: rgba(255,255,255,0.74); }

.bc-equation{
  border-radius: var(--r18);
  padding: 14px;
  background: rgba(0,0,0,0.18);
  border: 1px solid rgba(255,255,255,0.10);
  display:flex; flex-wrap:wrap; align-items:center; gap:10px;
  margin-top: 12px;
}
.bc-eqItem{
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  font-weight: 980;
  font-size: 13px;
}
.bc-eqOp{ font-size:16px; font-weight: 980; color: rgba(255,255,255,0.75); }
.bc-eqEq{ font-size:16px; font-weight: 980; color: rgba(0,255,220,0.85); }
.bc-eqResult{
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(0,255,220,0.10);
  border: 1px solid rgba(0,255,220,0.22);
  font-weight: 990;
  font-size: 13px;
}

.bc-card{ border-radius: var(--r18); padding: 14px; background: rgba(0,0,0,0.18); border: 1px solid rgba(255,255,255,0.10); }
.bc-cardTitle{ font-size:14px; font-weight: 980; margin-bottom:8px; }
.bc-cardBody{ font-size:13px; line-height:1.55; color: rgba(255,255,255,0.74); }

.bc-footer{
  margin-top:18px;
  padding: 14px 4px 2px;
  display:flex;
  justify-content:space-between;
  gap:12px;
  flex-wrap:wrap;
  color: rgba(255,255,255,0.60);
}
.bc-footerLine{ font-size:12px; }
.bc-footerSmall{ font-size:12px; }

@media (max-width: 880px){
  .bc-split{ grid-template-columns: 1fr; }
  .bc-grid3{ grid-template-columns: 1fr; }
  .bc-loop{ grid-template-columns: 1fr; }
  .bc-chipGrid{ grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce){
  .bc-btn{ transition:none; }
  .bc-btn:hover{ transform:none; }
}
`;
