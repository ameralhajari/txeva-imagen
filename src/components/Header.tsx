import React from 'react';
import { Menu, Sparkles, Calculator, LogOut } from 'lucide-react';
import type { Session, ImageModel } from '../types';

interface HeaderProps {
  currentSession: Session | null;
  activeModel: ImageModel;
  sessionCost: number;
  currentUser: string | null;
  onToggleSidebar: () => void;
  onOpenCalculator: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSession,
  activeModel,
  sessionCost,
  currentUser,
  onToggleSidebar,
  onOpenCalculator,
  onLogout,
}) => {
  const imagesCount = currentSession?.generations?.length || 0;

  return (
    <header className="main-header">
      <div className="header-left">
        <button className="btn-mobile-menu" onClick={onToggleSidebar} aria-label="القائمة">
          <Menu size={22} />
        </button>

        <div className="header-session-info">
          <h1 className="header-title">
            {currentSession ? currentSession.title : 'جلسة توليد جديدة'}
          </h1>
          <div className="header-tags">
            <span className="badge badge-model">
              <Sparkles size={13} />
              <span>{activeModel.toUpperCase()}</span>
            </span>
            <span className="badge badge-count">
              {imagesCount} {imagesCount === 1 ? 'صورة' : imagesCount === 2 ? 'صورتان' : 'صور'}
            </span>
            {imagesCount > 0 && (
              <span className="badge badge-cost" title="إجمالي تكلفة الصور المولدة في هذه الجلسة">
                استهلاك الجلسة: ${sessionCost.toFixed(3)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="header-right">
        <button
          className="btn-header-action btn-header-calc"
          onClick={onOpenCalculator}
          title="حاسبة الأسعار ومعدل الصور لكل 1$ و 5$"
        >
          <Calculator size={17} className="text-accent" />
          <span>حاسبة الأسعار</span>
        </button>

        <div className="header-user-tag" title={`مُسجل بحساب: ${currentUser || 'عضو الفريق'}`}>
          <span className="user-status-dot" />
          <span>{currentUser || 'عضو الفريق'}</span>
        </div>

        <button className="btn-header-logout" onClick={onLogout} title="تسجيل الخروج">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
