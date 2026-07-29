import "./globals.css";

export const metadata = {
  title: "care pAIr — Trustworthy caregivers. Loving families. Paired by AI.",
  description:
    "AI-powered childcare matching for Pittsburgh families and caregivers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
