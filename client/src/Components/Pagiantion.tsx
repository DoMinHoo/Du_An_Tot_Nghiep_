import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    onItemsPerPageChange: (itemsPerPage: number) => void;
    pageSizeOptions?: number[];
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange,
    pageSizeOptions = [5, 10, 20], // Mặc định các tùy chọn
}) => {

    // Hàm tạo danh sách các số trang để hiển thị
    const renderPaginationNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5; // Số lượng nút trang hiển thị tối đa

        if (totalPages <= 1) return null; // Không hiển thị phân trang nếu chỉ có 1 trang hoặc không có trang nào

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Logic phức tạp hơn để hiển thị các số trang xung quanh trang hiện tại
            let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
            let endPage = Math.min(totalPages, currentPage + Math.floor(maxPagesToShow / 2));

            // Điều chỉnh để luôn hiển thị đủ maxPagesToShow nếu có thể
            if (endPage - startPage + 1 < maxPagesToShow) {
                if (startPage === 1) {
                    endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
                } else if (endPage === totalPages) {
                    startPage = Math.max(1, totalPages - maxPagesToShow + 1);
                }
            }

            if (startPage > 1) {
                pages.push(1);
                if (startPage > 2) {
                    pages.push('...'); // Dấu 3 chấm tượng trưng cho các trang bị ẩn
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    pages.push('...'); // Dấu 3 chấm tượng trưng cho các trang bị ẩn
                }
                pages.push(totalPages);
            }
        }

        return pages.map((page, index) => (
            <button
                key={index} // Sử dụng index cho key vì nội dung page có thể trùng '...'
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={typeof page !== 'number' || page === currentPage}
                className={`
          px-3 py-1.5 mx-1 rounded-md text-sm font-medium transition-colors duration-200
          ${typeof page === 'number'
                        ? (page === currentPage
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                        : 'bg-gray-100 text-gray-500 cursor-not-allowed' // For '...'
                    }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
            >
                {page}
            </button>
        ));
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 space-y-4 sm:space-y-0">
            {/* Dropdown chọn số mục mỗi trang */}
            <div className="flex items-center space-x-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-700">Hiển thị:</label>
                <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {pageSizeOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
                <span className="text-sm text-gray-700">đơn hàng/trang</span>
            </div>

            {/* Các nút phân trang */}
            <div className="flex items-center space-x-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors duration-200"
                >
                    Trang trước
                </button>

                {renderPaginationNumbers()}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors duration-200"
                >
                    Trang sau
                </button>
            </div>
        </div>
    );
};

export default Pagination;