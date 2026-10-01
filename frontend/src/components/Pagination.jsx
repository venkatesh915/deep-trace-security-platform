import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

export const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, limit } = pagination;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  // Generate page numbers
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    // Show first, last, current, and adjacent pages
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="pagination-wrapper">
      <div className="pagination-info">
        Showing <strong>{startRecord}</strong> to <strong>{endRecord}</strong> of{' '}
        <strong>{total}</strong> records
      </div>

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <div className="pagination-pages">
          {pages.map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                ...
              </span>
            ) : (
              <button
                key={`page-${p}`}
                className={`pagination-page-btn ${p === page ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          className="pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
