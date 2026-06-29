import "./globals.css";

export const metadata = {
  title: "Versioning Center",
  description: "Sitecore XM Cloud Versioning Center",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
