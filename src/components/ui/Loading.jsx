
import React from 'react';

export const Spinner = ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-md ${className}`}></div>
);

export const TableSkeleton = ({ rows = 5 }) => (
    <div className="w-full space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
        ))}
    </div>
);

export const CardSkeleton = () => (
    <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
    </div>
);
