import { C, FONT, LOGO_FIGURES } from "@/lib/theme";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: FONT }} />
      <div style={{
        maxWidth: 640, margin: "0 auto", padding: "56px 20px 40px",
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20,
        minHeight: "100vh", justifyContent: "center",
      }}>
        <img src={LOGO_FIGURES} alt="care pAIr" style={{ height: 88, display: "block" }} />
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 700, color: C.plum, lineHeight: 1 }}>
            care p<span style={{ color: C.gold }}>AI</span>r
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, letterSpacing: "0.04em", marginTop: 8 }}>
            Trustworthy caregivers. Loving families. Paired by <span style={{ color: C.gold, fontWeight: 700 }}>AI</span>.
          </div>
        </div>
        <p style={{ maxWidth: 460, fontSize: 15, color: C.ink, lineHeight: 1.7, margin: 0 }}>
          Tell us about your family or your caregiving experience, and we&rsquo;ll help match you with
          the right fit nearby. Every listing is reviewed by a real person before any match is made.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 8 }}>
          <a
            href="/join?as=family"
            style={{
              padding: "14px 26px", borderRadius: 13, textDecoration: "none",
              background: C.plum, color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Inter', sans-serif",
            }}
          >
            I&rsquo;m a family looking for care
          </a>
          <a
            href="/join?as=provider"
            style={{
              padding: "14px 26px", borderRadius: 13, textDecoration: "none",
              background: C.gold, color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Inter', sans-serif",
            }}
          >
            I&rsquo;m a provider offering care
          </a>
        </div>
        <a
          href="/admin"
          style={{ marginTop: 40, fontSize: 11, color: C.muted, textDecoration: "none", fontWeight: 600 }}
        >
          Admin sign in
        </a>
      </div>
    </div>
  );
}
