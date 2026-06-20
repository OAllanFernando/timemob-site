'use client';

import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function getInitials(firstName?: string, lastName?: string, login?: string) {
    const first = firstName?.[0];
    const last = lastName?.[0];
    if (first && last) return `${first}${last}`.toUpperCase();
    if (first) return first.toUpperCase();
    if (login) return login.slice(0, 2).toUpperCase();
    return '??';
}

export function UserMenu() {
    const tAuth = useTranslations('auth');
    const { user, logout } = useAuth();

    if (!user) return null;

    const displayName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.login;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={displayName}>
                    <Avatar size="sm">
                        {user.imageUrl ? <AvatarImage src={user.imageUrl} alt={displayName} /> : null}
                        <AvatarFallback>
                            {getInitials(user.firstName, user.lastName, user.login)}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuLabel>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{displayName}</span>
                        {user.email && (
                            <span className="text-xs text-muted-foreground">
                                {user.email}
                            </span>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void logout()}>
                    <LogOut className="size-4" />
                    {tAuth('logout')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
