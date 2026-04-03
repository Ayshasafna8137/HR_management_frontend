import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const leaveBalanceApi = createApi({
  reducerPath: "leaveBalance",
  baseQuery: fetchBaseQuery({ 
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['LeaveBalance'],
  endpoints: (builder) => ({
    getAllLeaveBalances: builder.query({
      query: () => `/api/leaveBalance`,
      providesTags: ['LeaveBalance'],
      transformResponse: (response) => {
        if (response.data) return response;
        return { data: response };
      }
    }),

    getLeaveBalanceById: builder.query({
      query: (id) => `/api/leaveBalance/${id}`,
      providesTags: (result, error, id) => [{ type: 'LeaveBalance', id }],
    }),

    updateLeaveBalance: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/leaveBalance/${id}`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'LeaveBalance', id }],
    }),

    deleteLeaveBalance: builder.mutation({
      query: (id) => ({
        url: `/api/leaveBalance/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ['LeaveBalance'],
    }),
  }),
});

export const {
  useGetAllLeaveBalancesQuery,
  useGetLeaveBalanceByIdQuery,
  useUpdateLeaveBalanceMutation,
  useDeleteLeaveBalanceMutation,
} = leaveBalanceApi;