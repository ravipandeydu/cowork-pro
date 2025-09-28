/**
 * Utility function to determine if a sidebar item should be active based on the current pathname
 */
export function isActiveRoute(pathname: string, itemUrl: string): boolean {
  // Handle exact matches
  if (pathname === itemUrl) {
    return true;
  }

  // Handle nested routes - if the current path starts with the item URL
  // but make sure we don't match partial segments
  if (pathname.startsWith(itemUrl + '/')) {
    return true;
  }

  // Special cases for specific routes
  switch (itemUrl) {
    case '/dashboard/leads':
      return pathname.startsWith('/dashboard/leads');
    case '/proposals':
      return pathname.startsWith('/proposals');
    case '/dashboard/customers':
      return pathname.startsWith('/dashboard/customers');
    case '/dashboard/contracts/new':
      return pathname === '/dashboard/contracts/new';
    case '/dashboard/contracts':
      return pathname.startsWith('/dashboard/contracts') && pathname !== '/dashboard/contracts/new';
    case '/dashboard/documents':
      return pathname.startsWith('/dashboard/documents');
    case '/dashboard/notifications':
      return pathname.startsWith('/dashboard/notifications');
    case '/dashboard/support':
      return pathname.startsWith('/dashboard/support');
    default:
      return false;
  }
}

/**
 * Get the active sidebar item title based on the current pathname
 */
export function getActiveSidebarTitle(pathname: string): string {
  if (pathname.startsWith('/dashboard/leads')) return 'Leads';
  if (pathname.startsWith('/proposals')) return 'Proposals';
  if (pathname.startsWith('/dashboard/customers')) return 'Customers';
  if (pathname === '/dashboard/contracts/new') return 'New Contract';
  if (pathname.startsWith('/dashboard/contracts')) return 'Contract Details';
  if (pathname.startsWith('/dashboard/documents')) return 'Documents';
  if (pathname.startsWith('/dashboard/notifications')) return 'Notifications';
  if (pathname.startsWith('/dashboard/support')) return 'Support & Help';
  return 'Dashboard';
}