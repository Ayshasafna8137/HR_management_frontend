import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const leaveTypeApi = createApi({
  reducerPath: "leaveType",
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
  tagTypes: ['LeaveType'],
  endpoints: (builder) => ({

    // Get all leave types
    getAllLeaveTypes: builder.query({
      query: () => "/api/leaveType",
      providesTags: ['LeaveType'],
    }),

    // Get leave type by id
    getLeaveTypeById: builder.query({
      query: (id) => `/api/leaveType/${id}`,
      providesTags: (result, error, id) => [{ type: 'LeaveType', id }],
    }),

    // Create new leave type
    createLeaveType: builder.mutation({
      query: (newLeaveType) => ({
        url: `/api/leaveType`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: newLeaveType,
      }),
      invalidatesTags: ['LeaveType'],
    }),

    // Update a leave type
    updateLeaveType: builder.mutation({
      query: ({ id, updateLeaveType }) => ({
        url: `/api/leaveType/${id}`,
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: updateLeaveType,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'LeaveType', id }],
    }),

    // Delete a leave type
    deleteLeaveType: builder.mutation({
      query: (id) => ({
        url: `/api/leaveType/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['LeaveType'],
    }),

  }),
});

export const {
  useGetAllLeaveTypesQuery,
  useGetLeaveTypeByIdQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
} = leaveTypeApi;