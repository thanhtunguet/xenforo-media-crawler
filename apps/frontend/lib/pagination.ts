import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

/**
 * Parses page number from URL query parameters
 * @param query - Router query object
 * @returns Page number (defaults to 1)
 */
export function parsePageFromQuery(query: any): number {
  const pageParam = query.page;
  if (pageParam) {
    const page =
      typeof pageParam === 'string'
        ? parseInt(pageParam, 10)
        : parseInt(pageParam[0], 10);
    if (!isNaN(page) && page > 0) {
      return page;
    }
  }
  return 1; // Default to page 1
}

/**
 * Builds a paginated URL with query parameters
 * @param basePath - Base path without query params (e.g., '/sites', '/sites/123')
 * @param page - Page number (1-indexed)
 * @returns Full path with query parameter (e.g., '/sites?page=2', '/sites/123?page=2')
 */
export function buildPaginatedPath(basePath: string, page: number): string {
  // Remove existing page query param and other query params from basePath
  const [path, queryString] = basePath.split('?');
  const cleanPath = path.replace(/\/page-\d+$/, ''); // Remove old path-based pagination if any

  if (page === 1) {
    // For page 1, remove the page query param
    const params = new URLSearchParams(queryString);
    params.delete('page');
    const newQuery = params.toString();
    return newQuery ? `${cleanPath}?${newQuery}` : cleanPath;
  }

  // Add or update page query param
  const params = new URLSearchParams(queryString);
  params.set('page', page.toString());
  return `${cleanPath}?${params.toString()}`;
}

/**
 * Hook to get current page from URL query parameters and navigate to different pages
 */
export function usePagination() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Parse page from query parameters
    let currentPage = 1;

    if (router.isReady) {
      currentPage = parsePageFromQuery(router.query);
    } else if (router.query.page) {
      // Try to parse even if router is not fully ready
      currentPage = parsePageFromQuery(router.query);
    }

    // Only update if the page actually changed to prevent unnecessary re-renders
    setPage((prevPage) => {
      if (prevPage !== currentPage) {
        return currentPage;
      }
      return prevPage;
    });
  }, [router.isReady, router.query.page]);

  const goToPage = (newPage: number) => {
    if (newPage === page) return; // Don't navigate if already on that page

    // Get current path without query params for the base
    const basePath = router.asPath.split('?')[0].replace(/\/page-\d+$/, '');
    const newPath = buildPaginatedPath(basePath, newPage);
    router.push(newPath, undefined, { shallow: true });
  };

  return { page, goToPage, setPage };
}
