import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { useCreateLeaveRequestMutation } from "@/app/service/leave";
import { useGetAllUserQuery } from "@/app/service/user";

const CreateLeaveRequest = ({
  open,
  onOpenChange,
  onSuccess,
  leaveData,
  setLeaveData
}) => {

  const { data, isLoading } = useGetAllUserQuery();

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

  const [createLeaveRequest, { isLoading: isAdding }] = useCreateLeaveRequestMutation();

  const [form, setForm] = useState({
    companyId: "",
    userId: "",
    leaveType: "Casual",
    leaveFrom: "",
    leaveTo: "",
    noOfDays: "",
    reason: ""
  });

  const [errors, setErrors] = useState({});
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [leaveTypeOpen, setLeaveTypeOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm({
        companyId: "",
        userId: "",
        leaveType: "Casual",
        leaveFrom: "",
        leaveTo: "",
        noOfDays: "",
        reason: ""
      });
      setErrors({});
      setEmployeeOpen(false);
      setLeaveTypeOpen(false);
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }

    // Auto-calculate number of days when dates are selected
    if (name === "leaveFrom" || name === "leaveTo") {
      const newForm = { ...form, [name]: value };
      if (newForm.leaveFrom && newForm.leaveTo) {
        const fromDate = new Date(newForm.leaveFrom);
        const toDate = new Date(newForm.leaveTo);
        const diffTime = Math.abs(toDate - fromDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        newForm.noOfDays = diffDays;
      }
      setForm(newForm);
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEmployeeSelect = (employee) => {
    const employeeCompanyId = employee.companyId || employee.company?._id;
    
    setForm(prev => ({
      ...prev,
      userId: employee._id,
      companyId: employeeCompanyId || "69c393e25b8735f88830c9b7"
    }));
    
    setEmployeeOpen(false);
    
    if (errors.userId) {
      setErrors(prev => ({ ...prev, userId: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.userId) newErrors.userId = "Please select an employee";
    if (!form.leaveType) newErrors.leaveType = "Please select leave type";
    if (!form.leaveFrom) newErrors.leaveFrom = "Leave from date is required";
    if (!form.leaveTo) newErrors.leaveTo = "Leave to date is required";
    if (!form.noOfDays) newErrors.noOfDays = "Number of days is required";
    if (!form.reason) newErrors.reason = "Reason is required";
    
    // Validate dates
    if (form.leaveFrom && form.leaveTo) {
      const fromDate = new Date(form.leaveFrom);
      const toDate = new Date(form.leaveTo);
      if (toDate < fromDate) {
        newErrors.leaveTo = "Leave to date cannot be earlier than leave from date";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const getEmployeeName = (user) => {
    if (!user) return "";
    if (user.firstname && user.lastName) {
      return `${user.firstname} ${user.lastName}`;
    }
    if (user.firstname && user.lastname) {
      return `${user.firstname} ${user.lastname}`;
    }
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.name) return user.name;
    return user.email || "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const leaveDataToSend = {
      companyId: form.companyId,
      userId: form.userId,
      leaveType: form.leaveType,
      leaveFrom: form.leaveFrom,
      leaveTo: form.leaveTo,
      noOfDays: parseInt(form.noOfDays),
      reason: form.reason
    };

    try {
      const response = await createLeaveRequest(leaveDataToSend).unwrap();
      const newLeave = response?.data;

      if (leaveData && setLeaveData) {
        setLeaveData([newLeave, ...leaveData]);
      }

      if (onSuccess) onSuccess();
      onOpenChange(false);

    } catch (err) {
      const errorMessage =
        err?.data?.message || err?.message || "Failed to add leave request";
      setErrors({ submit: errorMessage });
    }
  };

  const getSelectedEmployeeName = () => {
    if (!form.userId) return "Select Employee";
    const selected = employees.find(emp => emp._id === form.userId);
    if (selected) {
      return getEmployeeName(selected);
    }
    return "Select Employee";
  };

  const leaveTypes = ["Emergency", "Family", "Sick", "Casual"];

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
      <div className="bg-white w-[800px] rounded-lg shadow-xl">
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-lg font-semibold">Create Leave Request</h2>
          <button onClick={() => onOpenChange(false)} className="hover:bg-purple-700 p-1 rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {/* Left Column */}
            <div className="space-y-5">
              {/* EMPLOYEE CUSTOM DROPDOWN */}
              <div className="relative z-50">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee *
                </label>
                <div
                  onClick={() => setEmployeeOpen(!employeeOpen)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 flex justify-between items-center cursor-pointer bg-white"
                >
                  <span className={form.userId ? "text-gray-900" : "text-gray-500"}>
                    {getSelectedEmployeeName()}
                  </span>
                  <span>▼</span>
                </div>

                {employeeOpen && (
                  <div className="absolute left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-60 overflow-y-auto">
                    {isLoading ? (
                      <div className="px-4 py-2 text-gray-500">Loading employees...</div>
                    ) : employees.length === 0 ? (
                      <div className="px-4 py-2 text-gray-500">No employees found</div>
                    ) : (
                      employees.map((emp) => {
                        const empName = getEmployeeName(emp);
                        return (
                          <div
                            key={emp._id}
                            onClick={() => handleEmployeeSelect(emp)}
                            className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between ${
                              form.userId === emp._id ? "bg-gray-100" : ""
                            }`}
                          >
                            {empName}
                            {form.userId === emp._id && <span>✓</span>}
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
               
              {/* LEAVE TYPE CUSTOM DROPDOWN */}
              <div className="relative z-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leave Type *
                </label>
                <div
                  onClick={() => setLeaveTypeOpen(!leaveTypeOpen)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 flex justify-between items-center cursor-pointer bg-white"
                >
                  <span>{form.leaveType || "Select Leave Type"}</span>
                  <span>▼</span>
                </div>

                {leaveTypeOpen && (
                  <div className="absolute left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-40">
                    {leaveTypes.map((item) => (
                      <div
                        key={item}
                        onClick={() => {
                          setForm({ ...form, leaveType: item });
                          setLeaveTypeOpen(false);
                        }}
                        className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between ${
                          form.leaveType === item ? "bg-gray-100" : ""
                        }`}
                      >
                        {item}
                        {form.leaveType === item && <span>✓</span>}
                      </div>
                    ))}
                  </div>
                  
                )}
              </div>
              {/* Number of Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Days *
                </label>
                <input
                  type="number"
                  name="noOfDays"
                  value={form.noOfDays}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 cursor-not-allowed"
                  placeholder="Auto-calculated"
                />
                {errors.noOfDays && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle size={12} className="text-red-500" />
                    <p className="text-xs text-red-500">{errors.noOfDays}</p>
                  </div>
                )}
              </div>
            </div>
           
            {/* Right Column */}
            <div className="space-y-5">
              {/* Leave From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leave From *
                </label>
                <input
                  type="date"
                  name="leaveFrom"
                  value={form.leaveFrom}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 ${
                    errors.leaveFrom ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.leaveFrom && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle size={12} className="text-red-500" />
                    <p className="text-xs text-red-500">{errors.leaveFrom}</p>
                  </div>
                )}
              </div>

              {/* Leave To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leave To *
                </label>
                <input
                  type="date"
                  name="leaveTo"
                  value={form.leaveTo}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 ${
                    errors.leaveTo ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.leaveTo && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle size={12} className="text-red-500" />
                    <p className="text-xs text-red-500">{errors.leaveTo}</p>
                  </div>
                )}
              </div>

              
            </div>
          </div>

          {/* Reason */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={4}
              placeholder="Enter reason for leave..."
              className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 ${
                errors.reason ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.reason && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle size={12} className="text-red-500" />
                <p className="text-xs text-red-500">{errors.reason}</p>
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="text-red-500 text-sm mt-4">{errors.submit}</div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isAdding}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLeaveRequest;