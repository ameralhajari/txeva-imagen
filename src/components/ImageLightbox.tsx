import React, { useEffect } from 'react';
import { X, Download, Copy, ExternalLink, Sparkles } from 'lucide-react';
import type { Generation } from '../types';

interface ImageLightboxProps {
  generation: Generation | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ generation, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!generation) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(generation.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `txeva-imagen-${generation.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(generation.imageUrl, '_blank');
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generation.prompt);
  };

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close">
          <X size={22} />
        </button>

        <div className="lightbox-image-container">
          <img src={generation.imageUrl} alt={generation.prompt} className="lightbox-image" />
        </div>

        <div className="lightbox-details">
          <div className="lightbox-meta">
            <span className="badge badge-model">{generation.model}</span>
            <span className="badge">{generation.size}</span>
            {generation.quality && <span className="badge">{generation.quality}</span>}
            {generation.style && <span className="badge">{generation.style}</span>}
          </div>

          <div className="lightbox-prompt-box">
            <div className="lightbox-prompt-header">
              <span className="text-secondary">الوصف (Prompt):</span>
              <button className="btn-icon-subtle" onClick={handleCopyPrompt} title="نسخ الوصف">
                <Copy size={16} />
              </button>
            </div>
            <p className="lightbox-prompt-text">{generation.prompt}</p>

            {generation.revisedPrompt && (
              <div className="lightbox-revised">
                <div className="revised-title">
                  <Sparkles size={14} />
                  <span>الوصف المعدل بواسطة DALL-E (Revised):</span>
                </div>
                <p className="revised-text">{generation.revisedPrompt}</p>
              </div>
            )}
          </div>

          <div className="lightbox-actions">
            <button className="btn btn-primary" onClick={handleDownload}>
              <Download size={18} />
              <span>تحميل الصورة عالية الدقة</span>
            </button>
            <a
              href={generation.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <ExternalLink size={18} />
              <span>فتح الرابط المباشر</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
