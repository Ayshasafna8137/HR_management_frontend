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
  User
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetAttendanceQuery } from "@/app/service/attendance";
import CreateAttendance from "./CreateAttendance";
import UpdateAttendance from "./UpdateAttendance";
import DeleteAttendance from "./DeleteAttendance";

const AttendanceList = () => {
  const navigate = useNavigate();
  const { data, refetch, isLoading } =
    useGetAttendanceQuery("69c393e25b8735f88830c9b7");

  const [attendanceData, setAttendanceData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState({
    shift: "",
    status: "",
    startDate: "",
    endDate: ""
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const shiftDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedAttendance, setSelectedAttendance] = useState(null);

  // Helper function to format time with AM/PM
  const formatTime = (timeString) => {
    if (!timeString) return "-";
    
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString;
    }
    
    const [hours, minutes] = timeString.split(':');
    if (!hours || !minutes) return timeString;
    
    let hour = parseInt(hours);
    const minute = minutes;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    const hourStr = hour.toString().padStart(2, '0');
    
    return `${hourStr}:${minute} ${ampm}`;
  };

  useEffect(() => {
    if (data?.data) {
      setAttendanceData(data.data);
    }
  }, [data]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shiftDropdownRef.current && !shiftDropdownRef.current.contains(event.target)) {
        setShowShiftDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // FILTER LOGIC
  const filteredData = useMemo(() => {
    return attendanceData.filter((att) => {
      const fullName =
        `${att?.userId?.firstName || ""} ${att?.userId?.lastName || ""}`;

      const matchSearch =
        searchTerm === "" ||
        fullName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchShift =
        filters.shift === "" || att?.shift === filters.shift;

      const matchStatus =
        filters.status === "" || att?.status === filters.status;

      const createdDate = att?.createdAt ? new Date(att.createdAt) : null;

      const startDate =
        filters.startDate ? new Date(filters.startDate) : null;

      const endDate =
        filters.endDate ? new Date(filters.endDate) : null;

      if (startDate) startDate.setHours(0,0,0,0);
      if (endDate) endDate.setHours(23,59,59,999);

      const matchStart =
        !startDate || (createdDate && createdDate >= startDate);

      const matchEnd =
        !endDate || (createdDate && createdDate <= endDate);

      return (
        matchSearch &&
        matchShift &&
        matchStatus &&
        matchStart &&
        matchEnd
      );
    });
  }, [attendanceData, searchTerm, filters]);

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

  const currentAttendance = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRefresh = () => {
    setSearchTerm("");
    setFilters({
      shift: "",
      status: "",
      startDate: "",
      endDate: ""
    });
    setCurrentPage(1);
    refetch();
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

  // Shift options
  const shiftOptions = [
    { value: "", label: "All Shift" },
    { value: "General", label: "General" },
    { value: "Day Shift", label: "Day Shift" },
    { value: "Night Shift", label: "Night Shift" }
  ];

  // Status options
  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "Present", label: "Present" },
    { value: "Late", label: "Late" },
    { value: "Absent", label: "Absent" },
    { value: "Half Day", label: "Half Day" }
  ];

  // Get selected shift display
  const getSelectedShift = () => {
    const selected = shiftOptions.find(opt => opt.value === filters.shift);
    return selected || shiftOptions[0];
  };

  // Get selected status display
  const getSelectedStatus = () => {
    const selected = statusOptions.find(opt => opt.value === filters.status);
    return selected || statusOptions[0];
  };

  // Handle row click navigation to employee attendance page
  const handleRowClick = (employeeId, employeeName) => {
    navigate(`/attendance/employee/${employeeId}`, { 
      state: { employeeName, employeeId } 
    });
  };

  // Export to CSV function
  const exportToExcel = () => {
    if (!filteredData.length) return;

    const exportData = filteredData.map(att => ({
      'Employee Name': `${att?.userId?.firstName || ''} ${att?.userId?.lastName || ''}`,
      'First In': formatTime(att?.firstIn),
      'Last Out': formatTime(att?.lastOut),
      'Total Hours': att?.totalHours || '-',
      'Status': att?.status || '-',
      'Shift': att?.shift || '-',
      'Date': att?.createdAt ? new Date(att.createdAt).toLocaleDateString() : '-'
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
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const hasActiveFilters = searchTerm !== '' || Object.values(filters).some(value => value !== '');

  return (
    <>
      <div className="w-full bg-white rounded-lg border overflow-hidden">

        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Today Attendance</h2>
        </div>

        {/* SEARCH */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e)=>setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border rounded-lg text-sm"
              />
              {searchTerm && (
                <button
                  onClick={()=>setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X size={16}/>
                </button>
              )}
            </div>

            <button
              onClick={()=>setShowFilters(!showFilters)}
              className="px-4 py-2 border rounded-lg flex gap-2 hover:bg-gray-50"
            >
              <Filter size={16}/>
              Filter
            </button>

            <button
              onClick={handleRefresh}
              className="px-4 py-2 border rounded-lg flex gap-2 hover:bg-gray-50"
            >
              <RefreshCw size={16}/>
              Refresh
            </button>

            <button
              onClick={exportToExcel}
              className="px-4 py-2 border rounded-lg flex gap-2 hover:bg-gray-50"
            >
              <Download size={16}/>
              Export
            </button>

            <button
              onClick={()=>setCreateOpen(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg flex gap-2"
            >
              <Plus size={16}/>
              Add Attendance
            </button>
          </div>

          {/* FILTER PANEL WITH CUSTOM DROPDOWNS */}
          {showFilters && (
            <div className="flex gap-4 mt-4 flex-wrap items-center">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e)=>setFilters({...filters,startDate:e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e)=>setFilters({...filters,endDate:e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="End Date"
              />
              
              {/* Shift Custom Dropdown */}
              <div className="relative" ref={shiftDropdownRef}>
                <button
                  onClick={() => setShowShiftDropdown(!showShiftDropdown)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <span>{getSelectedShift().label}</span>
                  <ChevronDown size={14} className={`transition-transform ${showShiftDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showShiftDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    {shiftOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilters({...filters, shift: option.value});
                          setShowShiftDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${
                          filters.shift === option.value ? 'bg-gray-100' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Custom Dropdown */}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <span>{getSelectedStatus().label}</span>
                  <ChevronDown size={14} className={`transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilters({...filters, status: option.value});
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${
                          filters.status === option.value ? 'bg-gray-100' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilters({
                      shift: "",
                      status: "",
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

        {/* TABLE with clickable rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-3 text-left">Employee</th>
                <th className="px-6 py-3 text-left">First In</th>
                <th className="px-6 py-3 text-left">Last Out</th>
                <th className="px-6 py-3 text-left">Total</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Shift</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="7" className="text-center py-6">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                      <span className="ml-2">Loading attendance...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && currentAttendance.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search size={48} className="mb-2 text-gray-300" />
                      <p className="text-lg font-medium">No attendance records found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && currentAttendance.map((att) => (
                <tr 
                  key={att._id} 
                  className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(att.userId?._id, `${att?.userId?.firstName} ${att?.userId?.lastName}`)}
                >
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={16} className="text-gray-600" />
                      </div>
                      <span>
                        {att?.userId?.firstName} {att?.userId?.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatTime(att?.firstIn)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatTime(att?.lastOut)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{att?.totalHours || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      att?.status === 'Present' ? 'bg-green-100 text-green-800' :
                      att?.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                      att?.status === 'Absent' ? 'bg-red-100 text-red-800' :
                      att?.status === 'Half Day' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {att?.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      att?.shift === 'Day Shift' ? 'bg-blue-100 text-blue-800' :
                      att?.shift === 'Night Shift' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {att?.shift}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={()=>{
                        setSelectedAttendance(att);
                        setUpdateOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                      title="Edit"
                    >
                      <Edit size={16}/>
                    </button>
                    <button
                      onClick={()=>{
                        setSelectedAttendance(att);
                        setDeleteOpen(true);
                      }}
                      className="text-red-600 hover:text-red-800 p-1 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16}/>
                    </button>
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
                          ? "bg-purple-600 text-white border-gray-600"
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

      <CreateAttendance 
        open={createOpen} 
        onOpenChange={setCreateOpen}
        onSuccess={() => refetch()}
        attendanceData={attendanceData}
        setAttendanceData={setAttendanceData}
      />
      <UpdateAttendance 
        open={updateOpen} 
        onOpenChange={setUpdateOpen} 
        attendance={selectedAttendance}
        attendanceData={attendanceData}
        setAttendanceData={setAttendanceData}
        onSuccess={() => refetch()}
      />
      <DeleteAttendance 
        open={deleteOpen} 
        onOpenChange={setDeleteOpen} 
        attendance={selectedAttendance}
        attendanceData={attendanceData}
        setAttendanceData={setAttendanceData}
        onSuccess={() => refetch()}
      />
    </>
  );
};

export default AttendanceList;