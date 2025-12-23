// src/admin/components/AdminDateRangeStub.jsx
import React from 'react';

export default function AdminDateRangeStub() {
  return (
    <div className="dm-admin-daterange">
      <label className="dm-admin-daterange__label">Период</label>
      <div className="dm-admin-daterange__inputs">
        <input type="date" className="dm-admin-daterange__input" />
        <span className="dm-admin-daterange__separator">-</span>
        <input type="date" className="dm-admin-daterange__input" />
      </div>
      <p className="dm-admin-daterange__hint">
        Фильтр по датам будет подключён позже.
      </p>
    </div>
  );
}

