import React, { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { useUpdateLeaveRequestMutation } from "@/app/service/leave";

const UpdateLeaveRequest = ({
  open,
  onOpenChange,
  leave,
  leaveData,
  setLeaveData,
  onSuccess
}) => {
  const [updateLeaveRequest, { isLoading: isUpdating }] = useUpdateLeaveRequestMutation();

  const [form, setForm] = useState({
    leaveType: "",
    leaveFrom: "",
    leaveTo: "",
    noOfDays: "",
    reason: ""
  });

  const [errors, setErrors] = useState({});
  const [leaveTypeOpen, setLeaveTypeOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (leave) {
      setForm({
        leaveType: leave.leaveType || "Casual",
        leaveFrom: leave.leaveFrom ? leave.leaveFrom.split('T')[0] : "",
        leaveTo: leave.leaveTo ? leave.leaveTo.split('T')[0] : "",
        noOfDays: leave.noOfDays || "",
        reason: leave.reason || ""
      });
    }
  }, [leave]);

  useEffect(() => {
    if (!open) {
      setErrors({});
      setLeaveTypeOpen(false);
    }
  }, [open]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

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

  const validateForm = () => {
    const newErrors = {};

    if (!form.leaveType) newErrors.leaveType = "Please select leave type";
    if (!form.leaveFrom) newErrors.leaveFrom = "Leave from date is required";
    if (!form.leaveTo) newErrors.leaveTo = "Leave to date is required";
    if (!form.noOfDays) newErrors.noOfDays = "Number of days is required";
    if (!form.reason) newErrors.reason = "Reason is required";
    
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const leaveDataToSend = {
      ...form,
      noOfDays: parseInt(form.noOfDays),
      reason: form.reason
    };

    try {
      const response = await updateLeaveRequest({
        id: leave._id,
        leaveData: leaveDataToSend
      }).unwrap();
      
      const updatedLeave = response?.data;

      if (leaveData && setLeaveData) {
        const updatedList = leaveData.map(item => 
          item._id === updatedLeave._id ? updatedLeave : item
        );
        setLeaveData(updatedList);
      }

      // Get employee name for toast message
      const employeeName = updatedLeave?.userId?.firstName 
        ? `${updatedLeave.userId.firstName} ${updatedLeave.userId.lastName || ''}`.trim()
        : 'Leave request';
      
      // Set toast message
      setToastMessage(`${employeeName} updated successfully`);

      // Call onSuccess callback
      if (onSuccess) onSuccess();
      
      // Close the form first
      onOpenChange(false);
      
      // Show toast after form is closed
      setTimeout(() => {
        setShowSuccessToast(true);
      }, 100);
      
    } catch (err) {
      const errorMessage = err?.data?.message || err?.message || "Failed to update leave request";
      setErrors({ submit: errorMessage });
    }
  };

  const leaveTypes = ["Emergency", "Family", "Sick", "Casual"];

  if (!open) return null;

  return (
    <>
      {/* Success Toast Message */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-[9999] transition-all duration-300 ease-out translate-x-0 opacity-100">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
            <CheckCircle size={20} />
            <div>
              <p className="font-semibold">Leave Request Updated</p>
              <p className="text-sm">{toastMessage}</p>
            </div>
            <button 
              onClick={() => setShowSuccessToast(false)} 
              className="hover:bg-green-600 rounded p-1 ml-2 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
        <div className="bg-white w-[800px] rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="bg-purple-600 text-white p-4 flex justify-between items-center rounded-t-lg sticky top-0">
            <h2 className="text-lg font-semibold">Update Leave Request</h2>
            <button onClick={() => onOpenChange(false)} className="hover:bg-purple-700 p-1 rounded transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {/* Left Column */}
              <div className="space-y-5">
                {/* LEAVE TYPE CUSTOM DROPDOWN */}
                <div className="relative z-40">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leave Type *
                  </label>
                  <div
                    onClick={() => setLeaveTypeOpen(!leaveTypeOpen)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 flex justify-between items-center cursor-pointer bg-white hover:border-purple-400 transition-colors"
                  >
                    <span>{form.leaveType || "Select Leave Type"}</span>
                    <span>▼</span>
                  </div>

                  {leaveTypeOpen && (
                    <div className="absolute left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-40 max-h-60 overflow-y-auto">
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
                  {errors.leaveType && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle size={12} className="text-red-500" />
                      <p className="text-xs text-red-500">{errors.leaveType}</p>
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
                    className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
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
                    className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
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
                className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
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
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Updating..." : "Update"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateLeaveRequest;