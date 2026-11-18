import api from "./api";

const URL = "/admin/accounts";

export const getAccounts = async (keyword = "", status = "all", pageNo = 1, pageSize = 5) => {
  const response = await api.get(URL, {
    params: {
      keyword,
      ...(status !== "all" ? { status } : {}),
      pageNo,
      pageSize,
    },
  });
  return response.data;
};

export const getAccountStatistics = async () => {
  const response = await api.get(`${URL}/statistics`);
  return response.data;
};

export const getAccountById = async (userId) => {
  const response = await api.get(`${URL}/${userId}`);
  return response.data;
};

export const createAccount = async (data) => {
  const response = await api.post(URL, data);
  return response.data;
};

export const updateAccount = async (userId, data) => {
  const response = await api.put(`${URL}/${userId}`, data);
  return response.data;
};