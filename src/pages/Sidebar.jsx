import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  CalendarDays, 
  Clock, 
  Gift, 
  Briefcase, 
  CreditCard, 
  FileText,
  ChevronDown,
  ChevronRight,
  LogOut,
  UserPlus,
  UserCheck,
  Settings,
  HelpCircle,
  Building2,
  CalendarCheck,
  PieChart,
  Layers
} from 'lucide-react';

// Tooltip Component
const Tooltip = ({ children, text, show }) => {
  if (!show) return children;
  
  return (
    <div className="relative group">
      {children}
      <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        {text}
      </div>
    </div>
  );
};

const Sidebar = ({ sidebarOpen }) => {
  const location = useLocation();
  const [employeesOpen, setEmployeesOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [leaveManagementOpen, setLeaveManagementOpen] = useState(false);
  
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/projects', icon: FolderKanban, label: 'Projects' },
    { 
      type: 'dropdown',
      icon: Users, 
      label: 'Employees',
      isOpen: employeesOpen,
      setIsOpen: setEmployeesOpen,
      subItems: [
        { path: '/employees', icon: UserCheck, label: 'All Employees' },
        { path: '/employees/add', icon: UserPlus, label: 'Add Employee' },
        { path: '/employees/attendance', icon: Clock, label: 'Employee Attendance' },
      ]
    },
    { 
      type: 'dropdown',
      icon: CalendarDays, 
      label: 'Leave Management',
      isOpen: leaveManagementOpen,
      setIsOpen: setLeaveManagementOpen,
      subItems: [
        { path: '/leave-requests', icon: CalendarCheck, label: 'Leave Requests' },
        { path: '/leave-balance', icon: PieChart, label: 'Leave Balance' },
        { path: '/leave-types', icon: Layers, label: 'Leave Types' },
      ]
    },
    {
      type: 'dropdown',
      icon: Clock,
      label: 'Attendance',
      isOpen: attendanceOpen,
      setIsOpen: setAttendanceOpen,
      subItems: [
        { path: '/attendance/today', icon: Clock, label: "Today's Attendance" },
        { path: '/attendance/sheet', icon: FileText, label: 'Attendance Sheet' },
      ]
    },
    { path: '/holidays', icon: Gift, label: 'Holidays' },
    { path: '/clients', icon: Briefcase, label: 'Clients' },
    { path: '/payroll', icon: CreditCard, label: 'Payroll' },
    { path: '/documents', icon: FileText, label: 'Documents' }
  ];

  const bottomMenuItems = [
    { path: '/settings', icon: Settings, label: 'Settings' },
    { path: '/help', icon: HelpCircle, label: 'Help & Support' },
  ];

  const handleLogout = () => {
    console.log('Logging out...');
    // Add your logout logic here
  };

  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-10`}>
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {/* Logo Icon - Always visible */}
          <Tooltip text="HR Manager" show={!sidebarOpen}>
            <div className="flex-shrink-0">
              <Building2 size={28} className="text-purple-600" />
            </div>
          </Tooltip>
          {/* Logo Text - Only visible when sidebar is open */}
          {sidebarOpen && (
            <div className="font-semibold text-lg text-gray-800">
              HR Manager
            </div>
          )}
        </div>
      </div>
      
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className={`${sidebarOpen ? 'block' : 'hidden'} text-xs font-medium text-gray-400 uppercase mb-2`}>
          Departments
        </div>
        <div className="flex items-center gap-2">
          <Tooltip text="Sarah Smith - Admin" show={!sidebarOpen}>
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600 font-medium text-sm">SS</span>
            </div>
          </Tooltip>
          {sidebarOpen && (
            <div>
              <div className="text-sm font-medium text-gray-800">Sarah Smith</div>
              <div className="text-xs text-gray-500">Admin</div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className={`${sidebarOpen ? 'block' : 'hidden'} text-xs font-medium text-gray-400 uppercase mb-2`}>
          Main Menu
        </div>
        {menuItems.map((item, idx) => {
          if (item.type === 'dropdown') {
            const isActive = item.subItems.some(subItem => location.pathname === subItem.path);
            return (
              <div key={idx}>
                <Tooltip text={item.label} show={!sidebarOpen}>
                  <button
                    onClick={() => sidebarOpen && item.setIsOpen(!item.isOpen)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className="flex-shrink-0" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </div>
                    {sidebarOpen && (
                      <span className="text-gray-400">
                        {item.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    )}
                  </button>
                </Tooltip>
                
                {/* Dropdown Submenu */}
                {sidebarOpen && item.isOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.subItems.map((subItem, subIdx) => {
                      const isSubActive = location.pathname === subItem.path;
                      return (
                        <Link
                          key={subIdx}
                          to={subItem.path}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                            isSubActive ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <subItem.icon size={16} className="flex-shrink-0" />
                          <span>{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          
          const isActive = location.pathname === item.path;
          return (
            <Tooltip key={idx} text={item.label} show={!sidebarOpen}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom Section with Settings, Help, and Logout */}
      <div className="border-t border-gray-200 pt-4 pb-6 px-4 space-y-1">
        {bottomMenuItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <Tooltip key={idx} text={item.label} show={!sidebarOpen}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            </Tooltip>
          );
        })}
        
        {/* Logout Button */}
        <Tooltip text="Logout" show={!sidebarOpen}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-red-600 hover:bg-red-50`}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </Tooltip>
      </div>
    </aside>
  );
};

export default Sidebar;