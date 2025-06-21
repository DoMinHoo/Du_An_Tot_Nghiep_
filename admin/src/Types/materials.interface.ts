export interface Material {
    _id: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface MaterialResponse {
    data: Material[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
}
