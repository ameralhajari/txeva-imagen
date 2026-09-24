import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sliders,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Loader2,
  Calculator,
  ImagePlus,
  X,
  Layers,
  Sparkles,
  Maximize2
} from 'lucide-react';
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
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const priceInfo = getPricePerImage(activeModel, size, quality);

  useEffect(() => {
    if (externalPrompt) {
      setPrompt(externalPrompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [externalPrompt]);

  // Adjust size if selected size is invalid for new model
  const handleModelSelect = (m: ImageModel) => {
    onModelChange(m);
    if (m === 'dall-e-3' && !['1024x1024', '1792x1024', '1024x1792'].includes(size)) {
      setSize('1024x1024');
    } else if (m === 'dall-e-2' && !['1024x1024', '512x512', '256x256'].includes(size)) {
      setSize('1024x1024');
    }
  };

  const handleFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );
    if (validFiles.length === 0) return;

    // If user adds reference images and current model is dall-e-3, switch to gpt-image-1.5 which supports multi-image editing
    if (activeModel === 'dall-e-3') {
      onModelChange('gpt-image-1.5');
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setReferenceImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      handleFiles(files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    onGenerate({
      prompt: prompt.trim(),
      model: activeModel,
      quality: activeModel === 'dall-e-3' ? quality : undefined,
      style: activeModel === 'dall-e-3' ? style : undefined,
      size,
      images: referenceImages.length > 0 ? referenceImages : undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // List of all aspect ratios and resolutions
  const allSizes: { value: ImageSize; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: '1024x1024', label: '1:1', icon: <Square size={13} />, desc: 'مربع متوازن (1024x1024)' },
    { value: '1792x1024', label: '16:9', icon: <RectangleHorizontal size={13} />, desc: 'سينمائي عريض (1792x1024)' },
    { value: '1024x1792', label: '9:16', icon: <RectangleVertical size={13} />, desc: 'ستوري ورأسي (1024x1792)' },
    { value: '1536x1024', label: '3:2', icon: <RectangleHorizontal size={13} />, desc: 'أفقي كاميرا (1536x1024)' },
    { value: '1024x1536', label: '2:3', icon: <RectangleVertical size={13} />, desc: 'بورتريه فوتوغرافي (1024x1536)' },
    { value: '512x512', label: '512²', icon: <Layers size={13} />, desc: 'سريع واقتصادي (512x512)' },
    { value: '256x256', label: '256²', icon: <Maximize2 size={13} />, desc: 'أيقونات مصغرة (256x256)' },
  ];

  // Filter sizes based on active model capabilities
  const availableSizes = allSizes.filter((s) => {
    if (activeModel === 'dall-e-3') {
      return ['1024x1024', '1792x1024', '1024x1792'].includes(s.value);
    }
    if (activeModel === 'dall-e-2') {
      return ['1024x1024', '512x512', '256x256'].includes(s.value);
    }
    return true;
  });

  return (
    <div className="prompt-dock-container" onPaste={handlePaste} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
      <div className="prompt-box">
        {/* Controls Header Inside Prompt Box */}
        <div className="prompt-controls-bar">
          <div className="controls-group">
            {/* Model Selector */}
            <div className="model-select-wrapper">
              <select
                className="model-select-dropdown"
                value={activeModel}
                onChange={(e) => handleModelSelect(e.target.value)}
              >
                <option value="gpt-image-1-mini">GPT Image 1 Mini ($0.005 - الأوفر)</option>
                <option value="gpt-image-1.5">GPT Image 1.5 ($0.040 - الأحدث)</option>
                <option value="gpt-image-1">GPT Image 1 ($0.042 - متوازن)</option>
                <option value="dall-e-3">DALL·E 3 ($0.040 - الكلاسيكي)</option>
                <option value="dall-e-2">DALL·E 2 ($0.020 - سريع)</option>
              </select>
            </div>

            {/* Rich Aspect Ratio & Size Buttons */}
            <div className="size-selector-group">
              {availableSizes.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`size-btn ${size === item.value ? 'active' : ''}`}
                  onClick={() => setSize(item.value)}
                  title={item.desc}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
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

            {activeModel === 'dall-e-3' && (
              <button
                type="button"
                className={`btn-icon-subtle ${showAdvanced ? 'active-accent' : ''}`}
                onClick={() => setShowAdvanced(!showAdvanced)}
                title="خيارات الجودة والأسلوب (DALL·E 3)"
              >
                <Sliders size={16} />
                <span>خيارات متقدمة</span>
              </button>
            )}
          </div>
        </div>

        {/* Advanced Row (DALL-E 3 specific options) */}
        {showAdvanced && activeModel === 'dall-e-3' && (
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

        {/* Reference / Pasted Images Preview Tray */}
        {referenceImages.length > 0 && (
          <div className="reference-images-tray animate-fade-in">
            <div className="tray-label">
              <Sparkles size={13} className="text-accent" />
              <span>الصور المرجعية المرفقة ({referenceImages.length}):</span>
              <span className="tray-hint">(يمكنك لصق المزيد بـ Ctrl+V أو سحب وإفلات الصور)</span>
            </div>
            <div className="tray-items-row">
              {referenceImages.map((imgSrc, idx) => (
                <div key={idx} className="ref-image-card">
                  <img src={imgSrc} alt={`مرجع ${idx + 1}`} className="ref-image-thumb" />
                  <button
                    type="button"
                    className="btn-remove-ref"
                    onClick={() => removeImage(idx)}
                    title="حذف هذه الصورة"
                  >
                    <X size={12} />
                  </button>
                  <span className="ref-image-tag">#{idx + 1}</span>
                </div>
              ))}
              <button
                type="button"
                className="btn-add-more-refs"
                onClick={() => fileInputRef.current?.click()}
                title="إضافة صور أخرى"
              >
                <ImagePlus size={16} />
                <span>إضافة</span>
              </button>
            </div>
          </div>
        )}

        {/* Text Input Row with Paste & Upload Buttons */}
        <div className="prompt-input-row">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            accept="image/*"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />

          <textarea
            ref={textareaRef}
            rows={2}
            className="prompt-textarea"
            placeholder={
              referenceImages.length > 0
                ? "صف التعديلات أو الدمج المطلوب على الصور المرفقة أعلاه..."
                : "صف الصورة التي تتخيلها، أو الصق صوراً بالضغط على (Ctrl+V) للتعديل والدمج..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
          />

          <div className="prompt-actions-wrap">
            <button
              type="button"
              className="btn-attach-image"
              onClick={() => fileInputRef.current?.click()}
              title="إرفاق أو لصق صور مرجعية (Ctrl+V)"
            >
              <ImagePlus size={18} />
              <span className="attach-btn-label">إرفاق صور</span>
            </button>

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
                  <span>{referenceImages.length > 0 ? 'توليد ودمج الصور' : 'توليد الصورة'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
