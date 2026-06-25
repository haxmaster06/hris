"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Loader2, GitMerge, User, ChevronDown, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";

interface Employee {
  id: string;
  first_name: string;
  last_name: string | null;
  employee_number: string;
  reports_to: string | null;
  status: string;
  photo_url: string | null;
  position?: { name: string };
  department?: { name: string };
}

export default function OrgChart() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const [draggedEmployeeId, setDraggedEmployeeId] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Fetch Employees with relations
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ["org-employees"],
    queryFn: async () => {
      const res = await api.get("/employees?include=supervisor,position,department");
      return res.data.data?.data || res.data.data || [];
    },
  });

  // Mutation to create and execute lifecycle event
  const mutateSupervisor = useMutation({
    mutationFn: async (payload: { employeeId: string; newSupervisorId: string | null }) => {
      // 1. Create Lifecycle Event mutation
      const createRes = await api.post("/lifecycle-events", {
        employee_id: payload.employeeId,
        event_type: "mutation",
        effective_date: new Date().toISOString().split("T")[0],
        reason: "Mutasi struktur organisasi via Org Chart Drag & Drop",
        status: "draft"
      });
      const eventId = createRes.data.data.id;

      // 2. Execute the event
      await api.post(`/lifecycle-events/${eventId}/execute`);
      
      // 3. Directly update employee's reports_to in DB (fallback if lifecycle event only updates core fields, 
      // but reports_to is a core field we added, LifecycleEventService updates reports_to? Let's check:
      // wait, LifecycleEventService updates reports_to? Let's make sure it does or we update it manually.
      // In LifecycleEventService we didn't add reports_to to employee update logic. Oh!
      // Let's check LifecycleEventService update logic: it updates position_id, department_id, branch_id, division_id, grade_id, status.
      // Wait, let's update reports_to on employee directly via PATCH/PUT to be safe, or we can update it in backend.
      // Let's directly call PUT to update supervisor)
      const emp = employeesData.find((e: Employee) => e.id === payload.employeeId);
      if (emp) {
        await api.put(`/employees/${payload.employeeId}`, {
          ...emp,
          company_id: emp.company_id || emp.company?.id,
          branch_id: emp.branch_id || emp.branch?.id,
          department_id: emp.department_id || emp.department?.id,
          position_id: emp.position_id || emp.position?.id,
          reports_to: payload.newSupervisorId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-employees"] });
      toast.success(t("common.updatedSuccess", { entity: "Struktur Organisasi" }) || "Struktur Organisasi berhasil diperbarui");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal memperbarui struktur organisasi");
    }
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedEmployeeId(id);
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetSupervisorId: string | null) => {
    e.preventDefault();
    const employeeId = e.dataTransfer.getData("text/plain") || draggedEmployeeId;
    if (!employeeId || employeeId === targetSupervisorId) return;

    // Check if dropping onto their own subordinate (creates loop)
    if (targetSupervisorId && isSubordinateRecursive(employeeId, targetSupervisorId)) {
      toast.error("Tidak dapat memindahkan atasan menjadi bawahan dari bawahannya sendiri!");
      return;
    }

    const employee = employeesData.find((e: Employee) => e.id === employeeId);
    const targetSupervisor = targetSupervisorId 
      ? employeesData.find((e: Employee) => e.id === targetSupervisorId)
      : null;

    const empName = `${employee?.first_name} ${employee?.last_name || ""}`;
    const targetName = targetSupervisor 
      ? `${targetSupervisor.first_name} ${targetSupervisor.last_name || ""}`
      : "Direksi (Root)";

    const confirmRes = await Swal.fire({
      title: "Konfirmasi Mutasi Struktur",
      text: `Apakah Anda yakin ingin memindahkan ${empName} agar melapor ke ${targetName}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Mutasi",
      cancelButtonText: "Batal",
      confirmButtonColor: "#000",
      background: document.documentElement.classList.contains("dark") ? "#18181b" : "#fff",
      color: document.documentElement.classList.contains("dark") ? "#fff" : "#000",
    });

    if (confirmRes.isConfirmed) {
      mutateSupervisor.mutate({ employeeId, newSupervisorId: targetSupervisorId });
    }

    setDraggedEmployeeId(null);
  };

  // Helper function to check circular dependency in organizational tree
  const isSubordinateRecursive = (parentSelectorId: string, potentialSubordinateId: string): boolean => {
    const subordinates = employeesData.filter((e: Employee) => e.reports_to === parentSelectorId);
    if (subordinates.some((s: Employee) => s.id === potentialSubordinateId)) {
      return true;
    }
    for (const sub of subordinates) {
      if (isSubordinateRecursive(sub.id, potentialSubordinateId)) {
        return true;
      }
    }
    return false;
  };

  const toggleCollapse = (id: string) => {
    setCollapsedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Build recursive organizational tree JSX
  const renderNode = (emp: Employee) => {
    const subordinates = employeesData.filter((e: Employee) => e.reports_to === emp.id);
    const hasSubordinates = subordinates.length > 0;
    const isCollapsed = collapsedNodes[emp.id];
    const isBeingDragged = draggedEmployeeId === emp.id;

    return (
      <div key={emp.id} className="flex flex-col items-center select-none">
        {/* Node Card */}
        <div 
          draggable
          onDragStart={(e) => handleDragStart(e, emp.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, emp.id)}
          className={`relative flex flex-col items-center w-52 p-4 border rounded-xl bg-white dark:bg-zinc-950 shadow-sm transition-all duration-200 ${
            isBeingDragged ? "opacity-40 scale-95 border-dashed" : "hover:shadow-md border-zinc-200 dark:border-zinc-900"
          }`}
        >
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full overflow-hidden mb-2 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
            {emp.photo_url ? (
              <img src={emp.photo_url} alt={emp.first_name} className="w-full h-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-zinc-400" />
            )}
          </div>

          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 text-center truncate w-full">
            {emp.first_name} {emp.last_name || ""}
          </h4>
          <p className="text-[11px] text-zinc-500 font-semibold mb-1">{emp.position?.name || "No Position"}</p>
          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-mono">{emp.department?.name || "-"}</p>

          {/* Collapse/Expand Toggle */}
          {hasSubordinates && (
            <button
              onClick={() => toggleCollapse(emp.id)}
              className="absolute -bottom-3 flex items-center justify-center w-6 h-6 border rounded-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 text-zinc-500 shadow-sm cursor-pointer"
            >
              {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>

        {/* Tree Line Connector */}
        {hasSubordinates && !isCollapsed && (
          <div className="w-0.5 h-8 bg-zinc-200 dark:bg-zinc-900 my-1"></div>
        )}

        {/* Subordinates Row */}
        {hasSubordinates && !isCollapsed && (
          <div className="relative flex gap-6 mt-1">
            {/* Horizontal Line Connector */}
            {subordinates.length > 1 && (
              <div className="absolute top-0 left-[104px] right-[104px] h-0.5 bg-zinc-200 dark:bg-zinc-900"></div>
            )}
            {subordinates.map((sub: Employee, index: number) => {
              const isFirst = index === 0;
              const isLast = index === subordinates.length - 1;
              return (
                <div key={sub.id} className="relative flex flex-col items-center">
                  {/* Vertical Line Connector (upper half) */}
                  {subordinates.length > 1 && (
                    <div className={`absolute top-0 w-0.5 h-4 bg-zinc-200 dark:bg-zinc-900 ${
                      isFirst ? "left-1/2" : isLast ? "right-1/2" : ""
                    }`}></div>
                  )}
                  {renderNode(sub)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  // Find root employees (anyone who does not report to anyone, or reports_to is not found in database)
  const allIds = Array.isArray(employeesData) ? employeesData.map((e: Employee) => e.id) : [];
  const rootEmployees = Array.isArray(employeesData)
    ? employeesData.filter((e: Employee) => !e.reports_to || !allIds.includes(e.reports_to))
    : [];

  return (
    <div className="space-y-6">
      {/* Legend & Instructions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50/50 dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl select-none">
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <GitMerge className="h-4 w-4 text-blue-500" />
            Bagan Organisasi Interaktif
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            Tarik (Drag) kartu karyawan dan letakkan (Drop) ke kartu karyawan lain untuk memindahkan struktur pelaporan.
          </p>
        </div>
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null)}
          className="px-4 py-2 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 text-xs text-zinc-500 font-semibold cursor-pointer"
        >
          Lepas disini untuk jadikan Direksi (Tanpa Atasan)
        </div>
      </div>

      {/* Visual Chart Area */}
      <div className="overflow-auto bg-zinc-50/20 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-8 min-h-[500px]">
        {rootEmployees.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-sm">Tidak ada struktur organisasi yang terdefinisi.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-12 items-center min-w-max p-4">
            {rootEmployees.map((root: Employee) => renderNode(root))}
          </div>
        )}
      </div>
    </div>
  );
}
