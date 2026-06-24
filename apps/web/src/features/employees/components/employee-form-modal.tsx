"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Loader2 } from "lucide-react";

export interface Employee {
  id?: string;
  user_id?: string | null;
  company_id: string;
  branch_id: string;
  department_id: string;
  position_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  gender: "male" | "female";
  birth_date: string;
  join_date: string;
  status: "probation" | "contract" | "permanent";
}

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEmployee: Employee | null;
}

export default function EmployeeFormModal({ isOpen, onClose, selectedEmployee }: EmployeeFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Employee>({
    user_id: "",
    company_id: "",
    branch_id: "",
    department_id: "",
    position_id: "",
    employee_number: "",
    first_name: "",
    last_name: "",
    gender: "male",
    birth_date: "",
    join_date: "",
    status: "permanent",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync selected employee for editing
  useEffect(() => {
    if (selectedEmployee) {
      setFormData({
        ...selectedEmployee,
        user_id: selectedEmployee.user_id || "",
        birth_date: selectedEmployee.birth_date ? selectedEmployee.birth_date.split("T")[0] : "",
        join_date: selectedEmployee.join_date ? selectedEmployee.join_date.split("T")[0] : "",
      });
    } else {
      setFormData({
        user_id: "",
        company_id: "",
        branch_id: "",
        department_id: "",
        position_id: "",
        employee_number: "",
        first_name: "",
        last_name: "",
        gender: "male",
        birth_date: "",
        join_date: "",
        status: "permanent",
      });
    }
  }, [selectedEmployee, isOpen]);

  // Fetch dropdown data
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: () => api.get("/users").then((res) => res.data.data?.data || res.data.data || []) });
  const { data: companies } = useQuery({ queryKey: ["companies"], queryFn: () => api.get("/companies").then((res) => res.data.data?.data || res.data.data || []) });
  const { data: branches } = useQuery({ queryKey: ["branches"], queryFn: () => api.get("/branches").then((res) => res.data.data?.data || res.data.data || []) });
  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: () => api.get("/departments").then((res) => res.data.data?.data || res.data.data || []) });
  const { data: positions } = useQuery({ queryKey: ["positions"], queryFn: () => api.get("/positions").then((res) => res.data.data?.data || res.data.data || []) });

  // Auto select default options if empty
  useEffect(() => {
    if (!selectedEmployee && isOpen) {
      setFormData((prev) => ({
        ...prev,
        company_id: prev.company_id || (companies?.[0]?.id || ""),
        branch_id: prev.branch_id || (branches?.[0]?.id || ""),
        department_id: prev.department_id || (departments?.[0]?.id || ""),
        position_id: prev.position_id || (positions?.[0]?.id || ""),
      }));
    }
  }, [companies, branches, departments, positions, selectedEmployee, isOpen]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (newEmp: Employee) => api.post("/employees", newEmp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee onboarded successfully");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to onboard employee");
      setIsSubmitting(false);
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (updated: { id: string; data: Employee }) => api.put(`/employees/${updated.id}`, updated.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee profile updated successfully");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update employee");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (selectedEmployee?.id) {
      updateMutation.mutate({ id: selectedEmployee.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6 my-8"
      >
        <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
          <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
            {selectedEmployee ? "Edit Employee Profile" : "Onboard New Employee"}
          </h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">&times;</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* First Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">First Name</label>
            <input
              type="text"
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="John"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-zinc-950"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Last Name</label>
            <input
              type="text"
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="Doe"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-zinc-950"
            />
          </div>

          {/* Employee Number */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Employee Number (NIP)</label>
            <input
              type="text"
              required
              value={formData.employee_number}
              onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
              placeholder="e.g. EMP-2026-001"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-zinc-950"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e: any) => setFormData({ ...formData, gender: e.target.value })}
              required
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-zinc-950"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Birth Date</label>
            <input
              type="date"
              required
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm"
            />
          </div>

          {/* Join Date */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Join Date</label>
            <input
              type="date"
              required
              value={formData.join_date}
              onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm"
            />
          </div>

          {/* User Account */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">User Account (Optional)</label>
            <select
              value={formData.user_id || ""}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value || null })}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-zinc-950"
            >
              <option value="">No linked user account</option>
              {users?.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Legal Entity (Entitas Legal)</label>
            <select
              value={formData.company_id}
              onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              required
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:ring-2"
            >
              {companies?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Branch</label>
            <select
              value={formData.branch_id}
              onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
              required
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:ring-2"
            >
              {branches?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Department</label>
            <select
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              required
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:ring-2"
            >
              {departments?.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Position</label>
            <select
              value={formData.position_id}
              onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
              required
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:ring-2"
            >
              {positions?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Employment Status</label>
            <select
              value={formData.status}
              onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
              required
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:ring-2"
            >
              <option value="probation">Probation</option>
              <option value="contract">Contract</option>
              <option value="permanent">Permanent</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-sm font-semibold hover:opacity-85"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/95 transition-colors disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {selectedEmployee ? "Update Profile" : "Onboard Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
