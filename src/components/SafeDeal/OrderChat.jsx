// src/components/SafeDeal/OrderChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getOrderMessages, sendOrderMessage, subscribeToOrderMessages } from '../../services/safeDealService';
import { useAuth } from '../../lib/useAuth';
import './OrderChat.css';

export default function OrderChat({ orderId, order }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadMessages();
    
    // Подписка на новые сообщения
    const unsubscribe = subscribeToOrderMessages(orderId, (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => unsubscribe();
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadMessages() {
    const data = await getOrderMessages(orderId);
    setMessages(data);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setError(null);

    try {
      const result = await sendOrderMessage(orderId, user.id, newMessage.trim());
      
      if (result.blocked) {
        setError(`⚠️ Сообщение заблокировано: ${result.reason}. Передача контактов запрещена!`);
      } else {
        setNewMessage('');
      }
    } catch (err) {
      setError('Ошибка отправки сообщения');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  const isMyMessage = (msg) => msg.sender_id === user?.id;
  const canChat = order && ['paid', 'in_progress', 'delivered'].includes(order.status);

  return (
    <div className="order-chat">
      <div className="order-chat__header">
        <span className="order-chat__title">💬 Чат заказа</span>
        <span className="order-chat__hint">Общение только по заказу. Контакты запрещены.</span>
      </div>

      <div className="order-chat__messages">
        {messages.length === 0 ? (
          <div className="order-chat__empty">
            <p>Начните общение по заказу</p>
            <small>Все сообщения сохраняются и проверяются</small>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`order-chat__message ${isMyMessage(msg) ? 'order-chat__message--mine' : ''} ${msg.is_filtered ? 'order-chat__message--filtered' : ''}`}
            >
              {!isMyMessage(msg) && (
                <div className="order-chat__avatar">
                  {msg.sender?.avatar_url ? (
                    <img src={msg.sender.avatar_url} alt="" />
                  ) : (
                    <span>{(msg.sender?.display_name || msg.sender?.username || '?')[0]}</span>
                  )}
                </div>
              )}
              <div className="order-chat__bubble">
                {!isMyMessage(msg) && (
                  <div className="order-chat__sender">
                    {msg.sender?.display_name || msg.sender?.username || 'Пользователь'}
                  </div>
                )}
                <div className="order-chat__text">
                  {msg.message_type === 'system' ? (
                    <span className="order-chat__system">{msg.message}</span>
                  ) : (
                    msg.message
                  )}
                </div>
                <div className="order-chat__time">
                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="order-chat__error">{error}</div>
      )}

      {canChat ? (
        <form className="order-chat__form" onSubmit={handleSend}>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Напишите сообщение..."
            disabled={sending}
            maxLength={1000}
          />
          <button type="submit" disabled={!newMessage.trim() || sending}>
            {sending ? '...' : '→'}
          </button>
        </form>
      ) : (
        <div className="order-chat__disabled">
          {order?.status === 'pending' && 'Чат доступен после оплаты'}
          {order?.status === 'completed' && 'Заказ завершён'}
          {order?.status === 'cancelled' && 'Заказ отменён'}
          {order?.status === 'dispute' && 'Заказ на рассмотрении'}
        </div>
      )}

      <div className="order-chat__warning">
        🔒 Передача контактов (телефон, email, мессенджеры) запрещена и ведёт к блокировке
      </div>
    </div>
  );
}

