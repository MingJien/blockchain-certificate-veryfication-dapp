// Purpose: Render a QR code as an image (data URL) for a given text.

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QRCodeComponent({ text, dataUrl }) {
  const [src, setSrc] = useState(dataUrl || "");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (dataUrl) {
        setSrc(dataUrl);
        return;
      }
      if (!text) {
        setSrc("");
        return;
      }
      const url = await QRCode.toDataURL(text, { width: 256, margin: 2 });
      if (!cancelled) setSrc(url);
    }

    run().catch(() => setSrc(""));
    return () => {
      cancelled = true;
    };
  }, [text, dataUrl]);

  if (!src) return null;

  return (
    <div className="card qr-card">
      <div className="small" style={{ marginBottom: 8 }}>Mã QR</div>
      <img className="qr-image" src={src} alt="QR" style={{ width: 200, height: 200 }} />
    </div>
  );
}
