'use client';
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ======================== BUTTON ========================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary', size = 'md', loading = false,
  icon, iconRight, fullWidth = false, children, className = '', disabled, onClick, ...props
}: ButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    // Ripple
    const btn = btnRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const ripple = document.createElement('span');
      ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${x}px;top:${y}px;border-radius:50%;background:rgba(255,255,255,0.35);pointer-events:none;animation:ripple-animation 600ms ease-out forwards;transform:scale(0)`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    }
    onClick?.(e);
  }, [disabled, loading, onClick]);

  const variants = {
    primary: 'bg-[#1B5E20] hover:bg-[#154620] text-white shadow-sm',
    secondary: 'bg-white border-2 border-[#1B5E20] text-[#1B5E20] hover:bg-[#E8F5E9]',
    ghost: 'bg-transparent text-[#1B5E20] hover:bg-[#E8F5E9]',
    danger: 'bg-[#F44336] hover:bg-[#C62828] text-white shadow-sm',
    accent: 'bg-[#FF6F00] hover:bg-[#E65100] text-white shadow-sm',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs h-8 gap-1.5',
    md: 'px-6 py-3 text-sm h-11 gap-2',
    lg: 'px-8 py-4 text-base h-13 gap-2',
  };

  return (
    // @ts-expect-error framer-motion + React 19 type mismatch on motion.button
    <motion.button
      ref={btnRef}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden inline-flex items-center justify-center font-semibold rounded-lg
        transition-colors duration-150 cursor-pointer select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
        </>
      )}
    </motion.button>
  );
}

// ======================== INPUT ========================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  success?: boolean;
}

export function Input({
  label, error, helper, leftIcon, rightIcon, success,
  className = '', id, ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-[#212121]">
          {label}
          {props.required && <span className="text-[#F44336] ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]">{leftIcon}</div>
        )}
        <input
          id={inputId}
          className={`
            w-full h-11 px-4 text-sm rounded-lg border transition-all duration-150 bg-[#FAFAFA]
            focus:outline-none focus:bg-white focus:ring-2
            ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''}
            ${error
              ? 'border-[#F44336] focus:border-[#F44336] focus:ring-red-100'
              : success
                ? 'border-[#4CAF50] focus:border-[#4CAF50] focus:ring-green-100'
                : 'border-[#E0E0E0] focus:border-[#1B5E20] focus:ring-green-100'
            }
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999]">{rightIcon}</div>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-[#F44336] flex items-center gap-1"
        >
          <span>⚠</span> {error}
        </motion.p>
      )}
      {helper && !error && (
        <p className="text-xs text-[#999]">{helper}</p>
      )}
    </div>
  );
}

// ======================== BADGE ========================
type BadgeVariant = 'success' | 'error' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

export function Badge({ variant = 'neutral', children, className = '' }: {
  variant?: BadgeVariant; children: React.ReactNode; className?: string;
}) {
  const styles: Record<BadgeVariant, string> = {
    success: 'bg-[#E8F5E9] text-[#2E7D32]',
    error: 'bg-[#FFEBEE] text-[#C62828]',
    danger: 'bg-[#FFEBEE] text-[#C62828]',
    warning: 'bg-[#FFF3E0] text-[#E65100]',
    info: 'bg-[#E3F2FD] text-[#1565C0]',
    neutral: 'bg-[#F5F5F5] text-[#616161]',
    primary: 'bg-[#E8F5E9] text-[#1B5E20]',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ======================== SPINNER ========================
export function Spinner({ size = 'md', color = '#1B5E20' }: { size?: 'sm' | 'md' | 'lg'; color?: string }) {
  const sizes = { sm: 16, md: 24, lg: 36 };
  const s = sizes[size];
  return (
    <svg className="animate-spin" width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0110 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ======================== SKELETON ========================
export function Skeleton({ className = '', width, height }: {
  className?: string; width?: string | number; height?: string | number;
}) {
  return (
    <div
      className={`skeleton rounded-lg ${className}`}
      style={{ width, height: height ?? 16 }}
    />
  );
}

export function TruckCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
      <Skeleton height={180} className="w-full rounded-lg" />
      <div className="flex gap-2">
        <Skeleton height={20} width={80} />
        <Skeleton height={20} width={60} />
      </div>
      <Skeleton height={16} width="60%" />
      <div className="flex justify-between items-center">
        <Skeleton height={24} width={100} />
        <Skeleton height={36} width={90} className="rounded-lg" />
      </div>
    </div>
  );
}

// ======================== MODAL ========================
export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title?: string;
  children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} z-10 max-h-[90vh] overflow-y-auto`}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-[#212121]">{title}</h3>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                  ✕
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ======================== STAR RATING ========================
export function StarRating({ value = 0, onChange, readonly = false, size = 'md' }: {
  value?: number; onChange?: (v: number) => void; readonly?: boolean; size?: 'sm' | 'md' | 'lg';
}) {
  const [hover, setHover] = useState(0);
  const sizes = { sm: 14, md: 20, lg: 28 };
  const s = sizes[size];
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star} type="button"
          whileHover={!readonly ? { scale: 1.2 } : {}}
          whileTap={!readonly ? { scale: 0.9 } : {}}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          style={{ lineHeight: 1 }}
        >
          <svg width={s} height={s} viewBox="0 0 24 24" fill={star <= (hover || value) ? '#FFC107' : '#E0E0E0'}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </motion.button>
      ))}
    </div>
  );
}

// ======================== STATS CARD ========================
export function StatsCard({ label, value, subtext, icon, trend, color = 'green' }: {
  label: string; value: string; subtext?: string; icon?: React.ReactNode;
  trend?: { value: number; positive: boolean }; color?: 'green' | 'orange' | 'blue' | 'red';
}) {
  const colors = {
    green: 'from-[#1B5E20] to-[#2E7D32]',
    orange: 'from-[#E65100] to-[#FF6F00]',
    blue: 'from-[#1565C0] to-[#2196F3]',
    red: 'from-[#C62828] to-[#F44336]',
  };
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#666] font-medium">{label}</span>
        {icon && (
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white`}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#212121]">{value}</p>
        {subtext && <p className="text-xs text-[#999] mt-0.5">{subtext}</p>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-[#2E7D32]' : 'text-[#C62828]'}`}>
          <span>{trend.positive ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}% vs last month</span>
        </div>
      )}
    </motion.div>
  );
}

// ======================== PROGRESS TIMELINE ========================
export function BookingTimeline({ steps }: {
  steps: { label: string; done: boolean; active?: boolean; time?: string }[];
}) {
  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3 pb-4 relative">
          {i < steps.length - 1 && (
            <div className={`absolute left-3.5 top-7 bottom-0 w-0.5 ${step.done ? 'bg-[#1B5E20]' : 'bg-[#E0E0E0]'}`} />
          )}
          <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold z-10 ${step.done ? 'bg-[#1B5E20] text-white' :
              step.active ? 'bg-[#FF6F00] text-white animate-pulse' :
                'bg-[#F5F5F5] text-[#999] border-2 border-[#E0E0E0]'
            }`}>
            {step.done ? '✓' : i + 1}
          </div>
          <div className="pt-0.5 flex-1">
            <p className={`text-sm font-semibold ${step.done ? 'text-[#1B5E20]' : step.active ? 'text-[#FF6F00]' : 'text-[#999]'}`}>
              {step.label}
            </p>
            {step.time && <p className="text-xs text-[#999]">{step.time}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ======================== TOAST ========================
let toastId = 0;
const toastListeners: Array<(toasts: ToastItem[]) => void> = [];
let currentToasts: ToastItem[] = [];

interface ToastItem { id: number; message: string; type: 'success' | 'error' | 'info' | 'warning' }

function notifyListeners() {
  toastListeners.forEach(fn => fn([...currentToasts]));
}

export const toast = {
  success: (msg: string) => addToast(msg, 'success'),
  error: (msg: string) => addToast(msg, 'error'),
  info: (msg: string) => addToast(msg, 'info'),
  warning: (msg: string) => addToast(msg, 'warning'),
};

function addToast(message: string, type: ToastItem['type']) {
  const id = ++toastId;
  currentToasts = [...currentToasts, { id, message, type }];
  notifyListeners();
  setTimeout(() => {
    currentToasts = currentToasts.filter(t => t.id !== id);
    notifyListeners();
  }, 4000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  React.useEffect(() => {
    toastListeners.push(setToasts);
    return () => { const i = toastListeners.indexOf(setToasts); if (i > -1) toastListeners.splice(i, 1); };
  }, []);

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const colors = {
    success: 'bg-[#1B5E20] text-white', error: 'bg-[#F44336] text-white',
    info: 'bg-[#1565C0] text-white', warning: 'bg-[#FF6F00] text-white',
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl min-w-[280px] max-w-sm ${colors[t.type]}`}
          >
            <span className="text-lg font-bold text-white">{icons[t.type]}</span>
            <p className="text-sm font-medium flex-1 text-white">{t.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
