// src/admin/screens/PlansScreen.jsx
import React, { useState, useEffect } from 'react';
import { fetchPlans, updatePlan, createPlan, deletePlan, fetchPricingSettings, updatePricingSettings } from '../api/adminApi';
import Loader from '../../components/ui/Loader';

export default function PlansScreen() {
  const [plans, setPlans] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [plansData, settingsData] = await Promise.all([
        fetchPlans(),
        fetchPricingSettings()
      ]);
      setPlans(plansData);
      setSettings(settingsData);
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Ошибка загрузки' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePlan() {
    if (!editingPlan) return;
    setSaving(true);
    setMessage(null);
    
    try {
      const planData = {
        name: editingPlan.name,
        price: editingPlan.price,
        currency: editingPlan.currency,
        period: editingPlan.interval,
        description: editingPlan.description,
        badge: editingPlan.badge,
        features_list: editingPlan.features_list,
        is_active: editingPlan.is_active,
        is_popular: editingPlan.is_popular,
        sort_order: editingPlan.sort_order
      };

      if (editingPlan.isNew) {
        planData.id = editingPlan.id;
        await createPlan(planData);
        setMessage({ type: 'success', text: 'Тариф создан!' });
      } else {
        await updatePlan(editingPlan.id, planData);
        setMessage({ type: 'success', text: 'Тариф сохранён!' });
      }
      
      setEditingPlan(null);
      loadData();
    } catch (e) {
      setMessage({ type: 'error', text: 'Ошибка: ' + e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSettings() {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    
    try {
      await updatePricingSettings(settings);
      setMessage({ type: 'success', text: 'Настройки сохранены!' });
      setEditingSettings(false);
    } catch (e) {
      setMessage({ type: 'error', text: 'Ошибка: ' + e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePlan() {
    if (!editingPlan || editingPlan.isNew) return;
    if (!window.confirm(`Удалить тариф "${editingPlan.name}"?`)) return;
    
    setSaving(true);
    try {
      await deletePlan(editingPlan.id);
      setMessage({ type: 'success', text: 'Тариф удалён' });
      setEditingPlan(null);
      loadData();
    } catch (e) {
      setMessage({ type: 'error', text: 'Ошибка: ' + e.message });
    } finally {
      setSaving(false);
    }
  }

  function handleEditPlan(plan) {
    setEditingPlan({ ...plan, features_list: plan.features_list || [] });
    setEditingSettings(false);
    setMessage(null);
  }

  function handleAddPlan() {
    setEditingPlan({
      id: '', name: '', price: 0, currency: 'TJS', interval: 'month',
      description: '', badge: '', features_list: [],
      is_active: true, is_popular: false, sort_order: plans.length + 1, isNew: true
    });
    setEditingSettings(false);
    setMessage(null);
  }

  function updateFeature(idx, value) {
    const list = [...(editingPlan.features_list || [])];
    list[idx] = value;
    setEditingPlan({ ...editingPlan, features_list: list });
  }

  function addFeature() {
    setEditingPlan({ ...editingPlan, features_list: [...(editingPlan.features_list || []), ''] });
  }

  function removeFeature(idx) {
    const list = [...(editingPlan.features_list || [])];
    list.splice(idx, 1);
    setEditingPlan({ ...editingPlan, features_list: list });
  }

  function updateAfterPaymentItem(idx, value) {
    const items = [...(settings.after_payment_items || [])];
    items[idx] = value;
    setSettings({ ...settings, after_payment_items: items });
  }

  function addAfterPaymentItem() {
    setSettings({ ...settings, after_payment_items: [...(settings.after_payment_items || []), ''] });
  }

  function removeAfterPaymentItem(idx) {
    const items = [...(settings.after_payment_items || [])];
    items.splice(idx, 1);
    setSettings({ ...settings, after_payment_items: items });
  }

  if (loading) return <Loader />;

  return (
    <div className="dm-plans-page">
      {message && (
        <div className={`dm-msg dm-msg--${message.type}`}>{message.text}</div>
      )}

      {/* === ТАРИФЫ === */}
      <section className="dm-section">
        <div className="dm-section__header">
          <h2>Тарифные планы</h2>
          <div className="dm-section__actions">
            <button className="dm-btn" onClick={loadData}>🔄</button>
            <button className="dm-btn dm-btn--primary" onClick={handleAddPlan}>+ Тариф</button>
          </div>
        </div>

        {/* Форма редактирования тарифа */}
        {editingPlan && (
          <div className="dm-form">
            <h3>{editingPlan.isNew ? 'Новый тариф' : `Редактирование: ${editingPlan.name}`}</h3>
            
            <div className="dm-form__row">
              <label>ID<input type="text" value={editingPlan.id} onChange={e => setEditingPlan({...editingPlan, id: e.target.value})} disabled={!editingPlan.isNew} /></label>
              <label>Название<input type="text" value={editingPlan.name} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} /></label>
              <label>Цена<input type="number" value={editingPlan.price} onChange={e => setEditingPlan({...editingPlan, price: parseFloat(e.target.value) || 0})} /></label>
              <label>Валюта
                <select value={editingPlan.currency} onChange={e => setEditingPlan({...editingPlan, currency: e.target.value})}>
                  <option value="TJS">сомони</option><option value="RUB">рубли</option><option value="USD">доллары</option>
                </select>
              </label>
              <label>Период
                <select value={editingPlan.interval} onChange={e => setEditingPlan({...editingPlan, interval: e.target.value})}>
                  <option value="month">Месяц</option><option value="year">Год</option>
                </select>
              </label>
              <label>Порядок<input type="number" value={editingPlan.sort_order || 0} onChange={e => setEditingPlan({...editingPlan, sort_order: parseInt(e.target.value) || 0})} /></label>
            </div>

            <div className="dm-form__row">
              <label className="dm-form__wide">Описание<input type="text" value={editingPlan.description || ''} onChange={e => setEditingPlan({...editingPlan, description: e.target.value})} /></label>
              <label>Бейдж<input type="text" value={editingPlan.badge || ''} onChange={e => setEditingPlan({...editingPlan, badge: e.target.value})} placeholder="Популярный" /></label>
            </div>

            <div className="dm-form__row dm-form__row--checkboxes">
              <label><input type="checkbox" checked={editingPlan.is_active !== false} onChange={e => setEditingPlan({...editingPlan, is_active: e.target.checked})} /> Активен</label>
              <label><input type="checkbox" checked={editingPlan.is_popular || false} onChange={e => setEditingPlan({...editingPlan, is_popular: e.target.checked})} /> Популярный</label>
            </div>

            <div className="dm-form__list">
              <label>Список возможностей:</label>
              {(editingPlan.features_list || []).map((f, i) => (
                <div key={i} className="dm-form__list-item">
                  <input type="text" value={f} onChange={e => updateFeature(i, e.target.value)} />
                  <button type="button" onClick={() => removeFeature(i)}>✕</button>
                </div>
              ))}
              <button type="button" className="dm-btn dm-btn--small" onClick={addFeature}>+ Пункт</button>
            </div>

            <div className="dm-form__actions">
              {!editingPlan.isNew && <button className="dm-btn dm-btn--danger" onClick={handleDeletePlan} disabled={saving}>Удалить</button>}
              <div style={{flex:1}} />
              <button className="dm-btn" onClick={() => setEditingPlan(null)} disabled={saving}>Отмена</button>
              <button className="dm-btn dm-btn--primary" onClick={handleSavePlan} disabled={saving}>{saving ? '...' : 'Сохранить'}</button>
            </div>
          </div>
        )}

        {/* Карточки тарифов */}
        <div className="dm-cards">
          {plans.map(p => (
            <div key={p.id} className={`dm-card ${p.is_popular ? 'dm-card--popular' : ''} ${!p.is_active ? 'dm-card--inactive' : ''}`} onClick={() => handleEditPlan(p)}>
              {p.badge && <div className="dm-card__badge">{p.badge}</div>}
              <div className="dm-card__name">{p.name}</div>
              <div className="dm-card__price">{p.price} {p.currency === 'TJS' ? 'с' : p.currency}<span>/ {p.interval === 'year' ? 'год' : 'мес'}</span></div>
              {p.description && <div className="dm-card__desc">{p.description}</div>}
              <ul className="dm-card__features">{(p.features_list || []).map((f, i) => <li key={i}>{f}</li>)}</ul>
              {!p.is_active && <div className="dm-card__inactive">Неактивен</div>}
            </div>
          ))}
        </div>
      </section>

      {/* === РАЗДЕЛИТЕЛЬ === */}
      <hr className="dm-divider" />

      {/* === НАСТРОЙКИ СТРАНИЦЫ === */}
      <section className="dm-section">
        <div className="dm-section__header">
          <h2>Настройки страницы /pricing</h2>
          <button className="dm-btn dm-btn--primary" onClick={() => { setEditingSettings(!editingSettings); setEditingPlan(null); }}>
            {editingSettings ? 'Свернуть' : 'Редактировать'}
          </button>
        </div>

        {editingSettings && settings && (
          <div className="dm-form">
            <h4>Соцсети</h4>
            <div className="dm-form__row">
              <label className="dm-form__wide">Заголовок<input type="text" value={settings.social_title || ''} onChange={e => setSettings({...settings, social_title: e.target.value})} /></label>
            </div>
            <div className="dm-form__row">
              <label className="dm-form__wide">Текст<input type="text" value={settings.social_text || ''} onChange={e => setSettings({...settings, social_text: e.target.value})} /></label>
            </div>
            <div className="dm-form__row">
              <label>Telegram<input type="text" value={settings.telegram_url || ''} onChange={e => setSettings({...settings, telegram_url: e.target.value})} /></label>
              <label>Instagram<input type="text" value={settings.instagram_url || ''} onChange={e => setSettings({...settings, instagram_url: e.target.value})} /></label>
              <label>YouTube<input type="text" value={settings.youtube_url || ''} onChange={e => setSettings({...settings, youtube_url: e.target.value})} /></label>
            </div>

            <h4>Подсказка по оплате</h4>
            <div className="dm-form__row">
              <label className="dm-form__wide">Текст под кнопкой оплаты<textarea value={settings.payment_hint || ''} onChange={e => setSettings({...settings, payment_hint: e.target.value})} /></label>
            </div>

            <h4>Шаги оплаты</h4>
            <div className="dm-form__row">
              <label className="dm-form__wide">Шаг 1<input type="text" value={settings.step1_text || ''} onChange={e => setSettings({...settings, step1_text: e.target.value})} /></label>
            </div>
            <div className="dm-form__row">
              <label className="dm-form__wide">Шаг 2<input type="text" value={settings.step2_text || ''} onChange={e => setSettings({...settings, step2_text: e.target.value})} /></label>
            </div>
            <div className="dm-form__row">
              <label className="dm-form__wide">Шаг 3<input type="text" value={settings.step3_text || ''} onChange={e => setSettings({...settings, step3_text: e.target.value})} /></label>
            </div>

            <h4>Что происходит после оплаты</h4>
            <div className="dm-form__list">
              {(settings.after_payment_items || []).map((item, i) => (
                <div key={i} className="dm-form__list-item">
                  <input type="text" value={item} onChange={e => updateAfterPaymentItem(i, e.target.value)} />
                  <button type="button" onClick={() => removeAfterPaymentItem(i)}>✕</button>
                </div>
              ))}
              <button type="button" className="dm-btn dm-btn--small" onClick={addAfterPaymentItem}>+ Пункт</button>
            </div>

            <h4>Юридическая информация</h4>
            <div className="dm-form__row">
              <label className="dm-form__wide">Краткий текст<textarea value={settings.legal_text || ''} onChange={e => setSettings({...settings, legal_text: e.target.value})} /></label>
            </div>
            <div className="dm-form__row">
              <label className="dm-form__wide">Антифрод текст<textarea value={settings.antifraud_text || ''} onChange={e => setSettings({...settings, antifraud_text: e.target.value})} rows={3} /></label>
            </div>

            <h4>Реферальная программа</h4>
            <div className="dm-form__row">
              <label className="dm-form__wide">Заголовок<input type="text" value={settings.referral_title || ''} onChange={e => setSettings({...settings, referral_title: e.target.value})} /></label>
            </div>
            <div className="dm-form__row">
              <label className="dm-form__wide">Основной текст<textarea value={settings.referral_text || ''} onChange={e => setSettings({...settings, referral_text: e.target.value})} /></label>
            </div>
            <div className="dm-form__row">
              <label className="dm-form__wide">Бонус за 7 друзей<textarea value={settings.referral_bonus_text || ''} onChange={e => setSettings({...settings, referral_bonus_text: e.target.value})} /></label>
            </div>

            <h4>Альтернативная оплата</h4>
            <div className="dm-form__row">
              <label className="dm-form__wide">Заголовок<input type="text" value={settings.alternative_title || ''} onChange={e => setSettings({...settings, alternative_title: e.target.value})} /></label>
            </div>
            <div className="dm-form__row">
              <label className="dm-form__wide">Текст<textarea value={settings.alternative_text || ''} onChange={e => setSettings({...settings, alternative_text: e.target.value})} /></label>
            </div>

            <div className="dm-form__actions">
              <button className="dm-btn" onClick={() => setEditingSettings(false)} disabled={saving}>Отмена</button>
              <button className="dm-btn dm-btn--primary" onClick={handleSaveSettings} disabled={saving}>{saving ? '...' : 'Сохранить настройки'}</button>
            </div>
          </div>
        )}

        {!editingSettings && (
          <p className="dm-hint">Нажмите "Редактировать" чтобы изменить тексты, ссылки и настройки страницы тарифов.</p>
        )}
      </section>

      <style>{`
        .dm-plans-page { max-width: 1000px; }
        .dm-section { margin-bottom: 32px; }
        .dm-section__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .dm-section__header h2 { margin: 0; font-size: 18px; font-weight: 600; }
        .dm-section__actions { display: flex; gap: 8px; }
        
        .dm-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); background: #fff; font-size: 13px; cursor: pointer; }
        .dm-btn:hover { background: #f5f5f7; }
        .dm-btn--primary { background: #007aff; color: #fff; border-color: #007aff; }
        .dm-btn--primary:hover { background: #0066d6; }
        .dm-btn--danger { background: #ff3b30; color: #fff; border-color: #ff3b30; }
        .dm-btn--small { padding: 6px 12px; font-size: 12px; }
        .dm-btn:disabled { opacity: 0.5; }
        
        .dm-msg { padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
        .dm-msg--success { background: #e8f5e9; color: #2e7d32; }
        .dm-msg--error { background: #ffebee; color: #c62828; }
        
        .dm-form { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 2px solid #007aff; }
        .dm-form h3 { margin: 0 0 16px; font-size: 16px; }
        .dm-form h4 { margin: 20px 0 12px; font-size: 13px; color: #86868b; font-weight: 600; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 16px; }
        .dm-form h4:first-of-type { border-top: none; margin-top: 0; padding-top: 0; }
        .dm-form__row { display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
        .dm-form__row label { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #86868b; min-width: 100px; flex: 1; }
        .dm-form__row--checkboxes label { flex-direction: row; align-items: center; gap: 6px; font-size: 13px; color: #1d1d1f; flex: none; }
        .dm-form__wide { flex: 2 !important; min-width: 200px; }
        .dm-form__row input, .dm-form__row select, .dm-form__row textarea { padding: 8px 10px; border: 1px solid rgba(0,0,0,0.1); border-radius: 6px; font-size: 14px; }
        .dm-form__row input:focus, .dm-form__row select:focus, .dm-form__row textarea:focus { outline: none; border-color: #007aff; }
        .dm-form__row textarea { min-height: 60px; resize: vertical; }
        .dm-form__row input[type="checkbox"] { width: 16px; height: 16px; }
        
        .dm-form__list { margin: 12px 0; }
        .dm-form__list > label { display: block; font-size: 11px; color: #86868b; margin-bottom: 8px; }
        .dm-form__list-item { display: flex; gap: 8px; margin-bottom: 6px; }
        .dm-form__list-item input { flex: 1; padding: 8px; border: 1px solid rgba(0,0,0,0.1); border-radius: 6px; }
        .dm-form__list-item button { width: 32px; height: 32px; border: none; background: #ffebee; color: #c62828; border-radius: 6px; cursor: pointer; }
        
        .dm-form__actions { display: flex; gap: 12px; margin-top: 20px; }
        
        .dm-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
        .dm-card { background: #fff; border-radius: 12px; padding: 20px; cursor: pointer; border: 1px solid rgba(0,0,0,0.06); position: relative; transition: all 0.15s; }
        .dm-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .dm-card--popular { border: 2px solid #007aff; }
        .dm-card--inactive { opacity: 0.5; }
        .dm-card__badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #007aff; color: #fff; padding: 4px 12px; border-radius: 10px; font-size: 11px; font-weight: 600; }
        .dm-card__name { font-size: 18px; font-weight: 600; text-align: center; margin-top: 8px; }
        .dm-card__price { font-size: 28px; font-weight: 700; text-align: center; margin: 8px 0; }
        .dm-card__price span { font-size: 14px; font-weight: 400; color: #86868b; }
        .dm-card__desc { font-size: 13px; color: #86868b; text-align: center; margin-bottom: 12px; }
        .dm-card__features { list-style: none; padding: 0; margin: 0; font-size: 13px; }
        .dm-card__features li { padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.04); }
        .dm-card__features li:last-child { border: none; }
        .dm-card__inactive { text-align: center; color: #c62828; font-size: 12px; margin-top: 8px; }
        
        .dm-divider { border: none; border-top: 2px solid rgba(0,0,0,0.08); margin: 32px 0; }
        
        .dm-hint { color: #86868b; font-size: 13px; padding: 16px; background: #f9f9f9; border-radius: 8px; }
      `}</style>
    </div>
  );
}
