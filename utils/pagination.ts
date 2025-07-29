import React, { useMemo } from "react";

interface PaginationOptions {
  currentPage: number;
  totalPages: number;
  visiblePagesCount?: number;
}

interface PaginationResult {
  getVisiblePages: () => (number | "...")[];
  canGoToFirstPage: boolean;
  canGoToPreviousPage: boolean;
  canGoToNextPage: boolean;
  canGoToLastPage: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
}

export function usePagination({
  currentPage,
  totalPages,
  visiblePagesCount = 5,
}: PaginationOptions): PaginationResult {
  const paginationData = useMemo(() => {
    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === totalPages;
    const canGoToFirstPage = !isFirstPage;
    const canGoToPreviousPage = !isFirstPage;
    const canGoToNextPage = !isLastPage;
    const canGoToLastPage = !isLastPage;

    const getVisiblePages = (): (number | "...")[] => {
      if (totalPages <= visiblePagesCount) {
        // If total pages is less than or equal to visible count, show all pages
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      const halfVisible = Math.floor(visiblePagesCount / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, startPage + visiblePagesCount - 1);

      // Adjust start page if we're near the end
      if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - visiblePagesCount + 1);
      }

      const pages: (number | "...")[] = [];

      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push("...");
        }
      }

      // Add visible pages
      for (let i = startPage; i <= endPage; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push("...");
        }
        if (!pages.includes(totalPages)) {
          pages.push(totalPages);
        }
      }

      return pages;
    };

    return {
      getVisiblePages,
      canGoToFirstPage,
      canGoToPreviousPage,
      canGoToNextPage,
      canGoToLastPage,
      isFirstPage,
      isLastPage,
    };
  }, [currentPage, totalPages, visiblePagesCount]);

  return paginationData;
}

// Additional utility functions for pagination calculations
export const paginationUtils = {
  /**
   * Calculate total pages based on total items and items per page
   */
  calculateTotalPages: (totalItems: number, itemsPerPage: number): number => {
    return Math.ceil(totalItems / itemsPerPage);
  },

  /**
   * Calculate the start and end index for current page
   */
  getPageRange: (currentPage: number, itemsPerPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return { startIndex, endIndex };
  },

  /**
   * Get pagination info text
   */
  getPaginationInfo: (
    currentPage: number,
    itemsPerPage: number,
    totalItems: number
  ): string => {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    return `Showing ${start} to ${end} of ${totalItems} items`;
  },

  /**
   * Validate and normalize page number
   */
  normalizePage: (page: number, totalPages: number): number => {
    if (page < 1) return 1;
    if (page > totalPages) return totalPages;
    return Math.floor(page);
  },

  /**
   * Generate page size options
   */
  getPageSizeOptions: (defaultSizes = [10, 20, 50, 100]): number[] => {
    return defaultSizes.sort((a, b) => a - b);
  },
};

// Hook for managing pagination state
export function usePaginationState(initialPage = 1, initialPageSize = 10) {
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const goToPage = (page: number, totalPages: number) => {
    const normalizedPage = paginationUtils.normalizePage(page, totalPages);
    setCurrentPage(normalizedPage);
  };

  const goToFirstPage = () => setCurrentPage(1);

  const goToLastPage = (totalPages: number) => setCurrentPage(totalPages);

  const goToNextPage = (totalPages: number) => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const changePageSize = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  return {
    currentPage,
    pageSize,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    changePageSize,
    setCurrentPage,
    setPageSize,
  };
}
