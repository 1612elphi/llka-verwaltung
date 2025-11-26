/**
 * Top navigation bar component
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  Calendar,
  Settings,
  FileText,
  LogOut,
  MoreVertical,
  User,
  Command,
  ArrowBigUp as Shift,
  Option,
  Zap,
  Tag,
  ClipboardCheck,
  Layers,
  BarChart3,
  AlertCircle,
  Search,
  Keyboard,
  ArrowRight,
} from 'lucide-react';
import { NavLink } from './nav-link';
import { IdentityPicker } from './identity-picker';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useQuickFind } from '@/hooks/use-quick-find';
import { useSequentialMode } from '@/hooks/use-sequential-mode';
import { useCommandMenu } from '@/hooks/use-command-menu';
import { useKeyboardShortcutsReferenceContext } from '@/components/keyboard-shortcuts/keyboard-shortcuts-reference';

const navigationItems = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    href: '/customers',
    icon: Users,
    label: 'Nutzer:innen',
  },
  {
    href: '/items',
    icon: Package,
    label: 'Gegenstände',
  },
  {
    href: '/rentals',
    icon: ClipboardList,
    label: 'Leihvorgänge',
  },
  {
    href: '/reservations',
    icon: Calendar,
    label: 'Reservierungen',
  },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { setOpen } = useQuickFind();
  const { setOpen: setSequentialModeOpen } = useSequentialMode();
  const { setOpen: setCommandMenuOpen } = useCommandMenu();
  const { setOpen: setKeyboardShortcutsOpen } = useKeyboardShortcutsReferenceContext();
  const userEmail = (user as any)?.email || 'admin@leihlokal.de';

  // State for current time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Detect OS for keyboard shortcut display
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time and date
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b-2 border-primary bg-background">
      <div className="flex h-full items-center px-4">
        {/* Logo */}
        <div
          onDoubleClick={() => setSequentialModeOpen(true)}
          className="flex items-center cursor-pointer"
          title="Doppelklick für Sequential Mode"
        >
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/smile.svg"
              alt="LeihLokal"
              width={40}
              height={40}
              className="h-10 w-10"
              unoptimized
              priority
            />
          </Link>
        </div>

        {/* Main Navigation */}
        <div className="ml-8 flex flex-1 items-center space-x-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </div>

        {/* Time and Date */}
        <div className="flex flex-col items-end mr-4 text-sm">

          <div className="font-mono">
            {currentTime.toLocaleDateString('de-DE', { 
              day: '2-digit', 
              month: '2-digit', 
              year: '2-digit' 
            })}
          </div>
        </div>

        {/* Identity Picker */}
        <IdentityPicker />

        {/* Quick Find Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="mr-2 h-7 px-2 gap-1.5 hover:bg-accent transition-colors"
          title="Quick Find (O → F)"
        >
          <Zap className="h-3 w-3" />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.5 font-medium bg-muted border border-border rounded text-xs">
            <span>O</span>
            <ArrowRight className="h-2.5 w-2.5" />
            <span>F</span>
          </kbd>
        </Button>

        {/* Overflow Menu */}
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mehr</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCommandMenuOpen(true)}>
                <Search className="mr-2 h-4 w-4" />
                <span>Suche</span>
                <kbd className="ml-auto inline-flex items-center gap-0.5 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground rounded border border-border">
                  <span>O</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>S</span>
                </kbd>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpen(true)}>
                <Zap className="mr-2 h-4 w-4" />
                <span>Finden</span>
                <kbd className="ml-auto inline-flex items-center gap-0.5 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground rounded border border-border">
                  <span>O</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>F</span>
                </kbd>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSequentialModeOpen(true)}>
                <Layers className="mr-2 h-4 w-4" />
                <span>Eintragen</span>
                <kbd className="ml-auto inline-flex items-center gap-0.5 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground rounded border border-border">
                  <span>O</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>O</span>
                </kbd>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/overdue" className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    <span>Überfällige Ausleihen</span>
                  </div>
                  <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground rounded border border-border">
                    <span>G</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>O</span>
                  </kbd>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/items/analytics" className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Inventaranalyse</span>
                  </div>
                  <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground rounded border border-border">
                    <span>G</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>I</span>
                  </kbd>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/system-check" className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    <span>Systemcheck</span>
                  </div>
                  <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground rounded border border-border">
                    <span>G</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>S</span>
                  </kbd>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/label-designer" className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <Tag className="mr-2 h-4 w-4" />
                    <span>Label Designer</span>
                  </div>
                  <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground rounded border border-border">
                    <span>G</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>P</span>
                  </kbd>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/logs" className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Logs</span>
                  </div>
                  <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground rounded border border-border">
                    <span>G</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>L</span>
                  </kbd>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setKeyboardShortcutsOpen(true)}>
                <Keyboard className="mr-2 h-4 w-4" />
                <span>Tastaturkürzel</span>
                <kbd className="ml-auto inline-flex items-center gap-0.5 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground rounded border border-border">
                  <span>/</span>
                </kbd>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Abmelden</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
