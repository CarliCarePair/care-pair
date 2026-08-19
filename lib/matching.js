import ZIP_COORDS from "us-zips";
import { C } from "@/lib/theme";

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
  return haversineMiles([c1.latitude, c1.longitude], [c2.latitude, c2.longitude]);
}

export const MAX_DISTANCE_MILES = 5;

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

export function scoreMatch(p, prov) {
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
export function matchInsight(m) {
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
