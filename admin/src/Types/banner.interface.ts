export interface Banner {
    _id: string;
    title?: string;
    image: string;
    link?: string;
    isActive: boolean;
    collection?: string;
    position?: number;
    createdAt?: string;
    updatedAt?: string;
}