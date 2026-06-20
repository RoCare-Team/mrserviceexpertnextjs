"use client";

import { usePathname } from "next/navigation";
import Header from "./header/Header";
import Footer from "./footer/Footer";

export default function SiteChrome({ children }) {
  const pathname = usePathname() || "/";
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    // Admin routes render their own shell (sidebar + topbar), so the
    // public site header and footer are intentionally omitted here.
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
