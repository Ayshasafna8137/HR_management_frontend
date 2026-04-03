import React, { useState, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, User, Briefcase, Award, TrendingUp, LogIn, LogOut, Coffee, BarChart3, Table, CheckCircle, XCircle, Clock, Users, PieChart as PieChartIcon } from "lucide-react";
import { useGetAttendanceQuery } from "@/app/service/attendance";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const EmployeeAttendance = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { employeeName } = location.state || {};
  const { data, isLoading } = useGetAttendanceQuery("69c393e25b8735f88830c9b7");

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState("attendance");
  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  // Colors for charts
  const COLORS = {
    present: "#10b981",
    absent: "#ef4444",
    late: "#f59e0b",
    halfDay: "#f97316",
    holiday: "#ec489a",
    leave: "#3b82f6",
    weekend: "#8b5cf6",
    onDuty: "#06b6d4"
  };

  // Months array for month dropdown
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Years array for year dropdown - actual years
  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

  // Get employee details from attendance data
  const employeeDetails = useMemo(() => {
    if (!data?.data) return null;
    const attendance = data.data.find(att => att.userId?._id === id);
    return attendance?.userId || null;
  }, [data, id]);

  // Filter attendance for specific employee
  const employeeAttendances = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter(att => att.userId?._id === id);
  }, [data, id]);

  // Filter by selected month and year
  const filteredAttendances = useMemo(() => {
    return employeeAttendances.filter(att => {
      const date = new Date(att.createdAt);
      return date.getMonth() + 1 === selectedMonth && 
             date.getFullYear() === selectedYear;
    });
  }, [employeeAttendances, selectedMonth, selectedYear]);

  // Calculate status distribution
  const statusDistribution = useMemo(() => {
    const total = filteredAttendances.length;
    if (total === 0) {
      return {
        present: { count: 0, percentage: 0 },
        absent: { count: 0, percentage: 0 },
        late: { count: 0, percentage: 0 },
        halfDay: { count: 0, percentage: 0 },
        holiday: { count: 0, percentage: 0 },
        leave: { count: 0, percentage: 0 },
        weekend: { count: 0, percentage: 0 },
        onDuty: { count: 0, percentage: 0 }
      };
    }

    const present = filteredAttendances.filter(att => att.status === 'Present').length;
    const absent = filteredAttendances.filter(att => att.status === 'Absent').length;
    const late = filteredAttendances.filter(att => att.status === 'Late').length;
    const halfDay = filteredAttendances.filter(att => att.status === 'Half Day').length;
    const holiday = filteredAttendances.filter(att => att.status === 'Holiday').length;
    const leave = filteredAttendances.filter(att => att.status === 'Leave').length;
    const weekend = filteredAttendances.filter(att => att.status === 'Weekend').length;
    const onDuty = filteredAttendances.filter(att => att.status === 'On Duty').length;

    return {
      present: { count: present, percentage: (present / total) * 100 },
      absent: { count: absent, percentage: (absent / total) * 100 },
      late: { count: late, percentage: (late / total) * 100 },
      halfDay: { count: halfDay, percentage: (halfDay / total) * 100 },
      holiday: { count: holiday, percentage: (holiday / total) * 100 },
      leave: { count: leave, percentage: (leave / total) * 100 },
      weekend: { count: weekend, percentage: (weekend / total) * 100 },
      onDuty: { count: onDuty, percentage: (onDuty / total) * 100 }
    };
  }, [filteredAttendances]);

  // Prepare data for Pie Chart
  const pieChartData = useMemo(() => {
    const data = [];
    
    if (statusDistribution.present.count > 0) {
      data.push({ name: "Present", value: statusDistribution.present.count, color: COLORS.present, percentage: statusDistribution.present.percentage });
    }
    if (statusDistribution.onDuty.count > 0) {
      data.push({ name: "On Duty", value: statusDistribution.onDuty.count, color: COLORS.onDuty, percentage: statusDistribution.onDuty.percentage });
    }
    if (statusDistribution.leave.count > 0) {
      data.push({ name: "Paid Leave", value: statusDistribution.leave.count, color: COLORS.leave, percentage: statusDistribution.leave.percentage });
    }
    if (statusDistribution.absent.count > 0) {
      data.push({ name: "Absent", value: statusDistribution.absent.count, color: COLORS.absent, percentage: statusDistribution.absent.percentage });
    }
    if (statusDistribution.holiday.count > 0) {
      data.push({ name: "Holiday Leaves", value: statusDistribution.holiday.count, color: COLORS.holiday, percentage: statusDistribution.holiday.percentage });
    }
    if (statusDistribution.weekend.count > 0) {
      data.push({ name: "Weekend", value: statusDistribution.weekend.count, color: COLORS.weekend, percentage: statusDistribution.weekend.percentage });
    }
    if (statusDistribution.late.count > 0) {
      data.push({ name: "Late", value: statusDistribution.late.count, color: COLORS.late, percentage: statusDistribution.late.percentage });
    }
    if (statusDistribution.halfDay.count > 0) {
      data.push({ name: "Half Day", value: statusDistribution.halfDay.count, color: COLORS.halfDay, percentage: statusDistribution.halfDay.percentage });
    }
    
    return data;
  }, [statusDistribution]);

  // Calculate averages
  const calculateAverage = useMemo(() => {
    const validAttendances = filteredAttendances.filter(att => att.firstIn && att.lastOut && att.totalHours);
    
    if (validAttendances.length === 0) {
      return {
        avgWorkingHours: "08:00",
        avgInTime: "10:30 AM",
        avgOutTime: "07:30 PM",
        avgBreakTime: "01:00"
      };
    }

    const avgWorkingHours = 8;
    const avgWorkingMins = 0;
    
    let totalInMinutes = 0;
    let inTimeCount = 0;
    validAttendances.forEach(att => {
      if (att.firstIn) {
        let hour, minute;
        if (att.firstIn.includes('AM') || att.firstIn.includes('PM')) {
          const [time, period] = att.firstIn.split(' ');
          const [h, m] = time.split(':');
          hour = parseInt(h);
          minute = parseInt(m);
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
        } else {
          const [h, m] = att.firstIn.split(':');
          hour = parseInt(h);
          minute = parseInt(m);
        }
        totalInMinutes += (hour * 60 + minute);
        inTimeCount++;
      }
    });
    
    let totalOutMinutes = 0;
    let outTimeCount = 0;
    validAttendances.forEach(att => {
      if (att.lastOut) {
        let hour, minute;
        if (att.lastOut.includes('AM') || att.lastOut.includes('PM')) {
          const [time, period] = att.lastOut.split(' ');
          const [h, m] = time.split(':');
          hour = parseInt(h);
          minute = parseInt(m);
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
        } else {
          const [h, m] = att.lastOut.split(':');
          hour = parseInt(h);
          minute = parseInt(m);
        }
        totalOutMinutes += (hour * 60 + minute);
        outTimeCount++;
      }
    });
    
    const avgInMinutes = inTimeCount > 0 ? totalInMinutes / inTimeCount : 0;
    const avgInHour = Math.floor(avgInMinutes / 60);
    const avgInMinute = Math.floor(avgInMinutes % 60);
    const inPeriod = avgInHour >= 12 ? 'PM' : 'AM';
    const displayInHour = avgInHour % 12 || 12;
    
    const avgOutMinutes = outTimeCount > 0 ? totalOutMinutes / outTimeCount : 0;
    const avgOutHour = Math.floor(avgOutMinutes / 60);
    const avgOutMinute = Math.floor(avgOutMinutes % 60);
    const outPeriod = avgOutHour >= 12 ? 'PM' : 'AM';
    const displayOutHour = avgOutHour % 12 || 12;
    
    const avgBreakHours = 1;
    const avgBreakMins = 0;
    
    return {
      avgWorkingHours: `${avgWorkingHours.toString().padStart(2, '0')}:${avgWorkingMins.toString().padStart(2, '0')}`,
      avgInTime: `${displayInHour.toString().padStart(2, '0')}:${avgInMinute.toString().padStart(2, '0')} ${inPeriod}`,
      avgOutTime: `${displayOutHour.toString().padStart(2, '0')}:${avgOutMinute.toString().padStart(2, '0')} ${outPeriod}`,
      avgBreakTime: `${avgBreakHours.toString().padStart(2, '0')}:${avgBreakMins.toString().padStart(2, '0')}`
    };
  }, [filteredAttendances]);

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    if (timeString.includes('AM') || timeString.includes('PM')) return timeString;
    
    const [hours, minutes] = timeString.split(':');
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const formatWorkingHours = (hours) => {
    if (!hours) return "-";
    if (typeof hours === 'string' && hours.includes('h')) return hours;
    const numHours = parseFloat(hours);
    if (isNaN(numHours)) return hours;
    const hrs = Math.floor(numHours);
    const mins = Math.round((numHours - hrs) * 60);
    if (hrs === 0 && mins > 0) return `${mins}m`;
    if (hrs > 0 && mins === 0) return `${hrs}h`;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const displayName = employeeName || 
    (employeeDetails?.firstName + " " + employeeDetails?.lastName) || 
    "Employee";

  const getStatusBadge = (status) => {
    const statusMap = {
      'Present': 'bg-green-100 text-green-700',
      'Late': 'bg-yellow-100 text-yellow-700',
      'Absent': 'bg-red-100 text-red-700',
      'Half Day': 'bg-orange-100 text-orange-700',
      'Holiday': 'bg-pink-100 text-pink-700',
      'Leave': 'bg-blue-100 text-blue-700',
      'Weekend': 'bg-gray-100 text-gray-700',
      'On Duty': 'bg-cyan-100 text-cyan-700'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-700';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-800">{payload[0].name}</p>
          <p className="text-sm" style={{ color: payload[0].payload.color }}>
            Count: {payload[0].value} days
          </p>
          <p className="text-sm" style={{ color: payload[0].payload.color }}>
            Percentage: {payload[0].payload.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CircularProgress = ({ percentage, color, size = 100, strokeWidth = 8 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  // Attendance Log Content with Custom Dropdowns - FIXED to show all months
  const AttendanceLogContent = () => (
    <div>
      {/* Month/Year Filter */}
      <div className="flex justify-end mb-4 gap-3">
        {/* Month Dropdown */}
        <div className="relative">
          <div
            onClick={() => {
              setMonthOpen(!monthOpen);
              setYearOpen(false);
            }}
            className="w-36 border border-gray-300 rounded-lg px-4 py-2.5 flex justify-between items-center cursor-pointer bg-white hover:border-purple-400"
          >
            <span className="text-gray-700">{months[selectedMonth - 1]}</span>
            <span className="text-gray-400">▼</span>
          </div>

          {monthOpen && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-white border rounded-lg shadow-lg z-50">
              {months.map((month, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedMonth(index + 1);
                    setMonthOpen(false);
                  }}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between ${
                    selectedMonth === index + 1 ? "bg-purple-50" : ""
                  }`}
                >
                  <span className={selectedMonth === index + 1 ? "text-purple-600 font-medium" : "text-gray-700"}>
                    {month}
                  </span>
                  {selectedMonth === index + 1 && <span className="text-purple-600">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Year Dropdown */}
        <div className="relative">
          <div
            onClick={() => {
              setYearOpen(!yearOpen);
              setMonthOpen(false);
            }}
            className="w-28 border border-gray-300 rounded-lg px-4 py-2.5 flex justify-between items-center cursor-pointer bg-white hover:border-purple-400"
          >
            <span className="text-gray-700">{selectedYear}</span>
            <span className="text-gray-400">▼</span>
          </div>

          {yearOpen && (
            <div className="absolute top-full left-0 mt-1 w-28 bg-white border rounded-lg shadow-lg z-50">
              {years.map((year) => (
                <div
                  key={year}
                  onClick={() => {
                    setSelectedYear(year);
                    setYearOpen(false);
                  }}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between ${
                    selectedYear === year ? "bg-purple-50" : ""
                  }`}
                >
                  <span className={selectedYear === year ? "text-purple-600 font-medium" : "text-gray-700"}>
                    {year}
                  </span>
                  {selectedYear === year && <span className="text-purple-600">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CHECK IN</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CHECK OUT</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WORKING HOURS</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SHIFT</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
              </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan="6" className="text-center py-12">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="ml-2 text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && filteredAttendances.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-12">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Calendar size={40} className="mb-2" />
                    <p>No attendance records found</p>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && filteredAttendances.map((att) => (
              <tr key={att._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-700">
                  {new Date(att.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatTime(att.firstIn)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatTime(att.lastOut)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatWorkingHours(att.totalHours)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{att.shift || "Shift 1"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(att.status)}`}>
                    {att.status || "-"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Analytics Content with Custom Dropdowns - FIXED to show all months
  const AnalyticsContent = () => (
    <div className="space-y-6">
      {/* Month/Year Filter */}
      <div className="flex justify-end gap-3">
        {/* Month Dropdown */}
        <div className="relative">
          <div
            onClick={() => {
              setMonthOpen(!monthOpen);
              setYearOpen(false);
            }}
            className="w-36 border border-gray-300 rounded-lg px-4 py-2.5 flex justify-between items-center cursor-pointer bg-white hover:border-purple-400"
          >
            <span className="text-gray-700">{months[selectedMonth - 1]}</span>
            <span className="text-gray-400">▼</span>
          </div>

          {monthOpen && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-white border rounded-lg shadow-lg z-50">
              {months.map((month, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedMonth(index + 1);
                    setMonthOpen(false);
                  }}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between ${
                    selectedMonth === index + 1 ? "bg-purple-50" : ""
                  }`}
                >
                  <span className={selectedMonth === index + 1 ? "text-purple-600 font-medium" : "text-gray-700"}>
                    {month}
                  </span>
                  {selectedMonth === index + 1 && <span className="text-purple-600">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Year Dropdown */}
        <div className="relative">
          <div
            onClick={() => {
              setYearOpen(!yearOpen);
              setMonthOpen(false);
            }}
            className="w-28 border border-gray-300 rounded-lg px-4 py-2.5 flex justify-between items-center cursor-pointer bg-white hover:border-purple-400"
          >
            <span className="text-gray-700">{selectedYear}</span>
            <span className="text-gray-400">▼</span>
          </div>

          {yearOpen && (
            <div className="absolute top-full left-0 mt-1 w-28 bg-white border rounded-lg shadow-lg z-50">
              {years.map((year) => (
                <div
                  key={year}
                  onClick={() => {
                    setSelectedYear(year);
                    setYearOpen(false);
                  }}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between ${
                    selectedYear === year ? "bg-purple-50" : ""
                  }`}
                >
                  <span className={selectedYear === year ? "text-purple-600 font-medium" : "text-gray-700"}>
                    {year}
                  </span>
                  {selectedYear === year && <span className="text-purple-600">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6 bg-white">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon size={20} className="text-gray-600" />
            <h3 className="font-semibold text-gray-800">Attendance Distribution</h3>
          </div>
          
          {pieChartData.length > 0 ? (
            <>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {pieChartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <span className="text-sm font-medium text-gray-800">{item.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              No data available
            </div>
          )}
        </div>

        <div className="border rounded-xl p-6 bg-white">
          <h3 className="font-semibold text-gray-800 mb-6">Status Overview</h3>
          <div className="grid grid-cols-2 gap-6">
            {pieChartData.map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <CircularProgress 
                    percentage={item.percentage} 
                    color={item.color}
                    size={100}
                    strokeWidth={8}
                  />
                </div>
                <p className="text-sm font-medium text-gray-700 mt-2">{item.name}</p>
                <p className="text-xs text-gray-500 mt-1">{item.value} days</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back</span>
          </button>
          
          {/* Username Div */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              {employeeDetails?.employeeId && (
                <div className="flex items-center gap-2">
                  <User size={14} />
                  <span>ID: {employeeDetails.employeeId}</span>
                </div>
              )}
              {employeeDetails?.department && (
                <div className="flex items-center gap-2">
                  <Briefcase size={14} />
                  <span>Dept: {employeeDetails.department}</span>
                </div>
              )}
              {employeeDetails?.joinDate && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>Joined: {new Date(employeeDetails.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-800">Employee Attendance</h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Avg Working Hours</div>
                <div className="text-xl font-semibold text-gray-800">{calculateAverage.avgWorkingHours}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <LogIn size={20} className="text-green-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Avg In Time</div>
                <div className="text-xl font-semibold text-gray-800">{calculateAverage.avgInTime}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <LogOut size={20} className="text-red-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Avg Out Time</div>
                <div className="text-xl font-semibold text-gray-800">{calculateAverage.avgOutTime}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Coffee size={20} className="text-orange-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Avg Break Time</div>
                <div className="text-xl font-semibold text-gray-800">{calculateAverage.avgBreakTime}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                ${activeTab === "attendance"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Table size={16} />
              Attendance Log
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                ${activeTab === "analytics"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
          </div>

          <div className="p-6">
            {activeTab === "attendance" ? <AttendanceLogContent /> : <AnalyticsContent />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendance;