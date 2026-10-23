"use client";

import { Download } from "lucide-react";
import { btnPrimary } from "../ui";

export default function PrintButton() {
  return (
    <button className={btnPrimary} onClick={() => window.print()}>
      <Download className="h-4 w-4" /> Download / print (Save as PDF)
    </button>
  );
}
