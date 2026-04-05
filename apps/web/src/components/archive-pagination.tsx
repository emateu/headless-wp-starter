import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { labels } from "~/lib/config/labels";

interface ArchivePaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  basePath: string;
}

function pageHref(basePath: string, page: number) {
  if (page <= 1) return basePath;
  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}page=${page}`;
}

/**
 * Generates visible page numbers with ellipsis gaps.
 * Always shows first page, last page (if known), and pages around current.
 * Since WPGraphQL cursor pagination doesn't expose total count,
 * we only show a "next" page when hasNextPage is true.
 */
function getPageNumbers(currentPage: number, hasNextPage: boolean): number[] {
  const lastKnown = hasNextPage ? currentPage + 1 : currentPage;
  const pages: Set<number> = new Set();

  pages.add(1);
  for (
    let i = Math.max(2, currentPage - 1);
    i <= Math.min(lastKnown, currentPage + 1);
    i++
  ) {
    pages.add(i);
  }
  if (lastKnown > 1) pages.add(lastKnown);

  return Array.from(pages).sort((a, b) => a - b);
}

export function ArchivePagination({
  currentPage,
  hasNextPage,
  basePath,
}: ArchivePaginationProps) {
  if (currentPage <= 1 && !hasNextPage) return null;

  const pages = getPageNumbers(currentPage, hasNextPage);

  return (
    <Pagination className="mt-10">
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious
              href={pageHref(basePath, currentPage - 1)}
              text={labels.pagination.previous}
            />
          </PaginationItem>
        )}

        {pages.map((page, i) => {
          const prev = pages[i - 1];
          const showEllipsis = prev != null && page - prev > 1;

          return (
            <span key={page} className="contents">
              {showEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink
                  href={pageHref(basePath, page)}
                  isActive={page === currentPage}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            </span>
          );
        })}

        {hasNextPage && (
          <PaginationItem>
            <PaginationNext
              href={pageHref(basePath, currentPage + 1)}
              text={labels.pagination.next}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
