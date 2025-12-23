// src/admin/components/AdminStatCard.jsx
import React from 'react';

export default function AdminStatCard({ label, value, hint }) {
  return (
    <div className="dm-admin-stat-card">
      <div className="dm-admin-stat-card__label">{label}</div>
      <div className="dm-admin-stat-card__value">{value}</div>
      {hint && <div className="dm-admin-stat-card__hint">{hint}</div>}
    </div>
  );
}
