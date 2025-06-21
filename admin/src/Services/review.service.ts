import axios from '../utils/axiosInstance'; // hoặc axios thường nếu không custom

export const getAllReviews = async () => {
  const res = await axios.get("/api/reviews"); // hoặc endpoint phù hợp
  return res.data;
};
