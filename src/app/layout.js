import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Home Appliance Repair & Services | Mr. Service Expert",
  description: "Expert repair and maintenance services for ACs, water purifiers, and home appliances. Book reliable technicians across India with Mr. Service Expert.",
  keywords:"ac repair service,water purifier repair,home appliance repair,refrigerator repair service,washing machine repair,air conditioner maintenance,ro service near me,microwave oven repair,geyser installation service,appliance service center",
  alternates: {
    canonical: "https://www.mrserviceexpert.com/",
  },
  verification: {
    google: 'V60YSnBVGExJKR1IaZkBJf5hwHuAjMhcx6miESUJZNY', 
  },
  icons: {
    icon: '/favicon.ico', 
  },
  robots: 'index, follow',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

