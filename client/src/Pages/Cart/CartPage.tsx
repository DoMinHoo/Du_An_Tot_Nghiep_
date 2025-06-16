import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  updateCartItem,
  removeCartItem,
  clearCart,
  getCart,
} from '../../services/cartService';
import CartItemComponent from './CartItem';
import CartSummary from './CartSummary';
import type { Cart } from '../../types/Cart';

const CartPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
  const [note, setNote] = React.useState<string>('');

  const token = localStorage.getItem('token') || undefined;
  const guestId = localStorage.getItem('guestId') || undefined;

  // Chỉ gọi API khi có token hoặc guestId
  const shouldFetchCart = !!token || !!guestId;
  const { data, isLoading, error } = useQuery({
    queryKey: ['cart', token, guestId],
    queryFn: () => getCart(token, guestId),
    retry: 2,
    enabled: shouldFetchCart,
  });

  const cart: Cart | undefined = data?.data?.cart;
  const totalPrice: number = data?.data?.totalPrice || 0;

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
      toast.success('Cập nhật số lượng thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi khi cập nhật số lượng');
      console.error('Lỗi updateCartItem:', err);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (variationId: string) =>
      removeCartItem(variationId, token, guestId),
    onSuccess: (data, variationId) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setSelectedItems((prev) => prev.filter((id) => id !== variationId));
      toast.success('Xóa sản phẩm thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi khi xóa sản phẩm');
      console.error('Lỗi removeCartItem:', err);
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearCart(token, guestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setSelectedItems([]);
      toast.success('Xóa giỏ hàng thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi khi xóa giỏ hàng');
      console.error('Lỗi clearCart:', err);
    },
  });

  const toggleSelectItem = (variationId: string) => {
    setSelectedItems((prev) =>
      prev.includes(variationId)
        ? prev.filter((id) => id !== variationId)
        : [...prev, variationId]
    );
  };

  const handleDeleteSelected = () => {
    if (!cart?.items.length) {
      toast.warn('Giỏ hàng đang trống, không có sản phẩm để xóa!');
      return;
    }
    if (selectedItems.length === 0) {
      toast.warn('Vui lòng chọn sản phẩm để xóa!');
      return;
    }
    selectedItems.forEach((variationId) => removeMutation.mutate(variationId));
  };

  const handleCheckout = () => {
    if (!cart?.items.length) {
      toast.warn('Giỏ hàng đang trống, không thể thanh toán!');
      return;
    }
    if (selectedItems.length === 0) {
      toast.warn('Vui lòng chọn sản phẩm để thanh toán!');
      return;
    }
    toast.info('Chức năng thanh toán đang được phát triển!');
  };

  const handleClearCart = () => {
    if (!cart?.items.length) {
      toast.warn('Giỏ hàng đang trống, không cần xóa!');
      return;
    }
    clearMutation.mutate();
  };

  // Giao diện trống nếu không có token hoặc guestId
  if (!shouldFetchCart) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ToastContainer />
        <h2 className="text-3xl font-bold text-center mb-8">
          Giỏ hàng của bạn
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded">
              <span>Có 0 sản phẩm trong giỏ hàng</span>
              <button
                onClick={handleDeleteSelected}
                disabled={true}
                className="text-red-600 font-semibold hover:underline disabled:opacity-40"
              >
                Xóa đã chọn
              </button>
            </div>
            <div className="bg-white rounded-xl shadow p-6 text-center text-gray-600">
              Giỏ hàng của bạn đang trống hoặc chưa được khởi tạo.
            </div>
            <CartNote note={note} onChange={(value) => setNote(value)} />
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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 bg-white rounded-xl shadow p-4"
                >
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="w-28 h-28 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ToastContainer />
        <h2 className="text-3xl font-bold text-center mb-8">
          Giỏ hàng của bạn
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded">
              <span>Có 0 sản phẩm trong giỏ hàng</span>
              <button
                onClick={handleDeleteSelected}
                disabled={true}
                className="text-red-600 font-semibold hover:underline disabled:opacity-40"
              >
                Xóa đã chọn
              </button>
            </div>
            <div className="bg-white rounded-xl shadow p-6 text-center text-gray-600">
              Lỗi khi lấy giỏ hàng: {error.message}
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ToastContainer />
      <h2 className="text-3xl font-bold text-center mb-8">Giỏ hàng của bạn</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded">
            <span>Có {cart?.items.length || 0} sản phẩm trong giỏ hàng</span>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedItems.length === 0 || cart?.items.length === 0}
              className="text-red-600 font-semibold hover:underline disabled:opacity-40"
            >
              Xóa đã chọn
            </button>
          </div>

          {cart?.items.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6 text-center text-gray-600">
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
                    toast.warn('Giỏ hàng đang trống, không thể cập nhật!');
                  }
                }}
                onRemove={() => {
                  if (cart?.items.length) {
                    removeMutation.mutate(item.variationId._id);
                  } else {
                    toast.warn('Giỏ hàng đang trống, không thể xóa!');
                  }
                }}
              />
            ))
          )}
        </div>
        <CartSummary
          totalPrice={totalPrice}
          selectedCount={selectedItems.length}
          onCheckout={handleCheckout}
          onClearCart={handleClearCart}
        />
      </div>
    </div>
  );
};

export default CartPage;
