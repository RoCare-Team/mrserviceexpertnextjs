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
  title: "Mr. Service Expert - Home Appliances Repair Services ",
  description: "Mr. Service Expert is your one-stop solution for home appliances repair services in Delhi. We have 1000+ trusted professionals near you in Delhi to take care of your home appliances.",
  keywords:"ac repair service,water purifier repair,home appliance repair,refrigerator repair service,washing machine repair,air conditioner maintenance,ro service near me,microwave oven repair,geyser installation service,appliance service center",
  alternates: {
    canonical: "https://www.mrserviceexpert.com/",
  },
  robots: 'index, follow',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header/>
        {children}
        <Footer/>
      </body>
    </html>
  );
}
