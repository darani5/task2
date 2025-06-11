// src/api/usersApi.js
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/users';

// Get all users
export const getUsers = async ({ page, limit, sortBy, order }) => {
  const response = await axios.get(BASE_URL, {
    params: {
      _page: page,
      _limit: limit,
      _sort: sortBy,
      _order: order
    }
  });
  return response.data;
};

// Add a new user
export const addUser = async (userData) => {
  const response = await axios.post(BASE_URL, userData);
  return response.data;
};

// Update an existing user
export const updateUser = async (id, userData) => {
  const response = await axios.put(`${BASE_URL}/${id}`, userData);
  return response.data;
};

// Delete a user
export const deleteUser = async (id) => {
  const response = await axios.delete(`${BASE_URL}/${id}`);
  return response.data;
};
