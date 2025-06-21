import axiosInstance from '../utils/axiosInstance';
import axios from '../utils/axiosInstance'; // hoặc axios thường nếu không custom

export const getAllReviews = async () => {
  const res = await axios.get("/api/reviews"); // hoặc endpoint phù hợp
  return res.data;
};

export const toggleReviewVisibility = async (id: string, visible: boolean) => {
  return await axiosInstance.patch(`/api/reviews/${id}/visibility`, { visible });
};

export const toggleReviewFlag = async (id: string, flagged: boolean) => {
  return await axiosInstance.patch(`/api/reviews/${id}/flag`, { flagged });
};

export const replyToReview = async (id: string, content: string) => {
  return await axiosInstance.post(`/api/reviews/${id}/reply`, { content });
};

