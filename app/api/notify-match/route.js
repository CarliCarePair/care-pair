async function sendEmail({ apiKey, to, subject, text }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: "care pAIr <onboarding@resend.dev>", to, subject, text }),
  });
  if (!res.ok) {
    console.error("Resend error:", await res.text());
    return false;
  }
  return true;
}

export async function POST(request) {
  const { family, provider } = await request.json();

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Notifications not configured" }, { status: 500 });
  }

  const link = "https://getcarepair.com/my-matches";
  const results = await Promise.all([
    family?.contactEmail
      ? sendEmail({
          apiKey,
          to: family.contactEmail,
          subject: `You've been matched on care pAIr: ${provider?.label || "a provider"}`,
          text: `You've been matched with ${provider?.label || "a provider"}.\n\nSign in at ${link} with this email address to see their contact info and details.`,
        })
      : Promise.resolve(false),
    provider?.contactEmail
      ? sendEmail({
          apiKey,
          to: provider.contactEmail,
          subject: `You've been matched on care pAIr: ${family?.label || "a family"}`,
          text: `You've been matched with ${family?.label || "a family"}.\n\nSign in at ${link} with this email address to see their contact info and details.`,
        })
      : Promise.resolve(false),
  ]);

  return Response.json({ ok: true, sent: results });
}
