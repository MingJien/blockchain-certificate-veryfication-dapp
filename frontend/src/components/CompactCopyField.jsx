import React, { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

function truncateMiddle(value, maxChars = 42, head = 16, tail = 14) {
  const text = String(value || "");
  if (!text || text.length <= maxChars) return text;

  const safeHead = Math.max(8, head);
  const safeTail = Math.max(8, tail);

  if (safeHead + safeTail + 3 >= maxChars) {
    const shared = Math.max(8, Math.floor((maxChars - 3) / 2));
    return `${text.slice(0, shared)}...${text.slice(-shared)}`;
  }

  return `${text.slice(0, safeHead)}...${text.slice(-safeTail)}`;
}

export default function CompactCopyField({
  label,
  value,
  copyValue,
  emptyText = "—",
  className = ""
}) {
  const [copied, setCopied] = useState(false);
  const fullValue = String(value || "").trim();
  const displayValue = useMemo(() => truncateMiddle(fullValue), [fullValue]);

  async function handleCopy() {
    if (!fullValue) return;
    try {
      await navigator.clipboard.writeText(copyValue || fullValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={`compact-copy ${className}`.trim()}>
      <span className="compact-copy-label">{label}</span>
      <div className="compact-copy-content" title={fullValue || emptyText}>
        <span className="compact-copy-text">{fullValue ? displayValue : emptyText}</span>
        {fullValue ? (
          <button type="button" className="compact-copy-btn" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Đã chép" : "Sao chép"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
