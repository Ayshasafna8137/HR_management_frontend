import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const leaveApi = createApi({
  reducerPath: "leave",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),
  endpoints: (builder) => ({

    // Get all leave requests
    getAllLeaveRequests: builder.query({
      query: () => `/api/leaveRequest`,
    }),

    // Get leave request by id
    getLeaveRequestById: builder.query({
      query: (id) => `/api/leaveRequest/${id}`,
    }),

    // Create leave request
    createLeaveRequest: builder.mutation({
      query: (leaveData) => ({
        url: `/api/leaveRequest`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: leaveData,
      }),
    }),

    // Update leave request
    updateLeaveRequest: builder.mutation({
      query: ({ id, leaveData }) => ({
        url: `/api/leaveRequest/${id}`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: leaveData,
      }),
    }),

    // Update leave request status
    updateLeaveStatus: builder.mutation({
      query: ({ id, status, manageId, manageRole }) => ({
        url: `/api/leaveRequest/${id}/status`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: { status, manageId, manageRole },
      }),
    }),

    // Delete leave request
    deleteLeaveRequest: builder.mutation({
      query: (id) => ({
        url: `/api/leaveRequest/${id}`,
        method: "DELETE",
      }),
    }),

  }),
});

export const {
  useGetAllLeaveRequestsQuery,
  useGetLeaveRequestByIdQuery,
  useCreateLeaveRequestMutation,
  useUpdateLeaveRequestMutation,
  useUpdateLeaveStatusMutation,
  useDeleteLeaveRequestMutation,
} = leaveApi;