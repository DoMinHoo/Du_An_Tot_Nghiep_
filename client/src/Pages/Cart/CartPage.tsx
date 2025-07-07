import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  updateCartItem,
  removeCartItem,
  deleteMultipleCartItems,
  clearCart,
  getCart,
} from '../../services/cartService';
import CartItemComponent from './CartItem';
import CartSummary from './CartSummary';
import type { Cart } from '../../types/Cart';
import { useNavigate } from 'react-router-dom';

const CartPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);

  // Lấy token hoặc guestId từ localStorage
  const token = sessionStorage.getItem('token') || undefined;
  const guestId = sessionStorage.getItem('guestId') || undefined;
  const shouldFetchCart = !!token || !!guestId;

  // Query để lấy dữ liệu giỏ hàng
  const { data, isLoading, error } = useQuery({
    queryKey: ['cart', token, guestId],
    queryFn: () => getCart(token, guestId),
    retry: 2,
    enabled: shouldFetchCart,
    staleTime: 1000 * 60, // Dữ liệu tươi trong 1 phút
  });

  const cart: Cart | undefined = data?.data?.cart;
  const totalPrice: number = data?.data?.totalPrice || 0;

  // Tính tổng tiền của các sản phẩm được chọn
  const selectedTotalPrice = useMemo(() => {
    if (!cart?.items || selectedItems.length === 0) return 0;

    return cart.items
      .filter((item) => selectedItems.includes(item.variationId._id))
      .reduce((total, item) => {
        const price =
          item.variationId.salePrice || item.variationId.finalPrice || 0;
        return total + price * item.quantity;
      }, 0);
  }, [cart?.items, selectedItems]);

  // Mutation để cập nhật số lượng sản phẩm
  const updateMutation = useMutation({
    mutationFn: ({
      variationId,
      quantity,
    }: {
      variationId: string;
      quantity: number;
    }) => updateCartItem(variationId, quantity, token, guestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cập nhật số lượng thành công!', { autoClose: 1000 });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi khi cập nhật số lượng', {
        autoClose: 1000,
      });
      console.error('Lỗi updateCartItem:', err);
    },
  });

  // Mutation để xóa một sản phẩm
  const removeMutation = useMutation({
    mutationFn: (variationId: string) =>
      removeCartItem(variationId, token, guestId),
    onSuccess: (_, variationId) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setSelectedItems((prev) => prev.filter((id) => id !== variationId));
      toast.success('Xóa sản phẩm thành công!', { autoClose: 1000 });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi khi xóa sản phẩm', { autoClose: 1000 });
    },
  });

  // Mutation để xóa nhiều sản phẩm
  const deleteMultipleMutation = useMutation({
    mutationFn: (variationIds: string[]) =>
      deleteMultipleCartItems(variationIds, token, guestId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setSelectedItems([]);
      if (!data.data || !data.data.cart) {
        localStorage.removeItem('guestId');
      }
      toast.success('Xóa các sản phẩm đã chọn thành công!', {
        autoClose: 1000,
      });
    },
    onError: (err: any) => {
      const errorMessage =
        err.response?.status === 404
          ? 'Không tìm thấy endpoint /remove-multiple. Vui lòng kiểm tra cấu hình server.'
          : err.message || 'Lỗi khi xóa các sản phẩm';
      toast.error(errorMessage, { autoClose: 1000 });
    },
  });

  // Mutation để xóa toàn bộ giỏ hàng
  const clearMutation = useMutation({
    mutationFn: () => clearCart(token, guestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setSelectedItems([]);
      localStorage.removeItem('guestId');
      toast.success('Xóa giỏ hàng thành công!', { autoClose: 1000 });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi khi xóa giỏ hàng', { autoClose: 1000 });
      console.error('Lỗi clearCart:', err);
    },
  });

  // Xử lý chọn hoặc bỏ chọn tất cả sản phẩm
  const handleSelectAll = () => {
    if (!cart?.items.length) {
      toast.warn('Giỏ hàng đang trống, không có sản phẩm để chọn!', {
        autoClose: 1000,
      });
      return;
    }

    if (selectedItems.length === cart?.items.length) {
      setSelectedItems([]);
    } else {
      const allVariationIds =
        cart?.items.map((item) => item.variationId._id) || [];
      setSelectedItems(allVariationIds);
    }
  };

  // Xử lý chọn/xóa chọn sản phẩm
  const toggleSelectItem = (variationId: string) => {
    setSelectedItems((prev) =>
      prev.includes(variationId)
        ? prev.filter((id) => id !== variationId)
        : [...prev, variationId]
    );
  };

  // Xử lý xóa các sản phẩm được chọn
  const handleDeleteSelected = () => {
    if (!cart?.items.length) {
      toast.warn('Giỏ hàng đang trống, không có sản phẩm để xóa!', {
        autoClose: 1000,
      });
      return;
    }
    if (selectedItems.length === 0) {
      toast.warn('Vui lòng chọn ít nhất một sản phẩm để xóa!', {
        autoClose: 1000,
      });
      return;
    }
    deleteMultipleMutation.mutate(selectedItems);
  };

  // Xử lý thanh toán
  const handleCheckout = () => {
    // Kiểm tra nếu giỏ hàng không tồn tại hoặc trống
    if (!cart || !cart.items || cart.items.length === 0) {
      toast.warn('Giỏ hàng đang trống, không thể thanh toán!', {
        autoClose: 1000,
      });
      return;
    }

    // Kiểm tra nếu không có sản phẩm nào được chọn
    if (selectedItems.length === 0) {
      toast.warn('Vui lòng chọn ít nhất một sản phẩm để thanh toán!', {
        autoClose: 1000,
      });
      return;
    }

    // Lọc các sản phẩm được chọn
    const checkedItems = cart.items.filter((item) =>
      selectedItems.includes(item.variationId._id)
    );

    // Kiểm tra nếu không có sản phẩm nào được lọc (trường hợp lỗi bất ngờ)
    if (checkedItems.length === 0) {
      toast.error('Lỗi: Không tìm thấy sản phẩm được chọn!', {
        autoClose: 1000,
      });
      return;
    }


    // Lọc ra các sản phẩm được chọn
    const checkedItems = cart.items.filter(item => selectedItems.includes(item.variationId._id));

    navigate('/checkout', {
      state: {
        selectedItems,
        cartItems: checkedItems,
        totalPrice: selectedTotalPrice,
      },
    });

  };

  // Xử lý xóa toàn bộ giỏ hàng
  const handleClearCart = () => {
    if (!cart?.items.length) {
      toast.warn('Giỏ hàng đang trống, không cần xóa!', { autoClose: 1000 });
      return;
    }
    clearMutation.mutate();
  };

  // Trường hợp không có token hoặc guestId
  if (!shouldFetchCart) {
    return (
      <div className="max-w-5xl mx-auto px-2 py-4">
        <ToastContainer />
        <h2 className="text-2xl font-bold text-center mb-4">
          Giỏ hàng của bạn
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center bg-gray-50 text-gray-600 text-xs px-3 py-1 rounded-md">
              <span>Có 0 sản phẩm trong giỏ hàng</span>
              <button
                onClick={handleDeleteSelected}
                disabled={true}
                className="text-red-500 font-medium hover:text-red-600 disabled:opacity-40 transition-colors"
              >
                Xóa đã chọn
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-600">
              Giỏ hàng của bạn đang trống hoặc chưa được khởi tạo.
            </div>
          </div>
          <CartSummary
            totalPrice={0}
            selectedCount={0}
            onCheckout={handleCheckout}
            onClearCart={handleClearCart}
          />
        </div>
      </div>
    );
  }

  // Trường hợp đang tải933 dữ liệu
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-2 py-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
        <div class SIX="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="flex gap-3 bg-white rounded-lg shadow-sm p-3"
                >
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-20 h-20 bg-gray-200 rounded-md"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Trường hợp có lỗi khi lấy dữ liệu
  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-2 py-4">
        <ToastContainer />
        <h2 className="text-2xl font-bold text-center mb-4">
          Giỏ hàng của bạn
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center bg-gray-50 text-gray-600 text-xs px-3 py-1 rounded-md">
              <span>Có 0 sản phẩm trong giỏ hàng</span>
              <button
                onClick={handleDeleteSelected}
                disabled={true}
                className="text-red-500 font-medium hover:text-red-600 disabled:opacity-40 transition-colors"
              >
                Xóa đã chọn
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-600">
              Lỗi khi lấy giỏ hàng:{' '}
              {(error as Error).message || 'Đã có lỗi xảy ra'}
            </div>
          </div>
          <CartSummary
            totalPrice={0}
            selectedCount={0}
            onCheckout={handleCheckout}
            onClearCart={handleClearCart}
          />
        </div>
      </div>
    );
  }

  // Trường hợp hiển thị giỏ hàng bình thường
  return (
    <div className="max-w-5xl mx-auto px-2 py-4">
      <ToastContainer />
      <h2 className="text-2xl font-bold text-center mb-4">Giỏ hàng của bạn</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-gray-50 text-gray-600 text-xs px-3 py-1 rounded-md">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={
                  !!cart?.items &&
                  cart.items.length > 0 &&
                  selectedItems.length === cart.items.length
                }
                onChange={handleSelectAll}
                className="mr-2"
                disabled={!cart?.items.length}
              />
              <span>Có {cart?.items.length || 0} sản phẩm trong giỏ hàng</span>
            </div>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedItems.length === 0 || !cart?.items.length}
              className="text-red-500 font-medium hover:text-red-600 disabled:opacity-40 transition-colors"
            >
              Xóa đã chọn
            </button>
          </div>

          {cart?.items.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-600">
              Giỏ hàng của bạn đang trống.
            </div>
          ) : (
            cart?.items.map((item) => (
              <CartItemComponent
                key={item.variationId._id}
                item={item}
                isSelected={selectedItems.includes(item.variationId._id)}
                onSelect={() => toggleSelectItem(item.variationId._id)}
                onUpdateQuantity={(quantity) => {
                  if (cart?.items.length) {
                    updateMutation.mutate({
                      variationId: item.variationId._id,
                      quantity,
                    });
                  } else {
                    toast.warn('Giỏ hàng đang trống, không thể cập nhật!', {
                      autoClose: 1000,
                    });
                  }
                }}
                onRemove={() => {
                  if (cart?.items.length) {
                    removeMutation.mutate(item.variationId._id);
                  } else {
                    toast.warn('Giỏ hàng đang trống, không thể xóa!', {
                      autoClose: 1000,
                    });
                  }
                }}
              />
            ))
          )}
        </div>
        <CartSummary
          totalPrice={selectedTotalPrice}
          selectedCount={selectedItems.length}
          onCheckout={handleCheckout}
          onClearCart={handleClearCart}
        />
      </div>
    </div>
  );
};

export default CartPage;
