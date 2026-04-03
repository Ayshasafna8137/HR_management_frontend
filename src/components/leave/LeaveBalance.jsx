import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  RefreshCw,
  Pencil,
  Trash2,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  X,
  ChevronDown
} from "lucide-react";

import { useSelector } from "react-redux";

import {
  useGetAllLeaveBalancesQuery,
} from "@/app/service/leavebalance";

import UpdateLeaveBalance from "./UpdateLeaveBalance";
import DeleteLeaveBalance from "./DeleteLeaveBalance";

const LeaveBalanceList = () => {

  const companyId = useSelector((state) => state.auth?.user?.companyId) || "";

  const { data, refetch, isLoading, error } =
    useGetAllLeaveBalancesQuery(companyId);

  const [leaveBalanceData, setLeaveBalanceData] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterYear, setFilterYear] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  
  // Dropdown states
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  
  const yearDropdownRef = useRef(null);
  const departmentDropdownRef = useRef(null);

  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const [updateOpen, setUpdateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedBalance, setSelectedBalance] = useState(null);

  const currentYear = new Date().getFullYear();

  const years = [];

  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(i);
  }

  const departmentOptions = [
    { value: "", label: "All Departments" },
    { value: "HR", label: "HR" },
    { value: "IT", label: "IT" },
    { value: "Finance", label: "Finance" },
    { value: "Marketing", label: "Marketing" },
    { value: "Sales", label: "Sales" },
    { value: "Operations", label: "Operations" },
    { value: "Engineering", label: "Engineering" }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setShowYearDropdown(false);
      }
      if (departmentDropdownRef.current && !departmentDropdownRef.current.contains(event.target)) {
        setShowDepartmentDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getEmployeeName = (balance) => {
    if (balance?.userName) return balance.userName;
    if (balance?.user) {
      const firstName = balance.user?.firstName || "";
      const lastName = balance.user?.lastName || "";
      return `${firstName} ${lastName}`.trim() || "Unknown";
    }
    if (balance?.userId) {
      const firstName = balance.userId?.firstName || "";
      const lastName = balance.userId?.lastName || "";
      return `${firstName} ${lastName}`.trim() || "Unknown";
    }
    return "Unknown";
  };

  const getEmployeeId = (balance) => {
    if (balance?.employeeId) return balance.employeeId;
    if (balance?.user?.employeeId) return balance.user.employeeId;
    if (balance?.userId?.employeeId) return balance.userId.employeeId;
    return "-";
  };

  const getDepartment = (balance) => {
    if (balance?.department) return balance.department;
    if (balance?.user?.department) return balance.user.department;
    if (balance?.userId?.department) return balance.userId.department;
    return "-";
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return "0";
    return num;
  };

  useEffect(() => {
    if (data?.data) {
      let filtered = data.data;
      if (selectedYear) {
        filtered = filtered.filter((b) => b.year === selectedYear);
      }
      setLeaveBalanceData(filtered);
    }
  }, [data, selectedYear]);

  const filteredData = useMemo(() => {
    return leaveBalanceData.filter((balance) => {
      const employeeName = getEmployeeName(balance).toLowerCase();
      const employeeId = getEmployeeId(balance).toLowerCase();
      const department = getDepartment(balance).toLowerCase();

      const matchSearch = searchTerm === "" ||
        employeeName.includes(searchTerm.toLowerCase()) ||
        employeeId.includes(searchTerm.toLowerCase());

      const matchYear = filterYear === "" || balance?.year === parseInt(filterYear);
      const matchDepartment = filterDepartment === "" || department === filterDepartment.toLowerCase();

      return matchSearch && matchYear && matchDepartment;
    });
  }, [leaveBalanceData, searchTerm, filterYear, filterDepartment]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterYear, filterDepartment, selectedYear]);

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
    setFilterYear("");
    setFilterDepartment("");
    setSelectedYear(currentYear);
    setCurrentPage(1);
    refetch();
  };

  const handleExport = () => {
    if (!filteredData.length) {
      alert("No data to export");
      return;
    }

    const exportData = filteredData.map(balance => ({
      'Employee Name': getEmployeeName(balance),
      'Employee ID': getEmployeeId(balance),
      'Department': getDepartment(balance),
      'Year': balance?.year || '',
      'Previous Balance': balance?.previousBalance || 0,
      'Current Balance': balance?.currentBalance || 0,
      'Total Balance': balance?.totalBalance || 0,
      'Used Leave': balance?.usedLeave || 0,
      'Accepted Leave': balance?.acceptedLeave || 0,
      'Rejected Leave': balance?.rejectedLeave || 0,
      'Expired Leave': balance?.expiredLeave || 0,
      'Carry Over': balance?.carryOverBalance || 0
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
    a.download = `leave_balance_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterYear("");
    setFilterDepartment("");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || filterYear !== '' || filterDepartment !== '';

  const getSelectedYearLabel = () => {
    if (filterYear) return filterYear;
    return "All Years";
  };

  const getSelectedDepartmentLabel = () => {
    const selected = departmentOptions.find(opt => opt.value === filterDepartment);
    return selected ? selected.label : "All Departments";
  };

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
        <p>Error loading leave balance data</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg"
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
        <h2 className="text-lg font-semibold">Leave Balance</h2>
        <p className="text-sm text-gray-500 mt-1">
          Track employee leave balances by year
        </p>
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
              placeholder="Search by employee name or ID..."
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
            onClick={handleExport}
            className="px-4 py-2 border rounded-lg flex gap-2 items-center hover:bg-gray-100"
          >
            <Download size={16} /> Export
          </button>
        </div>

        {/* FILTER PANEL WITH DROPDOWNS */}
        {showFilters && (
          <div className="flex gap-4 mt-4 flex-wrap items-end">
            {/* Year Filter Dropdown */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Year</label>
              <div className="relative" ref={yearDropdownRef}>
                <button
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 min-w-[120px]"
                >
                  <span>{getSelectedYearLabel()}</span>
                  <ChevronDown size={14} className={`transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showYearDropdown && (
                  <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        setFilterYear("");
                        setShowYearDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${filterYear === "" ? 'bg-purple-50 text-purple-600' : ''}`}
                    >
                      All Years
                    </button>
                    {years.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setFilterYear(year.toString());
                          setShowYearDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${filterYear === year.toString() ? 'bg-purple-50 text-purple-600' : ''}`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Department Filter Dropdown */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Department</label>
              <div className="relative" ref={departmentDropdownRef}>
                <button
                  onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 min-w-[140px]"
                >
                  <span>{getSelectedDepartmentLabel()}</span>
                  <ChevronDown size={14} className={`transition-transform ${showDepartmentDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showDepartmentDropdown && (
                  <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {departmentOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterDepartment(option.value);
                          setShowDepartmentDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${filterDepartment === option.value ? 'bg-purple-50 text-purple-600' : ''}`}
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
        <table className="w-full text-sm min-w-[1200px]">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Previous Balance</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Current Balance</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Balance</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Used Leave</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Accepted</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rejected</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Expired</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Carry Over</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
             </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((balance, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={16} className="text-gray-600" />
                      </div>
                      <span className="font-medium">{getEmployeeName(balance)}</span>
                    </div>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{getEmployeeId(balance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{getDepartment(balance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{balance?.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">{formatNumber(balance?.previousBalance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`font-semibold ${balance?.currentBalance < 3 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatNumber(balance?.currentBalance)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-gray-800">{formatNumber(balance?.totalBalance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-orange-600 font-medium">{formatNumber(balance?.usedLeave)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-green-600">{formatNumber(balance?.acceptedLeave)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-red-600">{formatNumber(balance?.rejectedLeave)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">{formatNumber(balance?.expiredLeave)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-blue-600">{formatNumber(balance?.carryOverBalance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedBalance(balance);
                          setUpdateOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBalance(balance);
                          setDeleteOpen(true);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="13" className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-lg font-medium text-gray-500">No leave balance records found</p>
                  <p className="text-sm text-gray-400 mt-1">Leave balances will appear when leave requests are approved</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION - WITH PAGE NUMBERS (SAME AS LEAVE REQUEST) */}
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

      <UpdateLeaveBalance
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        balance={selectedBalance}
        leaveBalanceData={leaveBalanceData}
        setLeaveBalanceData={setLeaveBalanceData}
        onSuccess={() => refetch()}
      />

      <DeleteLeaveBalance
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        balance={selectedBalance}
        leaveBalanceData={leaveBalanceData}
        setLeaveBalanceData={setLeaveBalanceData}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default LeaveBalanceList;