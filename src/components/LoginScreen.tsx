import React, { useState } from 'react';
import { Lock, User, KeyRound, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (username: string, token: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('يرجى كتابة اسم المستخدم وكلمة المرور');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        onLoginSuccess(data.username || username.trim(), data.token);
      } else {
        setErrorMessage(data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch {
      setErrorMessage('تعذر الاتصال بخادم المصادقة. يرجى التأكد من اتصال الإنترنت');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-backdrop-glow" />

      <div className="login-card animate-scale-up">
        <div className="login-header">
          <div className="login-logo-image-wrap">
            <img src="/logo.png" alt="TXEVA IMAGEN" className="login-brand-img" />
          </div>
          <h1 className="login-title">TXEVA IMAGEN</h1>
          <p className="login-subtitle">BUILD YOUR FUTURE • استوديو توليد الصور بالذكاء الاصطناعي</p>
          <div className="login-team-badge">
            <ShieldCheck size={15} />
            <span>بوابة فريق العمل المصرح لهم</span>
          </div>
        </div>

        {errorMessage && (
          <div className="login-error-alert animate-fade-in">
            <AlertCircle size={18} className="error-icon" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group-spacious">
            <label className="form-label-spacious">اسم المستخدم (Username):</label>
            <div className="input-spacious-wrap">
              <User size={18} className="input-icon-spacious" />
              <input
                type="text"
                className="input-spacious"
                placeholder="أدخل اسم المستخدم..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group-spacious">
            <label className="form-label-spacious">كلمة المرور (Password):</label>
            <div className="input-spacious-wrap">
              <KeyRound size={18} className="input-icon-spacious" />
              <input
                type="password"
                className="input-spacious"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-login-submit"
            disabled={isLoading || !username.trim() || !password.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>جاري التحقق من الصلاحيات...</span>
              </>
            ) : (
              <>
                <Lock size={18} />
                <span>تسجيل الدخول للمنصة</span>
              </>
            )}
          </button>
        </form>

        <div className="login-footer-info">
          <span>يتم التحقق من بيانات الدخول عبر متغيرات البيئة السحابية (AUTH_USERNAME و AUTH_PASSWORD)</span>
        </div>
      </div>
    </div>
  );
};
