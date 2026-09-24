import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Sliders, Square, RectangleHorizontal, RectangleVertical, Loader2, Calculator } from 'lucide-react';
import type { ImageModel, ImageQuality, ImageStyle, ImageSize, GenerationRequestParams } from '../types';
import { getPricePerImage } from '../utils/pricing';

interface PromptInputProps {
  onGenerate: (params: GenerationRequestParams) => Promise<void>;
  isGenerating: boolean;
  activeModel: ImageModel;
  onModelChange: (model: ImageModel) => void;
  externalPrompt?: string;
  onOpenCalculator: () => void;
}

const PROMPT_SUGGESTIONS = [
  'رائد فضاء عربي في محطة فضاء مستقبلية مطلة على كوكب الأرض، إضاءة سينمائية، تفاصيل دقيقة 8k',
  'واحة خضراء خلابة وسط كثبان رملية ذهبية عند الغروب، واقعية فائقة، نمط صور ناشيونال جيوغرافيك',
  'Cyberpunk futuristic city in rain, glowing neon signs, photorealistic 8k octane render',
  'قصر إسلامي عائم بين السحب، فن خيالي سريالي، ألوان زاهية وضوء سحري دافئ',
  'Cute 3D isometric room of a programmer with plants and glowing monitors, Pixar animation style',
];

export const PromptInput: React.FC<PromptInputProps> = ({
  onGenerate,
  isGenerating,
  activeModel,
  onModelChange,
  externalPrompt,
  onOpenCalculator,
}) => {
  const [prompt, setPrompt] = useState('');
  const [quality, setQuality] = useState<ImageQuality>('standard');
  const [style, setStyle] = useState<ImageStyle>('vivid');
  const [size, setSize] = useState<ImageSize>('1024x1024');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const priceInfo = getPricePerImage(activeModel, size, quality);

  useEffect(() => {
    if (externalPrompt) {
      setPrompt(externalPrompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [externalPrompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    onGenerate({
      prompt: prompt.trim(),
      model: activeModel,
      quality,
      style,
      size,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="prompt-dock-container">
      {/* Suggestions Bar */}
      <div className="suggestions-scroll">
        <div className="suggestion-label">
          <Sparkles size={14} />
          <span>أفكار سريعة:</span>
        </div>
        {PROMPT_SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            className="suggestion-chip"
            onClick={() => setPrompt(s)}
            disabled={isGenerating}
          >
            {s.substring(0, 36)}...
          </button>
        ))}
      </div>

      <div className="prompt-box">
        {/* Controls Header Inside Prompt Box */}
        <div className="prompt-controls-bar">
          <div className="controls-group">
            {/* Model Selector */}
            <div className="model-select-wrapper">
              <select
                className="model-select-dropdown"
                value={activeModel}
                onChange={(e) => {
                  const m = e.target.value;
                  onModelChange(m);
                  if (m === 'dall-e-2' && size !== '1024x1024' && size !== '512x512' && size !== '256x256') {
                    setSize('1024x1024');
                  }
                }}
              >
                <option value="gpt-image-1-mini">GPT Image 1 Mini ($0.005 - الأوفر)</option>
                <option value="gpt-image-1.5">GPT Image 1.5 ($0.040 - الأحدث)</option>
                <option value="gpt-image-1">GPT Image 1 ($0.042 - متوازن)</option>
                <option value="dall-e-3">DALL·E 3 ($0.040 - الكلاسيكي)</option>
                <option value="dall-e-2">DALL·E 2 ($0.020 - سريع)</option>
              </select>
            </div>

            {/* Aspect Ratio / Size */}
            <div className="size-selector-group">
              <button
                type="button"
                className={`size-btn ${size === '1024x1024' ? 'active' : ''}`}
                onClick={() => setSize('1024x1024')}
                title="مربع (1:1)"
              >
                <Square size={15} />
                <span>1:1</span>
              </button>
              {activeModel !== 'dall-e-2' && (
                <>
                  <button
                    type="button"
                    className={`size-btn ${size === '1792x1024' ? 'active' : ''}`}
                    onClick={() => setSize('1792x1024')}
                    title="عرضي (16:9)"
                  >
                    <RectangleHorizontal size={15} />
                    <span>16:9</span>
                  </button>
                  <button
                    type="button"
                    className={`size-btn ${size === '1024x1792' ? 'active' : ''}`}
                    onClick={() => setSize('1024x1792')}
                    title="طولي (9:16)"
                  >
                    <RectangleVertical size={15} />
                    <span>9:16</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="controls-right-actions">
            <button
              type="button"
              className="price-pill-btn"
              onClick={onOpenCalculator}
              title="انقر لفتح حاسبة التكاليف والأسعار"
            >
              <Calculator size={14} className="text-accent" />
              <span>${priceInfo.cost.toFixed(3)} / صورة</span>
              <span className="price-sub-pill">({priceInfo.imagesPerDollar} صورة / $1)</span>
            </button>

            <button
              type="button"
              className={`btn-icon-subtle ${showAdvanced ? 'active-accent' : ''}`}
              onClick={() => setShowAdvanced(!showAdvanced)}
              title="خيارات الجودة والأسلوب"
            >
              <Sliders size={16} />
              <span>خيارات متقدمة</span>
            </button>
          </div>
        </div>

        {/* Advanced Row */}
        {showAdvanced && activeModel !== 'dall-e-2' && (
          <div className="advanced-options-panel animate-fade-in">
            <div className="option-field">
              <label>الجودة (Quality):</label>
              <div className="pill-group">
                <button
                  type="button"
                  className={`pill-btn ${quality === 'standard' ? 'active' : ''}`}
                  onClick={() => setQuality('standard')}
                >
                  Standard
                </button>
                <button
                  type="button"
                  className={`pill-btn ${quality === 'hd' ? 'active' : ''}`}
                  onClick={() => setQuality('hd')}
                >
                  HD (فائقة)
                </button>
              </div>
            </div>

            <div className="option-field">
              <label>النمط (Style):</label>
              <div className="pill-group">
                <button
                  type="button"
                  className={`pill-btn ${style === 'vivid' ? 'active' : ''}`}
                  onClick={() => setStyle('vivid')}
                >
                  Vivid (حيوي ودرامي)
                </button>
                <button
                  type="button"
                  className={`pill-btn ${style === 'natural' ? 'active' : ''}`}
                  onClick={() => setStyle('natural')}
                >
                  Natural (طبيعي وواقعي)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Text Input Row */}
        <div className="prompt-input-row">
          <textarea
            ref={textareaRef}
            rows={2}
            className="prompt-textarea"
            placeholder="صف الصورة التي تتخيلها بدقة... (مثال: قلعة مستقبلية فوق جبال الألب عند الفجر بأسلوب سينمائي)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
          />
          <button
            type="button"
            className="btn-generate"
            onClick={() => handleSubmit()}
            disabled={!prompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>جاري التوليد...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>توليد الصورة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
