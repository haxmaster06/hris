"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  FolderLock, 
  UploadCloud, 
  Download, 
  Trash2, 
  Loader2, 
  FileSpreadsheet, 
  FileText,
  Clock,
  Calendar
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import { useTranslations } from "next-intl";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

interface DocumentCategory {
  id: string;
  name: string;
  code: string;
}

interface DocumentItem {
  id: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  expiry_date: string | null;
  document_type: string | null;
  versions?: Array<{
    id: string;
    version_number: number;
    file_path: string;
    file_size: number;
    notes?: string;
    created_at: string;
  }>;
  category?: { name: string };
  signed_url?: string;
  storage_path: string;
}

export default function DocumentsReportsPage() {
  const t = useTranslations("documents");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");

  // Document Form Upload State
  const [docCategoryId, setDocCategoryId] = useState("");
  const [docType, setDocType] = useState("other");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  // Reports Form State
  const [empReportStatus, setEmpReportStatus] = useState("");
  const [empReportDept, setEmpReportDept] = useState("");
  const [isEmpReportLoading, setIsEmpReportLoading] = useState(false);

  const [attReportStart, setAttReportStart] = useState("");
  const [attReportEnd, setAttReportEnd] = useState("");
  const [isAttReportLoading, setIsAttReportLoading] = useState(false);

  const [leaveReportYear, setLeaveReportYear] = useState(new Date().getFullYear().toString());
  const [isLeaveReportLoading, setIsLeaveReportLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router, mounted]);

  // Fetch Employees for selector
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => api.get("/employees").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  // Set default employee
  useEffect(() => {
    if (employees && employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].id);
    }
  }, [employees, selectedEmpId]);

  // Fetch Document Categories
  const { data: categories } = useQuery<DocumentCategory[]>({
    queryKey: ["document-categories"],
    queryFn: () => api.get("/document-categories").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  // Set default category
  useEffect(() => {
    if (categories && categories.length > 0 && !docCategoryId) {
      setDocCategoryId(categories[0].id);
    }
  }, [categories, docCategoryId]);

  // Fetch Documents for selected employee
  const { data: documents, isLoading: isLoadingDocs } = useQuery<DocumentItem[]>({
    queryKey: ["employee-documents", selectedEmpId],
    queryFn: () => api.get(`/employees/${selectedEmpId}/documents`).then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && !!selectedEmpId,
  });

  // Fetch Departments for filter
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  // Delete Document Mutation
  const deleteDocMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents", selectedEmpId] });
      toast.success(t("toast.deleteSuccess"));
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t("toast.deleteFailed")),
  });

  if (!mounted || !isAuthenticated) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return toast.error(t("toast.chooseFileError"));
    if (!selectedEmpId) return toast.error(t("toast.selectEmployeeError"));

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("document_category_id", docCategoryId);
    if (expiryDate) {
      formData.append("expiry_date", expiryDate);
    }
    if (docType) {
      formData.append("document_type", docType);
    }

    try {
      await api.post(`/employees/${selectedEmpId}/documents`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success(t("toast.uploadSuccess"));
      setSelectedFile(null);
      setExpiryDate("");
      setDocType("other");
      queryClient.invalidateQueries({ queryKey: ["employee-documents", selectedEmpId] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("toast.uploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  // Reusable CSV conversion and download handler
  const triggerCSVDownload = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.warning(t("toast.noDataExport"));
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(fieldName => {
          let val = row[fieldName];
          if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          }
          const stringVal = String(val ?? '');
          return `"${stringVal.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t("toast.exportSuccess", { filename }));
  };

  // Export Employee Report
  const handleExportEmployees = async () => {
    setIsEmpReportLoading(true);
    try {
      const res = await api.get(`/reports/employees`, {
        params: {
          status: empReportStatus || undefined,
          department_id: empReportDept || undefined,
          export: true,
        }
      });
      const data = res.data.data?.data || res.data.data || [];
      triggerCSVDownload(data, `employee_report_${Date.now()}.csv`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("toast.exportFailed"));
    } finally {
      setIsEmpReportLoading(false);
    }
  };

  // Export Attendance Report
  const handleExportAttendance = async () => {
    if (!attReportStart || !attReportEnd) {
      return toast.error(t("toast.dateRequiredError"));
    }
    setIsAttReportLoading(true);
    try {
      const res = await api.get(`/reports/attendance`, {
        params: {
          start_date: attReportStart,
          end_date: attReportEnd,
          employee_id: selectedEmpId || undefined,
        }
      });
      const data = res.data.data || [];
      // Flatten attendance log summary for clean CSV
      const flattened = data.map((item: any) => ({
        employee_id: item.employee_id,
        employee_number: item.employee_number,
        employee_name: item.employee_name,
        department: item.department,
        present: item.summary?.present,
        late: item.summary?.late,
        early_leave: item.summary?.early_leave,
        absent: item.summary?.absent,
        total_days_logged: item.summary?.total_days_logged,
        total_work_hours: item.summary?.total_work_hours,
      }));
      triggerCSVDownload(flattened, `attendance_report_${attReportStart}_to_${attReportEnd}.csv`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("toast.exportFailed"));
    } finally {
      setIsAttReportLoading(false);
    }
  };

  // Export Leave Report
  const handleExportLeave = async () => {
    if (!leaveReportYear) {
      return toast.error(t("toast.yearRequiredError"));
    }
    setIsLeaveReportLoading(true);
    try {
      const res = await api.get(`/reports/leave`, {
        params: {
          year: leaveReportYear,
          employee_id: selectedEmpId || undefined,
        }
      });
      const data = res.data.data || [];
      // Flatten balances for clean CSV
      const flattened: any[] = [];
      data.forEach((item: any) => {
        item.balances?.forEach((bal: any) => {
          flattened.push({
            employee_name: item.employee_name,
            employee_number: item.employee_number,
            leave_type: bal.leave_type,
            allocated_days: bal.allocated,
            used_days: bal.used,
            remaining_days: bal.remaining,
            pending_requests: item.requests_summary?.pending,
            approved_requests: item.requests_summary?.approved,
          });
        });
      });
      triggerCSVDownload(flattened, `leave_report_${leaveReportYear}.csv`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("toast.exportFailed"));
    } finally {
      setIsLeaveReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header 
        title={t("pageTitle")} 
        subtitle={t("subtitle")}
        backUrl="/dashboard"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Context Selector Card */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 shadow-sm text-zinc-900 dark:text-zinc-100">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t("activeEmployeeFilter")}</span>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold focus:outline-none"
          >
            {employees?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name} ({emp.employee_number})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sisi Kiri: Document Vault */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-md font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <FolderLock className="h-5 w-5 text-zinc-500" />
              {t("vaultTitle")}
            </h3>

            {/* Document Upload Form */}
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{t("category")}</label>
                  <select
                    value={docCategoryId}
                    onChange={(e) => setDocCategoryId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none"
                  >
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name} ({cat.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Doc Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none"
                  >
                    <option value="ktp">KTP / ID Card</option>
                    <option value="npwp">NPWP / Tax Card</option>
                    <option value="contract">Employment Contract</option>
                    <option value="certificate">Certification</option>
                    <option value="transcript">Academic Transcript</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{t("expiryDate")}</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm"
                  />
                </div>
              </div>

              {/* Drag/Drop File Input Area */}
              <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-xl p-6 text-center cursor-pointer transition-colors relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <UploadCloud className="h-10 w-10 text-zinc-400 mx-auto" />
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {selectedFile ? selectedFile.name : t("dragDropHint")}
                  </p>
                  <p className="text-[10px] text-zinc-400">{t("fileLimitHint")}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 py-2 px-5 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("uploadButton")}
                </button>
              </div>
            </form>
          </div>

          {/* Uploaded Documents List */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{t("vaultedFiles")}</h4>
            {isLoadingDocs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : !documents || documents.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">{t("noFiles")}</p>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const isExpiringSoon = doc.expiry_date && (new Date(doc.expiry_date).getTime() - new Date().getTime()) < 30 * 24 * 60 * 60 * 1000;
                  const isExpired = doc.expiry_date && new Date(doc.expiry_date).getTime() < new Date().getTime();

                  return (
                    <div 
                      key={doc.id}
                      className="border border-zinc-150 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors p-3 space-y-2.5"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 max-w-[200px] truncate" title={doc.original_name}>
                              {doc.original_name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] uppercase bg-zinc-100 dark:bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded font-medium">
                                {doc.document_type || "Other"}
                              </span>
                              <span className="text-[9px] text-zinc-400 uppercase font-medium">
                                {doc.category?.name || "General"} &bull; {(doc.file_size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {doc.expiry_date && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isExpired 
                                ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                                : isExpiringSoon
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                                : "bg-zinc-100 text-zinc-500"
                            }`}>
                              <Clock className="h-3 w-3" />
                              {isExpired ? "Expired" : isExpiringSoon ? "Expiring Soon" : `Expires: ${new Date(doc.expiry_date).toLocaleDateString()}`}
                            </span>
                          )}
                          {doc.signed_url && (
                            <a
                              href={doc.signed_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                              title={t("downloadTooltip")}
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => deleteDocMutation.mutate(doc.id)}
                            className="p-1.5 rounded-md text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20"
                            title={t("deleteTooltip")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Versions History expander */}
                      {doc.versions && doc.versions.length > 0 && (
                        <div className="border-t border-zinc-200/50 dark:border-zinc-900/50 pt-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setExpandedDocId(expandedDocId === doc.id ? null : doc.id)}
                            className="text-blue-500 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {expandedDocId === doc.id ? "Hide version history" : `Show versions (${doc.versions.length})`}
                          </button>

                          {expandedDocId === doc.id && (
                            <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-zinc-200 dark:border-zinc-800">
                              {doc.versions.map((ver) => (
                                <div key={ver.id} className="flex justify-between text-zinc-500">
                                  <span>v{ver.version_number} &bull; {(ver.file_size / 1024).toFixed(1)} KB</span>
                                  <span>{new Date(ver.created_at).toLocaleDateString()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sisi Kanan: Reporting Hub */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-md font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-zinc-500" />
              {t("reportCenterTitle")}
            </h3>

            {/* 1. Employee Report Card */}
            <div className="p-4 border border-zinc-150 dark:border-zinc-900 rounded-xl space-y-4 bg-zinc-50/50 dark:bg-zinc-900/10">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">{t("empReportTitle")}</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={empReportStatus}
                  onChange={(e) => setEmpReportStatus(e.target.value)}
                  className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                >
                  <option value="">{tCommon("allStatuses")}</option>
                  <option value="probation">{tCommon("probation") || "probation"}</option>
                  <option value="contract">{tCommon("contract") || "contract"}</option>
                  <option value="permanent">{tCommon("permanent") || "permanent"}</option>
                </select>
                <select
                  value={empReportDept}
                  onChange={(e) => setEmpReportDept(e.target.value)}
                  className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                >
                  <option value="">{tCommon("allDepartments")}</option>
                  {departments?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleExportEmployees}
                disabled={isEmpReportLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {isEmpReportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {t("exportEmpButton")}
              </button>
            </div>

            {/* 2. Attendance Summary Report Card */}
            <div className="p-4 border border-zinc-150 dark:border-zinc-900 rounded-xl space-y-4 bg-zinc-50/50 dark:bg-zinc-900/10">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">{t("attendanceReportTitle")}</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">{t("startDate")}</label>
                  <input
                    type="date"
                    required
                    value={attReportStart}
                    onChange={(e) => setAttReportStart(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">{t("endDate")}</label>
                  <input
                    type="date"
                    required
                    value={attReportEnd}
                    onChange={(e) => setAttReportEnd(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleExportAttendance}
                disabled={isAttReportLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {isAttReportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {t("exportAttButton")}
              </button>
            </div>

            {/* 3. Leave Balance Summary Report Card */}
            <div className="p-4 border border-zinc-150 dark:border-zinc-900 rounded-xl space-y-4 bg-zinc-50/50 dark:bg-zinc-900/10">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">{t("leaveReportTitle")}</h4>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] text-zinc-500">{t("targetYear")}</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2026"
                  value={leaveReportYear}
                  onChange={(e) => setLeaveReportYear(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                />
              </div>
              <button
                onClick={handleExportLeave}
                disabled={isLeaveReportLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {isLeaveReportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {t("exportLeaveButton")}
              </button>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
