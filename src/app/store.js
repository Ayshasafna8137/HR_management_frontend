import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { userApi } from "./service/user";
import { attendanceApi } from "./service/attendance";
import { leaveApi } from "./service/leave";
import { leaveBalanceApi } from "./service/leavebalance";
import { leaveTypeApi } from "./service/leavetype";


export const store = configureStore({
  reducer: {
    [userApi.reducerPath]: userApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
    [leaveApi.reducerPath]: leaveApi.reducer,
    [leaveBalanceApi.reducerPath]: leaveBalanceApi.reducer,
    [leaveTypeApi.reducerPath]: leaveTypeApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(userApi.middleware)
      .concat(attendanceApi.middleware)
      .concat(leaveApi.middleware)
      .concat(leaveBalanceApi.middleware)
      .concat(leaveTypeApi.middleware),
});

setupListeners(store.dispatch);
