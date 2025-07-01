import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

import { getCart } from '../services/cartService';
import { createOrder } from '../services/orderService';
import { getAllPromotions } from '../services/apiPromotion.service';

const CheckoutPage: React.FC = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [finalAmount, setFinalAmount] = useState<number | null>(null);
  const { data: promotionList } = useQuery({
    queryKey: ['promotions'],
    queryFn: getAllPromotions,
  });

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [street, setStreet] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer' | 'online_payment'>('cod');
  const [couponCode, setCouponCode] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const token = localStorage.getItem('token') || undefined;
  const guestId = localStorage.getItem('guestId') || undefined;

  const passedState = location.state as {
    selectedItems?: string[];
    cartItems?: any[];
    totalPrice?: number;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => getCart(token, guestId),
    enabled: !!token || !!guestId,
  });

  const paymentOptions: { label: string; value: 'cod' | 'bank_transfer' | 'online_payment' }[] = [
    { label: 'Thanh toán khi nhận hàng (COD)', value: 'cod' },
    { label: 'Chuyển khoản ngân hàng', value: 'bank_transfer' },
    { label: 'Thanh toán qua ZaloPay', value: 'online_payment' },
  ];

  const fallbackCart = data?.data?.cart;
  const fallbackTotalPrice = data?.data?.totalPrice || 0;

  const selectedItems = passedState?.selectedItems || [];
  const cartItems = passedState?.cartItems || fallbackCart?.items || [];
  const totalPrice = passedState?.totalPrice ?? fallbackTotalPrice;

  const orderMutation = useMutation({
    mutationFn: (orderData: any) => createOrder(orderData, token, guestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Đặt hàng thành công!', { autoClose: 1500 });
    },
    onError: () => {
      toast.error('Đặt hàng thất bại!', { autoClose: 1500 });
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên';
    if (!phone.trim() || !/^\d{9,11}$/.test(phone))
      newErrors.phone = 'Số điện thoại không hợp lệ';
    if (!province) newErrors.province = 'Vui lòng chọn tỉnh/thành';
    if (!district) newErrors.district = 'Vui lòng chọn quận/huyện';
    if (!ward) newErrors.ward = 'Vui lòng chọn phường/xã';
    if (!street.trim()) newErrors.street = 'Vui lòng nhập tên đường';
    if (!detailAddress.trim())
      newErrors.detailAddress = 'Vui lòng nhập địa chỉ chi tiết';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = async () => {
    if (!validate()) return;

    if (!cartItems?.length) {
      toast.error('Giỏ hàng trống!');
      return;
    }

    let email = 'guest@example.com';
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email) email = payload.email;
      } catch {
        console.warn('Không thể lấy email từ token');
      }
    }

    if (!fallbackCart || !fallbackCart._id) {
      toast.error('Không tìm thấy giỏ hàng. Vui lòng thử lại.');
      return;
    }

    try {
      // Tạo order thông qua mutateAsync
      const orderRes = await orderMutation.mutateAsync({
        shippingAddress: {
          fullName,
          phone,
          email,
          addressLine: detailAddress,
          street,
          province,
          district,
          ward,
        },
        paymentMethod,
        cartId: fallbackCart._id,
      });

      if (paymentMethod === 'online_payment' && orderRes?.orderCode) {
        const res = await fetch('http://localhost:5000/api/zalo-payment/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderCode: orderRes.orderCode }),
        });

        const data = await res.json();

        if (res.ok && data.order_url) {
          localStorage.setItem("currentOrderCode", orderRes.orderCode);
          window.location.href = data.order_url;
        } else {
          toast.error(data.message || 'Không lấy được link thanh toán ZaloPay');
        }
      } else {
        toast.success('Đặt hàng thành công!', { autoClose: 1500 });
      }
    } catch {
      toast.error('Đặt hàng thất bại!', { autoClose: 1500 });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row bg-white p-6 rounded-md">
      <ToastContainer />

      <div className="lg:w-2/3 pr-0 lg:pr-6 border-b lg:border-b-0 lg:border-r border-gray-200">
        <h1 className="text-2xl font-semibold mb-1">Nội thất LIENTO</h1>
        <p className="text-sm text-gray-500 mb-4">
          Giỏ hàng / Thông tin giao hàng
        </p>

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Thông tin giao hàng</h2>
          <form className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                className="w-full border rounded px-4 py-2"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="0123456789"
                className="w-full border rounded px-4 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="flex gap-4">
              <div className="w-1/3">
                <select
                  className="w-full border rounded px-4 py-2"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                >
                  <option value="">Chọn tỉnh/thành</option>
                  <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                </select>
                {errors.province && (
                  <p className="text-red-500 text-sm mt-1">{errors.province}</p>
                )}
              </div>
              <div className="w-1/3">
                <select
                  className="w-full border rounded px-4 py-2"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                >
                  <option value="">Chọn quận/huyện</option>
                  <option value="Quận 1">Quận 1</option>
                  <option value="Quận Bình Thạnh">Quận Bình Thạnh</option>
                </select>
                {errors.district && (
                  <p className="text-red-500 text-sm mt-1">{errors.district}</p>
                )}
              </div>
              <div className="w-1/3">
                <select
                  className="w-full border rounded px-4 py-2"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                >
                  <option value="">Chọn phường/xã</option>
                  <option value="Phường 1">Phường 1</option>
                  <option value="Phường 2">Phường 2</option>
                </select>
                {errors.ward && (
                  <p className="text-red-500 text-sm mt-1">{errors.ward}</p>
                )}
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="Tên đường"
                className="w-full border rounded px-4 py-2"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
              {errors.street && (
                <p className="text-red-500 text-sm mt-1">{errors.street}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="Địa chỉ chi tiết"
                className="w-full border rounded px-4 py-2"
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
              />
              {errors.detailAddress && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.detailAddress}
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Phương thức thanh toán</h2>
          <div className="space-y-3">
            {paymentOptions.map((option) => (
              <label key={option.value} className="block">
                <input
                  type="radio"
                  name="payment"
                  value={option.value}
                  checked={paymentMethod === option.value}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cod' | 'bank_transfer' | 'online_payment')}
                  className="mr-2"
                />
                {option.value === 'bank_transfer' ? (
                  <span>
                    <strong>Thanh toán chuyển khoản qua ngân hàng</strong>
                    <div className="ml-6 text-sm text-gray-600">
                      <p>Chủ tài khoản: ABCXYZ</p>
                      <p>Số tài khoản: 0123456789</p>
                      <p>Ngân hàng: ALO BANK</p>
                      <p>Nội dung: Tên + SĐT đặt hàng</p>
                    </div>
                  </span>
                ) : (
                  <>{option.label}</>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="text-right space-x-2">
          <button className="px-4 py-2 border rounded text-gray-600">
            Giỏ hàng
          </button>
          <button
            onClick={handleSubmitOrder}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Hoàn tất đơn hàng
          </button>
        </div>
      </div>

      <div className="lg:w-1/3 mt-8 lg:mt-0 lg:pl-6">
        <div className="border rounded p-4 space-y-4">
          {isLoading ? (
            <p>Đang tải giỏ hàng...</p>
          ) : cartItems.length ? (
            cartItems
              .filter(
                (item) =>
                  selectedItems.length === 0 ||
                  selectedItems.includes(item.variationId._id)
              )
              .map((item: any, index: number) => (
                <div key={index} className="flex gap-4">
                  <img
                    src={item.variationId.colorImageUrl}
                    alt="item"
                    className="w-20 h-20 object-cover"
                  />
                  <div>
                    <p className="font-medium">{item.variationId.name}</p>
                    <p className="text-gray-500 text-sm">
                      {item.variationId.color}
                    </p>
                    {item.variationId.finalPrice !== 0 &&
                      item.variationId.salePrice !== 0 &&
                      item.variationId.salePrice < item.variationId.finalPrice ? (
                      <p className="font-semibold">
                        {item.variationId.salePrice.toLocaleString()}₫ ×{' '}
                        {item.quantity}
                      </p>
                    ) : (
                      <p className="font-semibold">
                        {item.variationId.finalPrice.toLocaleString()}₫ ×{' '}
                        {item.quantity}
                      </p>
                    )}
                  </div>
                </div>
              ))
          ) : (
            <p>Giỏ hàng trống</p>
          )}

          <input
            type="text"
            placeholder="Mã giảm giá..."
            className="w-full border rounded px-4 py-2"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value);

              // Khi xóa hết ô input, tự trả lại giá ban đầu
              if (e.target.value.trim() === "") {
                setFinalAmount(null);
                toast.info("Đã xóa mã giảm giá, giá gốc được áp dụng lại");
              }
            }}
          />

          <button
            className="w-full bg-gray-200 py-2 rounded mt-2"
            onClick={async () => {
              if (!couponCode.trim()) {
                toast.error("Vui lòng nhập mã giảm giá");
                return;
              }

              try {
                const res = await fetch("http://localhost:5000/api/promotions/apply", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    code: couponCode.trim(),
                    originalPrice: Number(totalPrice),
                  }),
                });

                const data = await res.json();

                if (!res.ok) {
                  toast.error(data.message || "Áp mã thất bại");
                  setFinalAmount(null);
                  return;
                }

                toast.success(data.message || "Áp dụng mã thành công!");
                setFinalAmount(data.finalPrice);
              } catch {
                toast.error("Có lỗi khi áp dụng mã");
                setFinalAmount(null);
              }
            }}
          >
            Sử dụng
          </button>

          {/* Danh sách mã giảm giá có sẵn */}
          {promotionList?.length > 0 && (
            <div className="mt-4 border rounded p-3 space-y-2">
              <p className="font-medium mb-2">Hoặc chọn nhanh mã giảm giá:</p>
              {promotionList.map((promo: any) => (
                <button
                  key={promo._id}
                  className="w-full border px-3 py-2 rounded hover:bg-gray-100 text-left"
                  onClick={() => setCouponCode(promo.code)}
                >
                  <div className="flex justify-between">
                    <span className="font-semibold">{promo.code}</span>
                    <span className="text-gray-600 text-sm">
                      {promo.discountType === "percentage"
                        ? `${promo.discountValue}%`
                        : `${promo.discountValue.toLocaleString()}₫`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}





          <hr />
          <div className="flex justify-between">
            <span>Tạm tính:</span>
            <span>{totalPrice.toLocaleString()}₫</span>
          </div>
          <div className="flex justify-between">
            <span>Phí vận chuyển:</span>
            <span>—</span>
          </div>
          <hr />
          <div className="flex justify-between font-semibold text-red-500 text-lg">
            <span>Tổng cộng:</span>
            <span>{(finalAmount ?? totalPrice).toLocaleString()}₫</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
