import { useCallback, useEffect, useRef } from "react";
import { LineageGraph } from "./LineageGraph";
import type { LineageMode, LineageModeResult } from "./lineage-graph-utils";

interface LineageGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: LineageMode;
  result: LineageModeResult | string;
}

/**
 * Full-screen modal overlay that displays the lineage graph.
 * Closes on Escape key or clicking the backdrop.
 */
export function LineageGraphModal({ isOpen, onClose, mode, result }: LineageGraphModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div
      ref={backdropRef}
      className="lineage-modal__backdrop"
      onClick={handleBackdropClick}
    >
      <div className="lineage-modal__content">
        <div className="lineage-modal__header">
          <h2 className="lineage-modal__title">Lineage Graph</h2>
          <span className="lineage-modal__mode-badge">{mode.replace(/-/g, " ")}</span>
          <button className="lineage-modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="lineage-modal__body">
          <LineageGraph mode={mode} result={result} />
        </div>
      </div>
    </div>
  );
}
