// src/admin/components/AdminStatusBadge.jsx
import React from 'react';

const STATUS_LABELS = {
  active: 'Активен',
  expired: 'Истёк',
  free: 'Free',
  blocked: 'Заблокирован',
  pending: 'Ожидает',
  canceled: 'Отменён',
  error: 'Ошибка',
  'Не найден': 'Не найден',
  published: 'Публичен',
  hidden: 'Скрыт',
  публичен: 'Публичен',
  скрыт: 'Скрыт',
  lifetime: 'Навсегда',
  success: 'Успешно',
};

function getStatusModifier(status) {
  if (['active', 'published', 'публичен', 'lifetime', 'success'].includes(status)) {
    return '--success';
  }
  if (['expired', 'pending', 'canceled', 'free', 'warning'].includes(status)) {
    return '--warning';
  }
  if (['blocked', 'error', 'hidden', 'скрыт', 'Не найден', 'danger'].includes(status)) {
    return '--danger';
  }
  return '--success'; // по умолчанию
}

export default function AdminStatusBadge({ status, label }) {
  const displayLabel = label || STATUS_LABELS[status] || status;
  const modifier = getStatusModifier(status);

  return (
    <span className={`dm-admin-status-badge dm-admin-status-badge${modifier}`}>
      {displayLabel}
    </span>
  );
}
