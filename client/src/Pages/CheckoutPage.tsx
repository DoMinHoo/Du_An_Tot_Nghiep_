import React, { useEffect, useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

import { getCart } from '../services/cartService';
import { createOrder } from '../services/orderService';
import { getAllPromotions } from '../services/apiPromotion.service';
import {
  getProvinces,
  getDistricts,
  getWards,
  calculateShippingFee,
} from '../services/ghnService';

const CheckoutPage: React.FC = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [finalAmount, setFinalAmount] = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number | null>(null);
  const { data: promotionListRaw } = useQuery({
    queryKey: ['promotions'],
    queryFn: getAllPromotions,
  });
  const promotionList: any[] = Array.isArray(promotionListRaw)
    ? promotionListRaw
    : [];

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [street, setStreet] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<
    'cod' | 'bank_transfer' | 'online_payment'
  >('cod');
  const [couponCode, setCouponCode] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const token = sessionStorage.getItem('token') || undefined;
  const guestId = sessionStorage.getItem('guestId') || undefined;

  const passedState = location.state as {
    selectedItems?: string[];
    cartItems?: any[];
    totalPrice?: number;
    isDirectPurchase?: boolean;
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('shippingInfo');
    if (saved) {
      try {
        const info = JSON.parse(saved);
        setFullName(info.fullName || '');
        setPhone(info.phone || '');
        setEmail(info.email || '');
        setProvince(info.province || '');
        setDistrict(info.district || '');
        setWard(info.ward || '');
        setStreet(info.street || '');
        setDetailAddress(info.detailAddress || '');
      } catch (error) {
        console.warn('Không thể đọc dữ liệu shippingInfo:', error);
      }
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => getCart(token, guestId),
    enabled: !!token || !!guestId,
  });

  const paymentOptions: {
    label: string;
    value: 'cod' | 'bank_transfer' | 'online_payment';
  }[] = [
    { label: 'Thanh toán khi nhận hàng (COD)', value: 'cod' },
    { label: 'Chuyển khoản ngân hàng', value: 'bank_transfer' },
    { label: 'Thanh toán qua ZaloPay', value: 'online_payment' },
  ];

  // Lấy giá trị từ location.state chỉ 1 lần khi mount
  const [initSelectedItems] = useState(() => passedState?.selectedItems || []);
  const [initCartItems] = useState(() => passedState?.cartItems || undefined);
  const [initTotalPrice] = useState(() => passedState?.totalPrice);
  const [isDirectPurchase] = useState(
    () => passedState?.isDirectPurchase || false
  );

  const fallbackCart = data?.data?.cart;
  const fallbackTotalPrice = data?.data?.totalPrice || 0;

  const selectedItems = initSelectedItems;
  const cartItems = isDirectPurchase
    ? initCartItems
    : initCartItems ?? fallbackCart?.items ?? [];
  const totalPrice = initTotalPrice ?? fallbackTotalPrice;

  const orderMutation = useMutation({
    mutationFn: (orderData: any) => createOrder(orderData, token, guestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Đặt hàng thành công!', { autoClose: 1500 });
      sessionStorage.removeItem('pendingOrderInfo');
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

  // Thêm biến tổng tiền đã cộng phí vận chuyển
  const [provinceList, setProvinceList] = useState<any[]>([]);
  const [districtList, setDistrictList] = useState<any[]>([]);
  const [wardList, setWardList] = useState<any[]>([]);
  const [provinceId, setProvinceId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [wardCode, setWardCode] = useState<string>('');
  const [shippingFee, setShippingFee] = useState<number>(0); // KHỞI TẠO 0
  const [provinceSearch, setProvinceSearch] = useState(''); // Thêm state tìm kiếm

  const finalAmountWithShipping = (finalAmount ?? totalPrice) + shippingFee;

  // Lấy danh sách tỉnh/thành khi mount
  useEffect(() => {
    getProvinces()
      .then((res) => {
        console.log('Provinces:', res); // Kiểm tra dữ liệu thực tế
        // Sửa lại đoạn này cho đúng với dữ liệu thực tế trả về từ backend
        if (Array.isArray(res)) {
          setProvinceList(res);
        } else if (res && Array.isArray(res.data)) {
          setProvinceList(res.data);
        } else if (res && Array.isArray(res.provinces)) {
          setProvinceList(res.provinces);
        } else {
          setProvinceList([]);
        }
      })
      .catch(() => setProvinceList([]));
  }, []);

  // Lấy danh sách quận/huyện khi chọn tỉnh/thành
  useEffect(() => {
    if (provinceId) {
      getDistricts(provinceId)
        .then(setDistrictList)
        .catch(() => setDistrictList([]));
    } else {
      setDistrictList([]);
      setDistrict('');
      setDistrictId(null);
    }
    setWardList([]);
    setWard('');
    setWardCode('');
  }, [provinceId]);

  // Lấy danh sách phường/xã khi chọn quận/huyện
  useEffect(() => {
    if (districtId) {
      getWards(districtId)
        .then(setWardList)
        .catch(() => setWardList([]));
    } else {
      setWardList([]);
      setWard('');
      setWardCode('');
    }
  }, [districtId]);

  // Tính phí vận chuyển khi chọn tỉnh/thành, quận/huyện, phường/xã hoặc khi thay đổi tỉnh/thành
  useEffect(() => {
    // Chỉ tính phí khi đã chọn đủ tỉnh, quận, phường và các giá trị là hợp lệ
    if (
      provinceId &&
      districtId &&
      wardCode &&
      totalPrice > 0 &&
      typeof districtId === 'number' &&
      typeof provinceId === 'number' &&
      typeof wardCode === 'string' &&
      wardCode.length > 0
    ) {
      calculateShippingFee({
        toDistrictId: districtId,
        toWardCode: wardCode,
        amount: totalPrice,
      })
        .then((fee) => {
          // Nếu fee là số hợp lệ và lớn hơn 0 thì set, nếu không thì set 0
          if (typeof fee === 'number' && !isNaN(fee) && fee > 0) {
            setShippingFee(fee);
          } else {
            setShippingFee(0);
          }
        })
        .catch(() => setShippingFee(0));
    } else {
      setShippingFee(0);
    }
  }, [provinceId, districtId, wardCode, totalPrice]);

  const handleSubmitOrder = async () => {
    if (!validate()) return;

    if (!cartItems?.length) {
      toast.error('Giỏ hàng trống!');
      return;
    }

    let finalEmail = email?.trim();
    if (!finalEmail && token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email) finalEmail = payload.email;
      } catch {
        console.warn('Không thể lấy email từ token');
      }
    }
    if (!finalEmail) finalEmail = 'guest@example.com';

    try {
      const items = cartItems.map((item: any) => ({
        variationId: item.variationId._id,
        quantity: item.quantity,
        salePrice: item.variationId.salePrice || item.variationId.finalPrice,
      }));

      const orderData = {
        shippingAddress: {
          fullName,
          phone,
          email: finalEmail,
          addressLine: detailAddress,
          street,
          province,
          district,
          ward,
        },
        paymentMethod,
        cartId: isDirectPurchase ? null : fallbackCart?._id, // Gửi null nếu là mua trực tiếp
        couponCode: couponCode || undefined,
        finalAmount: finalAmountWithShipping,
        shippingFee,
        selectedItems: isDirectPurchase ? selectedItems : selectedItems, // Đảm bảo gửi đúng selectedItems
        items,
      };

      sessionStorage.setItem(
        'shippingInfo',
        JSON.stringify({
          fullName,
          phone,
          email: finalEmail,
          province,
          district,
          ward,
          street,
          detailAddress,
        })
      );

      const orderRes = await orderMutation.mutateAsync(orderData);

      if (paymentMethod === 'bank_transfer') {
        sessionStorage.setItem('pendingOrder', JSON.stringify(orderRes));
        const res = await fetch(
          'http://localhost:5000/api/vnpay/create-payment',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: finalAmountWithShipping,
            }),
          }
        );

        const data = await res.json();
        if (res.ok && data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          toast.error(data.error || 'Không tạo được thanh toán VNPAY');
        }
      } else if (paymentMethod === 'online_payment' && orderRes?.orderCode) {
        const res = await fetch(
          'http://localhost:5000/api/zalo-payment/create-payment',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderCode: orderRes.orderCode }),
          }
        );

        const data = await res.json();
        if (res.ok && data.order_url) {
          localStorage.setItem('currentOrderCode', orderRes.orderCode);
          window.location.href = data.order_url;
        } else {
          toast.error(data.message || 'Không lấy được link thanh toán ZaloPay');
        }
      } else {
        toast.success('Đặt hàng thành công!', { autoClose: 1500 });
        setTimeout(() => navigate('/thank-you'), 1600);
      }
    } catch (error) {
      toast.error('Đặt hàng thất bại!', { autoClose: 1500 });
      console.error('Lỗi handleSubmitOrder:', error);
    }
  };

  const applyCoupon = async (code: string) => {
    if (!code.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/promotions/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          originalPrice: Number(totalPrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Áp mã thất bại');
        setFinalAmount(null);
        return;
      }
      toast.success(data.message || 'Áp dụng mã thành công!');
      setFinalAmount(data.finalPrice);
      setDiscountAmount(data.discountAmount);
    } catch {
      toast.error('Có lỗi khi áp dụng mã');
      setFinalAmount(null);
      setDiscountAmount(null);
    }
  };

  // State cho địa chỉ động

  // Lấy danh sách tỉnh/thành khi mount
  useEffect(() => {
    getProvinces()
      .then((res) => {
        console.log('Provinces:', res); // Kiểm tra dữ liệu thực tế
        // Sửa lại đoạn này cho đúng với dữ liệu thực tế trả về từ backend
        if (Array.isArray(res)) {
          setProvinceList(res);
        } else if (res && Array.isArray(res.data)) {
          setProvinceList(res.data);
        } else if (res && Array.isArray(res.provinces)) {
          setProvinceList(res.provinces);
        } else {
          setProvinceList([]);
        }
      })
      .catch(() => setProvinceList([]));
  }, []);

  // Lấy danh sách quận/huyện khi chọn tỉnh/thành
  useEffect(() => {
    if (provinceId) {
      getDistricts(provinceId)
        .then(setDistrictList)
        .catch(() => setDistrictList([]));
    } else {
      setDistrictList([]);
      setDistrict('');
      setDistrictId(null);
    }
    setWardList([]);
    setWard('');
    setWardCode('');
  }, [provinceId]);

  // Lấy danh sách phường/xã khi chọn quận/huyện
  useEffect(() => {
    if (districtId) {
      getWards(districtId)
        .then(setWardList)
        .catch(() => setWardList([]));
    } else {
      setWardList([]);
      setWard('');
      setWardCode('');
    }
  }, [districtId]);

  // Tính phí vận chuyển khi chọn tỉnh/thành, quận/huyện, phường/xã hoặc khi thay đổi tỉnh/thành
  useEffect(() => {
    // Chỉ tính phí khi đã chọn đủ tỉnh, quận, phường và các giá trị là hợp lệ
    if (
      provinceId &&
      districtId &&
      wardCode &&
      totalPrice > 0 &&
      typeof districtId === 'number' &&
      typeof provinceId === 'number' &&
      typeof wardCode === 'string' &&
      wardCode.length > 0
    ) {
      calculateShippingFee({
        toDistrictId: districtId,
        toWardCode: wardCode,
        amount: totalPrice,
      })
        .then((fee) => {
          // Nếu fee là số hợp lệ và lớn hơn 0 thì set, nếu không thì set 0
          if (typeof fee === 'number' && !isNaN(fee) && fee > 0) {
            setShippingFee(fee);
          } else {
            setShippingFee(0);
          }
        })
        .catch(() => setShippingFee(0));
    } else {
      setShippingFee(0);
    }
  }, [provinceId, districtId, wardCode, totalPrice]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setProvinceId(id || null);
    setProvince(e.target.selectedOptions[0]?.text || '');
    // Reset quận/huyện, phường/xã khi đổi tỉnh/thành
    setDistrict('');
    setDistrictId(null);
    setWard('');
    setWardCode('');
    setDistrictList([]);
    setWardList([]);
    setShippingFee(0); // Reset phí khi đổi tỉnh
  };

  // Thay đổi select quận/huyện
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setDistrictId(id || null);
    setDistrict(e.target.selectedOptions[0]?.text || '');
  };

  // Thay đổi select phường/xã
  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setWardCode(e.target.value);
    setWard(e.target.selectedOptions[0]?.text || '');
  };

  // Lọc danh sách tỉnh/thành theo từ khóa tìm kiếm
  const filteredProvinceList = (
    Array.isArray(provinceList) ? provinceList : []
  ).filter((item) => {
    const name = (
      item.ProvinceName ||
      item.province_name ||
      item.name ||
      ''
    ).toLowerCase();
    return name.includes(provinceSearch.trim().toLowerCase());
  });

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
                  value={provinceId || ''}
                  onChange={handleProvinceChange}
                >
                  <option value="">Chọn tỉnh/thành</option>
                  {filteredProvinceList.map((item) => (
                    <option
                      key={item.ProvinceID || item.province_id || item.id}
                      value={item.ProvinceID || item.province_id || item.id}
                    >
                      {item.ProvinceName || item.province_name || item.name}
                    </option>
                  ))}
                </select>
                {errors.province && (
                  <p className="text-red-500 text-sm mt-1">{errors.province}</p>
                )}
              </div>
              <div className="w-1/3">
                <select
                  className="w-full border rounded px-4 py-2"
                  value={districtId || ''}
                  onChange={handleDistrictChange}
                  disabled={!provinceId}
                >
                  <option value="">Chọn quận/huyện</option>
                  {(Array.isArray(districtList) ? districtList : []).map(
                    (item) => (
                      <option key={item.DistrictID} value={item.DistrictID}>
                        {item.DistrictName}
                      </option>
                    )
                  )}
                </select>
                {errors.district && (
                  <p className="text-red-500 text-sm mt-1">{errors.district}</p>
                )}
              </div>
              <div className="w-1/3">
                <select
                  className="w-full border rounded px-4 py-2"
                  value={wardCode}
                  onChange={handleWardChange}
                  disabled={!districtId}
                >
                  <option value="">Chọn phường/xã</option>
                  {(Array.isArray(wardList) ? wardList : []).map((item) => (
                    <option key={item.WardCode} value={item.WardCode}>
                      {item.WardName}
                    </option>
                  ))}
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
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value as
                        | 'cod'
                        | 'bank_transfer'
                        | 'online_payment'
                    )
                  }
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
          ) : (Array.isArray(cartItems) ? cartItems : []).length ? (
            (Array.isArray(cartItems) ? cartItems : [])
              .filter(
                (item) =>
                  selectedItems.length === 0 ||
                  selectedItems.includes(item.variationId._id)
              )
              .map((item: any, index: number) => (
                <div key={index} className="flex gap-4">
                  <img
                    src={
                      // Ưu tiên lấy ảnh từ productId.images[0], sau đó đến colorImageUrl, cuối cùng là placeholder
                      (item.variationId.productId &&
                        Array.isArray(item.variationId.productId.images) &&
                        item.variationId.productId.images.length > 0 &&
                        item.variationId.productId.images[0]) ||
                      item.variationId.colorImageUrl ||
                      '/placeholder.png'
                    }
                    alt={item.variationId.name || 'Sản phẩm'}
                    className="w-20 h-20 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.png';
                    }}
                  />
                  <div className="  grid grid-cols-2  flex-11/12 jcontent-between items-center">
                    <div>
                      <p className="font-medium">{item.variationId.name}</p>
                      <p className="text-gray-500 text-sm">
                        {item.variationId.material.name}
                      </p>

                      <p className="text-gray-500 text-sm">
                        {item.variationId.colorName}
                      </p>
                    </div>
                    <div className="flex justify-end items-center">
                      {item.variationId.finalPrice !== 0 &&
                      item.variationId.salePrice !== 0 &&
                      item.variationId.salePrice <
                        item.variationId.finalPrice ? (
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
                </div>
              ))
          ) : (
            <p>Giỏ hàng trống</p>
          )}

          <div className="space-y-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <label className="font-semibold text-gray-700 text-sm">
              Mã giảm giá
            </label>

            <div className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Nhập mã giảm giá..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  // Khi setCouponCode, chỉ reset finalAmount khi thực sự xóa mã
                  if (e.target.value.trim() === '') {
                    setFinalAmount(null);
                    setDiscountAmount(null); // Thêm dòng này để tránh render lại liên tục
                    toast.info('Đã xóa mã giảm giá, giá gốc được áp dụng lại');
                  }
                }}
              />
              <button
                className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-900 transition duration-200 active:scale-95"
                onClick={() => applyCoupon(couponCode)}
              >
                Áp dụng
              </button>
            </div>

            {Array.isArray(promotionList) && promotionList.length > 0 && (
              <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3 max-h-60 overflow-y-auto">
                <p className="font-semibold text-gray-700 text-sm">
                  Chọn mã giảm giá:
                </p>

                {promotionList.map((promo) => {
                  const minOrder = promo.minimumOrderValue || 0;
                  const isExpired =
                    promo.expiryDate && new Date(promo.expiryDate) < new Date();
                  const notMeetMinOrder = totalPrice < minOrder;
                  const disabled = isExpired || notMeetMinOrder;

                  return (
                    <div
                      key={promo._id}
                      className={`border border-gray-200 rounded-lg p-3 text-sm flex justify-between items-start cursor-pointer transition duration-200 ${
                        disabled
                          ? 'opacity-50 bg-gray-100'
                          : 'hover:bg-blue-50 hover:border-blue-300'
                      }`}
                      onClick={() => {
                        if (disabled) return;
                        setCouponCode(promo.code);
                      }}
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-blue-600">
                          {promo.code}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Giảm giá:{' '}
                          {promo.discountType === 'percentage'
                            ? `${promo.discountValue}%`
                            : `${promo.discountValue.toLocaleString()}₫`}
                        </p>
                        {promo.minimumOrderValue && (
                          <p className="text-gray-600 text-xs">
                            Đơn tối thiểu:{' '}
                            {promo.minimumOrderValue.toLocaleString()}₫
                          </p>
                        )}
                        {promo.expiryDate && (
                          <p
                            className={`text-xs ${
                              isExpired ? 'text-red-500' : 'text-gray-600'
                            }`}
                          >
                            HSD:{' '}
                            {new Date(promo.expiryDate).toLocaleDateString(
                              'vi-VN',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              }
                            )}
                          </p>
                        )}
                        {isExpired && (
                          <p className="text-red-500 text-xs font-medium">
                            Đã hết hạn
                          </p>
                        )}
                        {notMeetMinOrder && !isExpired && (
                          <p className="text-orange-500 text-xs">
                            Cần tối thiểu{' '}
                            {promo.minimumOrderValue.toLocaleString()}₫
                          </p>
                        )}
                      </div>
                      {!disabled && (
                        <button
                          className="text-blue-600 text-xs font-medium hover:underline"
                          onClick={() => {
                            setCouponCode(promo.code);
                            applyCoupon(promo.code);
                          }}
                        >
                          Chọn
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr />
          <div className="flex justify-between">
            <span>Tạm tính:</span>
            <span>{totalPrice.toLocaleString()}₫</span>
          </div>
          <div className="flex justify-between">
            <span>Phí vận chuyển:</span>
            <span>
              {provinceId && districtId && wardCode
                ? shippingFee > 0
                  ? `${shippingFee.toLocaleString()}₫`
                  : 'Đang tính phí...'
                : 'Vui lòng chọn đủ địa chỉ'}
            </span>
          </div>
          <hr />
          {discountAmount !== null && discountAmount > 0 && (
            <div className="flex justify-between text-green-600 font-medium">
              <span>Tiết kiệm:</span>
              <span>-{discountAmount.toLocaleString()}₫</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-red-500 text-lg">
            <span>Tổng cộng:</span>
            <span>{finalAmountWithShipping.toLocaleString()}₫</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
