import { GoogleAnalytics } from "@/src/components/google-analytics";
import "./globals.css";

export const metadata = {
  title: "Versions Cleanup Tool",
  description: "Versions Cleanup Tool for SitecoreAI - list and trim page versions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
