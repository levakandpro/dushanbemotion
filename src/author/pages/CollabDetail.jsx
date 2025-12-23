import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../components/author-ui.css";
import "./CollabDetail.css";
import Loader from "../../components/ui/Loader";

import { getCurrentUser } from "../../services/userService";
import { uploadCollabMaterialImage } from "../../services/coverService";
import {
  getCollabById,
  getCollabMaterials,
  getCollabHistory,
  getStatusLabel,
  getActionLabel,
  getUserRole,
  getUserShare,
  getPartner,
  getPendingActions,
  confirmCollab,
  pauseCollab,
  resumeCollab,
  requestDeleteCollab,
  confirmDeleteCollab,
  cancelDeleteRequest,
  requestShareChange,
  confirmShareChange,
  rejectShareChange,
  addMaterial,
  approveMaterial,
  rejectMaterial,
  deleteMaterial,
  setMaterialAsCover,
  updateCollabTitle,
  updateCollabDescription
} from "../../services/collabService";

import { ToastProvider, showToast } from "../components/Toast";
import sadIcon from "../../editorV2/components/bazar/assets/prof/sad.png";

const STATUS_CLASS = {
  draft: 'is-draft',
  pending: 'is-pending',
  active: 'is-active',
  paused: 'is-paused',
  delete_requested: 'is-delete',
  archived: 'is-archived'
};

const MATERIAL_STATUS = {
  pending: { label: 'На подтверждении', class: 'is-pending' },
  approved: { label: 'Подтверждён', class: 'is-approved' },
  rejected: { label: 'Отклонён', class: 'is-rejected' }
};

export default function CollabDetail() {
  const { collabId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [collab, setCollab] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('materials');
  
  // Модалки
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showChangeShare, setShowChangeShare] = useState(false);
  const [newShare, setNewShare] = useState(50);
  const [newMaterial, setNewMaterial] = useState({ title: '', description: '', previewUrl: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Редактирование названия и описания
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        navigate('/author/collabs');
        return;
      }
      setCurrentUserId(user.id);

      const [collabData, materialsData, historyData] = await Promise.all([
        getCollabById(collabId),
        getCollabMaterials(collabId),
        getCollabHistory(collabId)
      ]);

      if (!collabData) {
        showToast("Коллаб не найден", "error");
        navigate('/author/collabs');
        return;
      }

      setCollab(collabData);
      setMaterials(materialsData);
      setHistory(historyData);
      setNewShare(getUserShare(collabData, user.id));
    } catch (error) {
      console.error("Error loading collab:", error);
      showToast("Ошибка загрузки", "error");
    } finally {
      setLoading(false);
    }
  }, [collabId, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <ToastProvider>
        <Loader />
      </ToastProvider>
    );
  }

  if (!collab) return null;

  const role = getUserRole(collab, currentUserId);
  const partner = getPartner(collab, currentUserId);
  const myShare = getUserShare(collab, currentUserId);
  const pendingActions = getPendingActions(collab, currentUserId);

  // Handlers
  const handleConfirm = async () => {
    try {
      await confirmCollab(collabId);
      showToast("Участие подтверждено");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handlePause = async () => {
    try {
      await pauseCollab(collabId, currentUserId);
      showToast("Коллаб на паузе");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleResume = async () => {
    try {
      await resumeCollab(collabId, currentUserId);
      showToast("Коллаб возобновлён");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleRequestDelete = async () => {
    if (!window.confirm("Запросить удаление коллаба? Партнёр должен подтвердить.")) return;
    try {
      await requestDeleteCollab(collabId, currentUserId);
      showToast("Запрос на удаление отправлен");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!window.confirm("Подтвердить удаление коллаба? Это действие нельзя отменить.")) return;
    try {
      await confirmDeleteCollab(collabId, currentUserId);
      showToast("Коллаб архивирован");
      navigate('/author/collabs');
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleCancelDelete = async () => {
    try {
      await cancelDeleteRequest(collabId, currentUserId);
      showToast("Запрос на удаление отменён");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleRequestShareChange = async () => {
    try {
      await requestShareChange(collabId, currentUserId, newShare);
      showToast("Запрос на изменение отправлен");
      setShowChangeShare(false);
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleConfirmShareChange = async () => {
    try {
      await confirmShareChange(collabId, currentUserId);
      showToast("Изменение процентов подтверждено");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleRejectShareChange = async () => {
    try {
      await rejectShareChange(collabId, currentUserId);
      showToast("Изменение процентов отклонено");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Файл слишком большой (макс 5MB)", "error");
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadCollabMaterialImage(currentUserId, collabId, file);
      setNewMaterial(prev => ({ ...prev, previewUrl: url }));
      showToast("Изображение загружено");
    } catch (err) {
      showToast("Ошибка загрузки: " + err.message, "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.title.trim()) {
      showToast("Введите название материала", "error");
      return;
    }
    try {
      await addMaterial(collabId, currentUserId, {
        title: newMaterial.title,
        description: newMaterial.description,
        previewUrl: newMaterial.previewUrl
      });
      showToast("Материал добавлен, ожидает подтверждения");
      setShowAddMaterial(false);
      setNewMaterial({ title: '', description: '', previewUrl: '' });
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleApproveMaterial = async (materialId) => {
    try {
      await approveMaterial(materialId, currentUserId);
      showToast("Материал подтверждён");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleRejectMaterial = async (materialId) => {
    const reason = window.prompt("Причина отклонения (опционально):");
    try {
      await rejectMaterial(materialId, currentUserId, reason || undefined);
      showToast("Материал отклонён");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm("Удалить этот материал?")) return;
    try {
      await deleteMaterial(materialId, currentUserId, collabId);
      showToast("Материал удалён");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleSetAsCover = async (materialId) => {
    try {
      await setMaterialAsCover(materialId, currentUserId, collabId);
      showToast("Обложка установлена");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Всегда можно редактировать описание
  const canEditDescription = () => {
    return true;
  };

  const handleStartEditTitle = () => {
    setEditedTitle(collab.title || '');
    setEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) {
      showToast("Название не может быть пустым", "error");
      return;
    }
    try {
      await updateCollabTitle(collabId, currentUserId, editedTitle);
      showToast("Название обновлено");
      setEditingTitle(false);
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleStartEditDesc = () => {
    setEditedDesc(collab.description || '');
    setEditingDesc(true);
  };

  const handleSaveDesc = async () => {
    try {
      await updateCollabDescription(collabId, currentUserId, editedDesc);
      showToast("Описание обновлено");
      setEditingDesc(false);
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Pending share change info
  const hasPendingShareChange = collab.share_change_requested_by && collab.share_change_requested_by !== currentUserId;

  return (
    <ToastProvider>
    <div className="au-collab-detail">
      {/* Компактная шапка */}
      <div className="au-collab-header au-collab-header--compact">
        <button className="au-back-btn" onClick={() => navigate('/author/collabs')}>← Назад</button>
        
        <div className="au-collab-header__row">
          {editingTitle ? (
            <div className="au-collab-edit-title">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Название коллаба"
                autoFocus
              />
              <button className="au-btn au-btn--sm" onClick={handleSaveTitle}>✓</button>
              <button className="au-btn au-btn--sm au-btn--ghost" onClick={() => setEditingTitle(false)}>✕</button>
            </div>
          ) : (
            <div className="au-collab-title-inline">
              <h1 className="au-collab-header__title">{collab.title}</h1>
              <button className="au-collab-edit-btn" onClick={handleStartEditTitle} title="Редактировать название">✏️</button>
            </div>
          )}
          <span className={`au-collab-status ${STATUS_CLASS[collab.status]}`}>
            {getStatusLabel(collab.status)}
          </span>
          <span className="au-collab-header__partner-inline">
            Партнёр: <strong>{partner?.display_name || 'Неизвестен'}</strong>
          </span>
          <span className="au-collab-header__shares-inline">
            Вы: <strong>{myShare}%</strong> / Партнёр: <strong>{100 - myShare}%</strong>
          </span>
        </div>

        {/* Описание с редактированием */}
        <div className="au-collab-header__desc-row">
          {editingDesc ? (
            <div className="au-collab-edit-desc">
              <input
                type="text"
                value={editedDesc}
                onChange={(e) => setEditedDesc(e.target.value)}
                placeholder="Описание коллаба..."
                autoFocus
              />
              <button className="au-btn au-btn--sm" onClick={handleSaveDesc}>✓</button>
              <button className="au-btn au-btn--sm au-btn--ghost" onClick={() => setEditingDesc(false)}>✕</button>
            </div>
          ) : (
            <div className="au-collab-desc-inline">
              <span className="au-collab-desc-text">{collab.description || 'Нет описания'}</span>
              <button className="au-collab-edit-btn" onClick={handleStartEditDesc} title="Редактировать описание">✏️</button>
            </div>
          )}
        </div>
      </div>

      {/* Уведомления о требуемых действиях */}
      {pendingActions.length > 0 && (
        <div className="au-collab-alerts">
          {pendingActions.includes('confirm_participation') && (
            <div className="au-collab-alert au-collab-alert--action">
              <span>Партнёр приглашает вас в коллаб</span>
              <div className="au-collab-alert__actions">
                <button className="au-btn au-btn--sm" onClick={handleConfirm}>Подтвердить</button>
                <button className="au-btn au-btn--sm au-btn--ghost" onClick={() => navigate('/author/collabs')}>Отклонить</button>
              </div>
            </div>
          )}
          
          {pendingActions.includes('confirm_delete') && (
            <div className="au-collab-alert au-collab-alert--warning">
              <span>Партнёр запросил удаление коллаба</span>
              <div className="au-collab-alert__actions">
                <button className="au-btn au-btn--sm au-btn--danger" onClick={handleConfirmDelete}>Подтвердить удаление</button>
              </div>
            </div>
          )}

          {pendingActions.includes('confirm_share_change') && (
            <div className="au-collab-alert au-collab-alert--action">
              <span>
                Партнёр предлагает изменить доли: Вы {collab.pending_author1_share}% / Партнёр {collab.pending_author2_share}%
              </span>
              <div className="au-collab-alert__actions">
                <button className="au-btn au-btn--sm" onClick={handleConfirmShareChange}>Принять</button>
                <button className="au-btn au-btn--sm au-btn--ghost" onClick={handleRejectShareChange}>Отклонить</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Действия */}
      {collab.status === 'active' && (
        <div className="au-collab-actions">
          <button className="au-btn" onClick={() => navigate(`/editor?collab=${collabId}`)}>+ Добавить материал</button>
          <button className="au-btn au-btn--ghost" onClick={() => setShowChangeShare(true)}>Изменить доли</button>
          <button className="au-btn au-btn--ghost" onClick={handlePause}>Пауза</button>
          <button className="au-btn au-btn--ghost au-btn--danger" onClick={handleRequestDelete}>Удалить</button>
        </div>
      )}

      {collab.status === 'paused' && collab.paused_by === currentUserId && (
        <div className="au-collab-actions">
          <button className="au-btn" onClick={handleResume}>Снять с паузы</button>
        </div>
      )}

      {collab.status === 'delete_requested' && collab.delete_requested_by === currentUserId && (
        <div className="au-collab-actions">
          <button className="au-btn au-btn--ghost" onClick={handleCancelDelete}>Отменить запрос удаления</button>
        </div>
      )}

      {/* Табы */}
      <div className="au-tabs">
        <button 
          className={`au-tab ${activeTab === 'materials' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          Материалы ({materials.filter(m => m.status === 'approved').length})
        </button>
        <button 
          className={`au-tab ${activeTab === 'pending' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          На подтверждении ({materials.filter(m => m.status === 'pending').length})
        </button>
        <button 
          className={`au-tab ${activeTab === 'history' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          История
        </button>
      </div>

      {/* Контент табов */}
      <div className="au-collab-content">
        {activeTab === 'materials' && (
          <div className="au-collab-materials">
            {materials.filter(m => m.status === 'approved').length > 0 ? (
              materials.filter(m => m.status === 'approved').map(mat => (
                <div key={mat.id} className="au-material-card">
                  {mat.preview_url && (
                    <div className="au-material-card__preview">
                      <img src={mat.preview_url} alt="" />
                    </div>
                  )}
                  <div className="au-material-card__main">
                    <div className="au-material-card__title">{mat.title}</div>
                    {mat.description && (
                      <div className="au-material-card__desc">{mat.description}</div>
                    )}
                    <div className="au-material-card__owner">
                      Владелец: {mat.owner?.display_name || 'Неизвестен'}
                    </div>
                  </div>
                  <div className="au-material-card__actions">
                    {mat.preview_url && (
                      <button 
                        className="au-btn au-btn--sm au-btn--ghost"
                        onClick={(e) => { e.stopPropagation(); handleSetAsCover(mat.id); }}
                      >
                        📷 Обложка
                      </button>
                    )}
                    <button 
                      className="au-btn au-btn--sm au-btn--ghost au-btn--danger"
                      onClick={(e) => { e.stopPropagation(); handleDeleteMaterial(mat.id); }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="au-collab-empty">
                <img src={sadIcon} alt="" className="au-collab-empty__icon" />
                <p>Нет подтверждённых материалов</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="au-collab-materials">
            {materials.filter(m => m.status === 'pending').length > 0 ? (
              materials.filter(m => m.status === 'pending').map(mat => (
                <div key={mat.id} className="au-material-card au-material-card--pending">
                  {mat.preview_url && (
                    <div className="au-material-card__preview">
                      <img src={mat.preview_url} alt="" />
                    </div>
                  )}
                  <div className="au-material-card__main">
                    <div className="au-material-card__title">{mat.title}</div>
                    {mat.description && (
                      <div className="au-material-card__desc">{mat.description}</div>
                    )}
                    <div className="au-material-card__owner">
                      Добавил: {mat.owner?.display_name || 'Неизвестен'}
                    </div>
                  </div>
                  <div className="au-material-card__actions">
                    {mat.pending_approval_from === currentUserId ? (
                      <>
                        <button className="au-btn au-btn--sm" onClick={() => handleApproveMaterial(mat.id)}>
                          Подтвердить
                        </button>
                        <button className="au-btn au-btn--sm au-btn--ghost" onClick={() => handleRejectMaterial(mat.id)}>
                          Отклонить
                        </button>
                      </>
                    ) : (
                      <span className="au-material-waiting">Ожидает подтверждения партнёра</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="au-collab-empty">
                <p>Нет материалов на подтверждении</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="au-collab-history">
            {history.length > 0 ? (
              history.map(entry => (
                <div key={entry.id} className="au-history-item">
                  <div className="au-history-item__actor">
                    {entry.actor?.display_name || 'Пользователь'}
                  </div>
                  <div className="au-history-item__action">
                    {getActionLabel(entry.action_type)}
                  </div>
                  <div className="au-history-item__date">
                    {new Date(entry.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
              ))
            ) : (
              <div className="au-collab-empty">
                <p>История пуста</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модалка добавления материала */}
      {showAddMaterial && (
        <div className="au-modal-overlay" onClick={() => setShowAddMaterial(false)}>
          <div className="au-modal" onClick={e => e.stopPropagation()}>
            <h3>Добавить материал</h3>
            <p className="au-modal__hint">Материал будет отправлен партнёру на подтверждение</p>
            
            <div className="au-modal__field">
              <label>Название</label>
              <input
                type="text"
                className="au-input"
                value={newMaterial.title}
                onChange={e => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Название материала"
              />
            </div>
            
            <div className="au-modal__field">
              <label>Описание (опционально)</label>
              <textarea
                className="au-input"
                value={newMaterial.description}
                onChange={e => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Описание..."
                rows={3}
              />
            </div>

            <div className="au-modal__field">
              <label>Изображение (опционально)</label>
              {newMaterial.previewUrl ? (
                <div className="au-modal__preview">
                  <img src={newMaterial.previewUrl} alt="Preview" />
                  <button 
                    type="button" 
                    className="au-modal__preview-remove"
                    onClick={() => setNewMaterial(prev => ({ ...prev, previewUrl: '' }))}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="au-upload-btn">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    style={{ display: 'none' }}
                  />
                  {uploadingImage ? (
                    <Loader fullscreen={false} inline size="minimal" showText={false} />
                  ) : (
                    <span>+ Загрузить изображение</span>
                  )}
                </label>
              )}
            </div>

            <div className="au-modal__actions">
              <button className="au-btn au-btn--ghost" onClick={() => setShowAddMaterial(false)}>Отмена</button>
              <button className="au-btn" onClick={handleAddMaterial}>Добавить</button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка изменения долей */}
      {showChangeShare && (
        <div className="au-modal-overlay" onClick={() => setShowChangeShare(false)}>
          <div className="au-modal" onClick={e => e.stopPropagation()}>
            <h3>Изменить распределение</h3>
            <p className="au-modal__hint">Партнёр должен подтвердить изменение</p>
            
            <div className="au-modal__shares">
              <div className="au-modal__share">
                <span>Ваша доля</span>
                <input
                  type="number"
                  className="au-input"
                  value={newShare}
                  onChange={e => setNewShare(parseInt(e.target.value) || 0)}
                  min="1"
                  max="99"
                />
                <span>%</span>
              </div>
              <div className="au-modal__share">
                <span>Доля партнёра</span>
                <input
                  type="number"
                  className="au-input"
                  value={100 - newShare}
                  disabled
                />
                <span>%</span>
              </div>
            </div>

            <div className="au-modal__actions">
              <button className="au-btn au-btn--ghost" onClick={() => setShowChangeShare(false)}>Отмена</button>
              <button className="au-btn" onClick={handleRequestShareChange}>Отправить запрос</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ToastProvider>
  );
}
