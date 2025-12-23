import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import "./Toast.css";

let toastId = 0;
let addToastFn = null;

/**
 * Глобальная функция для показа toast
 */
export function showToast(message, type = "success") {
  if (addToastFn) {
    addToastFn({ id: ++toastId, message, type });
  }
}

/**
 * Провайдер Toast - добавить один раз в корень приложения или страницы
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    setToasts(prev => [...prev, toast]);
    
    // Автоудаление через 3 сек
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 3000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  return (
    <>
      {children}
      {createPortal(
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast--${t.type}`}>
              {t.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
