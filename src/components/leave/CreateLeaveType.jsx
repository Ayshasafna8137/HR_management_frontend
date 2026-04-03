import React, { useState, useEffect, useRef } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { useCreateLeaveTypeMutation } from "@/app/service/leavetype";

const CreateLeaveType = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  // Hardcoded company ID
  const companyId = "69c393e25b8735f88830c9b7";
  
  const [createLeaveType, { isLoading: isCreating }] = useCreateLeaveTypeMutation();

  const [form, setForm] = useState({
    companyId: companyId,
    leaveName: "",
    leaveType: "Paid",
    leaveUnit: "Days",
    status: "Active",
    duration: 0,
    createdBy: "HR Department",
    notificationPeriod: "",
    annualLimit: 0,
    note: ""
  });

  const [errors, setErrors] = useState({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [leaveTypeOpen, setLeaveTypeOpen] = useState(false);
  const [leaveUnitOpen, setLeaveUnitOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const leaveTypeRef = useRef(null);
  const leaveUnitRef = useRef(null);
  const statusRef = useRef(null);

  const leaveTypeOptions = ["Paid", "Unpaid"];
  const leaveUnitOptions = ["Days", "Hours"];
  const statusOptions = ["Active", "Inactive"];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (leaveTypeRef.current && !leaveTypeRef.current.contains(event.target)) {
        setLeaveTypeOpen(false);
      }
      if (leaveUnitRef.current && !leaveUnitRef.current.contains(event.target)) {
        setLeaveUnitOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setStatusOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setForm({
        companyId: companyId,
        leaveName: "",
        leaveType: "Paid",
        leaveUnit: "Days",
        status: "Active",
        duration: 0,
        createdBy: "HR Department",
        notificationPeriod: "",
        annualLimit: 0,
        note: ""
      });
      setErrors({});
      setLeaveTypeOpen(false);
      setLeaveUnitOpen(false);
      setStatusOpen(false);
    }
  }, [open, companyId]);

  // Auto-hide toast after 10 seconds
  useEffect(() => {
    if (showSuccessToast) {
      console.log("Toast is showing"); // Debug log
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
        console.log("Toast hidden after 10 seconds"); // Debug log
      }, 10000); // Changed to 10000 (10 seconds)
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.leaveName.trim()) newErrors.leaveName = "Leave name is required";
    if (!form.leaveType) newErrors.leaveType = "Leave type is required";
    if (!form.leaveUnit) newErrors.leaveUnit = "Leave unit is required";
    if (form.duration < 0) newErrors.duration = "Duration cannot be negative";
    if (form.annualLimit < 0) newErrors.annualLimit = "Annual limit cannot be negative";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const dataToSend = {
      companyId: form.companyId,
      leaveName: form.leaveName,
      leaveType: form.leaveType,
      leaveUnit: form.leaveUnit,
      status: form.status,
      duration: parseInt(form.duration),
      createdBy: form.createdBy,
      notificationPeriod: form.notificationPeriod,
      annualLimit: parseInt(form.annualLimit),
      note: form.note
    };

    try {
      const response = await createLeaveType(dataToSend).unwrap();
      
      console.log("Create response:", response); // Debug log
      
      // Set toast message
      setToastMessage(`"${response.data.leaveName}" created successfully`);
      console.log("Toast message set:", `"${response.data.leaveName}" created successfully`); // Debug log

      // Call onSuccess callback
      if (onSuccess) onSuccess();
      
      // Show toast BEFORE closing the modal
      setShowSuccessToast(true);
      
      // Close the modal after a short delay
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
      
    } catch (err) {
      console.error("Create error:", err);
      const errorMessage = err?.data?.message || err?.message || "Failed to create leave type";
      setErrors({ submit: errorMessage });
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Success Toast - 10 seconds duration */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-[9999] transition-all duration-300 ease-out translate-x-0 opacity-100">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
            <CheckCircle size={20} />
            <div>
              <p className="font-semibold">Leave Type Created</p>
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
        <div className="bg-white w-[700px] rounded-lg shadow-xl max-h-[90vh] flex flex-col">
          <div className="bg-purple-600 text-white p-4 flex justify-between items-center rounded-t-lg sticky top-0 z-10">
            <h2 className="text-lg font-semibold">Create Leave Type</h2>
            <button onClick={() => onOpenChange(false)} className="hover:bg-purple-700 p-1 rounded">
              <X size={20} />
            </button>
          </div>

          {/* Form with hidden scrollbar */}
          <div 
            className="overflow-y-auto p-6"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <style>
              {`
                .overflow-y-auto::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {/* Leave Name */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leave Name *
                  </label>
                  <input
                    type="text"
                    name="leaveName"
                    value={form.leaveName}
                    onChange={handleChange}
                    placeholder="e.g., Casual Leave, Sick Leave"
                    className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 ${
                      errors.leaveName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.leaveName && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle size={12} className="text-red-500" />
                      <p className="text-xs text-red-500">{errors.leaveName}</p>
                    </div>
                  )}
                </div>

                {/* Leave Type Dropdown */}
                <div className="relative" ref={leaveTypeRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leave Type *
                  </label>
                  <div
                    onClick={() => {
                      setLeaveTypeOpen(!leaveTypeOpen);
                      setLeaveUnitOpen(false);
                      setStatusOpen(false);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 flex justify-between items-center cursor-pointer bg-white"
                  >
                    <span>{form.leaveType}</span>
                    <span>▼</span>
                  </div>
                  {leaveTypeOpen && (
                    <div className="absolute left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-[60] max-h-40 overflow-y-auto">
                      {leaveTypeOptions.map((option) => (
                        <div
                          key={option}
                          onClick={() => {
                            setForm({ ...form, leaveType: option });
                            setLeaveTypeOpen(false);
                          }}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                            form.leaveType === option ? "bg-purple-50" : ""
                          }`}
                        >
                          {option}
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

                {/* Leave Unit Dropdown */}
                <div className="relative" ref={leaveUnitRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leave Unit *
                  </label>
                  <div
                    onClick={() => {
                      setLeaveUnitOpen(!leaveUnitOpen);
                      setLeaveTypeOpen(false);
                      setStatusOpen(false);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 flex justify-between items-center cursor-pointer bg-white"
                  >
                    <span>{form.leaveUnit}</span>
                    <span>▼</span>
                  </div>
                  {leaveUnitOpen && (
                    <div className="absolute left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-[60] max-h-40 overflow-y-auto">
                      {leaveUnitOptions.map((option) => (
                        <div
                          key={option}
                          onClick={() => {
                            setForm({ ...form, leaveUnit: option });
                            setLeaveUnitOpen(false);
                          }}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                            form.leaveUnit === option ? "bg-purple-50" : ""
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.leaveUnit && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle size={12} className="text-red-500" />
                      <p className="text-xs text-red-500">{errors.leaveUnit}</p>
                    </div>
                  )}
                </div>

                {/* Status Dropdown */}
                <div className="relative" ref={statusRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <div
                    onClick={() => {
                      setStatusOpen(!statusOpen);
                      setLeaveTypeOpen(false);
                      setLeaveUnitOpen(false);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 flex justify-between items-center cursor-pointer bg-white"
                  >
                    <span>{form.status}</span>
                    <span>▼</span>
                  </div>
                  {statusOpen && (
                    <div className="absolute left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-[60] max-h-40 overflow-y-auto">
                      {statusOptions.map((option) => (
                        <div
                          key={option}
                          onClick={() => {
                            setForm({ ...form, status: option });
                            setStatusOpen(false);
                          }}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                            form.status === option ? "bg-purple-50" : ""
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (Days/Hours) *
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    min="0"
                    step="0.5"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Notification Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notification Period
                  </label>
                  <input
                    type="text"
                    name="notificationPeriod"
                    value={form.notificationPeriod}
                    onChange={handleChange}
                    placeholder="e.g., 24 hours prior"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Annual Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Limit
                  </label>
                  <input
                    type="number"
                    name="annualLimit"
                    value={form.annualLimit}
                    onChange={handleChange}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Created By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created By
                  </label>
                  <select
                    name="createdBy"
                    value={form.createdBy}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="HR Department">HR Department</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>

              {/* Note */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Additional notes about this leave type..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {errors.submit && (
                <div className="text-red-500 text-sm mt-4">{errors.submit}</div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateLeaveType;