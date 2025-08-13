    export interface ChartData {
    type: 'bar' | 'line' | 'pie';
    data: {
        labels: string[];
        datasets: {
        label: string;
        data: number[];
        backgroundColor: string | string[];
        borderColor?: string;
        borderWidth?: number;
        fill?: boolean;
        }[];
    };
    options: {
        responsive: boolean;
        scales?: { y?: { beginAtZero: boolean } };
    };
    }

    export interface RevenueStats {
    currentRevenue: number;
    previousRevenue: number;
    growthRate: number;
    orderStatus: {
        pending: number;
        confirmed: number;
        shipping: number;
        completed: number;
        canceled: number;
    };
    avgRevenuePerOrder: number;
    chart: ChartData;
    }

    export interface ProductStats {
    productStats: {
        active: number;
        inactive: number;
        flashSale: number;
        totalStock: number;
    };
topProducts: {
    _id: string;
    productName?: string;
    totalSold: number;
    totalRevenue: number;
    colorImageUrl?: string;
    dimensions?: string;
    colorName?: string;
}[];
    lowStockProducts: { name: string; stockQuantity: number; productId: string }[];
    popularCategories: { _id: { categoryId: string; categoryName: string }; totalSold: number }[];
    soldRatio: number;
    unsoldProducts: number;
    chart: ChartData;
    }

    export interface CustomerStats {
    customerStats: {
        total: number;
        new: number;
        returning: number;
    };
    newCustomersThisMonth: number;
    topLocations: { _id: string; count: number }[];
    orderStatus: {
        pending: number;
        confirmed: number;
        shipping: number;
        completed: number;
        canceled: number;
    };
    chart: ChartData;
    }