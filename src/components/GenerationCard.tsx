import React, { useState } from 'react';
import { Download, Copy, Maximize2, Sparkles, RefreshCw, Check, Info } from 'lucide-react';
import type { Generation } from '../types';

interface GenerationCardProps {
  generation: Generation;
  onSelectForLightbox: (gen: Generation) => void;
  onReusePrompt: (prompt: string, model: Generation['model']) => void;
}

export const GenerationCard: React.FC<GenerationCardProps> = ({
  generation,
  onSelectForLightbox,
  onReusePrompt,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRevised, setShowRevised] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(generation.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(generation.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `txeva-${generation.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(generation.imageUrl, '_blank');
    }
  };

  const formattedDate = new Date(generation.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="gen-card animate-fade-in">
      <div className="gen-image-wrapper" onClick={() => onSelectForLightbox(generation)}>
        <img
          src={generation.imageUrl}
          alt={generation.prompt}
          loading="lazy"
          className="gen-image"
        />
        <div className="gen-image-overlay">
          <button
            className="overlay-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelectForLightbox(generation);
            }}
            title="تكبير"
          >
            <Maximize2 size={18} />
          </button>
          <button className="overlay-btn" onClick={handleDownload} title="تحميل">
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="gen-content">
        <div className="gen-header">
          <div className="gen-badges">
            <span className="badge badge-model">{generation.model.toUpperCase()}</span>
            <span className="badge">{generation.size}</span>
            {generation.quality && <span className="badge">{generation.quality}</span>}
            {generation.style && <span className="badge">{generation.style}</span>}
            {generation.referenceImages && generation.referenceImages.length > 0 && (
              <span className="badge badge-ref" title="تم إنشاؤها بالاعتماد على صور مرجعية">
                {generation.referenceImages.length} مرجع
              </span>
            )}
          </div>
          <span className="gen-time">{formattedDate}</span>
        </div>

        <p className="gen-prompt-text">{generation.prompt}</p>

        {generation.revisedPrompt && (
          <div className="revised-toggle-wrapper">
            <button
              className="btn-text-subtle"
              onClick={() => setShowRevised(!showRevised)}
            >
              <Info size={14} />
              <span>{showRevised ? 'إخفاء وصف DALL-E المحسّن' : 'عرض وصف DALL-E المحسّن'}</span>
            </button>
            {showRevised && (
              <div className="revised-box animate-fade-in">
                <Sparkles size={14} className="revised-icon" />
                <p>{generation.revisedPrompt}</p>
              </div>
            )}
          </div>
        )}

        <div className="gen-footer">
          <button className="btn-icon-subtle" onClick={handleCopy} title="نسخ الوصف">
            {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
            <span className="btn-label">{copied ? 'تم النسخ' : 'نسخ'}</span>
          </button>

          <button
            className="btn-icon-subtle"
            onClick={() => onReusePrompt(generation.prompt, generation.model)}
            title="إعادة استخدام الوصف في الإدخال"
          >
            <RefreshCw size={16} />
            <span className="btn-label">إعادة استخدام</span>
          </button>
        </div>
      </div>
    </div>
  );
};
