import { ChevronLeft, ChevronRight } from 'lucide-react'

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

type Props = {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

export function Pagination({ meta, onPageChange }: Props) {
  const { page, limit, total, totalPages } = meta

  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    
    if (totalPages <= 7) {
      // Mostrar todas as páginas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Lógica para páginas com ellipsis
      if (page <= 3) {
        // Início: [1] [2] [3] [4] ... [10]
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (page >= totalPages - 2) {
        // Fim: [1] ... [7] [8] [9] [10]
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Meio: [1] ... [4] [5] [6] ... [10]
        pages.push(1)
        pages.push('ellipsis')
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-800">
      {/* Info */}
      <div className="text-sm text-gray-400">
        Showing <span className="text-gray-300 font-medium">{startItem}</span> to{' '}
        <span className="text-gray-300 font-medium">{endItem}</span> of{' '}
        <span className="text-gray-300 font-medium">{total}</span> results
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Previous */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={`
            px-3 py-2 rounded-md text-sm font-medium transition
            flex items-center gap-1
            ${
              page === 1
                ? 'opacity-50 cursor-not-allowed text-gray-600'
                : 'text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700'
            }
          `}
        >
          <ChevronLeft size={16} />
          Prev
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
                  ...
                </span>
              )
            }
            
            const pageNum = p as number
            const isActive = pageNum === page
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`
                  min-w-[36px] px-3 py-2 rounded-md text-sm font-medium transition
                  ${
                    isActive
                      ? 'bg-primary text-black font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700'
                  }
                `}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={`
            px-3 py-2 rounded-md text-sm font-medium transition
            flex items-center gap-1
            ${
              page === totalPages
                ? 'opacity-50 cursor-not-allowed text-gray-600'
                : 'text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700'
            }
          `}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

