export async function POST(request) {
  const { kind, label } = await request.json();

  const apiKey = process.env.RESEND_API_KEY;
  const alertEmail = process.env.ALERT_EMAIL;
  if (!apiKey || !alertEmail) {
    return Response.json({ error: "Notifications not configured" }, { status: 500 });
  }

  const kindLabel = kind === "provider" ? "provider" : "family";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "care pAIr <onboarding@resend.dev>",
      to: alertEmail,
      subject: `New pending ${kindLabel} on care pAIr: ${label || "(untitled)"}`,
      text: `${label || "(untitled)"} just submitted the ${kindLabel} intake form.\n\nReview it at https://getcarepair.com/admin`,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Resend error:", detail);
    return Response.json({ error: "Failed to send" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
