'use client';

import { ReactNode } from 'react';

import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

interface Props {
    children: ReactNode;
}

export function AppProvider({ children }: Props) {
    return (
        <AuthProvider>
            <TooltipProvider>
                {children}
                <Toaster richColors position="top-right" />
            </TooltipProvider>
        </AuthProvider>
    );
}
