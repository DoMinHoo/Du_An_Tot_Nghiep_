import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Correct endpoint structure

export const getVariations = async (productId: string | number) => {
  try {
    const response = await axios.get(`${API_URL}/${productId}/variations`);
    return response.data.data;
  } catch (error) {
    console.error('Get variations error:', error);
    throw error;
  }
};


export const createVariation = async (productId: string | number, variationData: FormData) => {
  try {
    console.log('=== API DEBUG ===');
    console.log('Creating variation for product:', productId);
    console.log('Full URL:', `${API_URL}/${productId}/variations`);
    
    // Log FormData contents
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
        timeout: 30000 // 30 seconds timeout
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
    await axios.delete(
      `${API_URL}/${productId}/variations/${variationId}`
    );
  } catch (error) {
    console.error('Delete variation error:', error);
    throw error;
  }
};