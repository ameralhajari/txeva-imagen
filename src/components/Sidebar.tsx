import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Database,
  Search,
  LogOut,
  UserCheck,
} from 'lucide-react';
import type { Session } from '../types';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  currentUser: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
  onLogout: () => void;
  isTursoConnected: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  currentUser,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onUpdateTitle,
  onLogout,
  isTursoConnected,
  isOpen,
  onToggle,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const startEditing = (s: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const handleSaveTitle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onUpdateTitle(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onToggle} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand / Logo */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <img src="/logo.png" alt="TXEVA IMAGEN" className="sidebar-brand-img" />
            <div className="brand-text">
              <span className="brand-title">TXEVA IMAGEN</span>
              <span className="brand-subtitle">BUILD YOUR FUTURE</span>
            </div>
          </div>
          <button className="btn-new-session" onClick={onNewSession} title="بدء جلسة جديدة">
            <Plus size={18} />
            <span>جلسة جديدة</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="sidebar-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="بحث في الجلسات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sessions List */}
        <div className="sidebar-sessions-list">
          <div className="sessions-list-header">
            <span>سجل الجلسات</span>
            <span className="count-pill">{sessions.length}</span>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="sessions-empty">
              <MessageSquare size={32} className="empty-icon" />
              <p>لا توجد جلسات مسجلة</p>
              <button className="btn-text-accent" onClick={onNewSession}>
                بدء جلسة عمل جديدة
              </button>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = editingId === session.id;

              return (
                <div
                  key={session.id}
                  className={`session-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectSession(session.id)}
                >
                  <MessageSquare size={16} className="session-icon" />

                  {isEditing ? (
                    <div className="session-edit-input-wrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTitle(session.id, e as any);
                          if (e.key === 'Escape') handleCancelEditing(e as any);
                        }}
                      />
                      <button
                        className="btn-icon-mini"
                        onClick={(e) => handleSaveTitle(session.id, e)}
                      >
                        <Check size={14} />
                      </button>
                      <button className="btn-icon-mini" onClick={handleCancelEditing}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="session-title" title={session.title}>
                        {session.title}
                      </span>
                      <div className="session-actions">
                        <button
                          className="btn-action-icon"
                          onClick={(e) => startEditing(session, e)}
                          title="تعديل الاسم"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn-action-icon btn-action-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('هل تريد حذف هذه الجلسة وجميع صورها؟')) {
                              onDeleteSession(session.id);
                            }
                          }}
                          title="حذف الجلسة"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* User Info & Footer */}
        <div className="sidebar-footer">
          <div className="team-user-box">
            <div className="team-user-avatar">
              <UserCheck size={16} className="text-accent" />
            </div>
            <div className="team-user-details">
              <span className="team-user-name">{currentUser || 'فريق العمل'}</span>
              <span className="team-user-role">حساب مصرح له</span>
            </div>
          </div>

          <div className="storage-badge-wrap">
            <div className={`storage-badge ${isTursoConnected ? 'connected' : 'local'}`}>
              <Database size={14} />
              <span>{isTursoConnected ? 'قاعدة Turso سحابية' : 'تخزين Edge متصل'}</span>
            </div>
          </div>

          <button className="btn-sidebar-logout" onClick={onLogout} title="تسجيل الخروج">
            <LogOut size={16} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
};
