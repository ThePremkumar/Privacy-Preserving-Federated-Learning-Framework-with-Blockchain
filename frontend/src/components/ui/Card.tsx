import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn('rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300', className)}>
    {children}
  </div>
);

export const CardHeader = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn('mb-4 flex flex-col space-y-1.5', className)}>{children}</div>
);

export const CardTitle = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <h3 className={cn('text-xl font-bold leading-tight text-slate-900', className)}>{children}</h3>
);

export const CardDescription = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <p className={cn('text-sm text-slate-500 leading-relaxed', className)}>{children}</p>
);

export const CardContent = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn('relative', className)}>{children}</div>
);

export const CardFooter = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn('mt-6 flex items-center justify-end space-x-2', className)}>{children}</div>
);
