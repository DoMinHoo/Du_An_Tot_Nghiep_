import axios from '../utils/axiosInstance';

// ✅ Lấy tất cả review (Admin)
export const getAllReviews = async () => {
  const res = await axios.get('/reviews');
  return res.data;
};

// ✅ Lấy review theo ID
export const getReviewById = async (id: string) => {
  const res = await axios.get(`/reviews/${id}`);
  return res.data;
};

// ✅ Tạo review mới (người dùng đánh giá sản phẩm)
export const createReview = async (data: {
  product: string;
  rating: number;
  comment: string;
}) => {
    const res = await axios.post('/reviews', data);
    
    return res.data;
    
};

// ✅ Cập nhật review (người dùng hoặc admin)
export const updateReview = async (id: string, data: { rating?: number; comment?: string }) => {
  const res = await axios.put(`/reviews/${id}`, data);
  return res.data;
};

// ✅ Xóa review (người dùng hoặc admin)
export const deleteReview = async (id: string) => {
  const res = await axios.delete(`/reviews/${id}`);
  return res.data;
};

// ✅ Thêm phản hồi từ admin vào review
export const replyToReview = async (id: string, replyContent: string) => {
  const res = await axios.post(`/reviews/${id}/reply`, {
    content: replyContent,
  });
  return res.data;
};

export const getReviewsByProduct = async (productId: string) => {
    const res = await axios.get(`/reviews/product/${productId}`);
    return res.data;
};
  
