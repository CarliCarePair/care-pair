"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { C, FONT, LOGO_FIGURES } from "@/lib/theme";
import { ListingChips, rowToFamily, rowToProvider } from "@/components/ChildcareMatcher";

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

function CounterpartCard({ counterpart, isProvider }) {
  const item = isProvider ? rowToProvider(counterpart) : rowToFamily(counterpart);
  return (
    <div style={{
      borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 9,
      background: C.card, border: `1px solid ${C.line}`,
    }}>
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: C.ink }}>
        {item.label || "(untitled)"}
      </span>
      {item.contactEmail && (
        <a href={`mailto:${item.contactEmail}`} style={{ fontSize: 13, color: C.plum, fontWeight: 600 }}>
          {item.contactEmail}
        </a>
      )}
      <ListingChips item={item} kind={isProvider ? "provider" : "parent"} />
    </div>
  );
}

export default function MyMatches() {
  const [session, setSession] = useState(undefined);
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [matches, setMatches] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, families(*), providers(*)")
        .order("confirmed_at", { ascending: false });
      if (error) console.error(error);
      setMatches(data || []);
    })();
  }, [session]);

  const requestLink = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: "https://getcarepair.com/my-matches" },
    });
    if (error) console.error(error);
    setLinkSent(true);
  };

  if (session === undefined) {
    return <Shell><p style={{ color: C.muted, fontSize: 13 }}>Loading…</p></Shell>;
  }

  if (!session) {
    return (
      <Shell>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>
          See your matches
        </h1>
        {linkSent ? (
          <p style={{ margin: 0, fontSize: 14, color: C.ink, lineHeight: 1.6 }}>
            Check your email for a sign-in link.
          </p>
        ) : (
          <form onSubmit={requestLink} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
              Enter the email address you used when you submitted your info, and we'll send you a link to sign in.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 14 }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 18px", borderRadius: 11, cursor: "pointer", alignSelf: "flex-start",
                background: C.plum, color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
              }}
            >
              Email me a sign-in link
            </button>
          </form>
        )}
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>
        Your matches
      </h1>
      {matches === null ? (
        <p style={{ color: C.muted, fontSize: 13 }}>Loading…</p>
      ) : matches.length === 0 ? (
        <p style={{ color: C.muted, fontSize: 13, fontStyle: "italic" }}>
          No confirmed matches yet — check back after your submission has been reviewed.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {matches.map((m) => {
            const isProvider = session.user.email === m.providers?.contact_email;
            const counterpart = isProvider ? m.families : m.providers;
            return counterpart ? (
              <CounterpartCard key={m.id} counterpart={counterpart} isProvider={!isProvider} />
            ) : null;
          })}
        </div>
      )}
    </Shell>
  );
}
