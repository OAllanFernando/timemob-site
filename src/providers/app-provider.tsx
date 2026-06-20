'use client';

import { ReactNode } from 'react';

import { AuthProvider } from '@/contexts/auth-context';
import { TooltipProvider } from '@/components/ui/tooltip';

interface Props {
    children: ReactNode;
}

export function AppProvider({ children }: Props) {
    return (
        <AuthProvider>
            <TooltipProvider>{children}</TooltipProvider>
        </AuthProvider>
    );
}
