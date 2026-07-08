import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

/**
 * Shared pagination footer: summary text, prev/next, numbered pages and an
 * optional page-size select. Styling comes from the `className` the caller
 * passes (each surface keeps its own look).
 */
function Pagination({
  className = '',
  itemsLabel = 'items',
  onChangePage,
  onChangePageSize = null,
  page,
  pageCount,
  pageSize = null,
  pageSizeOptions = [],
  showingFrom = 0,
  showingTo = 0,
  totalCount = 0,
}) {
  return (
    <footer className={className}>
      <p>
        {totalCount
          ? `Showing ${showingFrom} to ${showingTo} of ${totalCount} ${itemsLabel}`
          : `No ${itemsLabel} to show`}
      </p>
      <div>
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChangePage(page - 1)}
        >
          <FiChevronLeft aria-hidden="true" />
        </button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            className={pageNumber === page ? 'is-active' : ''}
            aria-current={pageNumber === page ? 'page' : undefined}
            onClick={() => onChangePage(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onChangePage(page + 1)}
        >
          <FiChevronRight aria-hidden="true" />
        </button>
        {onChangePageSize && pageSizeOptions.length ? (
          <select
            aria-label={`${itemsLabel} per page`}
            value={pageSize}
            onChange={(event) => onChangePageSize(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>{option} per page</option>
            ))}
          </select>
        ) : null}
      </div>
    </footer>
  )
}

export default Pagination
