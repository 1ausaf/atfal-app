"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { LetterToHuzoorTemplate, type LetterValues } from "./letter-template";

export function LetterToHuzoorPrintView({
  values,
  submissionMonth,
}: {
  values: LetterValues;
  submissionMonth: string;
}) {
  const letterRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function onDownloadPdf() {
    if (!letterRef.current) return;
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const canvas = await html2canvas(letterRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

      // Single-page letter; if the layout ever becomes taller, this will scale down to fit.
      const y = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const finalHeight = imgHeight > pageHeight ? pageHeight : imgHeight;
      pdf.addImage(imgData, "PNG", 0, y, pageWidth, finalHeight);
      pdf.save(`letter-to-huzoor-${submissionMonth}.pdf`);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card-kid p-0">
        <div ref={letterRef} className="w-full">
          <LetterToHuzoorTemplate mode="view" values={values} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => void onDownloadPdf()}
        disabled={isDownloading}
        className="btn-kid-primary px-6 py-3 rounded-gta text-sm font-semibold self-start"
      >
        {isDownloading ? "Generating..." : "Download PDF"}
      </button>

      {downloadError && <p className="text-red-600 text-sm font-semibold">{downloadError}</p>}
    </div>
  );
}

