import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  ChevronDown
} from "lucide-react";
import { useSelector } from "react-redux";
import {
  useGetAllLeaveTypesQuery,
  useDeleteLeaveTypeMutation
} from "@/app/service/leavetype";
import CreateLeaveType from "./CreateLeaveType";
import UpdateLeaveType from "./UpdateLeaveType";
import DeleteLeaveType from "./DeleteLeaveType";

const LeaveTypeList = () => {
  const companyId = useSelector((state) => state.auth?.user?.companyId) || "";

  const { data, refetch, isLoading, error } = useGetAllLeaveTypesQuery(companyId);
  const [deleteLeaveType] = useDeleteLeaveTypeMutation();

  const [leaveTypeData, setLeaveTypeData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLeaveType, setFilterLeaveType] = useState("");
  const [filterLeaveUnit, setFilterLeaveUnit] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedLeaveType, setSelectedLeaveType] = useState(null);

  // Dropdown states
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showLeaveTypeDropdown, setShowLeaveTypeDropdown] = useState(false);
  const [showLeaveUnitDropdown, setShowLeaveUnitDropdown] = useState(false);

  const statusDropdownRef = useRef(null);
  const leaveTypeDropdownRef = useRef(null);
  const leaveUnitDropdownRef = useRef(null);

  useEffect(() => {
    if (data?.data) {
      setLeaveTypeData(data.data);
    }
  }, [data]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterLeaveType, filterLeaveUnit]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
      if (leaveTypeDropdownRef.current && !leaveTypeDropdownRef.current.contains(event.target)) {
        setShowLeaveTypeDropdown(false);
      }
      if (leaveUnitDropdownRef.current && !leaveUnitDropdownRef.current.contains(event.target)) {
        setShowLeaveUnitDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatNumber = (num) => {
    if (num === undefined || num === null) return "0";
    return num;
  };

  const getStatusBadge = (status) => {
    if (status === "Active") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactive
      </span>
    );
  };

  const getLeaveTypeBadge = (type) => {
    if (type === "Paid") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Paid
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        Unpaid
      </span>
    );
  };

  const getLeaveUnitBadge = (unit) => {
    if (unit === "Days") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Days
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        Hours
      </span>
    );
  };

  // Filter data
  const filteredData = useMemo(() => {
    return leaveTypeData.filter((item) => {
      const matchSearch = searchTerm === "" ||
        item.leaveName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = filterStatus === "" || item.status === filterStatus;
      const matchLeaveType = filterLeaveType === "" || item.leaveType === filterLeaveType;
      const matchLeaveUnit = filterLeaveUnit === "" || item.leaveUnit === filterLeaveUnit;

      return matchSearch && matchStatus && matchLeaveType && matchLeaveUnit;
    });
  }, [leaveTypeData, searchTerm, filterStatus, filterLeaveType, filterLeaveUnit]);

  // Pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Handle page change
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

  const handleRefresh = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterLeaveType("");
    setFilterLeaveUnit("");
    setCurrentPage(1);
    refetch();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterLeaveType("");
    setFilterLeaveUnit("");
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this leave type?")) {
      try {
        await deleteLeaveType(id).unwrap();
        refetch();
        alert("Leave type deleted successfully");
      } catch (err) {
        alert(err?.data?.message || "Failed to delete leave type");
      }
    }
  };

  const exportToExcel = () => {
    if (!filteredData.length) return;

    const exportData = filteredData.map(item => ({
      'Leave Name': item.leaveName || '',
      'Leave Type': item.leaveType || '',
      'Leave Unit': item.leaveUnit || '',
      'Status': item.status || '',
      'Duration': item.duration || 0,
      'Created By': item.createdBy || '',
      'Notification Period': item.notificationPeriod || '',
      'Annual Limit': item.annualLimit || 0,
      'Note': item.note || ''
    }));

    const headers = Object.keys(exportData[0]);
    const csvData = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave_types_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" }
  ];

  const leaveTypeOptions = [
    { value: "", label: "All Types" },
    { value: "Paid", label: "Paid" },
    { value: "Unpaid", label: "Unpaid" }
  ];

  const leaveUnitOptions = [
    { value: "", label: "All Units" },
    { value: "Days", label: "Days" },
    { value: "Hours", label: "Hours" }
  ];

  const getSelectedStatus = () => {
    const selected = statusOptions.find(opt => opt.value === filterStatus);
    return selected || statusOptions[0];
  };

  const getSelectedLeaveType = () => {
    const selected = leaveTypeOptions.find(opt => opt.value === filterLeaveType);
    return selected || leaveTypeOptions[0];
  };

  const getSelectedLeaveUnit = () => {
    const selected = leaveUnitOptions.find(opt => opt.value === filterLeaveUnit);
    return selected || leaveUnitOptions[0];
  };

  const hasActiveFilters = searchTerm !== '' || filterStatus !== '' || filterLeaveType !== '' || filterLeaveUnit !== '';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <AlertCircle className="mx-auto mb-2" size={40} />
        <p>Error loading leave types data</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg border overflow-hidden">
      {/* HEADER */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Leave Types</h2>
        <p className="text-sm text-gray-500 mt-1">Manage leave type configurations</p>
      </div>

      {/* SEARCH BAR */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by leave name..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border rounded-lg flex gap-2 items-center hover:bg-gray-100"
          >
            <Filter size={16} /> Filter
          </button>

          <button
            onClick={handleRefresh}
            className="px-4 py-2 border rounded-lg flex gap-2 items-center hover:bg-gray-100"
          >
            <RefreshCw size={16} /> Refresh
          </button>

          <button
            onClick={exportToExcel}
            className="px-4 py-2 border rounded-lg flex gap-2 items-center hover:bg-gray-100"
          >
            <Download size={16} /> Export
          </button>

          <button
            onClick={() => setCreateOpen(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center hover:bg-purple-700"
          >
            <Plus size={16} /> Add Leave Type
          </button>
        </div>

        {/* FILTER PANEL WITH DROPDOWNS */}
        {showFilters && (
          <div className="flex gap-4 mt-4 flex-wrap items-end">
            {/* Status Filter Dropdown */}
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
                  <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterStatus(option.value);
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${filterStatus === option.value ? 'bg-purple-50 text-purple-600' : ''}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Leave Type Filter Dropdown */}
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
                  <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {leaveTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterLeaveType(option.value);
                          setShowLeaveTypeDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${filterLeaveType === option.value ? 'bg-purple-50 text-purple-600' : ''}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Leave Unit Filter Dropdown */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Leave Unit</label>
              <div className="relative" ref={leaveUnitDropdownRef}>
                <button
                  onClick={() => setShowLeaveUnitDropdown(!showLeaveUnitDropdown)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 min-w-[120px]"
                >
                  <span>{getSelectedLeaveUnit().label}</span>
                  <ChevronDown size={14} className={`transition-transform ${showLeaveUnitDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showLeaveUnitDropdown && (
                  <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {leaveUnitOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterLeaveUnit(option.value);
                          setShowLeaveUnitDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${filterLeaveUnit === option.value ? 'bg-purple-50 text-purple-600' : ''}`}
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
                onClick={handleClearFilters}
                className="text-red-600 px-3 py-2 rounded flex gap-2 items-center hover:bg-red-50"
              >
                <X size={16} /> Clear All
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
        <table className="w-full text-sm min-w-[1000px]">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Unit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notification Period</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Annual Limit</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
             </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((item, index) => (
                <tr key={item._id || index} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                    {item.leaveName}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getLeaveTypeBadge(item.leaveType)}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getLeaveUnitBadge(item.leaveUnit)}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {item.duration || 0}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {item.createdBy || "HR Department"}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {item.notificationPeriod || "-"}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                    {item.annualLimit || 0}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedLeaveType(item);
                          setUpdateOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLeaveType(item);
                          setDeleteOpen(true);
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                   </td>
                 </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-12">
                  <AlertCircle size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-lg font-medium text-gray-500">No leave types found</p>
                  <p className="text-sm text-gray-400 mt-1">Click "Add Leave Type" to create one</p>
                 </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION - WITH PAGE NUMBERS (SAME AS LEAVE BALANCE) */}
      {totalItems > 0 && (
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} entries
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
      )}

      {/* MODALS */}
      <CreateLeaveType
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => refetch()}
      />
      <UpdateLeaveType
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        leaveType={selectedLeaveType}
        onSuccess={() => refetch()}
      />
      <DeleteLeaveType
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        leaveType={selectedLeaveType}
        onSuccess={() => {
          refetch();
          setDeleteOpen(false);
        }}
      />
    </div>
  );
};

export default LeaveTypeList;