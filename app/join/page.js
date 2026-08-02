"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { C, FONT, LOGO_FIGURES } from "@/lib/theme";
import {
  ListingForm,
  HoldHarmlessModal,
  emptyParent,
  emptyProvider,
  familyToRow,
  providerToRow,
} from "@/components/ChildcareMatcher";

function Shell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: FONT }} />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 20px 60px", display: "flex", flexDirection: "column", gap: 22 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
          <img src={LOGO_FIGURES} alt="care pAIr" style={{ height: 56, display: "block" }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: C.plum }}>
            care p<span style={{ color: C.gold }}>AI</span>r
          </div>
        </a>
        {children}
      </div>
    </div>
  );
}

function KindPicker({ onChoose }) {
  return (
    <Shell>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: C.ink, margin: 0 }}>
        Let&rsquo;s get you set up
      </h1>
      <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
        Tell us a bit about your schedule and needs. Carli reviews every submission before it goes live.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={() => onChoose("parent")}
          style={{
            padding: "18px 20px", borderRadius: 14, cursor: "pointer", textAlign: "left",
            background: C.card, border: `2px solid ${C.plumLight}`, fontFamily: "'Inter', sans-serif",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: C.plum }}>I&rsquo;m a family looking for care</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Tell us your schedule, ages, and preferences.</div>
        </button>
        <button
          onClick={() => onChoose("provider")}
          style={{
            padding: "18px 20px", borderRadius: 14, cursor: "pointer", textAlign: "left",
            background: C.card, border: `2px solid ${C.goldLine}`, fontFamily: "'Inter', sans-serif",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: C.gold }}>I&rsquo;m a provider offering care</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Tell us your availability, rates, and experience.</div>
        </button>
      </div>
    </Shell>
  );
}

function SuccessScreen() {
  return (
    <Shell>
      <div style={{
        borderRadius: 16, padding: 24, background: C.greenPale, border: `2px solid ${C.green}`,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.green, margin: 0 }}>
          Thanks — you&rsquo;re on the list!
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: C.ink, lineHeight: 1.6 }}>
          Carli will review your info shortly. Once approved, you&rsquo;ll start showing up in matches.
        </p>
      </div>
    </Shell>
  );
}

function JoinContent() {
  const searchParams = useSearchParams();
  const preset = searchParams.get("as") === "provider" ? "provider" : searchParams.get("as") === "family" ? "parent" : null;

  const [kind, setKind] = useState(preset);
  const [draft, setDraft] = useState(() => (preset === "parent" ? emptyParent() : preset === "provider" ? emptyProvider() : null));
  const [accepted, setAccepted] = useState(false);
  const [phase, setPhase] = useState("form"); // "form" | "submitting" | "done" | "error"

  const chooseKind = (k) => {
    setKind(k);
    setDraft(k === "parent" ? emptyParent() : emptyProvider());
  };

  const startOver = () => {
    setKind(null);
    setDraft(null);
    setAccepted(false);
    setPhase("form");
  };

  if (!kind || !draft) {
    return <KindPicker onChoose={chooseKind} />;
  }

  if (!accepted) {
    return <HoldHarmlessModal onAccept={() => setAccepted(true)} />;
  }

  if (phase === "done") {
    return <SuccessScreen />;
  }

  const handleSubmit = async () => {
    if (!draft.label.trim()) return;
    setPhase("submitting");
    const table = kind === "parent" ? "families" : "providers";
    const toRow = kind === "parent" ? familyToRow : providerToRow;
    const { error } = await supabase.from(table).insert(toRow({ ...draft, status: "pending" }));
    if (error) {
      console.error(error);
      setPhase("error");
      return;
    }
    setPhase("done");
  };

  return (
    <Shell>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>
        {kind === "parent" ? "Tell us about your family" : "Tell us about you"}
      </h1>
      {phase === "error" && (
        <p style={{ margin: 0, fontSize: 13, color: C.red }}>
          Something went wrong submitting your info. Please try again.
        </p>
      )}
      <ListingForm
        kind={kind}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSubmit}
        onCancel={startOver}
        saveLabel={phase === "submitting" ? "Submitting…" : "Submit"}
      />
    </Shell>
  );
}

export default function Join() {
  return (
    <Suspense fallback={null}>
      <JoinContent />
    </Suspense>
  );
}
