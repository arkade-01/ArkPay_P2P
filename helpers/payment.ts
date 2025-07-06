import axios from "axios";
import config from "../config/config";
import { InstitutionProps, OrderPayload, OrderResponse, RatePayload, RateResponse, VerifyAccountPayload } from "../types/payment.types";

const url = config.API.URL
const key = config.API.API_KEY

const api = axios.create({
  baseURL: url,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "API-Key": key,
  },
});

export const fetchSupportedCurrencies = async (): Promise<string[]> => {
  try {
    const response = await api.get(`/currencies`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching supported currencies:", error);
    throw error;
  }
};

export const fetchAccountName = async (
  payload: VerifyAccountPayload
): Promise<string> => {
  try {
    const response = await api.post(`/verify-account`, payload);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching supported institutions:", error);
    throw error;
  }
};

export const getInstitutions = async (
  currency: string
): Promise<InstitutionProps[]> => {
  try {
    const response = await api.get(`/institutions/${currency}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching supported institutions:", error);
    throw error;
  }
};

export const fetchRate = async ({
  token,
  amount = 1,
  currency = "NGN",
  providerId,
}: RatePayload): Promise<RateResponse> => {
  try {
    // Using relative path with api instance instead of constructing full URL
    const endpoint = `/rates/${token}/${amount}/${currency}`;
    const params = providerId ? { provider_id: providerId } : undefined;

    // Use the api instance instead of axios directly
    const response = await api.get(endpoint, { params });
    const { data } = response;

    // Check the API response status first
    if (data.status === "error") {
      throw new Error(data.message || "Provider not found");
    }

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(message);
    }
    console.error("Error fetching rate:", error);
    throw error;
  }
};

export const createOrder = async (
  payload: OrderPayload
): Promise<OrderResponse> => {
  try {
    const response = await api.post(`/sender/orders`, payload);
    return response.data.data;
  } catch (error) {
    console.error("Error Creating Order:", error); //change error log
    throw error;
  }
};
