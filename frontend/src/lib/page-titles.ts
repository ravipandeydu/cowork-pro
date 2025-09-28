/**
 * Utility function to generate dynamic page titles based on the current pathname
 */

interface PageTitle {
  title: string
  breadcrumb?: string[]
}

export function getPageTitle(pathname: string): PageTitle {
  // Remove leading slash and split by '/'
  const segments = pathname.replace(/^\//, '').split('/').filter(Boolean)
  
  // Handle root/home page
  if (segments.length === 0 || pathname === '/') {
    return { title: 'Home' }
  }

  // Handle specific routes
  switch (segments[0]) {
    case 'dashboard':
      return { title: 'Dashboard' }
    
    case 'leads':
      return { 
        title: 'Leads',
        breadcrumb: ['Sales', 'Leads']
      }
    
    case 'proposals':
      if (segments[1] === 'create') {
        return { 
          title: 'Create Proposal',
          breadcrumb: ['Sales', 'Proposals', 'Create']
        }
      }
      return { 
        title: 'Proposals',
        breadcrumb: ['Sales', 'Proposals']
      }
    
    case 'customers':
      return { 
        title: 'Customers',
        breadcrumb: ['Sales', 'Customers']
      }
    
    case 'login':
      return { title: 'Login' }
    
    default:
      // Capitalize first letter of the segment
      const title = segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
      return { title }
  }
}

/**
 * Format breadcrumb for display
 */
export function formatBreadcrumb(breadcrumb: string[]): string {
  return breadcrumb.join(' > ')
}