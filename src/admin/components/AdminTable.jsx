// src/admin/components/AdminTable.jsx
import React from 'react';

export default function AdminTable({
  columns,
  rows,
  getRowKey,
  actionsLabel,
}) {
  return (
    <div className="dm-admin-table">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {actionsLabel && <th className="dm-admin-table__actions-header">Действия</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actionsLabel ? 1 : 0)}>
                <div className="dm-admin-table__empty">
                  Нет данных для отображения.
                </div>
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((col) => (
                  <td key={col.key}>{row[col.key]}</td>
                ))}
                {actionsLabel && (
                  <td className="dm-admin-table__actions">{actionsLabel}</td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
