import type { AxiosResponse } from "axios";
import type { IPagedList } from "../models/booking";
import type { BookingPaymentStatus, IBookingPayment, IOrder, IOrderRequest, OrderStatus } from "../models/order";
import httpService from "./http-service";

const endPointBaseURL = `admin/orders`;

const getAllOrders = async (params: { status?: OrderStatus | ""; search?: string; limit: number; skip: number }): Promise<IPagedList<IOrder>> => {
    const response = await httpService.get<IOrder[]>(endPointBaseURL, {
        params: { ...params, status: params.status || undefined, search: params.search?.trim() || undefined },
    });
    return { items: response.data, total: Number(response.headers["x-total-count"] ?? response.data.length) };
};

const getOrderDetails = async (id: string): Promise<AxiosResponse<IOrder>> => httpService.get<IOrder>(`${endPointBaseURL}/${id}`);

const createOrder = async (body: IOrderRequest): Promise<AxiosResponse<IOrder>> => httpService.post<IOrder>(endPointBaseURL, body);

const cancelOrder = async (id: string): Promise<AxiosResponse<IOrder>> => httpService.post<IOrder>(`${endPointBaseURL}/${id}/cancel`);

const refundOrder = async (id: string): Promise<AxiosResponse<IOrder>> => httpService.post<IOrder>(`${endPointBaseURL}/${id}/refund`);

const getBookingPayments = async (params: { status?: BookingPaymentStatus | ""; search?: string; limit: number; skip: number }): Promise<IPagedList<IBookingPayment>> => {
    const response = await httpService.get<IBookingPayment[]>(`admin/payments`, {
        params: { ...params, status: params.status || undefined, search: params.search?.trim() || undefined },
    });
    return { items: response.data, total: Number(response.headers["x-total-count"] ?? response.data.length) };
};

export default { getAllOrders, getOrderDetails, createOrder, cancelOrder, refundOrder, getBookingPayments };
