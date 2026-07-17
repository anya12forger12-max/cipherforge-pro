import { useState } from 'react';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  X
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Encryption Complete',
    message: 'Your text has been encrypted successfully.',
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    read: false
  },
  {
    id: '2',
    type: 'info',
    title: 'Analysis Started',
    message: 'Frequency analysis is in progress.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    read: true
  },
  {
    id: '3',
    type: 'warning',
    title: 'Weak Cipher Detected',
    message: 'Caesar cipher is not recommended for secure communications.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    read: true
  }
];

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />;
      case 'warning':
        return <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />;
      case 'error':
        return <XCircle size={16} style={{ color: 'var(--color-error)' }} />;
      case 'info':
        return <Info size={16} style={{ color: 'var(--color-info)' }} />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        style={{
          position: 'fixed',
          bottom: 'var(--spacing-lg)',
          right: 'var(--spacing-lg)',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 900
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '20px',
              height: '20px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-error)',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          aria-modal="true"
          style={{
            position: 'fixed',
            bottom: '80px',
            right: 'var(--spacing-lg)',
            width: '380px',
            maxHeight: '500px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            zIndex: 1000
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--spacing-md)',
              borderBottom: '1px solid var(--color-border)'
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Notifications</h2>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                onClick={markAllAsRead}
                className="button button-ghost"
                style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
              >
                Mark all read
              </button>
              <button
                onClick={clearAll}
                className="button button-ghost"
                style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
              >
                Clear all
              </button>
            </div>
          </div>

          <div
            style={{
              maxHeight: '400px',
              overflowY: 'auto'
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: 'var(--spacing-xl)',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)'
                }}
              >
                No notifications
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  style={{
                    display: 'flex',
                    gap: 'var(--spacing-md)',
                    padding: 'var(--spacing-md)',
                    borderBottom: '1px solid var(--color-border)',
                    backgroundColor: notification.read ? 'transparent' : 'color-mix(in srgb, var(--color-primary) 5%, transparent)',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast)'
                  }}
                >
                  <div style={{ marginTop: '2px' }}>
                    {getIcon(notification.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--spacing-xs)'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: notification.read ? 400 : 600
                        }}
                      >
                        {notification.title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                        aria-label={`Dismiss ${notification.title}`}
                        style={{
                          padding: '2px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--color-text-secondary)',
                          cursor: 'pointer',
                          borderRadius: 'var(--border-radius-sm)'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-text-secondary)',
                        marginBottom: 'var(--spacing-xs)'
                      }}
                    >
                      {notification.message}
                    </p>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)'
                      }}
                    >
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
