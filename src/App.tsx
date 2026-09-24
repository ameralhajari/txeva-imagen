import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GenerationCard } from './components/GenerationCard';
import { PromptInput } from './components/PromptInput';
import { ImageLightbox } from './components/ImageLightbox';
import { PricingCalculatorModal } from './components/PricingCalculatorModal';
import { LoginScreen } from './components/LoginScreen';
import { getPricePerImage } from './utils/pricing';
import {
  fetchSessions,
  fetchSessionDetails,
  createSession,
  saveGeneration,
  deleteSession,
  updateSessionTitle,
} from './services/storage';
import { generateImage } from './services/openai';
import type { Session, Generation, ImageModel, GenerationRequestParams } from './types';
import { AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  const [authToken, setAuthToken] = useState<string | null>(() =>
    localStorage.getItem('txeva_auth_token')
  );
  const [currentUser, setCurrentUser] = useState<string | null>(() =>
    localStorage.getItem('txeva_auth_user')
  );

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [activeModel, setActiveModel] = useState<ImageModel>('gpt-image-1-mini');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTursoConnected, setIsTursoConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lightboxGen, setLightboxGen] = useState<Generation | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [externalPrompt, setExternalPrompt] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  const handleLoginSuccess = (user: string, token: string) => {
    localStorage.setItem('txeva_auth_token', token);
    localStorage.setItem('txeva_auth_user', user);
    setAuthToken(token);
    setCurrentUser(user);
    loadSessionsList();
  };

  const handleLogout = () => {
    localStorage.removeItem('txeva_auth_token');
    localStorage.removeItem('txeva_auth_user');
    setAuthToken(null);
    setCurrentUser(null);
    setSessions([]);
    setActiveSessionId(null);
    setCurrentSession(null);
  };

  const sessionTotalCost = (currentSession?.generations || []).reduce((acc, gen) => {
    return acc + getPricePerImage(gen.model, gen.size, gen.quality).cost;
  }, 0);

  // Load sessions from storage
  const loadSessionsList = async () => {
    try {
      const { sessions: fetched, isTurso } = await fetchSessions();
      setSessions(fetched);
      setIsTursoConnected(isTurso);

      if (fetched.length > 0 && !activeSessionId) {
        setActiveSessionId(fetched[0].id);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  useEffect(() => {
    if (authToken) {
      loadSessionsList();
    }
  }, [authToken]);

  // When active session changes, load its generations
  useEffect(() => {
    if (!activeSessionId) {
      setCurrentSession(null);
      return;
    }

    let isSubscribed = true;
    fetchSessionDetails(activeSessionId).then((fullSession) => {
      if (isSubscribed && fullSession) {
        setCurrentSession(fullSession);
        if (fullSession.model) {
          setActiveModel(fullSession.model);
        }
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [activeSessionId]);

  // Scroll to bottom when new generations arrive
  useEffect(() => {
    if (currentSession?.generations?.length) {
      scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.generations?.length]);

  const handleNewSession = async () => {
    const title = `جلسة جديدة ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newSess = await createSession(title, activeModel);
    setSessions((prev) => [newSess, ...prev]);
    setActiveSessionId(newSess.id);
    setCurrentSession(newSess);
    setSidebarOpen(false);
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else {
        setActiveSessionId(null);
        setCurrentSession(null);
      }
    }
  };

  const handleUpdateTitle = async (id: string, newTitle: string) => {
    await updateSessionTitle(id, newTitle);
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
    if (currentSession && currentSession.id === id) {
      setCurrentSession({ ...currentSession, title: newTitle });
    }
  };

  const handleGenerate = async (params: GenerationRequestParams) => {
    setErrorMessage(null);
    setIsGenerating(true);

    try {
      let targetSessionId = activeSessionId;
      if (!targetSessionId || !currentSession) {
        const derivedTitle =
          params.prompt.trim().split(/\s+/).slice(0, 5).join(' ') || 'جلسة توليد';
        const newSess = await createSession(derivedTitle, params.model);
        setSessions((prev) => [newSess, ...prev]);
        setActiveSessionId(newSess.id);
        setCurrentSession(newSess);
        targetSessionId = newSess.id;
      }

      const results = await generateImage(params);

      if (!results || results.length === 0) {
        throw new Error('لم يتم استلام أي صورة من مزود الخدمة');
      }

      for (const res of results) {
        const generation: Generation = {
          id: 'gen_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          sessionId: targetSessionId,
          prompt: params.prompt,
          revisedPrompt: res.revisedPrompt,
          model: params.model,
          quality: params.quality,
          style: params.style,
          size: params.size,
          imageUrl: res.url,
          referenceImages: params.images,
          createdAt: Date.now(),
        };

        await saveGeneration(generation);

        setCurrentSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            generations: [...(prev.generations || []), generation],
            updatedAt: Date.now(),
          };
        });

        setSessions((prev) =>
          prev.map((s) => (s.id === targetSessionId ? { ...s, updatedAt: Date.now() } : s))
        );
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء توليد الصورة');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReusePrompt = (prompt: string, model: ImageModel) => {
    setActiveModel(model);
    setExternalPrompt(prompt);
  };

  // If user is not authenticated, render Login Screen
  if (!authToken) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-layout" dir="rtl">
      {/* Sidebar Navigation */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        currentUser={currentUser}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setSidebarOpen(false);
        }}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onUpdateTitle={handleUpdateTitle}
        onLogout={handleLogout}
        isTursoConnected={isTursoConnected}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Workspace Area */}
      <div className="workspace-main">
        <Header
          currentSession={currentSession}
          activeModel={activeModel}
          sessionCost={sessionTotalCost}
          currentUser={currentUser}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
          onLogout={handleLogout}
        />

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="error-banner animate-fade-in">
            <div className="error-content">
              <AlertCircle size={20} className="error-icon" />
              <span>{errorMessage}</span>
            </div>
            <button className="btn-icon-subtle" onClick={() => setErrorMessage(null)}>
              <X size={18} />
            </button>
          </div>
        )}

        {/* Feed / Gallery Display Area with generous breathing room */}
        <main className="gallery-viewport">
          {!currentSession || !currentSession.generations || currentSession.generations.length === 0 ? (
            <div className="empty-state animate-fade-in">
              <div className="empty-logo-wrap">
                <img src="/logo.png" alt="TXEVA IMAGEN" className="empty-brand-logo" />
              </div>
              <h2>TXEVA IMAGEN Studio</h2>
              <p>
                اكتب الوصف المطلوب في شريط الأوامر أدناه، واختر الموديل المناسب (مثل GPT Image 1 Mini فائق التوفير أو GPT Image 1.5 أو DALL-E) لتوليد صورك بجودة سينمائية فوراً.
              </p>
              <div className="empty-features-grid">
                <div className="empty-feature-card">
                  <span className="feat-title">⚡ جيل GPT Image السريع</span>
                  <span className="feat-desc">توليد حتى 1,000 صورة لكل 5 دولار بأحدث خوارزميات OpenAI</span>
                </div>
                <div className="empty-feature-card">
                  <span className="feat-title">🔒 أمان ومصادقة الفريق</span>
                  <span className="feat-desc">نظام مقفل بكلمة سر واسم مستخدم مشفر عبر الـ Edge</span>
                </div>
                <div className="empty-feature-card">
                  <span className="feat-title">☁️ حفظ دائم مع Turso</span>
                  <span className="feat-desc">حفظ فوري للجلسات وقابل للوصول لجميع أفراد الفريق</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="generations-stream">
              {currentSession.generations.map((gen) => (
                <GenerationCard
                  key={gen.id}
                  generation={gen}
                  onSelectForLightbox={(g) => setLightboxGen(g)}
                  onReusePrompt={handleReusePrompt}
                />
              ))}
              <div ref={scrollAnchorRef} />
            </div>
          )}
        </main>

        {/* Bottom Floating Prompt Dock */}
        <PromptInput
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          activeModel={activeModel}
          onModelChange={setActiveModel}
          externalPrompt={externalPrompt}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
        />
      </div>

      {/* Lightbox Modal */}
      <ImageLightbox
        generation={lightboxGen}
        onClose={() => setLightboxGen(null)}
      />

      {/* Pricing & Cost Calculator Modal */}
      <PricingCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </div>
  );
};

export default App;
