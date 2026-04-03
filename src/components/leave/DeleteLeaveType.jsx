import React, { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle } from "lucide-react";
import { useDeleteLeaveTypeMutation } from "@/app/service/leavetype";

const DeleteLeaveType = ({
  open,
  onOpenChange,
  leaveType,
  onSuccess
}) => {
  const [deleteLeaveType, { isLoading: isDeleting }] = useDeleteLeaveTypeMutation();
  const [error, setError] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Auto-hide toast after 10 seconds
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  const handleDelete = async () => {
    setError("");
    try {
      await deleteLeaveType(leaveType._id).unwrap();
      
      // Set toast message
      setToastMessage(`"${leaveType?.leaveName}" deleted successfully`);
      
      // Call onSuccess callback
      if (onSuccess) onSuccess();
      
      // Close the modal first
      onOpenChange(false);
      
      // Show toast after modal is closed
      setTimeout(() => {
        setShowSuccessToast(true);
      }, 200);
      
    } catch (err) {
      const errorMessage = err?.data?.message || err?.message || "Failed to delete leave type";
      setError(errorMessage);
    }
  };

  if (!open && !showSuccessToast) return null;

  return (
    <>
      {/* Success Toast - Appears after modal closes */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-[9999] transition-all duration-300 ease-out translate-x-0 opacity-100">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
            <CheckCircle size={20} />
            <div>
              <p className="font-semibold">Leave Type Deleted</p>
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
        <div className="bg-white w-[450px] rounded-lg shadow-xl">
          <div className="bg-red-600 text-white p-4 flex justify-between items-center rounded-t-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} />
              <h2 className="text-lg font-semibold">Delete Leave Type</h2>
            </div>
            <button onClick={() => onOpenChange(false)} className="hover:bg-red-700 p-1 rounded">
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={32} className="text-red-600" />
                </div>
              </div>
              <p className="text-center text-gray-700 mb-2">
                Are you sure you want to delete the leave type?
              </p>
              <p className="text-center font-semibold text-gray-900 text-lg mb-2">
                {leaveType?.leaveName}
              </p>
              <p className="text-center text-xs text-gray-400 mt-4">
                This action cannot be undone. This will permanently delete the leave type.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteLeaveType;