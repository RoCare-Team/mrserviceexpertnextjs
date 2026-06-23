import "./admin.css";
import AdminShell from "./components/AdminShell";

export const metadata = {
  title: "Admin Console | Mr. Service Expert",
  robots: "noindex, nofollow",
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
