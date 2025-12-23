// src/admin/components/AdminFilterBar.jsx
import React, { useState } from 'react';

export default function AdminFilterBar({ items }) {
  const [active, setActive] = useState(items[0]?.key);

  return (
    <div className="dm-admin-filterbar">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={
            'dm-admin-filterbar__item' +
            (item.key === active ? ' dm-admin-filterbar__item--active' : '')
          }
          onClick={() => setActive(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
