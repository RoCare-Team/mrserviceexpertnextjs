// Partner area (/partner/*) is installable as a home-screen web app.
export const metadata = {
  manifest: "/partner.webmanifest",
  appleWebApp: { capable: true, title: "MSE Partner", statusBarStyle: "default" },
  icons: { icon: "/favicon.ico", apple: "/partner-icon-192.png" },
};

export default function PartnerLayout({ children }) {
  return children;
}
