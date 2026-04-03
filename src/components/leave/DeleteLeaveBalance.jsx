import React, { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useDeleteLeaveBalanceMutation } from "@/app/service/leavebalance";

const DeleteLeaveBalance = ({
  open,
  onOpenChange,
  balance,
  onSuccess,
  leaveBalanceData,
  setLeaveBalanceData
}) => {
  const [deleteLeaveBalance, { isLoading: isDeleting }] = useDeleteLeaveBalanceMutation();
  const [error, setError] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success"); // "success" or "error"

  // Auto-hide toast after 10 seconds
  useEffect(() => {
    if (showSuccessToast || showErrorToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
        setShowErrorToast(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast, showErrorToast]);

  // Debug: Log the balance object to see what's being passed
  console.log("DeleteLeaveBalance - balance:", balance);
  console.log("DeleteLeaveBalance - balance._id:", balance?._id);

  const getEmployeeName = () => {
    if (!balance?.userId) return "this employee";
    
    // Check if userId is an object with firstName/lastName
    if (typeof balance.userId === 'object') {
      const firstName = balance.userId?.firstName || balance.userId?.firstname || "";
      const lastName = balance.userId?.lastName || balance.userId?.lastname || "";
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || "this employee";
    }
    
    return "this employee";
  };

  const handleDelete = async () => {
    setError("");
    
    // Debug: Log the ID being sent
    console.log("Attempting to delete with ID:", balance?._id);
    
    // Validate balance ID
    if (!balance || !balance._id) {
      const errorMsg = "Invalid balance record. No ID found.";
      setError(errorMsg);
      setToastMessage(errorMsg);
      setToastType("error");
      setShowErrorToast(true);
      console.error("Delete failed: balance or balance._id is undefined", balance);
      return;
    }
    
    try {
      console.log("Calling deleteLeaveBalance with ID:", balance._id);
      const result = await deleteLeaveBalance(balance._id).unwrap();
      console.log("Delete result:", result);
      
      // Update local data if available
      if (leaveBalanceData && setLeaveBalanceData) {
        const updatedList = leaveBalanceData.filter(item => item._id !== balance._id);
        setLeaveBalanceData(updatedList);
      }

      // Set success toast message
      const employeeName = getEmployeeName();
      setToastMessage(`${employeeName}'s leave balance for ${balance?.year || new Date().getFullYear()} deleted successfully`);
      setToastType("success");
      setShowSuccessToast(true);

      // Call onSuccess callback
      if (onSuccess) onSuccess();
      
      // Close the modal
      onOpenChange(false);
      
    } catch (err) {
      console.error("Delete error details:", err);
      const errorMessage = err?.data?.message || err?.message || "Failed to delete leave balance";
      setError(errorMessage);
      setToastMessage(errorMessage);
      setToastType("error");
      setShowErrorToast(true);
    }
  };

  // Don't render anything if modal is closed and toast is not showing
  if (!open && !showSuccessToast && !showErrorToast) return null;

  return (
    <>
      {/* Success Toast - Green */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-[99999] animate-slide-in">
<div className="text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] bg-red-500">            <CheckCircle size={20} />
            <div>
              <p className="font-semibold">Leave Balance Deleted</p>
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

      {/* Error Toast - Red */}
      {showErrorToast && (
        <div className="fixed top-4 right-4 z-[99999] animate-slide-in">
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
            <XCircle size={20} />
            <div>
              <p className="font-semibold">Delete Failed</p>
              <p className="text-sm">{toastMessage}</p>
            </div>
            <button
              onClick={() => setShowErrorToast(false)}
              className="hover:bg-red-600 rounded p-1 ml-2 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal - Only show if modal is open */}
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white w-[450px] rounded-lg shadow-xl">

            {/* Header */}
            <div className="bg-red-600 text-white p-4 flex justify-between items-center rounded-t-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} />
                <h2 className="text-lg font-semibold">Delete Leave Balance</h2>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="hover:bg-red-700 p-1 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Warning Message */}
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle size={32} className="text-red-600" />
                  </div>
                </div>
                <p className="text-center text-gray-700 mb-2">
                  Are you sure you want to delete the leave balance record for?
                </p>
                <p className="text-center font-semibold text-gray-900 text-lg mb-2">
                  {getEmployeeName()}
                </p>
                <p className="text-center text-sm text-gray-500">
                  Year: <span className="font-medium">{balance?.year || "-"}</span>
                </p>
                <p className="text-center text-xs text-gray-400 mt-4">
                  This action cannot be undone. This will permanently delete the leave balance record.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-center gap-2">
                    <AlertTriangle size={14} className="text-red-600" />
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteLeaveBalance;