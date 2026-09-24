import React, { useState } from 'react';
import { X, Calculator, DollarSign, Check, HelpCircle, Sparkles } from 'lucide-react';
import { PRICING_TIERS } from '../utils/pricing';

interface PricingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingCalculatorModal: React.FC<PricingCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [budget, setBudget] = useState<number>(5);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Calculator className="modal-title-icon text-accent" size={22} />
            <h2>حاسبة أسعار وتكاليف موديلات OpenAI و GPT Image</h2>
          </div>
          <button className="btn-icon-subtle" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Quick Summary Table matching user request */}
          <div className="official-pricing-table-wrap">
            <h3 className="section-title">
              <Sparkles size={16} className="text-accent" />
              <span>جدول التسعيرة الرسمية لموديلات GPT Image و DALL-E</span>
            </h3>
            <table className="official-pricing-table">
              <thead>
                <tr>
                  <th>الموديل والجودة</th>
                  <th>سعر الصورة الواحدة</th>
                  <th>عدد الصور بكل 1 دولار</th>
                  <th>عدد الصور بكل 5 دولار</th>
                </tr>
              </thead>
              <tbody>
                {PRICING_TIERS.map((tier, idx) => (
                  <tr key={idx} className={tier.model === 'gpt-image-1-mini' ? 'highlight-row' : ''}>
                    <td>
                      <div className="table-model-cell">
                        <strong>{tier.name}</strong>
                        {tier.badge && <span className="mini-badge">{tier.badge}</span>}
                      </div>
                    </td>
                    <td className="font-mono text-cyan">${tier.costPerImage.toFixed(3)}</td>
                    <td className="font-mono text-success font-bold">{tier.imagesPerDollar} صورة</td>
                    <td className="font-mono text-accent font-bold">
                      {tier.imagesPerFiveDollars.toLocaleString()} صورة
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interactive Custom Budget Slider/Input */}
          <div className="budget-box">
            <div className="budget-header">
              <label>حساب عدد الصور لميزانية مخصصة (بالدولار):</label>
              <div className="budget-input-wrap">
                <DollarSign size={18} className="budget-icon" />
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={budget}
                  onChange={(e) => setBudget(Math.max(0.1, parseFloat(e.target.value) || 0))}
                  className="budget-input"
                />
              </div>
            </div>

            <div className="budget-quick-chips">
              {[1, 5, 10, 20, 50, 100].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className={`chip-btn ${budget === amount ? 'active' : ''}`}
                  onClick={() => setBudget(amount)}
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Custom budget results grid */}
            <div className="pricing-cards-grid">
              {PRICING_TIERS.map((tier, idx) => {
                const totalImages = Math.floor(budget / tier.costPerImage);
                const isMini = tier.model === 'gpt-image-1-mini';

                return (
                  <div key={idx} className={`pricing-card ${isMini ? 'featured' : ''}`}>
                    {isMini && <div className="featured-ribbon">الأعلى توفيراً</div>}

                    <div className="pricing-card-header">
                      <h4>{tier.name}</h4>
                      <span className="unit-cost">${tier.costPerImage.toFixed(3)} / صورة</span>
                    </div>

                    <div className="pricing-yield">
                      <span className="yield-number">{totalImages.toLocaleString()}</span>
                      <span className="yield-label">صورة بميزانية ${budget}</span>
                    </div>

                    <div className="yield-per-dollar">
                      <Check size={14} className="text-success" />
                      <span>
                        كل <strong>1$</strong> = <strong>{tier.imagesPerDollar}</strong> صورة | كل{' '}
                        <strong>5$</strong> = <strong>{tier.imagesPerFiveDollars}</strong> صورة
                      </span>
                    </div>

                    <p className="tier-description">{tier.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explanation Section */}
          <div className="pricing-faq-box">
            <div className="faq-title">
              <HelpCircle size={16} className="text-accent" />
              <strong>ما هي موديلات GPT Image وكيف تختلف عن DALL-E؟</strong>
            </div>
            <p>
              • <strong>عائلة GPT Image الرسمية:</strong> أطلقتها OpenAI كجيل متطور لتوليد ومعالجة الصور المدمجة متعددة الوسائط (Multimodal Image Generation).<br />
              • <strong>GPT Image 1 Mini:</strong> هو ثورة حقيقية في خفض التكاليف ($0.005 فقط لكل صورة) مما يتيح لك توليد <strong>1,000 صورة كاملة بـ 5 دولارات فقط!</strong><br />
              • <strong>GPT Image 1.5:</strong> يوفر كفاءة مذهلة في معالجة التفاصيل الدقيقة والنصوص داخل الصور.<br />
              • <strong>التوافق:</strong> يدعم هذا الموقع استخدام أي من هذه الموديلات مباشرة بمجرد اختيارها أو كتابة المعرف الخاص بها.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            إغلاق الحاسبة
          </button>
        </div>
      </div>
    </div>
  );
};
