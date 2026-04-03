import React, { useState, useEffect } from "react";
import { X, AlertCircle, User, Calendar } from "lucide-react";
import { useUpdateLeaveBalanceMutation } from "@/app/service/leavebalance";
import { useGetAllUserQuery } from "@/app/service/user";

const UpdateLeaveBalance = ({
  open,
  onOpenChange,
  balance,
  onSuccess,
  leaveBalanceData,
  setLeaveBalanceData
}) => {
  const { data, isLoading: isLoadingUsers } = useGetAllUserQuery();
  const [updateLeaveBalance, { isLoading: isUpdating }] = useUpdateLeaveBalanceMutation();

  const [form, setForm] = useState({
    userId: "",
    year: "",
    previousBalance: 0,
    currentBalance: 0,
    totalBalance: 0,
    usedLeave: 0,
    acceptedLeave: 0,
    rejectedLeave: 0,
    expiredLeave: 0,
    carryOverBalance: 0
  });

  const [errors, setErrors] = useState({});
  const [userOpen, setUserOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  // Get employees list
  let employees = [];
  if (data) {
    if (data.data && Array.isArray(data.data)) {
      employees = data.data;
    } else if (Array.isArray(data)) {
      employees = data;
    } else if (data.users && Array.isArray(data.users)) {
      employees = data.users;
    }
  }

  // Years for dropdown
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(i);
  }

  useEffect(() => {
    if (balance && open) {
      setForm({
        userId: balance.userId?._id || balance.userId || "",
        year: balance.year || "",
        previousBalance: balance.previousBalance || 0,
        currentBalance: balance.currentBalance || 0,
        totalBalance: balance.totalBalance || 0,
        usedLeave: balance.usedLeave || 0,
        acceptedLeave: balance.acceptedLeave || 0,
        rejectedLeave: balance.rejectedLeave || 0,
        expiredLeave: balance.expiredLeave || 0,
        carryOverBalance: balance.carryOverBalance || 0
      });
    }
  }, [balance, open]);

  useEffect(() => {
    if (!open) {
      setForm({
        userId: "",
        year: "",
        previousBalance: 0,
        currentBalance: 0,
        totalBalance: 0,
        usedLeave: 0,
        acceptedLeave: 0,
        rejectedLeave: 0,
        expiredLeave: 0,
        carryOverBalance: 0
      });
      setErrors({});
      setUserOpen(false);
      setYearOpen(false);
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }

    const numValue = name === 'year' ? parseInt(value) : parseFloat(value);
    
    setForm(prev => ({
      ...prev,
      [name]: name === 'userId' ? value : (isNaN(numValue) ? 0 : numValue)
    }));
  };

  const handleEmployeeSelect = (employee) => {
    setForm(prev => ({
      ...prev,
      userId: employee._id
    }));
    setUserOpen(false);
    
    if (errors.userId) {
      setErrors(prev => ({ ...prev, userId: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.userId) newErrors.userId = "Please select an employee";
    if (!form.year) newErrors.year = "Year is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getSelectedEmployeeName = () => {
    if (!form.userId) return "Select Employee";
    const selected = employees.find(emp => emp._id === form.userId);
    if (selected) {
      return selected.name || `${selected.firstName || ""} ${selected.lastName || ""}`.trim();
    }
    return "Select Employee";
  };

  const getSelectedYear = () => {
    const selected = years.find(y => y === form.year);
    return selected || form.year || currentYear;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const updateData = {
      userId: form.userId,
      year: form.year,
      previousBalance: form.previousBalance,
      currentBalance: form.currentBalance,
      totalBalance: form.totalBalance,
      usedLeave: form.usedLeave,
      acceptedLeave: form.acceptedLeave,
      rejectedLeave: form.rejectedLeave,
      expiredLeave: form.expiredLeave,
      carryOverBalance: form.carryOverBalance
    };

    try {
      const response = await updateLeaveBalance({
        id: balance._id,
        data: updateData
      }).unwrap();
      
      const updatedBalance = response?.data;

      if (leaveBalanceData && setLeaveBalanceData) {
        const updatedList = leaveBalanceData.map(item => 
          item._id === balance._id ? updatedBalance : item
        );
        setLeaveBalanceData(updatedList);
      }

      if (onSuccess) onSuccess();
      onOpenChange(false);

    } catch (err) {
      const errorMessage = err?.data?.message || err?.message || "Failed to update leave balance";
      setErrors({ submit: errorMessage });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white w-[600px] max-h-[90vh] overflow-y-auto rounded-lg shadow-xl">

        {/* Header */}
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center rounded-t-lg sticky top-0">
          <h2 className="text-lg font-semibold">Update Leave Balance</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="hover:bg-purple-700 p-1 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* EMPLOYEE DROPDOWN */}
          <div className="relative z-50">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee *
            </label>

            <div
              onClick={() => {
                setUserOpen(!userOpen);
                setYearOpen(false);
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 flex justify-between items-center cursor-pointer bg-white hover:border-purple-400 transition-colors"
            >
              <span className={form.userId ? "text-gray-900" : "text-gray-500"}>
                {getSelectedEmployeeName()}
              </span>
              <span className="text-gray-400">▼</span>
            </div>

            {userOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {isLoadingUsers ? (
                  <div className="px-4 py-2 text-gray-500">Loading employees...</div>
                ) : employees.length === 0 ? (
                  <div className="px-4 py-2 text-gray-500">No employees found</div>
                ) : (
                  employees.map((emp) => {
                    const empName = emp.name ||
                      `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
                    return (
                      <div
                        key={emp._id}
                        onClick={() => handleEmployeeSelect(emp)}
                        className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center ${
                          form.userId === emp._id ? "bg-purple-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span className={form.userId === emp._id ? "text-purple-600 font-medium" : "text-gray-700"}>
                            {empName}
                          </span>
                        </div>
                        {form.userId === emp._id && <span className="text-purple-600">✓</span>}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {errors.userId && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle size={12} className="text-red-500" />
                <p className="text-xs text-red-500">{errors.userId}</p>
              </div>
            )}
          </div>

          {/* YEAR DROPDOWN */}
          <div className="relative z-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year *
            </label>

            <div
              onClick={() => {
                setYearOpen(!yearOpen);
                setUserOpen(false);
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 flex justify-between items-center cursor-pointer bg-white hover:border-purple-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-gray-900">{getSelectedYear()}</span>
              </div>
              <span className="text-gray-400">▼</span>
            </div>

            {yearOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {years.map((year) => (
                  <div
                    key={year}
                    onClick={() => {
                      setForm({ ...form, year });
                      setYearOpen(false);
                    }}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center ${
                      form.year === year ? "bg-purple-50" : ""
                    }`}
                  >
                    <span className={form.year === year ? "text-purple-600 font-medium" : "text-gray-700"}>
                      {year}
                    </span>
                    {form.year === year && <span className="text-purple-600">✓</span>}
                  </div>
                ))}
              </div>
            )}

            {errors.year && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle size={12} className="text-red-500" />
                <p className="text-xs text-red-500">{errors.year}</p>
              </div>
            )}
          </div>

          {/* Input Fields Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Previous Balance
              </label>
              <input
                type="number"
                name="previousBalance"
                value={form.previousBalance}
                onChange={handleChange}
                step="0.5"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Balance *
              </label>
              <input
                type="number"
                name="currentBalance"
                value={form.currentBalance}
                onChange={handleChange}
                step="0.5"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Balance
              </label>
              <input
                type="number"
                name="totalBalance"
                value={form.totalBalance}
                onChange={handleChange}
                step="0.5"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Used Leave
              </label>
              <input
                type="number"
                name="usedLeave"
                value={form.usedLeave}
                onChange={handleChange}
                step="0.5"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Accepted Leave
              </label>
              <input
                type="number"
                name="acceptedLeave"
                value={form.acceptedLeave}
                onChange={handleChange}
                step="0.5"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejected Leave
              </label>
              <input
                type="number"
                name="rejectedLeave"
                value={form.rejectedLeave}
                onChange={handleChange}
                step="0.5"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expired Leave
              </label>
              <input
                type="number"
                name="expiredLeave"
                value={form.expiredLeave}
                onChange={handleChange}
                step="0.5"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carry Over Balance
              </label>
              <input
                type="number"
                name="carryOverBalance"
                value={form.carryOverBalance}
                onChange={handleChange}
                step="0.5"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {errors.submit && (
            <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isUpdating}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Updating..." : "Update Leave Balance"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default UpdateLeaveBalance;