import { HTMLAttributes } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'elevated';
}

export function Card({ children, variant = 'default', className, ...props }: CardProps) {
  const variantStyles = {
    default: 'bg-white dark:bg-gray-800 shadow-md',
    outline: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg',
  };

  return (
    <div
      className={clsx('rounded-lg p-6', variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div className={clsx('mb-4 pb-4 border-b border-gray-200 dark:border-gray-700', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ children, className, ...props }: CardTitleProps) {
  return (
    <h3 className={clsx('text-xl font-semibold text-gray-900 dark:text-white', className)} {...props}>
      {children}
    </h3>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={clsx(className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div className={clsx('mt-4 pt-4 border-t border-gray-200 dark:border-gray-700', className)} {...props}>
      {children}
    </div>
  );
}
