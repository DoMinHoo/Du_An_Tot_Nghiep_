// types/Review.ts (hoặc file định nghĩa kiểu dữ liệu của bạn)

export interface Review {
  _id: string;
  product: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  visible: boolean;
  flagged: boolean;
  replies: { // Định nghĩa cấu trúc của mảng replies
    _id: string;
    content: string;
    createdAt: string;
    admin?: { // Thông tin admin đã được populate từ backend
      _id: string;
      name: string;
    };
  }[];
}