// src/admin/AdminApp.jsx
import React from 'react';
import './admin.css';
import AdminLayout from './layout/AdminLayout';
import { AdminProvider } from './store/adminStore';

export default function AdminApp() {
  return (
    <AdminProvider>
      <AdminLayout />
    </AdminProvider>
  );
}
