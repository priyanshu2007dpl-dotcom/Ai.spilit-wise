import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-brown-700 mb-1.5">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={`w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-brown-900 placeholder:text-brown-300 focus:outline-none focus:ring-2 focus:ring-brown-400 focus:border-transparent transition-all ${icon ? 'pl-10' : ''} ${error ? 'border-danger-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-danger-600 mt-1">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-brown-700 mb-1.5">{label}</label>
      )}
      <textarea
        className={`w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-brown-900 placeholder:text-brown-300 focus:outline-none focus:ring-2 focus:ring-brown-400 focus:border-transparent transition-all resize-none ${error ? 'border-danger-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-danger-600 mt-1">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function Select({ label, error, className = '', children, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-brown-700 mb-1.5">{label}</label>
      )}
      <select
        className={`w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-400 focus:border-transparent transition-all appearance-none bg-no-repeat ${error ? 'border-danger-500' : ''} ${className}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a06d44' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundPosition: 'right 0.75rem center',
          paddingRight: '2rem',
        }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-sm text-danger-600 mt-1">{error}</p>}
    </div>
  );
}
