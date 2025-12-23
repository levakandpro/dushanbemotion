import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../components/author-ui.css";
import "./AuthorCollabs.css";
import Loader from "../../components/ui/Loader";

import { getCurrentUser, getUserProfile, toggleCollabEnabled } from "../../services/userService";
import { 
  getUserCollabs, 
  getStatusLabel, 
  getUserShare, 
  getPartner, 
  getPendingActions,
  confirmCollab,
  rejectCollab
} from "../../services/collabService";

import ContextMenu, { useContextMenu } from "../components/ContextMenu";
import { ToastProvider, showToast } from "../components/Toast";
import CreateCollabModal from "../components/CreateCollabModal";
import sadIcon from "../../editorV2/components/bazar/assets/prof/sad.png";

const STATUS_CLASS = {
  draft: 'is-draft',
  pending: 'is-pending',
  active: 'is-active',
  paused: 'is-paused',
  delete_requested: 'is-delete',
  archived: 'is-archived'
};

export default function AuthorCollabs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [collabs, setCollabs] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [collabEnabled, setCollabEnabled] = useState(true);
  const contextMenu = useContextMenu();
  
  // Для авто-скролла к первому pending
  const hasScrolledRef = useRef(false);
  const firstPendingRef = useRef(null);

  const loadCollabs = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) return;
      
      setCurrentUserId(user.id);
      const [data, profile] = await Promise.all([
        getUserCollabs(user.id),
        getUserProfile(user.id)
      ]);
      setCollabs(data);
      setCollabEnabled(profile?.collab_enabled !== false);
    } catch (error) {
      console.error("Error loading collabs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleCollab = async () => {
    try {
      const newValue = !collabEnabled;
      await toggleCollabEnabled(currentUserId, newValue);
      setCollabEnabled(newValue);
      showToast(newValue ? "Коллабы включены" : "Коллабы отключены");
    } catch (err) {
      showToast("Ошибка: " + err.message, "error");
    }
  };

  useEffect(() => { loadCollabs(); }, [loadCollabs]);

  // Фильтрация
  const filtered = collabs.filter(c => {
    if (filter === 'all') return c.status !== 'archived';
    if (filter === 'pending') return c.status === 'pending' || c.status === 'delete_requested';
    if (filter === 'active') return c.status === 'active';
    if (filter === 'paused') return c.status === 'paused';
    if (filter === 'archived') return c.status === 'archived';
    return true;
  });

  // Сортировка: pending-действия наверх (для вкладок "Все" и "Ожидают")
  const sorted = [...filtered].sort((a, b) => {
    if (filter === 'all' || filter === 'pending') {
      const aPending = getPendingActions(a, currentUserId).length > 0 ? 1 : 0;
      const bPending = getPendingActions(b, currentUserId).length > 0 ? 1 : 0;
      if (bPending !== aPending) return bPending - aPending;
    }
    // Затем по updated_at desc
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  // Авто-скролл к первому pending при первом заходе
  useEffect(() => {
    if (!loading && sorted.length > 0 && !hasScrolledRef.current && firstPendingRef.current) {
      const hasPending = sorted.some(c => getPendingActions(c, currentUserId).length > 0);
      if (hasPending) {
        hasScrolledRef.current = true;
        setTimeout(() => {
          firstPendingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstPendingRef.current?.classList.add('is-flash');
          setTimeout(() => {
            firstPendingRef.current?.classList.remove('is-flash');
          }, 500);
        }, 100);
      }
    }
  }, [loading, sorted, currentUserId]);

  // Действия
  const handleConfirm = async (collabId) => {
    try {
      await confirmCollab(collabId, currentUserId);
      showToast("Коллаб подтверждён");
      loadCollabs();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleReject = async (collabId) => {
    if (!window.confirm("Отклонить приглашение в коллаб?")) return;
    try {
      await rejectCollab(collabId, currentUserId);
      showToast("Приглашение отклонено");
      loadCollabs();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleOpenCollab = (collabId) => {
    navigate(`/author/collabs/${collabId}`);
  };

  const getMenuItems = (collab) => {
    const items = [
      { label: "Открыть", onClick: () => handleOpenCollab(collab.id) }
    ];

    const pending = getPendingActions(collab, currentUserId);
    
    if (pending.includes('confirm_participation')) {
      items.push({ label: "Подтвердить участие", onClick: () => handleConfirm(collab.id) });
      items.push({ label: "Отклонить", onClick: () => handleReject(collab.id), danger: true });
    }

    return items;
  };

  const currentCollab = collabs.find(c => c.id === contextMenu.targetId);

  return (
    <ToastProvider>
    <div className="au-collabs">
      {/* Контекстное меню */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={contextMenu.closeMenu}
        anchorRect={contextMenu.anchorRect}
        items={currentCollab ? getMenuItems(currentCollab) : []}
      />

      {/* Шапка */}
      <div className="au-pageHead">
        <div>
          <h1 className="au-pageTitle">Коллабы</h1>
          <p className="au-pageSub">Двусторонние контракты с другими авторами</p>
        </div>
        <div className="au-pageHead__actions">
          <label className="au-toggle" title={collabEnabled ? "Вы принимаете коллабы" : "Вы не принимаете коллабы"}>
            <input 
              type="checkbox" 
              checked={collabEnabled} 
              onChange={handleToggleCollab}
            />
            <span className="au-toggle__slider"></span>
            <span className="au-toggle__label">{collabEnabled ? "Принимаю" : "Не принимаю"}</span>
          </label>
          <button className="au-btn" type="button" onClick={() => setShowCreateModal(true)}>
            + Создать коллаб
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="au-tabs" role="tablist">
        <button className={`au-tab ${filter === 'all' ? 'is-active' : ''}`} onClick={() => setFilter('all')}>Все</button>
        <button className={`au-tab ${filter === 'pending' ? 'is-active' : ''}`} onClick={() => setFilter('pending')}>Ожидают</button>
        <button className={`au-tab ${filter === 'active' ? 'is-active' : ''}`} onClick={() => setFilter('active')}>Активные</button>
        <button className={`au-tab ${filter === 'paused' ? 'is-active' : ''}`} onClick={() => setFilter('paused')}>На паузе</button>
        <button className={`au-tab ${filter === 'archived' ? 'is-active' : ''}`} onClick={() => setFilter('archived')}>Архив</button>
      </div>

      {/* Список */}
      {loading ? (
        <Loader fullscreen={false} size="compact" />
      ) : sorted.length ? (
        <div className="au-collabs-list">
          {sorted.map((collab, index) => {
            const partner = getPartner(collab, currentUserId);
            const myShare = getUserShare(collab, currentUserId);
            const pending = getPendingActions(collab, currentUserId);
            const needsAction = pending.length > 0;

            const showConfirmBtn = pending.includes('confirm_participation');
            const showDeleteConfirmBtn = pending.includes('confirm_delete');
            const showShareConfirmBtn = pending.includes('confirm_share_change');

            // Первая pending карточка получает ref для авто-скролла
            const isFirstPending = needsAction && !sorted.slice(0, index).some(c => getPendingActions(c, currentUserId).length > 0);

            return (
              <div 
                key={collab.id} 
                ref={isFirstPending ? firstPendingRef : null}
                className={`au-collab-card ${needsAction ? 'is-pendingAction' : ''} ${collab.cover_url ? 'has-cover' : ''}`}
                style={{ animationDelay: `${index * 30}ms` }}
                onClick={() => handleOpenCollab(collab.id)}
              >
                {collab.cover_url && (
                  <div className="au-collab-card__cover">
                    <img src={collab.cover_url} alt="" />
                  </div>
                )}
                <div className="au-collab-card__main">
                  <div className="au-collab-card__title">{collab.title}</div>
                  <div className="au-collab-card__partner">
                    {partner?.avatar_url && (
                      <img src={partner.avatar_url} alt="" className="au-collab-card__avatar" />
                    )}
                    <span>с {partner?.display_name || 'Партнёр'}</span>
                  </div>
                  {collab.description && (
                    <div className="au-collab-card__desc">{collab.description.slice(0, 100)}</div>
                  )}
                </div>
                <div className="au-collab-card__side">
                  <span className={`au-collab-status ${STATUS_CLASS[collab.status] || ''}`}>
                    {getStatusLabel(collab.status)}
                  </span>
                  <div className="au-collab-card__share">
                    Моя доля: <strong>{myShare}%</strong>
                  </div>
                  {needsAction && (
                    <div className="au-collab-card__action-needed">
                      Требуется действие
                    </div>
                  )}
                  {/* Action CTA buttons */}
                  {showConfirmBtn && (
                    <div className="au-collab-card__cta">
                      <button 
                        className="au-cta-btn au-cta-btn--primary"
                        onClick={(e) => { e.stopPropagation(); handleConfirm(collab.id); }}
                      >
                        Подтвердить
                      </button>
                      <button 
                        className="au-cta-btn au-cta-btn--ghost"
                        onClick={(e) => { e.stopPropagation(); handleReject(collab.id); }}
                      >
                        Отклонить
                      </button>
                    </div>
                  )}
                  {showDeleteConfirmBtn && (
                    <div className="au-collab-card__cta">
                      <button 
                        className="au-cta-btn au-cta-btn--danger"
                        onClick={(e) => { e.stopPropagation(); handleOpenCollab(collab.id); }}
                      >
                        Подтвердить удаление
                      </button>
                    </div>
                  )}
                  {showShareConfirmBtn && (
                    <div className="au-collab-card__cta">
                      <button 
                        className="au-cta-btn au-cta-btn--primary"
                        onClick={(e) => { e.stopPropagation(); handleOpenCollab(collab.id); }}
                      >
                        Подтвердить %
                      </button>
                    </div>
                  )}
                  <button 
                    className="au-menu-btn" 
                    onClick={(e) => { e.stopPropagation(); contextMenu.openMenu(e, collab.id); }}
                  >
                    ⋯
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="au-collabs-empty">
          <img src={sadIcon} alt="" className="au-collabs-empty__icon" />
          <p className="au-collabs-empty__text">
            {filter === 'all' 
              ? 'Пока нет коллабов. Создайте первый коллаб с другим автором.'
              : 'Нет коллабов в этой категории'}
          </p>
          {filter === 'all' && (
            <button className="au-btn" onClick={() => setShowCreateModal(true)}>
              + Создать коллаб
            </button>
          )}
        </div>
      )}

      {/* Модалка создания */}
      <CreateCollabModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => { loadCollabs(); setShowCreateModal(false); }}
        currentUserId={currentUserId}
      />
    </div>
    </ToastProvider>
  );
}
