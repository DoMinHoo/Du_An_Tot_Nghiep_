import React from "react";

const CheckoutPage: React.FC = () => {
    return (
        <div className="flex flex-col lg:flex-row bg-white p-6 rounded-md">
            {/* Left Side - Form */}
            <div className="lg:w-2/3 pr-0 lg:pr-6 border-b lg:border-b-0 lg:border-r border-gray-200">
                <h1 className="text-2xl font-semibold mb-1">Nội thất LIENTO</h1>
                <p className="text-sm text-gray-500 mb-4">Giỏ hàng / Thông tin giao hàng</p>

                <div className="mb-6">
                    <h2 className="text-lg font-medium mb-2">Thông tin giao hàng</h2>
                    <form className="space-y-4">
                        <input
                            type="text"
                            placeholder="Nguyễn Văn A"
                            className="w-full border rounded px-4 py-2"
                        />
                        <input
                            type="text"
                            placeholder="0123456789"
                            className="w-full border rounded px-4 py-2"
                        />
                        <div className="flex gap-4">
                            <select className="w-1/3 border rounded px-4 py-2">
                                <option>Chọn tỉnh/thành</option>
                                <option>Hồ Chí Minh</option>
                            </select>
                            <select className="w-1/3 border rounded px-4 py-2">
                                <option>Chọn quận/huyện</option>
                                <option>Quận 1</option>
                            </select>
                            <select className="w-1/3 border rounded px-4 py-2">
                                <option>Chọn phường/xã</option>
                                <option>Phường X</option>
                            </select>
                        </div>
                        <input
                            type="text"
                            placeholder="Địa chỉ chi tiết"
                            className="w-full border rounded px-4 py-2"
                        />
                    </form>
                </div>

                <div className="mb-6">
                    <h2 className="text-lg font-medium mb-2">Phương thức vận chuyển</h2>
                    <div className="border border-dashed border-gray-300 text-center py-4 rounded">
                        Vui lòng chọn tỉnh / thành để hiển thị phương thức vận chuyển.
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-lg font-medium mb-2">Phương thức thanh toán</h2>
                    <div className="space-y-3">
                        <label className="block">
                            <input type="radio" name="payment" className="mr-2" />
                            Thanh toán khi nhận hàng (COD)
                        </label>
                        <label className="block">
                            <input type="radio" name="payment" className="mr-2" />
                            <strong>Thanh toán chuyển khoản qua ngân hàng</strong>
                            <div className="ml-6 text-sm text-gray-600">
                                <p>Chủ tài khoản: ABCXYZ</p>
                                <p>Số tài khoản: 0123456789</p>
                                <p>Ngân hàng: ALO BANK</p>
                                <p>Nội dung: Tên + SĐT đặt hàng</p>
                            </div>
                        </label>
                        <label className="block">
                            <input type="radio" name="payment" className="mr-2" /> Ví ZaloPay
                        </label>
                        <label className="block">
                            <input type="radio" name="payment" className="mr-2" /> Ví Momo
                        </label>
                    </div>
                </div>

                <div className="text-right space-x-2">
                    <button className="px-4 py-2 border rounded text-gray-600">Giỏ hàng</button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded">Hoàn tất đơn hàng</button>
                </div>
            </div>

            {/* Right Side - Cart Summary */}
            <div className="lg:w-1/3 mt-8 lg:mt-0 lg:pl-6">
                <div className="border rounded p-4 space-y-4">
                    <div className="flex gap-4">
                        <img src="https://via.placeholder.com/80" alt="item" />
                        <div>
                            <p className="font-medium">Combo Phòng Ăn MOHO KOSTER Màu Nâu</p>
                            <p className="text-gray-500 text-sm">Nâu</p>
                            <p className="font-semibold">7,690,000₫</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <img src="https://via.placeholder.com/80" alt="item" />
                        <div>
                            <p className="font-medium">Full Combo Phòng Khách MOHO KOSTER Màu Nâu</p>
                            <p className="text-gray-500 text-sm">Nâu</p>
                            <p className="font-semibold">11,690,000₫</p>
                        </div>
                    </div>

                    <input
                        type="text"
                        placeholder="Mã giảm giá..."
                        className="w-full border rounded px-4 py-2"
                    />
                    <button className="w-full bg-gray-200 py-2 rounded">Sử dụng</button>

                    <hr />
                    <div className="flex justify-between">
                        <span>Tạm tính:</span>
                        <span>19,380,000₫</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Phí vận chuyển:</span>
                        <span>—</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-semibold text-red-500 text-lg">
                        <span>Tổng cộng:</span>
                        <span>19,380,000₫</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;