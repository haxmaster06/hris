"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTranslations } from "next-intl";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { 
  Loader2, 
  Users, 
  TrendingUp, 
  DollarSign, 
  GraduationCap, 
  Calendar,
  Download,
  Filter
} from "lucide-react";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];

export default function AnalyticsDashboard() {
  const router = useRouter();
  const t = useTranslations();
  const { isAuthenticated } = useAuthStore();
  const { isAdmin } = useAuthorization();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("workforce");
  const [loading, setLoading] = useState(true);

  // Analytics Data States
  const [workforceData, setWorkforceData] = useState<any>(null);
  const [turnoverData, setTurnoverData] = useState<any[]>([]);
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [headcountData, setHeadcountData] = useState<any[]>([]);
  const [costData, setCostData] = useState<any[]>([]);
  const [trainingData, setTrainingData] = useState<any[]>([]);
  
  // Attendance & Leave stats
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [leaveData, setLeaveData] = useState<any[]>([]);

  // Filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Start of month
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!isAdmin) {
      router.push("/dashboard");
    } else {
      loadAllData();
    }
  }, [isAuthenticated, isAdmin, router]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Parallel fetches for summary / charts
      const [
        workforceRes,
        turnoverRes,
        retentionRes,
        headcountRes,
        costRes,
        trainingRes,
      ] = await Promise.all([
        api.get("/reports/workforce-summary"),
        api.get(`/reports/turnover?year=${selectedYear}`),
        api.get(`/reports/retention?year=${selectedYear}`),
        api.get("/reports/headcount"),
        api.get(`/reports/cost-analysis?year=${selectedYear}`),
        api.get("/reports/training-effectiveness")
      ]);

      setWorkforceData(workforceRes.data.data);
      setTurnoverData(turnoverRes.data.data || []);
      setRetentionData(retentionRes.data.data || []);
      setHeadcountData(headcountRes.data.data || []);
      setCostData(costRes.data.data || []);
      setTrainingData(trainingRes.data.data || []);

      // Fetch tabular data
      fetchAttendance();
      fetchLeave();

    } catch (err) {
      console.error(err);
      toast.error("Failed to retrieve report data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await api.get(`/reports/attendance?start_date=${startDate}&end_date=${endDate}`);
      setAttendanceData(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeave = async () => {
    try {
      const res = await api.get(`/reports/leave?year=${selectedYear}`);
      setLeaveData(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value);
  };

  // Mock CSV Export handler
  const handleExportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.warning("No data to export");
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => 
      Object.values(row).map(val => typeof val === "string" ? `"${val}"` : val).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report exported successfully");
  };

  if (!mounted || !isAuthenticated || !isAdmin) {
    return null;
  }

  // Calculate high-level summary cards values
  const totalEmployees = headcountData[headcountData.length - 1]?.headcount || 0;
  const currentRetention = retentionData[retentionData.length - 1]?.retention_rate || 100;
  const totalPayrollCost = costData.reduce((acc, c) => acc + c.cost, 0);
  const avgTrainingPost = trainingData.length > 0
    ? (trainingData.reduce((acc, t) => acc + t.post_score, 0) / trainingData.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black font-sans transition-colors duration-200">
      <Header
        title={t("analytics.pageTitle")}
        subtitle={t("analytics.subtitle")}
        backUrl="/dashboard"
      />

      <main className="flex-1 flex flex-col justify-start px-6 py-8 max-w-6xl mx-auto w-full space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-550" />
          </div>
        ) : (
          <>
            {/* Year / Date Filters Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-650 dark:text-zinc-350">
                  <Filter className="h-4 w-4 text-indigo-500" />
                  <span>Filters:</span>
                </div>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    setTimeout(loadAllData, 100);
                  }}
                  className="text-xs py-1.5 px-3 border border-zinc-200 dark:border-zinc-900 bg-transparent rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
                >
                  {[currentYear, currentYear - 1, currentYear - 2].map(yr => (
                    <option key={yr} value={yr} className="bg-white dark:bg-zinc-950">{yr}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs py-1 px-2 border border-zinc-200 dark:border-zinc-900 bg-transparent rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-400">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs py-1 px-2 border border-zinc-200 dark:border-zinc-900 bg-transparent rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none"
                  />
                  <button
                    onClick={fetchAttendance}
                    className="text-[10px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 py-1 px-2.5 rounded font-black hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Sync Range
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (activeTab === "attendance") handleExportCSV(attendanceData, "attendance_report");
                  else if (activeTab === "leave") handleExportCSV(leaveData, "leave_report");
                  else if (activeTab === "cost") handleExportCSV(costData, "compensation_costs");
                  else if (activeTab === "training") handleExportCSV(trainingData, "training_effectiveness");
                  else if (activeTab === "turnover") handleExportCSV(turnoverData, "staff_turnover");
                  else toast.info("Please select a tabular tab to export data");
                }}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                {t("analytics.exportBtn")}
              </button>
            </div>

            {/* High-Level Executive Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Headcount */}
              <div className="bg-white dark:bg-zinc-950 p-5 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-violet-500/10 text-violet-600 border border-violet-500/20 rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Total Headcount</p>
                  <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-1">{totalEmployees}</h4>
                </div>
              </div>

              {/* Retention Rate */}
              <div className="bg-white dark:bg-zinc-950 p-5 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Retention Rate</p>
                  <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-1">{currentRetention.toFixed(1)}%</h4>
                </div>
              </div>

              {/* Total Costs */}
              <div className="bg-white dark:bg-zinc-950 p-5 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Total Salaries (YTD)</p>
                  <h4 className="text-md font-black text-zinc-900 dark:text-zinc-50 mt-1.5 truncate max-w-[150px]">{formatCurrency(totalPayrollCost)}</h4>
                </div>
              </div>

              {/* Training Average Post Score */}
              <div className="bg-white dark:bg-zinc-950 p-5 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded-xl">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Avg Training Post-Score</p>
                  <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-1">{avgTrainingPost} / 100</h4>
                </div>
              </div>
            </div>

            {/* Sub-tabs Selection Row */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-900 overflow-x-auto gap-2">
              {Object.keys(t.raw("analytics.tabs")).map((tabKey) => (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`py-2.5 px-4 text-xs font-black border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === tabKey
                      ? "border-primary text-primary"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  {t(`analytics.tabs.${tabKey}`)}
                </button>
              ))}
            </div>

            {/* Dashboard Display Area */}
            <div className="min-h-[400px]">
              
              {/* Tab 1: Workforce Demographics */}
              {activeTab === "workforce" && workforceData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gender Split */}
                  <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm">
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-550 mb-4 uppercase tracking-wider">
                      {t("analytics.genderDistribution")}
                    </h5>
                    <div className="h-[250px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={workforceData.gender || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {(workforceData.gender || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value} Employees`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Employment Status */}
                  <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm">
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-550 mb-4 uppercase tracking-wider">
                      {t("analytics.statusDistribution")}
                    </h5>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={workforceData.status || []}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                          >
                            {(workforceData.status || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value} Employees`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Age Distribution */}
                  <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm">
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-550 mb-4 uppercase tracking-wider">
                      {t("analytics.ageDistribution")}
                    </h5>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workforceData.age || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.1} />
                          <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                          <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip formatter={(value) => `${value} Staff`} />
                          <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Tenure Distribution */}
                  <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm">
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-550 mb-4 uppercase tracking-wider">
                      {t("analytics.tenureDistribution")}
                    </h5>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workforceData.tenure || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.1} />
                          <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                          <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip formatter={(value) => `${value} Staff`} />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Turnover & Retention */}
              {activeTab === "turnover" && (
                <div className="grid grid-cols-1 gap-6">
                  {/* Hired vs Terminated */}
                  <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm">
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-555 mb-4 uppercase tracking-wider">
                      {t("analytics.hiredVsTerminated")}
                    </h5>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={turnoverData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.1} />
                          <XAxis dataKey="month" stroke="#888888" fontSize={11} />
                          <YAxis stroke="#888888" fontSize={11} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="hired" name="Hired Staff" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="terminated" name="Terminated Staff" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Retention Line Chart */}
                  <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm">
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-555 mb-4 uppercase tracking-wider">
                      {t("analytics.retentionRate")}
                    </h5>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={retentionData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.1} />
                          <XAxis dataKey="month" stroke="#888888" fontSize={11} />
                          <YAxis stroke="#888888" fontSize={11} domain={[0, 100]} />
                          <Tooltip formatter={(value) => `${value}%`} />
                          <Line type="monotone" dataKey="retention_rate" name="Retention Rate (%)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Headcount Growth */}
              {activeTab === "headcount" && (
                <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm">
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-555 mb-4 uppercase tracking-wider">
                    {t("analytics.headcountGrowth")}
                  </h5>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={headcountData}>
                        <defs>
                          <linearGradient id="colorHeadcount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.1} />
                        <XAxis dataKey="month" stroke="#888888" fontSize={11} />
                        <YAxis stroke="#888888" fontSize={11} />
                        <Tooltip />
                        <Area type="monotone" dataKey="headcount" name="Employees Count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorHeadcount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 4: Financial Cost */}
              {activeTab === "cost" && (
                <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm">
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-555 mb-4 uppercase tracking-wider">
                    {t("analytics.costByDept")}
                  </h5>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={costData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.1} />
                        <XAxis type="number" stroke="#888888" fontSize={10} tickFormatter={(val) => `${val/1000000}M`} />
                        <YAxis dataKey="department" type="category" stroke="#888888" fontSize={11} width={80} />
                        <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                        <Bar dataKey="cost" name="Compensation Cost" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 5: Training Effectiveness */}
              {activeTab === "training" && (
                <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm">
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-555 mb-4 uppercase tracking-wider">
                    {t("analytics.trainingEffectiveness")}
                  </h5>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trainingData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.1} />
                        <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                        <YAxis stroke="#888888" fontSize={11} domain={[0, 100]} />
                        <Tooltip formatter={(value) => `${value} Points`} />
                        <Legend />
                        <Bar dataKey="pre_score" name="Pre-Test Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="post_score" name="Post-Test Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 6: Attendance & Leave tabular rekap */}
              {activeTab === "attendance" && (
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-zinc-150 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/10">
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">
                      Rekap Kehadiran ({startDate} s/d {endDate})
                    </h5>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-650 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-900">
                        <tr>
                          <th className="p-3.5">Employee Name</th>
                          <th className="p-3.5">Present Days</th>
                          <th className="p-3.5">Late Checks</th>
                          <th className="p-3.5">Overtime Hours</th>
                          <th className="p-3.5">Attendance Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-800 dark:text-zinc-300">
                        {attendanceData.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-zinc-500 font-medium select-none">
                              No attendance data within selected date range.
                            </td>
                          </tr>
                        ) : (
                          attendanceData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                              <td className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">{row.employee_name}</td>
                              <td className="p-3.5">{row.present_days} days</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded font-black ${row.late_checks > 0 ? "bg-amber-50 text-amber-705 dark:bg-amber-950/20 dark:text-amber-400" : ""}`}>
                                  {row.late_checks} times
                                </span>
                              </td>
                              <td className="p-3.5">{row.overtime_hours} hrs</td>
                              <td className="p-3.5 font-semibold text-primary">{row.attendance_rate}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 7: Leave Stats Tab */}
              {activeTab === "leave" && (
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-zinc-150 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/10">
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">
                      Rekap Saldo & Penggunaan Cuti (Tahun {selectedYear})
                    </h5>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-650 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-900">
                        <tr>
                          <th className="p-3.5">Employee Name</th>
                          <th className="p-3.5">Yearly Quota</th>
                          <th className="p-3.5">Approved Leave</th>
                          <th className="p-3.5">Pending Request</th>
                          <th className="p-3.5">Remaining Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-800 dark:text-zinc-300">
                        {leaveData.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-zinc-500 font-medium select-none">
                              No leave record data for year {selectedYear}.
                            </td>
                          </tr>
                        ) : (
                          leaveData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                              <td className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">{row.employee_name}</td>
                              <td className="p-3.5">{row.total_quota} days</td>
                              <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-semibold">{row.used_quota} days</td>
                              <td className="p-3.5 text-amber-600 dark:text-amber-400">{row.pending_quota} days</td>
                              <td className="p-3.5 font-semibold text-primary">{row.remaining_quota} days</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </main>
    </div>
  );
}
