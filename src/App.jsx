import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './pages/Sidebar';
import TopBar from './pages/TopBar';

// Import all pages
import Dashboard from './pages/Dashboard';
import EmployeeAttendance from './components/Attendance/EmployeeAttendance';


import Settings from './pages/Settings';
import Employees from './components/employees/Employees';
import AttendanceList from './components/Attendance/Attendances';
import AttendanceSheet from './components/Attendance/AttendanceSheet';
import LeaveRequestList from './components/leave/LeaveManagement';
import LeaveBalanceList from './components/leave/LeaveBalance';
import LeaveTypeList from './components/leave/LeaveType';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar sidebarOpen={sidebarOpen} />
      
      <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <div className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/attendance/employee/:id" element={<EmployeeAttendance />} />
            <Route path="/leave-requests" element={<LeaveRequestList />} />
            <Route path="/leave-balance" element={<LeaveBalanceList />} />
            <Route path="/leave-types" element={<LeaveTypeList />} />
            <Route path="/attendance" element={<AttendanceList/>}/>
            <Route path="/attendance/today" element={<AttendanceList />} />
            <Route path="/attendance/sheet" element={<AttendanceSheet />}/>
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;