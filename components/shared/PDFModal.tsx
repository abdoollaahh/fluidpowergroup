// components/shared/PDFModal.tsx
// REFACTOR PHASE 1 - EXTRACTED FROM checkout.tsx
// Shared modal component for viewing PDFs (desktop) or opening in new window (mobile)

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

interface PDFModalProps {
  isOpen: boolean;
  pdfUrl: string;
  onClose: () => void;
  title?: string;
}

export default function PDFModal({ 
  isOpen, 
  pdfUrl, 
  onClose,
  title = 'Custom Hose Assembly PDF'
}: PDFModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mobile - open in new window instead of modal
  useEffect(() => {
    if (isOpen && isMobile && pdfUrl) {
      try {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${title}</title>
                <style>
                  body { margin: 0; padding: 0; }
                  iframe { width: 100vw; height: 100vh; border: none; }
                </style>
              </head>
              <body>
                <iframe src="${pdfUrl}"></iframe>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
      } catch (error) {
        console.error('Error opening PDF:', error);
        alert('Unable to open PDF. Please try again.');
      }
      // Close modal immediately on mobile after opening window
      onClose();
    }
  }, [isOpen, isMobile, pdfUrl, title, onClose]);

  // Don't render modal on mobile (handled by new window)
  if (isMobile) return null;

  // Don't render if not open or no PDF
  if (!isOpen || !pdfUrl) return null;

  // Only render modal on desktop
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)"
      }}
      onClick={onClose}
    >
      <div
        className="relative w-11/12 h-5/6 bg-white rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 transition-all duration-200 flex items-center justify-center"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            background: "rgba(254, 226, 226, 0.8)",
            color: "#dc2626",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
            e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(254, 226, 226, 0.8)";
            e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.3)";
          }}
          aria-label="Close PDF viewer"
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <FiX style={{ width: "100%", height: "100%" }} />
          </div>
        </button>

        {/* PDF viewer */}
        <object
          data={pdfUrl}
          type="application/pdf"
          className="w-full h-full"
          style={{ border: "none" }}
        >
          {/* Fallback for browsers that can't display PDFs */}
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="mb-4 text-gray-700">
              Unable to display PDF in browser.
            </p>

            <a
              href={pdfUrl}
              download={title.toLowerCase().replace(/\s+/g, '-') + '.pdf'}
              className="px-6 py-3 rounded-lg font-semibold transition-all"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
                border: "1px solid rgba(255, 215, 0, 0.9)",
                color: "#000"
              }}
            >
              Download PDF
            </a>
          </div>
        </object>
      </div>
    </div>,
    document.body
  );
}