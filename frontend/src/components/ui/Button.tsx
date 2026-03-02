import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-95 transition-all duration-200',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-sm active:scale-95 transition-all duration-200',
      outline: 'border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-800 transition-all duration-200',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-800 transition-all duration-200',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-95 transition-all duration-200',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm active:scale-95 transition-all duration-200',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs font-medium rounded-md',
      md: 'px-4 py-2 text-sm font-semibold rounded-lg',
      lg: 'px-6 py-3 text-base font-bold rounded-xl',
      icon: 'p-2 rounded-full',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 ring-offset-background',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
