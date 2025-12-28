import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

/**
 * Parses page number from URL path
 * Supports patterns like:
 * - /sites/page-1
 * - /sites/1/page-2
 * - /sites (defaults to page 1)
 */
export function parsePageFromPath(pathname: string): number {
  const match = pathname.match(/\/page-(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 1; // Default to page 1
}

/**
 * Builds a paginated URL path
 * @param basePath - Base path without pagination (e.g., '/sites', '/sites/1')
 * @param page - Page number (1-indexed)
 * @returns Full path with pagination (e.g., '/sites/page-1', '/sites/page-2')
 */
export function buildPaginatedPath(basePath: string, page: number): string {
  if (page === 1) {
    return basePath;
  }
  return `${basePath}/page-${page}`;
}

/**
 * Hook to get current page from URL and navigate to different pages
 */
export function usePagination() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  useEffect(() => {
    const currentPage = parsePageFromPath(router.asPath);
    setPage(currentPage);
  }, [router.asPath]);

  const goToPage = (newPage: number) => {
    const basePath = router.asPath.replace(/\/page-\d+$/, '');
    const newPath = buildPaginatedPath(basePath, newPage);
    router.push(newPath, undefined, { shallow: true });
  };

  return { page, goToPage, setPage };
}


