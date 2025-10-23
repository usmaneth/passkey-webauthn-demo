import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Passkey Login Demo",
  description: "A beginner-friendly demo of WebAuthn passkeys authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}

