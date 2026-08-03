"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import LoginForm from "@/components/LoginForm";
import { FONT, C, LOGO_FIGURES } from "@/lib/theme";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Approximate lat/lon centroids for Pittsburgh-area ZIP codes (city + close suburbs).
// Not exhaustive — unrecognized ZIPs fall back to a "distance unknown" state.
const ZIP_COORDS = {
  "15201": [40.4732, -79.9591], // Lawrenceville
  "15202": [40.5024, -80.0631], // Bellevue
  "15203": [40.4256, -79.9759], // South Side
  "15204": [40.4631, -80.0571], // Esplen/Elliott
  "15205": [40.4488, -80.0723], // Crafton/Ingram
  "15206": [40.4644, -79.9217], // Friendship/Highland Park
  "15207": [40.4128, -79.9166], // Hazelwood
  "15208": [40.4548, -79.9090], // Point Breeze
  "15209": [40.4944, -79.9594], // Millvale
  "15210": [40.4119, -79.9846], // South Side Slopes/Carrick
  "15211": [40.4276, -80.0096], // Mt. Washington
  "15212": [40.4548, -80.0086], // North Side
  "15213": [40.4423, -79.9560], // Oakland
  "15214": [40.4848, -80.0046], // Perry/Observatory Hill
  "15215": [40.4938, -79.9050], // Aspinwall/Blawnox
  "15216": [40.3940, -80.0246], // Dormont/Beechview
  "15217": [40.4326, -79.9248], // Squirrel Hill
  "15218": [40.4322, -79.8916], // Edgewood/Swissvale
  "15219": [40.4423, -79.9817], // Hill District
  "15220": [40.4180, -80.0510], // Crafton Heights
  "15221": [40.4324, -79.8541], // Wilkinsburg
  "15222": [40.4470, -79.9939], // Downtown/Strip District
  "15223": [40.5125, -79.9180], // Etna/Sharpsburg
  "15224": [40.4673, -79.9510], // Bloomfield/Garfield
  "15225": [40.5050, -80.1170], // Neville Island/Robinson area
  "15226": [40.3848, -80.0119], // Brookline/Whitehall
  "15227": [40.3702, -79.9523], // Whitehall/Baldwin
  "15228": [40.3729, -80.0476], // Mt. Lebanon
  "15229": [40.5290, -80.0260], // Ross Twp
  "15232": [40.4530, -79.9337], // Shadyside
  "15233": [40.4530, -80.0140], // Allegheny West/Manchester
  "15234": [40.3650, -80.0330], // Castle Shannon/Brentwood
  "15235": [40.4470, -79.8230], // Penn Hills
  "15236": [40.3360, -79.9700], // West Mifflin
  "15237": [40.5460, -80.0440], // McCandless/North Hills
  "15238": [40.5070, -79.8580], // Blawnox/Fox Chapel area
  "15243": [40.3700, -80.0830], // Bridgeville/Scott Twp
  "15001": [40.6150, -80.2560], // Aliquippa/Hopewell
  "16066": [40.6840, -80.1070], // Cranberry Township
  "15101": [40.5730, -79.9600], // Allison Park
  "15367": [40.2750, -80.1350], // Venetia/Peters Township
  "15009": [40.6990, -80.3290], // Beaver
  "15301": [40.1740, -80.2460], // Washington PA
  "15136": [40.4650, -80.1010], // McKees Rocks/Kennedy Township
  "15668": [40.4350, -79.6630], // Murrysville
  "15090": [40.6250, -80.0650], // Wexford
  "15044": [40.6300, -79.9600], // Gibsonia
  "15108": [40.5080, -80.2070], // Moon Township/Coraopolis
  "15139": [40.5200, -79.8350], // Oakmont
  "15017": [40.3520, -80.1100], // Bridgeville
  "15239": [40.5020, -79.7500], // Plum
  "15202": [40.4410, -80.0150], // Bellevue
  "15237": [40.5350, -79.9850], // McCandless
};

function haversineMiles([lat1, lon1], [lat2, lon2]) {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceBetweenZips(zip1, zip2) {
  const c1 = ZIP_COORDS[(zip1 || "").trim()];
  const c2 = ZIP_COORDS[(zip2 || "").trim()];
  if (!c1 || !c2) return null; // unknown
  return haversineMiles(c1, c2);
}

const MAX_DISTANCE_MILES = 5;

const COLORS = {
  bg: "#EEF2EE",
  ink: "#1E2A23",
  muted: "#637068",
  card: "#FFFFFF",
  teal: "#2F6F62",
  tealDark: "#1F4E44",
  amber: "#D98B4B",
  amberDark: "#B36B2E",
  line: "#D7DED7",
  badgeBg: "#E4ECE6",
};

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function emptyParent() {
  return {
    id: uid(),
    status: "approved",
    label: "",
    contactEmail: "",
    zip: "",
    flexible: false,
    days: [],
    startTime: "08:00",
    endTime: "17:00",
    specificDates: [],
    term: "long",
    hoursGuaranteed: false,
    startDate: "",
    ages: "",
    rate: "",
    careLocation: "no_preference",   // "provider_home" | "family_home" | "no_preference"
    needsTransport: false,
    transportCar: "provider",        // "provider" | "family" — whose car if transport needed
    requiresDrivingRecord: false,
    requiresCPR: false,
    requiresClearances: false,
    notes: "",
  };
}

export function emptyProvider() {
  return {
    id: uid(),
    status: "approved",
    label: "",
    contactEmail: "",
    zip: "",
    flexible: false,
    days: [],
    startTime: "08:00",
    endTime: "17:00",
    specificDates: [],
    termsAccepted: "both",
    startDate: "",
    minAge: "",
    maxAge: "",
    ageNoPreference: false,
    rate: "",
    careLocation: "either",          // "my_home" | "family_home" | "either"
    hasTransport: false,
    cprCertified: false,
    hasClearances: false,
    notes: "",
  };
}

// ── Supabase row <-> app object mapping ──
const FAMILY_FIELDS = [
  ["label", "label"], ["zip", "zip"], ["flexible", "flexible"], ["days", "days"],
  ["startTime", "start_time"], ["endTime", "end_time"], ["specificDates", "specific_dates"],
  ["term", "term"], ["hoursGuaranteed", "hours_guaranteed"], ["startDate", "start_date"],
  ["ages", "ages"], ["rate", "rate"], ["careLocation", "care_location"],
  ["needsTransport", "needs_transport"], ["transportCar", "transport_car"],
  ["requiresDrivingRecord", "requires_driving_record"], ["requiresCPR", "requires_cpr"],
  ["requiresClearances", "requires_clearances"], ["notes", "notes"], ["status", "status"],
  ["contactEmail", "contact_email"],
];

const PROVIDER_FIELDS = [
  ["label", "label"], ["zip", "zip"], ["flexible", "flexible"], ["days", "days"],
  ["startTime", "start_time"], ["endTime", "end_time"], ["specificDates", "specific_dates"],
  ["termsAccepted", "terms_accepted"], ["startDate", "start_date"],
  ["minAge", "min_age"], ["maxAge", "max_age"], ["ageNoPreference", "age_no_preference"],
  ["rate", "rate"], ["careLocation", "care_location"], ["hasTransport", "has_transport"],
  ["cprCertified", "cpr_certified"], ["hasClearances", "has_clearances"], ["notes", "notes"],
  ["status", "status"], ["contactEmail", "contact_email"],
];

function toRow(item, fieldMap) {
  const row = { id: item.id };
  for (const [key, col] of fieldMap) row[col] = item[key];
  return row;
}

function fromRow(row, fieldMap) {
  const item = { id: row.id };
  for (const [key, col] of fieldMap) item[key] = row[col];
  return item;
}

export const familyToRow = (item) => toRow(item, FAMILY_FIELDS);
const rowToFamily = (row) => fromRow(row, FAMILY_FIELDS);
export const providerToRow = (item) => toRow(item, PROVIDER_FIELDS);
const rowToProvider = (row) => fromRow(row, PROVIDER_FIELDS);

// ── Pre-loaded roster from Carli's FB Group Posts spreadsheets ──
const SEED_PARENTS = [
  // Roster cleared for privacy — add families through the app
];

const SEED_PROVIDERS = [
  // Roster cleared for privacy — add providers through the app
];

// ────────────────────────── matching logic (unchanged) ──────────────────────────

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function hourOverlapRatio(p, prov) {
  if (p.flexible || prov.flexible) return 1;
  const ps = timeToMin(p.startTime), pe = timeToMin(p.endTime);
  const vs = timeToMin(prov.startTime), ve = timeToMin(prov.endTime);
  const overlap = Math.max(0, Math.min(pe, ve) - Math.max(ps, vs));
  const needed = Math.max(1, pe - ps);
  return Math.min(1, overlap / needed);
}

function dayOverlapRatio(p, prov) {
  if (p.days.length === 0) return 0;
  const covered = p.days.filter((d) => prov.days.includes(d)).length;
  return covered / p.days.length;
}

function parseAges(str) {
  return (str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const lower = s.toLowerCase();
      const monthsMatch = lower.match(/(\d+\.?\d*)\s*(months?|mos?\.?|mo)\b/);
      if (monthsMatch) return parseFloat(monthsMatch[1]) / 12;
      const yearsMatch = lower.match(/(\d+\.?\d*)\s*(years?|yrs?\.?|y)\b/);
      if (yearsMatch) return parseFloat(yearsMatch[1]);
      const bare = parseFloat(s);
      if (!isNaN(bare)) return bare;
      if (lower.includes("newborn")) return 0.1;
      if (lower.includes("infant")) return 0.5;
      if (lower.includes("toddler")) return 2;
      return null;
    });
}

function parseProviderAge(str) {
  if (str === "" || str == null) return null;
  const lower = String(str).toLowerCase().trim();
  const monthsMatch = lower.match(/(\d+\.?\d*)\s*(months?|mos?\.?|mo)\b/);
  if (monthsMatch) return parseFloat(monthsMatch[1]) / 12;
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

function ageFitRatio(p, prov) {
  if (prov.ageNoPreference) return 1;
  const ages = parseAges(p.ages).filter((a) => a !== null);
  if (ages.length === 0) return 0.5;
  const minRaw = parseProviderAge(prov.minAge);
  const maxRaw = parseProviderAge(prov.maxAge);
  const min = minRaw === null ? -Infinity : minRaw;
  const max = maxRaw === null ? Infinity : maxRaw;
  if (min === -Infinity && max === Infinity) return 0.5;
  const fitCount = ages.filter((a) => a >= min && a <= max).length;
  return fitCount / ages.length;
}

function termCompatible(p, prov) {
  if (prov.termsAccepted === "both") return 1;
  return prov.termsAccepted === p.term ? 1 : 0.3;
}

function parseRateRange(str) {
  if (!str || String(str).trim() === "") return null;
  const cleaned = String(str).replace(/\$/g, "").trim();
  const rangeMatch = cleaned.match(/(\d+\.?\d*)\s*(?:-|–|to)\s*(\d+\.?\d*)/i);
  if (rangeMatch) return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
  const single = parseFloat(cleaned);
  if (!isNaN(single)) return { min: single, max: single };
  return null;
}

function rateCompatible(p, prov) {
  const familyRange = parseRateRange(p.rate);
  const providerRate = parseRateRange(prov.rate);
  if (!familyRange || !providerRate) return { ratio: 1, gap: null, label: "rate not specified" };
  const provExpected = providerRate.min;
  if (familyRange.max >= provExpected) return { ratio: 1, gap: 0, label: "rate ok" };
  const ratio = Math.max(0, familyRange.max / provExpected);
  const gap = provExpected - familyRange.max;
  return { ratio, gap, label: `$${gap.toFixed(2)}/hr short (max $${familyRange.max} vs $${provExpected} expected)` };
}

function scoreMatch(p, prov) {
  const flexible = p.flexible || prov.flexible;
  const day = flexible ? 1 : dayOverlapRatio(p, prov);
  const hour = flexible ? 1 : hourOverlapRatio(p, prov);
  const timeFit = (day + hour) / 2;
  const age = ageFitRatio(p, prov);
  const term = termCompatible(p, prov);
  const distance = distanceBetweenZips(p.zip, prov.zip);
  const tooFar = distance !== null && distance > MAX_DISTANCE_MILES;
  const rate = rateCompatible(p, prov);

  const pDates = p.specificDates || [];
  const provDates = prov.specificDates || [];
  const bothHaveDates = pDates.length > 0 && provDates.length > 0;
  const sharedDates = bothHaveDates ? pDates.filter((d) => provDates.includes(d)) : [];
  const datesMismatch = bothHaveDates && sharedDates.length === 0;

  const careLocationMismatch =
    (p.careLocation === "provider_home" && prov.careLocation === "family_home") ||
    (p.careLocation === "family_home" && prov.careLocation === "my_home");

  const transportMismatch = p.needsTransport && !prov.hasTransport;
  const missingCPR = p.requiresCPR && !prov.cprCertified;
  const missingClearances = p.requiresClearances && !prov.hasClearances;
  const missingDrivingRecord = p.needsTransport && p.requiresDrivingRecord && !prov.hasTransport;

  const excluded = tooFar || datesMismatch || careLocationMismatch || transportMismatch || missingCPR || missingClearances;
  const base = timeFit * 0.5 + age * 0.5;
  const score = excluded ? 0 : Math.round(base * term * rate.ratio * 100);
  return {
    score, day, hour, age, term, distance, tooFar, rate,
    sharedDates, datesMismatch, careLocationMismatch, transportMismatch,
    missingCPR, missingClearances, missingDrivingRecord, excluded,
  };
}

// Turns a scored match into a confidence tier + plain-English reasons.
function matchInsight(m) {
  const flexible = m.parent.flexible || m.provider.flexible;
  const pros = [];
  const cons = [];

  // ── schedule ──
  if (flexible) {
    pros.push("Flexible schedule on at least one side, so days and times can be worked out.");
  } else {
    if (m.day >= 0.999) pros.push("Every day the family needs is covered by the provider's availability.");
    else if (m.day >= 0.5) pros.push(`The provider covers ${Math.round(m.day * 100)}% of the days the family needs.`);
    else cons.push(`The provider only covers ${Math.round(m.day * 100)}% of the days the family needs.`);

    if (m.hour >= 0.999) pros.push("The daily hours line up completely.");
    else if (m.hour >= 0.6) pros.push(`Their hours overlap by about ${Math.round(m.hour * 100)}%.`);
    else cons.push(`Their hours only overlap by about ${Math.round(m.hour * 100)}% — schedules may need adjusting.`);
  }

  // ── ages ──
  if (m.age >= 0.999) pros.push("The children's ages fall right within the provider's preferred range.");
  else if (m.age > 0) cons.push("Some of the children fall outside the provider's stated age range.");
  else if (m.age === 0) cons.push("The children's ages don't fit the provider's stated age range.");

  // ── term ──
  if (m.term === 1) pros.push("Both agree on the type of arrangement (long- vs. short-term).");
  else cons.push("One wants long-term and the other short-term — worth confirming flexibility.");

  // ── distance ──
  if (m.distance === null) {
    cons.push("Distance can't be calculated yet — a ZIP code is missing.");
  } else if (m.distance <= 3) {
    pros.push(`They're close — only ${m.distance.toFixed(1)} miles apart.`);
  } else if (m.distance <= MAX_DISTANCE_MILES) {
    pros.push(`Within range at ${m.distance.toFixed(1)} miles apart.`);
  }

  // ── rate ──
  if (m.rate.gap && m.rate.gap > 0) {
    cons.push(`The provider expects about $${m.rate.gap.toFixed(0)}/hr more than the family's budget.`);
  } else if (m.rate.label === "rate ok") {
    pros.push("The family's budget meets the provider's expected rate.");
  }

  // ── guaranteed hours ──
  if (m.parent.hoursGuaranteed) pros.push("The family guarantees hours — appealing to providers who want steady pay.");

  // ── transport ──
  if (m.parent.needsTransport && m.provider.hasTransport) {
    pros.push("The provider can drive, which this family requires.");
  }

  // ── credentials ──
  if (m.missingCPR) cons.push("The family requires CPR certification, which the provider hasn't confirmed.");
  if (m.missingClearances) cons.push("The family requires clearances the provider hasn't confirmed.");
  if (m.parent.requiresCPR && m.provider.cprCertified) pros.push("Provider is CPR certified, as required.");
  if (m.parent.requiresClearances && m.provider.hasClearances) pros.push("Provider has the required clearances on file.");

  // ── shared specific dates ──
  if (m.sharedDates && m.sharedDates.length > 0) {
    pros.push(`They share ${m.sharedDates.length} specific date${m.sharedDates.length > 1 ? "s" : ""} the family needs filled.`);
  }

  // ── confidence tier ──
  let tier, tierColor, tierBg, blurb;
  if (m.score >= 70 && cons.length === 0) {
    tier = "High confidence"; tierColor = C.green; tierBg = C.greenPale;
    blurb = "A strong match across the board.";
  } else if (m.score >= 70) {
    tier = "Strong, with a note"; tierColor = C.green; tierBg = C.greenPale;
    blurb = "A strong overall fit — just one or two things to check.";
  } else if (m.score >= 45) {
    tier = "Good with conditions"; tierColor = C.gold; tierBg = C.goldPale;
    blurb = "A workable match if the caveats below can be resolved.";
  } else {
    tier = "Explore further"; tierColor = C.gold; tierBg = C.goldPale;
    blurb = "A partial fit — worth a look, but expect some gaps.";
  }

  return { tier, tierColor, tierBg, blurb, pros, cons };
}


function needsFollowUp(item) {
  if (!item.zip) return true;
  const t = ((item.notes || "") + " " + (item.rate || "")).toLowerCase();
  return /tbd|follow up|unknown|confirm/.test(t);
}

// ────────────────────────── shared UI primitives ──────────────────────────

const inputStyle = {
  border: `1px solid ${C.line}`,
  background: C.soft,
  borderRadius: 10,
  padding: "8px 10px",
  fontSize: 13,
  color: C.ink,
  outline: "none",
  fontFamily: "'Inter', sans-serif",
};

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 11, fontWeight: 600, color: C.muted }}>
      {label}
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, children }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "7px 12px", borderRadius: 10,
        fontSize: 12, fontWeight: 600, alignSelf: "flex-start",
        background: checked ? C.plum : C.plumPale,
        color: checked ? "#fff" : C.muted,
        border: `1px solid ${checked ? C.plum : C.line}`,
        cursor: "pointer", transition: "all 0.15s",
        fontFamily: "'Inter', sans-serif", textAlign: "left",
      }}
    >
      <span>{checked ? "✓" : "○"}</span>
      {children}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 12,
      borderRadius: 14, padding: 14,
      border: `1px solid ${C.line}`, background: C.soft,
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.1em", color: C.plum,
      }}>
        {title}
      </span>
      {children}
    </div>
  );
}

function Chip({ children, tone }) {
  const tones = {
    default: { bg: C.plumPale, fg: C.plumDark, line: "#DCC7D3" },
    gold: { bg: C.goldPale, fg: C.gold, line: C.goldLine },
    green: { bg: C.greenPale, fg: C.green, line: "#BCE4CD" },
    red: { bg: C.redPale, fg: C.red, line: "#EBC9C6" },
  };
  const t = tones[tone] || tones.default;
  return (
    <span style={{
      display: "inline-block", padding: "3px 9px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
      background: t.bg, color: t.fg, border: `1px solid ${t.line}`,
    }}>
      {children}
    </span>
  );
}

function DayPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {DAYS.map((d) => {
        const active = value.includes(d);
        return (
          <button
            type="button"
            key={d}
            onClick={() => onChange(active ? value.filter((x) => x !== d) : [...value, d])}
            style={{
              width: 40, padding: "6px 0", borderRadius: 9,
              fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: active ? C.plum : C.card,
              color: active ? "#fff" : C.muted,
              border: `1px solid ${active ? C.plum : C.line}`,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}

function DatePicker({ value, onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const trimmed = input.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput("");
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="date"
          style={{ ...inputStyle, flex: 1 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button
          type="button"
          onClick={add}
          style={{
            padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
            background: C.plum, color: "#fff", border: "none", cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {value.map((d) => (
            <span key={d} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: C.plumPale, color: C.plumDark, border: "1px solid #DCC7D3",
            }}>
              {d}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== d))}
                style={{ border: "none", background: "none", color: C.muted, cursor: "pointer", padding: 0, lineHeight: 1 }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ score }) {
  const color = score >= 70 ? C.green : score >= 40 ? C.gold : C.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
      <div style={{ flex: 1, height: 6, borderRadius: 6, overflow: "hidden", background: C.plumPale }}>
        <div style={{ height: "100%", borderRadius: 6, width: `${score}%`, background: color, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{score}</span>
    </div>
  );
}

// ────────────────────────── disclaimer ──────────────────────────

export function HoldHarmlessModal({ onAccept }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, padding: 20,
      background: "rgba(28,26,46,0.72)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: C.card, borderRadius: 22, padding: "30px 26px",
        maxWidth: 520, width: "100%", display: "flex", flexDirection: "column", gap: 16,
        maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(28,26,46,0.35)",
      }}>
        <h2 style={{
          margin: 0, fontFamily: "'Playfair Display', serif",
          fontSize: 24, fontWeight: 700, color: C.plum,
        }}>
          Before You Begin
        </h2>
        <div style={{
          borderRadius: 14, padding: 16, fontSize: 12, lineHeight: 1.6,
          background: C.plumPale, color: C.ink,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <p style={{ margin: 0 }}><strong>Disclaimer & Hold Harmless Agreement</strong></p>
          <p style={{ margin: 0 }}>This tool is provided as an organizational aid only. By using it, you acknowledge and agree that:</p>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
            <li>The matching service makes no representations or warranties regarding the accuracy, completeness, or suitability of any family or provider listing.</li>
            <li>The operator of this tool is <strong>not</strong> responsible for verifying credentials, clearances, background checks, CPR certifications, driving records, or any other information submitted by users.</li>
            <li>All matches are suggestions only. Families and providers are solely responsible for conducting their own due diligence before entering into any childcare arrangement.</li>
            <li>The operator shall not be liable for any damages, losses, injuries, or claims of any kind arising from the use of this tool or any childcare arrangement made through it.</li>
            <li>By proceeding, you agree to hold the operator harmless from any and all claims related to your use of this service.</li>
          </ul>
          <p style={{ margin: 0, fontStyle: "italic", color: C.muted }}>
            This tool is not a licensed childcare agency and does not provide professional childcare referral services.
          </p>
        </div>
        <button
          onClick={onAccept}
          style={{
            padding: "13px 0", borderRadius: 12, border: "none", cursor: "pointer",
            background: C.plum, color: "#fff", fontSize: 14, fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          I understand — continue to the app
        </button>
      </div>
    </div>
  );
}

// ────────────────────────── listing form ──────────────────────────

export function ListingForm({ kind, draft, setDraft, onSave, onCancel, saveLabel = "Add to list" }) {
  const isParent = kind === "parent";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Section title={isParent ? "About the Family" : "About You"}>
        <Field label={isParent ? "Family name" : "Provider name"}>
          <input
            style={inputStyle}
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            placeholder={isParent ? "e.g. The Kowalski family" : "e.g. Sarah's In-Home Care"}
          />
        </Field>
        <Field label="Contact email">
          <input
            type="email"
            style={inputStyle}
            value={draft.contactEmail}
            onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="ZIP code">
          <input
            style={{ ...inputStyle, maxWidth: 120 }}
            value={draft.zip}
            onChange={(e) => setDraft({ ...draft, zip: e.target.value })}
            placeholder="15217"
            maxLength={5}
          />
        </Field>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>Desired start date</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <input
              type="date"
              style={{ ...inputStyle, maxWidth: 180 }}
              value={draft.startDate === "immediately" ? "" : draft.startDate}
              disabled={draft.startDate === "immediately"}
              onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setDraft({ ...draft, startDate: draft.startDate === "immediately" ? "" : "immediately" })}
              style={{
                padding: "7px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: draft.startDate === "immediately" ? C.gold : C.plumPale,
                color: draft.startDate === "immediately" ? "#fff" : C.muted,
                border: `1px solid ${draft.startDate === "immediately" ? C.gold : C.line}`,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {draft.startDate === "immediately" ? "✓ Immediately" : "Immediately"}
            </button>
          </div>
        </div>
      </Section>

      <Section title="Schedule & Availability">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Toggle checked={draft.flexible} onChange={(v) => setDraft({ ...draft, flexible: v })}>
            Flexible on days & hours
          </Toggle>
          {!draft.flexible && (
            <>
              <DayPicker value={draft.days} onChange={(days) => setDraft({ ...draft, days })} />
              <div style={{ display: "flex", gap: 12 }}>
                <Field label="Start time">
                  <input type="time" style={inputStyle} value={draft.startTime}
                    onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} />
                </Field>
                <Field label="End time">
                  <input type="time" style={inputStyle} value={draft.endTime}
                    onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} />
                </Field>
              </div>
            </>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>
            {isParent
              ? "Specific dates needed (optional — for one-time or short-term requests)"
              : "Specific dates available (optional — to fill open slots)"}
          </span>
          <DatePicker value={draft.specificDates || []} onChange={(dates) => setDraft({ ...draft, specificDates: dates })} />
        </div>
      </Section>

      <Section title="Care Arrangement">
        {isParent ? (
          <>
            <Field label="Type of care needed">
              <select style={inputStyle} value={draft.term} onChange={(e) => setDraft({ ...draft, term: e.target.value })}>
                <option value="long">Long-term (ongoing)</option>
                <option value="short">Short-term / one-time</option>
              </select>
            </Field>
            <Field label="Where will care take place?">
              <select style={inputStyle} value={draft.careLocation} onChange={(e) => setDraft({ ...draft, careLocation: e.target.value })}>
                <option value="no_preference">No preference</option>
                <option value="provider_home">At the provider's home</option>
                <option value="family_home">At our home</option>
              </select>
            </Field>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Toggle checked={draft.hoursGuaranteed} onChange={(v) => setDraft({ ...draft, hoursGuaranteed: v })}>
                Hours are guaranteed
              </Toggle>
              <p style={{ margin: 0, fontSize: 11, fontStyle: "italic", color: C.muted }}>
                When toggled on, the provider will be paid for scheduled hours even if the family does not need care that day.
              </p>
            </div>
          </>
        ) : (
          <>
            <Field label="Accepts">
              <select style={inputStyle} value={draft.termsAccepted} onChange={(e) => setDraft({ ...draft, termsAccepted: e.target.value })}>
                <option value="both">Both long-term and short-term</option>
                <option value="long">Long-term positions only</option>
                <option value="short">Short-term / one-time only</option>
              </select>
            </Field>
            <Field label="Where do you offer care?">
              <select style={inputStyle} value={draft.careLocation} onChange={(e) => setDraft({ ...draft, careLocation: e.target.value })}>
                <option value="either">Either — I'm flexible</option>
                <option value="my_home">In my home only</option>
                <option value="family_home">In the family's home only</option>
              </select>
            </Field>
          </>
        )}
      </Section>

      {isParent ? (
        <Section title="Children">
          <Field label="Children's ages (e.g. 17 months, 4 years — separate with commas)">
            <input style={inputStyle} value={draft.ages}
              onChange={(e) => setDraft({ ...draft, ages: e.target.value })}
              placeholder="17 months, 4 years" />
          </Field>
        </Section>
      ) : (
        <Section title="Ages Accepted">
          <Toggle
            checked={draft.ageNoPreference}
            onChange={(v) => setDraft({ ...draft, ageNoPreference: v, minAge: v ? "" : draft.minAge, maxAge: v ? "" : draft.maxAge })}
          >
            No preference — I'm open to all ages
          </Toggle>
          {!draft.ageNoPreference && (
            <div style={{ display: "flex", gap: 12 }}>
              <Field label="Minimum age">
                <input style={inputStyle} value={draft.minAge}
                  onChange={(e) => setDraft({ ...draft, minAge: e.target.value })}
                  placeholder="6 months" />
              </Field>
              <Field label="Maximum age">
                <input style={inputStyle} value={draft.maxAge}
                  onChange={(e) => setDraft({ ...draft, maxAge: e.target.value })}
                  placeholder="5 years" />
              </Field>
            </div>
          )}
        </Section>
      )}

      <Section title="Transportation">
        {isParent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Toggle checked={draft.needsTransport} onChange={(v) => setDraft({ ...draft, needsTransport: v })}>
              Provider will need to transport children
            </Toggle>
            {draft.needsTransport && (
              <>
                <Field label="Whose car will be used?">
                  <select style={inputStyle} value={draft.transportCar} onChange={(e) => setDraft({ ...draft, transportCar: e.target.value })}>
                    <option value="provider">Provider's own car</option>
                    <option value="family">Family's car</option>
                  </select>
                </Field>
                <Toggle checked={draft.requiresDrivingRecord} onChange={(v) => setDraft({ ...draft, requiresDrivingRecord: v })}>
                  Must provide a clean driving record
                </Toggle>
              </>
            )}
          </div>
        ) : (
          <Toggle checked={draft.hasTransport} onChange={(v) => setDraft({ ...draft, hasTransport: v })}>
            I have reliable transportation and can drive children
          </Toggle>
        )}
      </Section>

      <Section title="Compensation">
        {isParent ? (
          <Field label="Willing to pay per hour (range ok, e.g. 15-20)">
            <input style={{ ...inputStyle, maxWidth: 160 }} value={draft.rate}
              onChange={(e) => setDraft({ ...draft, rate: e.target.value })}
              placeholder="15-20" />
          </Field>
        ) : (
          <Field label="Expected hourly rate ($)">
            <input style={{ ...inputStyle, maxWidth: 120 }} value={draft.rate}
              onChange={(e) => setDraft({ ...draft, rate: e.target.value })}
              placeholder="20" />
          </Field>
        )}
      </Section>

      <Section title={isParent ? "Provider Requirements" : "Credentials & Certifications"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {isParent ? (
            <>
              <Toggle checked={draft.requiresCPR} onChange={(v) => setDraft({ ...draft, requiresCPR: v })}>
                Must be CPR certified
              </Toggle>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Toggle checked={draft.requiresClearances} onChange={(v) => setDraft({ ...draft, requiresClearances: v })}>
                  Must have current clearances & background checks
                </Toggle>
                <p style={{ margin: 0, fontSize: 11, fontStyle: "italic", color: C.muted, paddingLeft: 4 }}>
                  Includes Act 33 (Child Abuse History), Act 34 (PA Criminal History), and FBI background check.
                </p>
              </div>
            </>
          ) : (
            <>
              <Toggle checked={draft.cprCertified} onChange={(v) => setDraft({ ...draft, cprCertified: v })}>
                I am CPR certified
              </Toggle>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Toggle checked={draft.hasClearances} onChange={(v) => setDraft({ ...draft, hasClearances: v })}>
                  I have current clearances & background checks on file
                </Toggle>
                <p style={{ margin: 0, fontSize: 11, fontStyle: "italic", color: C.muted, paddingLeft: 4 }}>
                  Includes Act 33 (Child Abuse History), Act 34 (PA Criminal History), and FBI background check.
                </p>
              </div>
            </>
          )}
        </div>
      </Section>

      <Section title="Notes">
        <Field label="Paste the original Facebook post or add any additional context">
          <textarea
            style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />
        </Field>
      </Section>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onSave}
          style={{
            padding: "11px 22px", borderRadius: 11, border: "none", cursor: "pointer",
            background: C.plum, color: "#fff", fontSize: 13, fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {saveLabel}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: "11px 18px", borderRadius: 11, cursor: "pointer",
              background: "transparent", color: C.muted, fontSize: 13, fontWeight: 500,
              border: `1px solid ${C.line}`, fontFamily: "'Inter', sans-serif",
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ────────────────────────── listing card ──────────────────────────

function ListingCard({ item, kind, onDelete, onSave, onApprove }) {
  const isParent = kind === "parent";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item);
  const followUp = needsFollowUp(item);

  if (editing) {
    return (
      <div style={{
        borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 10,
        background: C.goldPale, border: `2px solid ${C.goldLine}`,
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.gold }}>
          Editing — {item.label || "(untitled)"}
        </p>
        <ListingForm
          kind={kind}
          draft={draft}
          setDraft={setDraft}
          onSave={() => { onSave(draft); setEditing(false); }}
          onCancel={() => { setDraft(item); setEditing(false); }}
          saveLabel="Save changes"
        />
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 16, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 9,
      background: C.card, border: `1px solid ${C.line}`,
      boxShadow: "0 1px 4px rgba(28,26,46,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 16, fontWeight: 700, color: C.ink,
          }}>
            {item.label || "(untitled)"}
          </span>
          {item.contactEmail ? (
            <a href={`mailto:${item.contactEmail}`} style={{ fontSize: 12, color: C.plum, fontWeight: 600 }}>
              {item.contactEmail}
            </a>
          ) : (
            <Chip tone="red">no contact email</Chip>
          )}
          {followUp && <Chip tone="gold">needs follow-up</Chip>}
          {item.status === "pending" && <Chip tone="gold">pending review</Chip>}
        </div>
        <div style={{ display: "flex", gap: 12, flexShrink: 0, alignItems: "center" }}>
          {item.status === "pending" && (
            <button
              onClick={onApprove}
              style={{ border: "none", background: "none", color: C.green, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Approve
            </button>
          )}
          <button
            onClick={() => { setDraft(item); setEditing(true); }}
            style={{ border: "none", background: "none", color: C.plum, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            title="Remove"
            style={{ border: "none", background: "none", color: C.muted, fontSize: 12, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {item.zip ? <Chip>ZIP {item.zip}</Chip> : <Chip tone="red">ZIP unknown</Chip>}
        {item.flexible
          ? <Chip tone="gold">flexible schedule</Chip>
          : item.days.map((d) => <Chip key={d}>{d}</Chip>)}
        {!item.flexible && <Chip>{item.startTime}–{item.endTime}</Chip>}
        {isParent
          ? <Chip>{item.term === "long" ? "long-term" : "short-term"}</Chip>
          : <Chip>{item.termsAccepted === "both" ? "long & short-term" : item.termsAccepted === "long" ? "long-term only" : "short-term only"}</Chip>}
        {isParent && item.ages && <Chip>ages {item.ages}</Chip>}
        {!isParent && item.ageNoPreference && <Chip>any age</Chip>}
        {!isParent && !item.ageNoPreference && (item.minAge || item.maxAge) && (
          <Chip>ages {item.minAge || "0"}–{item.maxAge || "∞"}</Chip>
        )}
        {item.rate && <Chip tone="green">{isParent ? "pays" : "expects"} ${item.rate}/hr</Chip>}
        {item.startDate === "immediately"
          ? <Chip tone="gold">starts immediately</Chip>
          : item.startDate ? <Chip>starts {item.startDate}</Chip> : null}
        {isParent && item.careLocation === "provider_home" && <Chip>care at provider's home</Chip>}
        {isParent && item.careLocation === "family_home" && <Chip>care at family's home</Chip>}
        {!isParent && item.careLocation === "my_home" && <Chip>in own home only</Chip>}
        {!isParent && item.careLocation === "family_home" && <Chip>in family's home only</Chip>}
        {isParent && item.hoursGuaranteed && <Chip tone="green">✓ guaranteed hours</Chip>}
        {isParent && item.needsTransport && (
          <Chip tone="gold">transport needed ({item.transportCar === "provider" ? "provider's car" : "family's car"})</Chip>
        )}
        {isParent && item.needsTransport && item.requiresDrivingRecord && <Chip>driving record required</Chip>}
        {!isParent && item.hasTransport && <Chip tone="green">has car ✓</Chip>}
        {(item.specificDates || []).map((d) => <Chip key={d} tone="gold">📅 {d}</Chip>)}
        {isParent && item.requiresCPR && <Chip>requires CPR</Chip>}
        {isParent && item.requiresClearances && <Chip>requires clearances</Chip>}
        {!isParent && item.cprCertified && <Chip tone="green">CPR ✓</Chip>}
        {!isParent && item.hasClearances && <Chip tone="green">clearances ✓</Chip>}
      </div>
      {item.notes && (
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: C.muted }}>
          {item.notes}
        </p>
      )}
    </div>
  );
}

// ────────────────────────── match cards & groups ──────────────────────────

function MatchCard({ m, rank, nameLabel, nameEmail, confirmed, onConfirm }) {
  const scoreColor = m.score >= 70 ? C.green : m.score >= 40 ? C.gold : C.red;
  const insight = matchInsight(m);
  return (
    <div style={{
      borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10,
      background: C.card, border: `1px solid ${C.line}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor, fontVariantNumeric: "tabular-nums" }}>
            #{rank + 1}
          </span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: C.ink }}>
            {nameLabel}
          </span>
          {nameEmail && (
            <a href={`mailto:${nameEmail}`} style={{ fontSize: 11, color: C.plum, fontWeight: 600 }}>
              {nameEmail}
            </a>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
            background: C.plumPale, color: scoreColor,
          }}>
            {m.score}
          </span>
          <button
            onClick={onConfirm}
            disabled={confirmed}
            style={{
              padding: "5px 11px", borderRadius: 10, fontSize: 11, fontWeight: 700,
              cursor: confirmed ? "default" : "pointer", border: "none",
              background: confirmed ? C.greenPale : C.green,
              color: confirmed ? C.green : "#fff",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {confirmed ? "✓ Matched" : "Confirm match"}
          </button>
        </div>
      </div>
      <ScoreBar score={m.score} />

      {/* confidence banner */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 3,
        background: insight.tierBg, borderRadius: 10, padding: "8px 11px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
            color: "#fff", background: insight.tierColor, padding: "2px 8px", borderRadius: 20,
          }}>
            {insight.tier}
          </span>
        </div>
        <span style={{ fontSize: 12, color: C.ink, fontWeight: 500 }}>{insight.blurb}</span>
      </div>

      {/* reasons */}
      {(insight.pros.length > 0 || insight.cons.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {insight.pros.map((p, i) => (
            <div key={`pro-${i}`} style={{ display: "flex", gap: 7, fontSize: 12, color: C.ink, lineHeight: 1.4 }}>
              <span style={{ color: C.green, flexShrink: 0, fontWeight: 700 }}>✓</span>
              <span>{p}</span>
            </div>
          ))}
          {insight.cons.map((c, i) => (
            <div key={`con-${i}`} style={{ display: "flex", gap: 7, fontSize: 12, color: C.ink, lineHeight: 1.4 }}>
              <span style={{ color: C.gold, flexShrink: 0, fontWeight: 700 }}>!</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      )}

      {/* supporting metrics — always visible */}
      <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
          Match details
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 11, color: C.muted }}>
          {(m.parent.flexible || m.provider.flexible) ? (
            <span>📅 schedule flexible</span>
          ) : (
            <>
              <span>📅 days {Math.round(m.day * 100)}%</span>
              <span>🕐 hours {Math.round(m.hour * 100)}%</span>
            </>
          )}
          <span>👶 age fit {Math.round(m.age * 100)}%</span>
          <span>📋 term {m.term === 1 ? "✓" : "mismatch"}</span>
          <span>📍 {m.distance === null ? "distance unknown" : `${m.distance.toFixed(1)} mi`}</span>
          <span>💰 {m.rate.label}</span>
          {(m.parent.startDate || m.provider.startDate) && (
            <span>
              🗓 {m.parent.startDate ? `family: ${m.parent.startDate}` : ""}
              {m.parent.startDate && m.provider.startDate ? " · " : ""}
              {m.provider.startDate ? `provider: ${m.provider.startDate}` : ""}
            </span>
          )}
          {m.parent.hoursGuaranteed && <span style={{ color: C.green }}>✓ guaranteed hours</span>}
          {m.parent.needsTransport && m.provider.hasTransport && (
            <span>🚗 transport ok ({m.parent.transportCar === "provider" ? "provider's car" : "family's car"}){m.parent.requiresDrivingRecord ? " · driving record required" : ""}</span>
          )}
          {m.sharedDates && m.sharedDates.length > 0 && (
            <span>📅 shared dates: {m.sharedDates.join(", ")}</span>
          )}
          {m.missingCPR && <span style={{ color: C.red }}>⚠ CPR not certified</span>}
          {m.missingClearances && <span style={{ color: C.red }}>⚠ clearances missing</span>}
        </div>
      </div>
    </div>
  );
}

function MatchGroup({ id, label, zip, contactEmail, rows, expanded, onToggle, nameKey, accent, matchedPairs, onConfirm }) {
  const best = rows.length > 0 ? rows[0].score : null;
  const bestColor = best === null ? C.muted : best >= 70 ? C.green : best >= 40 ? C.gold : C.red;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px", borderRadius: 13, border: "none", cursor: "pointer",
          background: expanded ? accent : C.card,
          boxShadow: expanded ? "none" : "0 1px 4px rgba(28,26,46,0.05)",
          border: `1px solid ${expanded ? accent : C.line}`,
          textAlign: "left", width: "100%",
          fontFamily: "'Inter', sans-serif",
          transition: "all 0.15s",
        }}
      >
        <span style={{ fontSize: 11, color: expanded ? "rgba(255,255,255,0.8)" : C.muted, width: 14 }}>
          {expanded ? "▾" : "▸"}
        </span>
        <span style={{
          flex: 1, fontFamily: "'Playfair Display', serif",
          fontSize: 15, fontWeight: 700,
          color: expanded ? "#fff" : C.ink,
        }}>
          {label}
        </span>
        {zip && (
          <span style={{ fontSize: 11, color: expanded ? "rgba(255,255,255,0.75)" : C.muted }}>
            {zip}
          </span>
        )}
        {contactEmail && (
          <a
            href={`mailto:${contactEmail}`}
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 11, color: expanded ? "rgba(255,255,255,0.9)" : C.plum, fontWeight: 600 }}
          >
            {contactEmail}
          </a>
        )}
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
          background: expanded ? "rgba(255,255,255,0.2)" : C.plumPale,
          color: expanded ? "#fff" : rows.length === 0 ? C.muted : C.plumDark,
        }}>
          {rows.length === 0 ? "no matches" : `${rows.length} match${rows.length > 1 ? "es" : ""}`}
        </span>
        {best !== null && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
            background: expanded ? "rgba(255,255,255,0.2)" : "transparent",
            color: expanded ? "#fff" : bestColor,
            border: expanded ? "none" : `1px solid ${bestColor}`,
          }}>
            top {best}
          </span>
        )}
      </button>
      {expanded && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
          paddingLeft: 12, borderLeft: `3px solid ${accent}`,
          marginLeft: 6,
        }}>
          {rows.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, fontStyle: "italic", color: C.muted, padding: "4px 2px" }}>
              No one meets the current threshold — try lowering the minimum score, or check hard filters (distance, transport, credentials).
            </p>
          ) : (
            rows.map((m, rank) => (
              <MatchCard
                key={m[nameKey].id}
                m={m}
                rank={rank}
                nameLabel={m[nameKey].label}
                nameEmail={m[nameKey].contactEmail}
                confirmed={matchedPairs.has(`${m.parent.id}::${m.provider.id}`)}
                onConfirm={() => onConfirm(m)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────── main app ──────────────────────────

export default function ChildcareMatcher() {
  const [tab, setTab] = useState("families");
  const [parents, setParents] = useState([]);
  const [providers, setProviders] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(() => new Set());
  const [parentDraft, setParentDraft] = useState(emptyParent());
  const [providerDraft, setProviderDraft] = useState(emptyProvider());
  const [loaded, setLoaded] = useState(false);
  const [minScore, setMinScore] = useState(30);
  const [search, setSearch] = useState("");
  const [termFilter, setTermFilter] = useState("all");
  const [followUpOnly, setFollowUpOnly] = useState(false);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    if (session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      window.location.href = "/my-matches";
    }
  }, [session]);

  useEffect(() => {
    if (!session || session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) return;
    (async () => {
      const [{ data: familyRows, error: famErr }, { data: providerRows, error: provErr }, { data: matchRows, error: matchErr }] = await Promise.all([
        supabase.from("families").select("*").order("created_at"),
        supabase.from("providers").select("*").order("created_at"),
        supabase.from("matches").select("family_id, provider_id"),
      ]);
      if (famErr) console.error(famErr);
      if (provErr) console.error(provErr);
      if (matchErr) console.error(matchErr);
      const p = (familyRows || []).map(rowToFamily);
      const v = (providerRows || []).map(rowToProvider);
      const pIds = new Set(p.map((x) => x.id));
      const vIds = new Set(v.map((x) => x.id));
      setParents([...p, ...SEED_PARENTS.filter((s) => !pIds.has(s.id))]);
      setProviders([...v, ...SEED_PROVIDERS.filter((s) => !vIds.has(s.id))]);
      setMatchedPairs(new Set((matchRows || []).map((m) => `${m.family_id}::${m.provider_id}`)));
      if (!localStorage.getItem("childcare-disclaimer")) {
        setShowDisclaimer(true);
      }
      setLoaded(true);
    })();
  }, [session]);

  const confirmMatch = async (m) => {
    const { error } = await supabase.from("matches").insert({ family_id: m.parent.id, provider_id: m.provider.id });
    if (error) { console.error(error); return; }
    setMatchedPairs((prev) => new Set(prev).add(`${m.parent.id}::${m.provider.id}`));
    fetch("/api/notify-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        family: { label: m.parent.label, contactEmail: m.parent.contactEmail },
        provider: { label: m.provider.label, contactEmail: m.provider.contactEmail },
      }),
    }).catch((e) => console.error(e));
  };

  const acceptDisclaimer = () => {
    setShowDisclaimer(false);
    try { localStorage.setItem("childcare-disclaimer", "accepted"); } catch (e) {}
  };

  const matchesFilters = (item) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${item.label} ${item.zip} ${item.notes || ""} ${item.ages || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (termFilter !== "all") {
      const t = item.term || item.termsAccepted;
      if (t !== termFilter && t !== "both") return false;
    }
    if (followUpOnly && !needsFollowUp(item)) return false;
    if (pendingOnly && item.status !== "pending") return false;
    return true;
  };

  const filteredParents = parents.filter(matchesFilters);
  const filteredProviders = providers.filter(matchesFilters);

  const approvedParents = useMemo(() => parents.filter((p) => p.status === "approved"), [parents]);
  const approvedProviders = useMemo(() => providers.filter((p) => p.status === "approved"), [providers]);

  const matchCount = useMemo(() => {
    let count = 0;
    approvedParents.forEach((p) => {
      approvedProviders.forEach((prov) => {
        const m = scoreMatch(p, prov);
        if (!m.excluded && m.score >= minScore) count++;
      });
    });
    return count;
  }, [approvedParents, approvedProviders, minScore]);

  const toggleGroup = (id) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const followUpCount = [...parents, ...providers].filter(needsFollowUp).length;
  const pendingCount = [...parents, ...providers].filter((x) => x.status === "pending").length;

  const tabs = [
    { id: "families", label: `Families (${parents.length})` },
    { id: "providers", label: `Providers (${providers.length})` },
    { id: "matches-family", label: `By Family (${matchCount})` },
    { id: "matches-provider", label: `By Provider (${matchCount})` },
  ];

  const isListTab = tab === "families" || tab === "providers";
  const isMatchTab = tab === "matches-family" || tab === "matches-provider";

  const renderListTab = (kind) => {
    const isParent = kind === "parent";
    const list = isParent ? filteredParents : filteredProviders;
    const full = isParent ? parents : providers;
    const setter = isParent ? setParents : setProviders;
    const draft = isParent ? parentDraft : providerDraft;
    const setDraft = isParent ? setParentDraft : setProviderDraft;
    const resetDraft = () => (isParent ? setParentDraft(emptyParent()) : setProviderDraft(emptyProvider()));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              alignSelf: "flex-start",
              padding: "10px 18px", borderRadius: 11, cursor: "pointer",
              background: C.plum, color: "#fff", border: "none",
              fontSize: 13, fontWeight: 700, fontFamily: "'Inter', sans-serif",
            }}
          >
            + Add {isParent ? "family" : "provider"}
          </button>
        ) : (
          <div style={{
            borderRadius: 16, padding: 14,
            background: C.card, border: `2px solid ${C.plumLight}`,
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.plum }}>
              New {isParent ? "family" : "provider"}
            </p>
            <ListingForm
              kind={kind}
              draft={draft}
              setDraft={setDraft}
              onSave={async () => {
                if (!draft.label.trim()) return;
                const table = isParent ? "families" : "providers";
                const toRow = isParent ? familyToRow : providerToRow;
                const { error } = await supabase.from(table).insert(toRow(draft));
                if (error) { console.error(error); return; }
                setter([...full, draft]);
                resetDraft();
                setShowAddForm(false);
              }}
              onCancel={() => { resetDraft(); setShowAddForm(false); }}
            />
          </div>
        )}

        {list.length === 0 && (
          <p style={{ margin: 0, fontSize: 13, fontStyle: "italic", color: C.muted }}>
            {full.length === 0
              ? `No ${isParent ? "families" : "providers"} yet — add one above.`
              : "No results match your search or filters."}
          </p>
        )}
        {list.map((item) => (
          <ListingCard
            key={item.id}
            item={item}
            kind={kind}
            onDelete={async () => {
              const table = isParent ? "families" : "providers";
              const { error } = await supabase.from(table).delete().eq("id", item.id);
              if (error) { console.error(error); return; }
              setter(full.filter((x) => x.id !== item.id));
            }}
            onSave={async (updated) => {
              const table = isParent ? "families" : "providers";
              const toRow = isParent ? familyToRow : providerToRow;
              const { error } = await supabase.from(table).update(toRow(updated)).eq("id", updated.id);
              if (error) { console.error(error); return; }
              setter(full.map((x) => (x.id === updated.id ? updated : x)));
            }}
            onApprove={async () => {
              const table = isParent ? "families" : "providers";
              const { error } = await supabase.from(table).update({ status: "approved" }).eq("id", item.id);
              if (error) { console.error(error); return; }
              setter(full.map((x) => (x.id === item.id ? { ...x, status: "approved" } : x)));
            }}
          />
        ))}
      </div>
    );
  };

  const renderMatchTab = (byFamily) => {
    const groups = byFamily ? approvedParents : approvedProviders;
    const others = byFamily ? approvedProviders : approvedParents;
    const visibleGroups = groups.filter((g) =>
      !search.trim() || `${g.label} ${g.zip}`.toLowerCase().includes(search.trim().toLowerCase())
    );
    const accent = byFamily ? C.plum : C.gold;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>Minimum score</span>
          <input
            type="range" min={0} max={100} value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            style={{ width: 160, accentColor: C.plum }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.plumDark }}>{minScore}</span>
          <button
            onClick={() => setExpandedGroups(new Set(visibleGroups.map((g) => g.id)))}
            style={{ marginLeft: "auto", border: "none", background: "none", color: C.plum, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
          >
            Expand all
          </button>
          <button
            onClick={() => setExpandedGroups(new Set())}
            style={{ border: "none", background: "none", color: C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
          >
            Collapse all
          </button>
        </div>

        {approvedParents.length === 0 || approvedProviders.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, fontStyle: "italic", color: C.muted }}>
            Approve at least one family and one provider to see matches.
          </p>
        ) : (
          visibleGroups.map((g) => {
            const rows = others
              .map((o) => {
                const parent = byFamily ? g : o;
                const provider = byFamily ? o : g;
                return { parent, provider, ...scoreMatch(parent, provider) };
              })
              .filter((m) => !m.excluded && m.score >= minScore)
              .sort((a, b) => b.score - a.score);
            return (
              <MatchGroup
                key={g.id}
                id={g.id}
                label={g.label}
                zip={g.zip}
                contactEmail={g.contactEmail}
                rows={rows}
                expanded={expandedGroups.has(g.id)}
                onToggle={() => toggleGroup(g.id)}
                nameKey={byFamily ? "provider" : "parent"}
                accent={accent}
                matchedPairs={matchedPairs}
                onConfirm={confirmMatch}
              />
            );
          })
        )}
      </div>
    );
  };

  if (session === undefined) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: C.bg, color: C.muted, fontFamily: "'Inter', sans-serif",
      }}>
        Loading…
      </div>
    );
  }

  if (!session) {
    return <LoginForm />;
  }

  if (session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: C.bg, color: C.muted, fontFamily: "'Inter', sans-serif",
      }}>
        Redirecting…
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <style dangerouslySetInnerHTML={{ __html: FONT }} />
      {showDisclaimer && <HoldHarmlessModal onAccept={acceptDisclaimer} />}

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 60px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Brand header */}
        <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img src={LOGO_FIGURES} alt="care pAIr" style={{ height: 74, display: "block" }} />
            <div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 30, fontWeight: 700, color: C.plum, lineHeight: 1,
            }}>
              care p<span style={{ color: C.gold }}>AI</span>r
            </div>
            <div style={{
              fontSize: 11, fontWeight: 600, color: C.muted,
              letterSpacing: "0.04em", marginTop: 4,
            }}>
              Trustworthy caregivers. Loving families. Paired by <span style={{ color: C.gold, fontWeight: 700 }}>AI</span>.
            </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Chip>{parents.length} families</Chip>
            <Chip>{providers.length} providers</Chip>
            <Chip tone="green">{matchCount} matches</Chip>
            {followUpCount > 0 && <Chip tone="gold">{followUpCount} need follow-up</Chip>}
            {pendingCount > 0 && <Chip tone="gold">{pendingCount} pending</Chip>}
            <button
              onClick={() => supabase.auth.signOut()}
              style={{
                padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                background: "transparent", color: C.muted, border: `1px solid ${C.line}`,
                fontSize: 11, fontWeight: 700, fontFamily: "'Inter', sans-serif",
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Tabs */}
        <nav style={{
          display: "flex", gap: 4, padding: 4, borderRadius: 13,
          background: C.plumPale, flexWrap: "wrap",
        }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: "1 1 auto", padding: "9px 12px", borderRadius: 10,
                fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
                background: tab === t.id ? C.card : "transparent",
                color: tab === t.id ? C.plumDark : C.muted,
                boxShadow: tab === t.id ? "0 1px 3px rgba(28,26,46,0.08)" : "none",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Search + filters */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            style={{ ...inputStyle, flex: "1 1 200px", background: C.card }}
            placeholder={isMatchTab ? "Search by name or ZIP…" : "Search name, ZIP, ages, notes…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isListTab && (
            <>
              <select
                style={{ ...inputStyle, background: C.card }}
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
              >
                <option value="all">All terms</option>
                <option value="long">Long-term</option>
                <option value="short">Short-term</option>
              </select>
              <button
                onClick={() => setFollowUpOnly(!followUpOnly)}
                style={{
                  padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: followUpOnly ? C.gold : C.card,
                  color: followUpOnly ? "#fff" : C.muted,
                  border: `1px solid ${followUpOnly ? C.gold : C.line}`,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Needs follow-up
              </button>
              <button
                onClick={() => setPendingOnly(!pendingOnly)}
                style={{
                  padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: pendingOnly ? C.plum : C.card,
                  color: pendingOnly ? "#fff" : C.muted,
                  border: `1px solid ${pendingOnly ? C.plum : C.line}`,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Pending review
              </button>
            </>
          )}
        </div>

        {/* Content */}
        {tab === "families" && renderListTab("parent")}
        {tab === "providers" && renderListTab("provider")}
        {tab === "matches-family" && renderMatchTab(true)}
        {tab === "matches-provider" && renderMatchTab(false)}

        <footer style={{ fontSize: 11, color: C.muted, paddingTop: 8 }}>
          Data saves automatically to this artifact. Matches are suggestions only — verify all credentials directly.
        </footer>
      </div>
    </div>
  );
}
