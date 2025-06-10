    import { DEFAULT_IMAGE_URL } from '../constants/api';

    export const getImageUrl = (image?: string): string => {
    if (!image) return DEFAULT_IMAGE_URL;
    return /^https?:\/\//.test(image) ? image : `http://localhost:5000${image}`;
    };
