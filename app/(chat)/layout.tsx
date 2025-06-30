import { cookies } from 'next/headers';

import Script from 'next/script';
import LayoutClient from './layout-client';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <LayoutClient isCollapsed={isCollapsed}>
        {children}
      </LayoutClient>
    </>
  );
}
