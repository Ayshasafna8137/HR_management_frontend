import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Edit,
  Trash2,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useGetAllLeaveRequestsQuery,
  useUpdateLeaveStatusMutation,
  useDeleteLeaveRequestMutation
} from "@/app/service/leave";
import { useGetAllLeaveBalancesQuery } from "@/app/service/leavebalance";
import CreateLeaveRequest from "./CreateLeaveRequest";
import UpdateLeaveRequest from "./UpdateLeaveRequest";
import DeleteLeaveRequest from "./DeleteLeaveRequest";

const LeaveRequestList = () => {
  const navigate = useNavigate();
  const { data, refetch, isLoading } = useGetAllLeaveRequestsQuery();
  const { refetch: refetchLeaveBalances } = useGetAllLeaveBalancesQuery();

  const [leaveData, setLeaveData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBalanceUpdateAlert, setShowBalanceUpdateAlert] = useState(false);
  const [showRejectedAlert, setShowRejectedAlert] = useState(false);
  const [lastUpdatedBalance, setLastUpdatedBalance] = useState(null);
  const [rejectedInfo, setRejectedInfo] = useState(null);

  const [filters, setFilters] = useState({
    status: "",
    leaveType: "",
    startDate: "",
    endDate: ""
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showLeaveTypeDropdown, setShowLeaveTypeDropdown] = useState(false);

  const statusDropdownRef = useRef(null);
  const leaveTypeDropdownRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [updateLeaveStatus] = useUpdateLeaveStatusMutation();
  const [deleteLeaveRequest] = useDeleteLeaveRequestMutation();

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Function to get user name
  const getUserName = (user) => {
    if (!user) return "Unknown";
    const firstName = user?.firstName || user?.firstname || "";
    const lastName = user?.lastName || user?.lastname || "";
    if (firstName && lastName) return `${firstName} ${lastName}`.trim();
    if (firstName) return firstName;
    if (lastName) return lastName;
    if (user?.name) return user.name;
    if (user?.fullName) return user.fullName;
    if (user?.username) return user.username;
    if (user?.email) return user.email.split('@')[0];
    if (user?._id) return user._id.slice(-6);
    return "Unknown";
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  useEffect(() => {
    if (data?.data) {
      setLeaveData(data.data);
    }
  }, [data]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  // Auto-hide alerts after 5 seconds
  useEffect(() => {
    if (showBalanceUpdateAlert) {
      const timer = setTimeout(() => {
        setShowBalanceUpdateAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showBalanceUpdateAlert]);

  useEffect(() => {
    if (showRejectedAlert) {
      const timer = setTimeout(() => {
        setShowRejectedAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showRejectedAlert]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
      if (leaveTypeDropdownRef.current && !leaveTypeDropdownRef.current.contains(event.target)) {
        setShowLeaveTypeDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle status update (Approve/Reject) with balance refresh
  const handleStatusUpdate = async (id, newStatus) => {
    if (updatingStatus) return;
    
    setUpdatingStatus(true);
    try {
      const response = await updateLeaveStatus({
        id,
        status: newStatus,
        manageId: currentUser._id,
        manageRole: currentUser.role || "Admin",
        companyId: currentUser.companyId
      }).unwrap();
      
      if (response?.data) {
        const updatedList = leaveData.map(leave => 
          leave._id === response.data._id ? response.data : leave
        );
        setLeaveData(updatedList);
        
        // Refresh leave balances after status change
        await refetchLeaveBalances();
        
        // Show toast message based on status
        if (newStatus === "Approved") {
          setLastUpdatedBalance({
            employeeName: getUserName(response.data.userId),
            days: response.data.noOfDays,
            year: new Date(response.data.leaveFrom).getFullYear()
          });
          setShowBalanceUpdateAlert(true);
        } else if (newStatus === "Rejected") {
          setRejectedInfo({
            employeeName: getUserName(response.data.userId),
            days: response.data.noOfDays,
            year: new Date(response.data.leaveFrom).getFullYear()
          });
          setShowRejectedAlert(true);
        }
      }
      
    } catch (err) {
      console.error("Status update failed:", err);
      alert(err?.data?.message || "Failed to update leave status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this leave request?")) {
      try {
        await deleteLeaveRequest(id).unwrap();
        const updatedList = leaveData.filter(leave => leave._id !== id);
        setLeaveData(updatedList);
        
        // Refresh leave balances after deletion
        await refetchLeaveBalances();
        
        alert("Leave request deleted successfully");
      } catch (err) {
        console.error("Delete failed:", err);
        alert(err?.data?.message || "Failed to delete leave request");
      }
    }
  };

  // FILTER LOGIC
  const filteredData = useMemo(() => {
    return leaveData.filter((leave) => {
      const employeeName = getUserName(leave?.userId).toLowerCase();
      const employeeId = leave?.userId?.employeeId || leave?.userId?.employeeID || "";

      const matchSearch = searchTerm === "" ||
        employeeName.includes(searchTerm.toLowerCase()) ||
        employeeId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = filters.status === "" || leave?.status === filters.status;
      const matchLeaveType = filters.leaveType === "" || leave?.leaveType === filters.leaveType;

      const leaveFrom = leave?.leaveFrom ? new Date(leave.leaveFrom) : null;
      const leaveTo = leave?.leaveTo ? new Date(leave.leaveTo) : null;

      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      if (startDate) startDate.setHours(0,0,0,0);
      if (endDate) endDate.setHours(23,59,59,999);

      const matchStart = !startDate || (leaveFrom && leaveFrom >= startDate);
      const matchEnd = !endDate || (leaveTo && leaveTo <= endDate);

      return (
        matchSearch &&
        matchStatus &&
        matchLeaveType &&
        matchStart &&
        matchEnd
      );
    });
  }, [leaveData, searchTerm, filters]);

  // PAGINATION
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
    if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [filteredData.length, currentPage, totalPages]);

  const currentLeave = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRefresh = () => {
    setSearchTerm("");
    setFilters({
      status: "",
      leaveType: "",
      startDate: "",
      endDate: ""
    });
    setCurrentPage(1);
    refetch();
    refetchLeaveBalances();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  const startRecord = filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(currentPage * itemsPerPage, filteredData.length);

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" }
  ];

  const leaveTypeOptions = [
    { value: "", label: "All Types" },
    { value: "Emergency", label: "Emergency" },
    { value: "Family", label: "Family" },
    { value: "Sick", label: "Sick" },
    { value: "Casual", label: "Casual" }
  ];

  const getSelectedStatus = () => {
    const selected = statusOptions.find(opt => opt.value === filters.status);
    return selected || statusOptions[0];
  };

  const getSelectedLeaveType = () => {
    const selected = leaveTypeOptions.find(opt => opt.value === filters.leaveType);
    return selected || leaveTypeOptions[0];
  };

  const exportToExcel = () => {
    if (!filteredData.length) return;

    const exportData = filteredData.map(leave => ({
      'Employee Name': getUserName(leave?.userId),
      'Employee ID': leave?.userId?.employeeId || '-',
      'Department': leave?.userId?.department || '',
      'Leave Type': leave?.leaveType || '',
      'Leave From': formatDate(leave?.leaveFrom),
      'Leave To': formatDate(leave?.leaveTo),
      'Number of Days': leave?.noOfDays || '',
      'Status': leave?.status || '',
      'Reason': leave?.reason || '',
      'Approved/Rejected By': leave?.status !== "Pending" ? getUserName(leave?.manageId) : '-',
      'Role': leave?.status !== "Pending" ? (leave?.manageRole || '-') : '-',
      'Approved/Rejected Date': leave?.status !== "Pending" ? (leave?.approvedDate ? formatDate(leave.approvedDate) : '-') : '-'
    }));

    const headers = Object.keys(exportData[0]);
    const csvData = [
      headers.join(','),
      ...exportData.map(row =>
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave_requests_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const hasActiveFilters = searchTerm !== '' || Object.values(filters).some(value => value !== '');

  return (
    <>
      {/* Balance Update Toast (Approved) */}
      {showBalanceUpdateAlert && lastUpdatedBalance && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <CheckCircle size={20} />
            <div>
              <p className="font-semibold">Leave Balance Updated</p>
              <p className="text-sm">
                {lastUpdatedBalance.employeeName}'s balance reduced by {lastUpdatedBalance.days} days for {lastUpdatedBalance.year}
              </p>
            </div>
            <button onClick={() => setShowBalanceUpdateAlert(false)} className="hover:bg-green-600 rounded p-1">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Rejected Toast */}
      {showRejectedAlert && rejectedInfo && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <XCircle size={20} />
            <div>
              <p className="font-semibold">Leave Request Rejected</p>
              <p className="text-sm">
                {rejectedInfo.employeeName}'s leave request for {rejectedInfo.days} days ({rejectedInfo.year}) has been rejected
              </p>
            </div>
            <button onClick={() => setShowRejectedAlert(false)} className="hover:bg-red-600 rounded p-1">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="w-full bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Leave Requests</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and track employee leave requests</p>
        </div>

        {/* SEARCH */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by employee name or ID..."
                value={searchTerm}
                onChange={(e)=>setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {searchTerm && (
                <button onClick={()=>setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={16}/>
                </button>
              )}
            </div>

            <button
              onClick={()=>setShowFilters(!showFilters)}
              className="px-4 py-2 border rounded-lg flex gap-2 hover:bg-gray-50 transition-colors"
            >
              <Filter size={16}/> Filter
            </button>

            <button
              onClick={handleRefresh}
              className="px-4 py-2 border rounded-lg flex gap-2 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={16}/> Refresh
            </button>

            <button
              onClick={exportToExcel}
              className="px-4 py-2 border rounded-lg flex gap-2 hover:bg-gray-50 transition-colors"
            >
              <Download size={16}/> Export
            </button>

            <button
              onClick={()=>setCreateOpen(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg flex gap-2 hover:bg-purple-700 transition-colors"
            >
              <Plus size={16}/> Add Leave Request
            </button>
          </div>

          {/* FILTER PANEL */}
          {showFilters && (
            <div className="flex gap-4 mt-4 flex-wrap items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e)=>setFilters({...filters, startDate: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e)=>setFilters({...filters, endDate: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              {/* Status Dropdown */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <div className="relative" ref={statusDropdownRef}>
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 min-w-[120px]"
                  >
                    <span>{getSelectedStatus().label}</span>
                    <ChevronDown size={14} className={`transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showStatusDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFilters({...filters, status: option.value});
                            setShowStatusDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Leave Type Dropdown */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Leave Type</label>
                <div className="relative" ref={leaveTypeDropdownRef}>
                  <button
                    onClick={() => setShowLeaveTypeDropdown(!showLeaveTypeDropdown)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 min-w-[120px]"
                  >
                    <span>{getSelectedLeaveType().label}</span>
                    <ChevronDown size={14} className={`transition-transform ${showLeaveTypeDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showLeaveTypeDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      {leaveTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFilters({...filters, leaveType: option.value});
                            setShowLeaveTypeDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilters({
                      status: "",
                      leaveType: "",
                      startDate: "",
                      endDate: ""
                    });
                    setCurrentPage(1);
                  }}
                  className="text-red-600 px-3 py-2 rounded flex gap-2 items-center hover:bg-red-50 transition"
                >
                  <X size={16} />
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>

        {/* TABLE - WITH HIDDEN SCROLLBAR */}
        <div 
          className="overflow-x-auto"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <style>
            {`
              .overflow-x-auto::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
          <table className="w-full text-sm min-w-[1200px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved/Rejected By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
               </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="12" className="text-center py-12">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      <span className="ml-2">Loading leave requests...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && currentLeave.length === 0 && (
                <tr>
                  <td colSpan="12" className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search size={48} className="mb-2 text-gray-300" />
                      <p className="text-lg font-medium">No leave requests found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && currentLeave.map((leave) => (
                <tr key={leave._id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={16} className="text-gray-600" />
                      </div>
                      <span className="font-medium">
                        {getUserName(leave?.userId)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {leave?.userId?.employeeId || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {leave?.userId?.department || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      leave?.leaveType === 'Emergency' ? 'bg-red-100 text-red-800' :
                      leave?.leaveType === 'Family' ? 'bg-purple-100 text-purple-800' :
                      leave?.leaveType === 'Sick' ? 'bg-blue-100 text-blue-800' :
                      leave?.leaveType === 'Casual' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {leave?.leaveType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {formatDate(leave?.leaveFrom)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {formatDate(leave?.leaveTo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                    {leave?.noOfDays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      leave?.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      leave?.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      leave?.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {leave?.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {leave?.status !== "Pending" ? (
                        <>
                          {leave?.status === "Approved" ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : (
                            <XCircle size={16} className="text-red-500" />
                          )}
                          <span className="text-gray-700">
                            {getUserName(leave?.manageId)}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {leave?.status !== "Pending" ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        leave?.manageRole === 'Admin' ? 'bg-purple-100 text-purple-800' :
                        leave?.manageRole === 'HR' ? 'bg-blue-100 text-blue-800' :
                        leave?.manageRole === 'Manager' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {leave?.manageRole || "-"}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate text-gray-600">
                    {leave?.reason || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {/* Approve/Reject buttons for Pending requests */}
                      {leave?.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(leave._id, "Approved")}
                            disabled={updatingStatus}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(leave._id, "Rejected")}
                            disabled={updatingStatus}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </>
                      )}
                      
                      {/* Edit button - disabled if not pending */}
                      <button
                        onClick={() => {
                          setSelectedLeave(leave);
                          setUpdateOpen(true);
                        }}
                        className={`p-1 transition-colors ${leave?.status === "Pending" ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'}`}
                        title="Edit"
                        disabled={leave?.status !== "Pending"}
                      >
                        <Edit size={16}/>
                      </button>
                      
                      {/* Delete button - disabled if not pending */}
                      <button
                        onClick={() => handleDelete(leave._id)}
                        className={`p-1 transition-colors ${leave?.status === "Pending" ? 'text-red-600 hover:text-red-800' : 'text-gray-400 cursor-not-allowed'}`}
                        title="Delete"
                        disabled={leave?.status !== "Pending"}
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              {filteredData.length > 0 ? (
                <>Showing {startRecord} to {endRecord} of {filteredData.length} entries</>
              ) : (
                <>No entries found</>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <div className="flex gap-1">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`dots-${index}`} className="px-3 py-1">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 border rounded-lg ${
                        currentPage === page
                          ? "bg-purple-600 text-white border-purple-600"
                          : "hover:bg-white"
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CreateLeaveRequest 
        open={createOpen} 
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          refetch();
          refetchLeaveBalances();
        }}
        leaveData={leaveData}
        setLeaveData={setLeaveData}
      />
      <UpdateLeaveRequest 
        open={updateOpen} 
        onOpenChange={setUpdateOpen} 
        leave={selectedLeave}
        leaveData={leaveData}
        setLeaveData={setLeaveData}
        onSuccess={() => {
          refetch();
          refetchLeaveBalances();
        }}
      />
      <DeleteLeaveRequest 
        open={deleteOpen} 
        onOpenChange={setDeleteOpen} 
        leave={selectedLeave}
        leaveData={leaveData}
        setLeaveData={setLeaveData}
        onSuccess={() => {
          refetch();
          refetchLeaveBalances();
        }}
      />
    </>
  );
};

export default LeaveRequestList;