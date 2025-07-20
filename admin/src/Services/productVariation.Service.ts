import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getVariations = async (productId: string | number) => {
  try {
    const response = await axios.get(`${API_URL}/${productId}/variations`);
    return response.data.data;
  } catch (error) {
    console.error('Get variations error:', error);
    throw error;
  }
};

export const getDeletedVariations = async (productId: string | number) => {
  try {
    console.log('Calling API:', `${API_URL}/${productId}/variations/deleted`);
    const response = await axios.get(`${API_URL}/${productId}/variations/deleted`, {
      headers: {
        // Add token if needed
        // Authorization: `Bearer ${yourToken}`,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Get deleted variations error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw error;
  }
};

export const createVariation = async (productId: string | number, variationData: FormData) => {
  try {
    console.log('=== API DEBUG ===');
    console.log('Creating variation for product:', productId);
    console.log('Full URL:', `${API_URL}/${productId}/variations`);
    
    console.log('FormData contents:');
    for (const [key, value] of variationData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }
    
    const response = await axios.post(
      `${API_URL}/${productId}/variations`,
      variationData,
      { 
        headers: { 
          'Content-Type': 'multipart/form-data' 
        },
        timeout: 30000
      }
    );
    
    console.log('Success response:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('=== API ERROR ===');
    console.error('Create variation error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Request config:', error.config);
    }
    throw error;
  }
};

export const updateVariation = async (
  productId: string | number,
  variationId: string | number,
  variationData: FormData
) => {
  try {
    const response = await axios.put(
      `${API_URL}/${productId}/variations/${variationId}`,
      variationData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Update variation error:', error);
    throw error;
  }
};

export const getVariationById = async (productId: string | number, variationId: string | number) => {
  try {
    const response = await axios.get(
      `${API_URL}/${productId}/variations/${variationId}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Get variation by id error!', error);
    throw error;
  }
};

export const deleteVariation = async (productId: string | number, variationId: string | number) => {
  try {
    const response = await axios.delete(
      `${API_URL}/${productId}/variations/${variationId}`
    );
    return response.data; // Trả về toàn bộ response để xử lý message
  } catch (error) {
    console.error('Delete variation error:', error);
    throw error;
  }
};

export const restoreVariation = async (productId: string | number, variationId: string | number) => {
  try {
    const response = await axios.patch(
      `${API_URL}/${productId}/variations/${variationId}/restore`
    );
    return response.data.data;
  } catch (error) {
    console.error('Restore variation error:', error);
    throw error;
  }
};