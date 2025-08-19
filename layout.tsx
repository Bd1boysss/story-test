import "./styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Story Mainnet Starter",
  description: "Register IP + attach license terms on Story mainnet from a simple UI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
