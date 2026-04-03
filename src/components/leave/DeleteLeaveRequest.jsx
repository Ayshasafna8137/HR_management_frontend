import React, { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle } from "lucide-react";
import { useDeleteLeaveRequestMutation } from "@/app/service/leave";

const DeleteLeaveRequest = ({
  open,
  onOpenChange,
  leave,
  leaveData,
  setLeaveData,
  onSuccess
}) => {
  const [deleteLeaveRequest, { isLoading: isDeleting }] = useDeleteLeaveRequestMutation();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const getEmployeeName = (user) => {
    if (!user) return "Unknown";
    const firstName = user?.firstName || user?.firstname || "";
    const lastName = user?.lastName || user?.lastname || "";
    return `${firstName} ${lastName}`.trim() || "Unknown";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleDelete = async () => {
    try {
      await deleteLeaveRequest(leave._id).unwrap();

      if (leaveData && setLeaveData) {
        const updatedList = leaveData.filter(item => item._id !== leave._id);
        setLeaveData(updatedList);
      }

      setToastMessage("Leave request deleted successfully");
      setShowToast(true);

      if (onSuccess) onSuccess();
      onOpenChange(false);

    } catch (err) {
      console.error("Delete failed:", err);
      setToastMessage(err?.data?.message || "Failed to delete leave request");
      setShowToast(true);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[99999] animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
            <CheckCircle size={20} />
            <div>
              <p className="font-semibold">Leave Request Deleted</p>
              <p className="text-sm">{toastMessage}</p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="hover:bg-green-600 rounded p-1 ml-2"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
        <div className="bg-white w-[450px] rounded-lg shadow-xl">
          <div className="bg-red-600 text-white p-4 flex justify-between items-center rounded-t-lg">
            <h2 className="text-lg font-semibold">Delete Leave Request</h2>
            <button onClick={() => onOpenChange(false)} className="hover:bg-red-700 p-1 rounded">
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle size={48} className="text-red-500" />
            </div>
            <p className="text-center text-gray-700 mb-2">
              Are you sure you want to delete this leave request?
            </p>
            <p className="text-center text-gray-500 text-sm mb-6">
              Employee: {getEmployeeName(leave?.userId)}<br/>
              Leave Type: {leave?.leaveType}<br/>
              Dates: {formatDate(leave?.leaveFrom)} - {formatDate(leave?.leaveTo)}
            </p>
            
            <div className="flex justify-center gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
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
    </>
  );
};

export default DeleteLeaveRequest;