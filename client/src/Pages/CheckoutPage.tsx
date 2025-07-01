import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

import { getCart } from '../services/cartService';
import { createOrder } from '../services/orderService';

const CheckoutPage: React.FC = () => {

  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [street, setStreet] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<
    'cod' | 'bank' | 'zalopay' | 'momo'
  >('cod');
  const [couponCode, setCouponCode] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const token = sessionStorage.getItem('token') || undefined;
  const guestId = sessionStorage.getItem('guestId') || undefined;

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
      setTimeout(() => navigate('/thank-you'), 1600);
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
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email))
      newErrors.email = 'Email không hợp lệ';
    if (!province) newErrors.province = 'Vui lòng chọn tỉnh/thành';
    if (!district) newErrors.district = 'Vui lòng chọn quận/huyện';
    if (!ward) newErrors.ward = 'Vui lòng chọn phường/xã';
    if (!street.trim()) newErrors.street = 'Vui lòng nhập tên đường';
    if (!detailAddress.trim())
      newErrors.detailAddress = 'Vui lòng nhập địa chỉ chi tiết';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = () => {
    if (!validate()) return;

    if (!cartItems?.length) {
      toast.error('Giỏ hàng trống!');
      return;
    }

    const orderData = {
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
      cartId: fallbackCart?._id,
      couponCode: couponCode || undefined,
    };

    orderMutation.mutate(orderData);
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
            <div>
              <input
                type="email"
                placeholder="Email"
                className="w-full border rounded px-4 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
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
            {['cod', 'bank', 'zalopay', 'momo'].map((method) => (
              <label key={method} className="block">
                <input
                  type="radio"
                  name="payment"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mr-2"
                />
                {method === 'bank' ? (
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
                  <>
                    Thanh toán{' '}
                    {method === 'cod'
                      ? 'khi nhận hàng (COD)'
                      : `qua ví ${method}`}
                  </>
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

                    <input
                        type="text"
                        placeholder="Mã giảm giá..."
                        className="w-full border rounded px-4 py-2"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <button
                        className="w-full bg-gray-200 py-2 rounded mt-2"
                        onClick={async () => {
                            try {
                            const res = await fetch("http://localhost:5000/api/promotions/apply", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                code: couponCode,
                                originalPrice: Number(totalPrice),
                                }),
                            });

                            const data = await res.json();

                            if (!res.ok) {
                                toast.error(data.message || "Áp mã thất bại");
                                return;
                            }

                            toast.success(data.message || "Áp dụng mã thành công!");
                            setFinalAmount(data.finalPrice); 
                            } catch {
                            toast.error("Có lỗi khi áp dụng mã");
                            }
                        }}
                        >
                        Sử dụng
                        </button>


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
              ))
          ) : (
            <p>Giỏ hàng trống</p>
          )}

          <input
            type="text"
            placeholder="Mã giảm giá..."
            className="w-full border rounded px-4 py-2"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
          <button className="w-full bg-gray-200 py-2 rounded">Sử dụng</button>

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
            <span>{totalPrice.toLocaleString()}₫</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
