import api from './api';

export const getCurrentUser = async () => {
    const response = await api.get('/courses/current-user-id');
    return response.data;
};