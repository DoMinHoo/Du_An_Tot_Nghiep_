export interface StatsOverview {
    totalOrders: number;
    totalRevenue: number;
    totalUsers: number;
    totalProductsSold: number;
    revenueByTime: { time: string; total: number }[];
}

export interface StatsOrders {
    ordersByStatus: { status: string; count: number }[];
    ordersByTime: { time: string; count: number }[];
    popularProducts: { productName: string; variationName: string; totalQuantity: number }[];
    avgOrderValue: number;
}

export interface StatsProducts {
    bestSellingProducts: { productName: string; variationName: string; totalQuantity: number; colorImageUrl?: string }[];
    lowStockProducts: { name: string; productId: { name: string }; stockQuantity: number; colorImageUrl?: string }[];
    highReturnProducts: { productName: string; variationName: string; totalReturns: number; colorImageUrl?: string }[];
    unsoldProducts: { productName: string; variationName: string; stockQuantity: number; colorImageUrl?: string }[];
}

export interface StatsUsers {
    newUsers: number;
    activeUsers: { name: string; email: string; totalOrders: number; totalSpent: number }[];
    userPurchaseHistory: { name: string; email: string; orders: { orderCode: string; totalAmount: number; createdAt: string }[] }[];
    userByRegion: { region: string; count: number }[];
}

export interface StatsRevenue {
    revenueByTime: { time: string; total: number }[];
    revenueByCategory: { category: string; total: number }[];
    revenueByPaymentMethod: { paymentMethod: string; total: number }[];
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}