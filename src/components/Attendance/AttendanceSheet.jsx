import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Calendar,
  Loader2
} from "lucide-react";
import { useGetAttendanceQuery } from "@/app/service/attendance";

const AttendanceSheet = () => {
  const { data, refetch, isLoading, error } = useGetAttendanceQuery("69c393e25b8735f88830c9b7", {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  const [attendanceData, setAttendanceData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const tableContainerRef = useRef(null);

  useEffect(() => {
    if (data?.data) {
      setAttendanceData(data.data);
    }
  }, [data]);

  // Get all unique employees from attendance data
  const employees = useMemo(() => {
    const employeeMap = new Map();
    if (!attendanceData || !Array.isArray(attendanceData)) return [];
    
    attendanceData.forEach(att => {
      if (att.userId && att.userId._id && !employeeMap.has(att.userId._id)) {
        const firstName = att.userId.firstName || '';
        const lastName = att.userId.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        employeeMap.set(att.userId._id, {
          id: att.userId._id,
          name: fullName || att.userId.email || 'Unknown'
        });
      }
    });
    
    return Array.from(employeeMap.values());
  }, [attendanceData]);

  // Group attendance by user and date
  const attendanceByUserAndDate = useMemo(() => {
    const map = new Map();
    
    if (!attendanceData || !Array.isArray(attendanceData)) return map;
    
    attendanceData.forEach(att => {
      const userId = att.userId?._id;
      if (!userId) return;
      
      const date = att.createdAt ? new Date(att.createdAt) : null;
      if (!date) return;
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      if (year === parseInt(selectedYear) && month === parseInt(selectedMonth)) {
        const key = `${userId}_${day}`;
        map.set(key, {
          status: att.status,
          shift: att.shift,
          firstIn: att.firstIn,
          lastOut: att.lastOut,
          totalHours: att.totalHours
        });
      }
    });
    
    return map;
  }, [attendanceData, selectedYear, selectedMonth]);

  // Get attendance status for a specific employee on a specific day
  const getAttendanceStatus = (employeeId, day) => {
    const key = `${employeeId}_${day}`;
    const attendance = attendanceByUserAndDate.get(key);
    return attendance ? attendance.status : null;
  };

  // Generate days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(parseInt(selectedYear), parseInt(selectedMonth));
  const firstDay = getFirstDayOfMonth(parseInt(selectedYear), parseInt(selectedMonth));

  // Generate weekdays
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate calendar days array
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear + 2; i++) {
    yearOptions.push({ value: i.toString(), label: i.toString() });
  }

  const monthOptions = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ];

  const getSelectedYearLabel = () => {
    const selected = yearOptions.find(opt => opt.value === selectedYear);
    return selected ? selected.label : "Select Year";
  };

  const getSelectedMonthLabel = () => {
    const selected = monthOptions.find(opt => opt.value === selectedMonth);
    return selected ? selected.label : "Select Month";
  };

  // Filter employees by search term
  const filteredEmployees = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return [];
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  const startRecord = filteredEmployees.length > 0 ? startIndex + 1 : 0;
  const endRecord = Math.min(startIndex + itemsPerPage, filteredEmployees.length);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setShowYearDropdown(false);
      }
      if (monthRef.current && !monthRef.current.contains(event.target)) {
        setShowMonthDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusText = (status) => {
    switch(status) {
      case 'Present': return 'P';
      case 'Absent': return 'A';
      case 'Late': return 'L';
      case 'Half Day': return 'HD';
      case 'Holiday': return 'HL';
      case 'Leave': return 'LV';
      default: return null;
    }
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Present': return 'bg-green-100 text-green-700';
      case 'Absent': return 'bg-red-100 text-red-700';
      case 'Late': return 'bg-yellow-100 text-yellow-700';
      case 'Half Day': return 'bg-orange-100 text-orange-700';
      case 'Holiday': return 'bg-pink-100 text-pink-700';
      case 'Leave': return 'bg-blue-100 text-blue-700';
      default: return '';
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setSearchTerm("");
    setCurrentPage(1);
    try {
      // Force refetch and wait for it to complete
      await refetch();
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export to CSV
  const exportToExcel = () => {
    if (!filteredEmployees.length) return;

    const exportData = filteredEmployees.map(emp => {
      const row = { 'Employee Name': emp.name };
      for (let day = 1; day <= daysInMonth; day++) {
        const status = getAttendanceStatus(emp.id, day);
        row[`Day ${day}`] = status || '';
      }
      return row;
    });

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
    a.download = `attendance_sheet_${getSelectedMonthLabel()}_${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg border overflow-hidden">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-gray-600" size={32} />
          <span className="ml-2 text-gray-600">Loading attendance data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-lg border overflow-hidden">
        <div className="flex justify-center items-center py-12 flex-col">
          <div className="text-red-600 text-lg font-medium mb-2">Error loading attendance data</div>
          <p className="text-gray-500 text-sm">Please check your connection and try again</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-800">Attendance Sheet</h2>
        <div className="flex items-center gap-2 mt-1">
          <Calendar size={14} className="text-gray-500" />
          <p className="text-sm text-gray-600">
            Filtered by: Year: {selectedYear} | Month: {getSelectedMonthLabel()}
          </p>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[250px] relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X size={16} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Year Dropdown */}
          <div className="relative" ref={yearRef}>
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <Calendar size={16} className="text-gray-500" />
              <span>{getSelectedYearLabel()}</span>
              <ChevronDown size={14} className={`transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showYearDropdown && (
              <div className="absolute top-full left-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {yearOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedYear(option.value);
                      setShowYearDropdown(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      selectedYear === option.value ? 'bg-gray-100 text-gray-600' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Month Dropdown */}
          <div className="relative" ref={monthRef}>
            <button
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <Calendar size={16} className="text-gray-500" />
              <span>{getSelectedMonthLabel()}</span>
              <ChevronDown size={14} className={`transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showMonthDropdown && (
              <div className="absolute top-full left-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {monthOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedMonth(option.value);
                      setShowMonthDropdown(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      selectedMonth === option.value ? 'bg-gray-100 text-gray-600' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 border border-gray-300 rounded-lg flex gap-2 items-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
            <span className="text-sm">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            onClick={exportToExcel}
            className="px-4 py-2 border border-gray-300 rounded-lg flex gap-2 items-center hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            <span className="text-sm">Export</span>
          </button>
        </div>
      </div>
       
      {/* Legend - Moved to right side */}
      <div className="px-6 py-3 border-b bg-gray-50 flex justify-end">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-gray-600">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-xs font-medium text-green-700">P</span>
            </div>
            <span className="text-xs text-gray-600">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-xs font-medium text-red-700">A</span>
            </div>
            <span className="text-xs text-gray-600">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-xs font-medium text-yellow-700">L</span>
            </div>
            <span className="text-xs text-gray-600">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-xs font-medium text-orange-700">HD</span>
            </div>
            <span className="text-xs text-gray-600">Half Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
              <span className="text-xs font-medium text-pink-700">HL</span>
            </div>
            <span className="text-xs text-gray-600">Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs font-medium text-blue-700">LV</span>
            </div>
            <span className="text-xs text-gray-600">Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-400">—</span>
            </div>
            <span className="text-xs text-gray-600">No Record</span>
          </div>
        </div>
      </div>
      
      {/* Attendance Table - Scrollable without visible scrollbar */}
      <div 
        ref={tableContainerRef}
        className="overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style>
          {`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100 sticky top-0">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left sticky left-0 bg-gray-100 z-20 min-w-[180px] font-semibold text-gray-700">
                Employee Name
              </th>
              {calendarDays.map((day, index) => (
                day && (
                  <th key={index} className="px-2 py-3 text-center min-w-[52px] border-l border-gray-200">
                    <div className="text-sm font-medium text-gray-700">{day}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {weekdays[(firstDay + index) % 7]}
                    </div>
                  </th>
                )
              ))}
            </tr>
          </thead>
          <tbody>
            {currentEmployees.map((employee, idx) => (
              <tr key={employee.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td
                  className="px-4 py-3 font-medium sticky left-0 bg-white z-30 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                  style={{
                    minWidth: '180px',
                    maxWidth: '220px',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    overflowWrap: 'break-word'
                  }}
                >
                  <div className="break-words whitespace-normal">
                    {employee.name}
                  </div>
                </td>
                {calendarDays.map((day, index) => {
                  if (!day) return null;
                  const status = getAttendanceStatus(employee.id, day);
                  const displayText = getStatusText(status);
                  const customStyle = status ? getStatusStyle(status) : '';
                  
                  return (
                    <td key={index} className="px-2 py-3 text-center border-l border-gray-100">
                      {status && displayText ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${customStyle}`}>
                          {displayText}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium bg-gray-100 text-gray-400">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredEmployees.length > 0 && totalPages > 1 && (
        <div className="px-6 py-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            Showing {startRecord} to {endRecord} of {filteredEmployees.length} employees
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <div className="flex gap-1">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={index} className="px-3 py-1.5 text-gray-400">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                      currentPage === page
                        ? "bg-gray-600 text-white border-gray-600"
                        : "border-gray-300 hover:bg-white text-gray-700"
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
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSheet;