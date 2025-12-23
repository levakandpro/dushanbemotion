// src/admin/screens/SettingsScreen.jsx
import React, { useState, useEffect } from 'react';
import { fetchAdminUsers, addAdminUser, updateAdminRole, deleteAdminUser } from '../api/adminApi';
import Loader from '../../components/ui/Loader';

export default function SettingsScreen() {
  const [projectName, setProjectName] = useState('D Motion');
  const [baseDomain, setBaseDomain] = useState('app.dmotion.tj');
  const [platformMode, setPlatformMode] = useState('Production');
  const [allowRegistration, setAllowRegistration] = useState(true);

  // Админы
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('helper');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setAdmins(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAdmin(e) {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setSaving(true);
    setMessage(null);
    try {
      await addAdminUser(newEmail, newRole);
      setMessage({ type: 'success', text: 'Админ добавлен!' });
      setNewEmail('');
      setNewRole('helper');
      loadAdmins();
    } catch (err) {
      setMessage({ type: 'error', text: 'Ошибка: ' + (err.message || 'Email уже существует') });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeRole(id, role) {
    try {
      await updateAdminRole(id, role);
      loadAdmins();
    } catch (err) {
      setMessage({ type: 'error', text: 'Ошибка изменения роли' });
    }
  }

  async function handleDeleteAdmin(admin) {
    if (admin.role === 'owner') {
      setMessage({ type: 'error', text: 'Нельзя удалить владельца!' });
      return;
    }
    if (!window.confirm(`Удалить ${admin.email} из админов?`)) return;

    try {
      await deleteAdminUser(admin.id);
      setMessage({ type: 'success', text: 'Удалён' });
      loadAdmins();
    } catch (err) {
      setMessage({ type: 'error', text: 'Ошибка удаления' });
    }
  }

  const getRoleName = (role) => {
    if (role === 'owner') return 'Владелец';
    if (role === 'admin') return 'Полный доступ';
    return 'Помощник Админа';
  };

  return (
    <div className="dm-settings">
      {message && (
        <div className={`dm-settings__msg dm-settings__msg--${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Общие параметры проекта */}
      <div className="dm-settings__card">
        <div className="dm-settings__header">
          <h2>Общие параметры проекта</h2>
          <p>Название, базовый домен и режим работы.</p>
          </div>
        <div className="dm-settings__content">
          <div className="dm-settings__row">
            <label>
              <span>Название проекта</span>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
              />
            </label>
            <label>
              <span>Базовый домен</span>
                <input
                  type="text"
                  value={baseDomain}
                  onChange={(e) => setBaseDomain(e.target.value)}
                />
            </label>
              </div>
          <label>
            <span>Режим платформы</span>
            <select value={platformMode} onChange={(e) => setPlatformMode(e.target.value)}>
                <option value="Production">Production</option>
                <option value="Private beta">Private beta</option>
                <option value="Invite-only">Invite-only</option>
              </select>
          </label>
          <label className="dm-settings__toggle">
                  <input
                    type="checkbox"
                    checked={allowRegistration}
                    onChange={(e) => setAllowRegistration(e.target.checked)}
                  />
            <span>Регистрация новых пользователей</span>
                </label>
          </div>
        </div>

      {/* Роли и права — Управление админами */}
      <div className="dm-settings__card">
        <div className="dm-settings__header">
          <h2>Роли и права</h2>
          <p>Кто имеет доступ к админке D Motion.</p>
              </div>
        <div className="dm-settings__content">
          {/* Добавление нового */}
          <form className="dm-settings__add-form" onSubmit={handleAddAdmin}>
            <input
              type="email"
              placeholder="Email нового админа"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="admin">Полный доступ</option>
              <option value="helper">Помощник Админа</option>
            </select>
            <button type="submit" disabled={saving}>
              {saving ? '...' : '+ Добавить'}
              </button>
          </form>

          {/* Список админов */}
          {loading ? (
            <Loader fullscreen={false} size="minimal" showText={false} />
          ) : (
            <div className="dm-settings__admins">
              {admins.map((admin) => (
                <div key={admin.id} className={`dm-settings__admin ${admin.role === 'owner' ? 'dm-settings__admin--owner' : ''}`}>
                  <div className="dm-settings__admin-info">
                    <span className="dm-settings__admin-email">{admin.email}</span>
                    <span className={`dm-settings__admin-role dm-settings__admin-role--${admin.role}`}>
                      {getRoleName(admin.role)}
              </span>
            </div>
                  <div className="dm-settings__admin-actions">
                    {admin.role !== 'owner' && (
                      <>
              <select
                          value={admin.role} 
                          onChange={(e) => handleChangeRole(admin.id, e.target.value)}
              >
                          <option value="admin">Полный доступ</option>
                          <option value="helper">Помощник Админа</option>
              </select>
                        <button onClick={() => handleDeleteAdmin(admin)}>✕</button>
                      </>
                    )}
                </div>
              </div>
            ))}
          </div>
          )}

          <div className="dm-settings__roles-info">
            <div className="dm-settings__role-desc">
              <b>Владелец</b> — полный доступ, нельзя удалить
          </div>
            <div className="dm-settings__role-desc">
              <b>Полный доступ</b> — все разделы админки, управление пользователями и тарифами
            </div>
            <div className="dm-settings__role-desc">
              <b>Помощник Админа</b> — просмотр данных, ограниченные действия
              </div>
            </div>
          </div>
        </div>

      <style>{`
        .dm-settings { max-width: 700px; }
        .dm-settings__msg {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .dm-settings__msg--success { background: #e8f5e9; color: #2e7d32; }
        .dm-settings__msg--error { background: #ffebee; color: #c62828; }
        
        .dm-settings__card {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dm-settings__header { margin-bottom: 20px; }
        .dm-settings__header h2 { margin: 0 0 4px; font-size: 18px; font-weight: 600; }
        .dm-settings__header p { margin: 0; font-size: 13px; color: #86868b; }
        .dm-settings__content { display: flex; flex-direction: column; gap: 16px; }
        .dm-settings__row { display: flex; gap: 16px; }
        .dm-settings__row label { flex: 1; }
        .dm-settings__content > label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
        }
        .dm-settings__content > label > span { color: #86868b; font-weight: 500; }
        .dm-settings__content input[type="text"],
        .dm-settings__content > label select {
          padding: 10px 12px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          font-size: 14px;
        }
        .dm-settings__content input:focus,
        .dm-settings__content select:focus {
          outline: none;
          border-color: #007aff;
        }
        .dm-settings__toggle {
          flex-direction: row !important;
          align-items: center;
          gap: 10px !important;
        }
        .dm-settings__toggle input { width: 18px; height: 18px; }
        .dm-settings__toggle span { color: #1d1d1f !important; }
        
        .dm-settings__add-form {
          display: flex;
          gap: 8px;
          padding: 16px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        .dm-settings__add-form input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 6px;
          font-size: 14px;
        }
        .dm-settings__add-form select {
          padding: 10px 12px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 6px;
          font-size: 14px;
        }
        .dm-settings__add-form button {
          padding: 10px 16px;
          background: #007aff;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        .dm-settings__add-form button:disabled { opacity: 0.5; }
        
        .dm-settings__loading { padding: 20px; text-align: center; color: #86868b; }
        
        .dm-settings__admins { display: flex; flex-direction: column; gap: 8px; }
        .dm-settings__admin {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        .dm-settings__admin--owner {
          background: linear-gradient(90deg, rgba(255,149,0,0.1) 0%, #f9f9f9 50%);
          border-left: 3px solid #ff9500;
        }
        .dm-settings__admin-info { display: flex; align-items: center; gap: 12px; }
        .dm-settings__admin-email { font-weight: 500; }
        .dm-settings__admin-role {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        .dm-settings__admin-role--owner { background: #ff9500; color: #fff; }
        .dm-settings__admin-role--admin { background: #007aff; color: #fff; }
        .dm-settings__admin-role--helper { background: #e0e0e0; color: #666; }
        
        .dm-settings__admin-actions { display: flex; gap: 8px; align-items: center; }
        .dm-settings__admin-actions select {
          padding: 6px 10px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 6px;
          font-size: 12px;
        }
        .dm-settings__admin-actions button {
          width: 28px;
          height: 28px;
          border: none;
          background: #ffebee;
          color: #c62828;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .dm-settings__roles-info {
          margin-top: 16px;
          padding: 16px;
          background: #f5f5f7;
          border-radius: 8px;
        }
        .dm-settings__role-desc {
          font-size: 12px;
          color: #666;
          margin-bottom: 6px;
        }
        .dm-settings__role-desc:last-child { margin-bottom: 0; }
        .dm-settings__role-desc b { color: #1d1d1f; }
      `}</style>
    </div>
  );
}
