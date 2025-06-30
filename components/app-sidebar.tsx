'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type User = {
  id: string;
  email?: string | null;
  name?: string | null;
  type: 'guest' | 'regular';
};

import { PlusIcon, LoaderIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [isNewChatLoading, setIsNewChatLoading] = useState(false);

  // Reset loading state when pathname changes
  useEffect(() => {
    setIsNewChatLoading(false);
  }, [pathname]);

  return (
    <Sidebar className="group-data-[side=left]:border-r-2 bg-muted">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                MyhubGPT
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  disabled={isNewChatLoading}
                  onClick={() => {
                    setIsNewChatLoading(true);
                    setOpenMobile(false);
                    router.push('/');
                    
                    // Reset after a short delay for testing
                    setTimeout(() => {

                      setIsNewChatLoading(false);
                    }, 1500);
                  }}
                >
                  {isNewChatLoading ? (
                    <div className="animate-spin">
                      <LoaderIcon />
                    </div>
                  ) : (
                    <PlusIcon />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
