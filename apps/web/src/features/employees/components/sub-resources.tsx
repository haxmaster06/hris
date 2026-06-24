"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Plus, Trash2, Loader2, Calendar, BookOpen, Briefcase, Users2 } from "lucide-react";

interface SubSectionProps {
  employeeId: string;
}

// ==========================================
// 1. FAMILY SECTION
// ==========================================
export function FamilySection({ employeeId }: SubSectionProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: "", relationship: "spouse", phone: "" });

  const { data: familyMembers, isLoading } = useQuery({
    queryKey: ["employee-family", employeeId],
    queryFn: () => api.get(`/employees/${employeeId}/family`).then((res) => res.data.data?.data || res.data.data || []),
  });

  const addMutation = useMutation({
    mutationFn: (newMember: typeof formData) => api.post(`/employees/${employeeId}/family`, newMember),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-family", employeeId] });
      toast.success("Family member added");
      setFormData({ name: "", relationship: "spouse", phone: "" });
      setIsAdding(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add member"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${employeeId}/family/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-family", employeeId] });
      toast.success("Family member removed");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to delete member"),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-3">
        <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <Users2 className="h-5 w-5 text-zinc-500" />
          Family Members
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 py-1 px-3 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <Plus className="h-3.5 w-3.5" /> Add Member
          </button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addMutation.mutate(formData);
          }}
          className="p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
        >
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:ring-1 focus:ring-zinc-950"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Relationship</label>
            <select
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:ring-1 focus:ring-zinc-950"
            >
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:ring-1 focus:ring-zinc-950"
              />
            </div>
            <button
              type="submit"
              className="py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 h-[38px]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="py-2 px-3 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 h-[38px]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      ) : familyMembers.length === 0 ? (
        <p className="text-xs text-zinc-500 italic">No family members registered.</p>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-900 font-medium">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Relationship</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-700 dark:text-zinc-300">
              {familyMembers.map((member: any) => (
                <tr key={member.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-2.5 font-semibold">{member.name}</td>
                  <td className="px-4 py-2.5 capitalize">{member.relationship}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{member.phone || "-"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(member.id)}
                      className="p-1 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. EDUCATION SECTION
// ==========================================
export function EducationSection({ employeeId }: SubSectionProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ institution_name: "", degree: "", field_of_study: "", graduation_year: "" });

  const { data: education, isLoading } = useQuery({
    queryKey: ["employee-education", employeeId],
    queryFn: () => api.get(`/employees/${employeeId}/education`).then((res) => res.data.data?.data || res.data.data || []),
  });

  const addMutation = useMutation({
    mutationFn: (newEdu: typeof formData) => api.post(`/employees/${employeeId}/education`, newEdu),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-education", employeeId] });
      toast.success("Education added");
      setFormData({ institution_name: "", degree: "", field_of_study: "", graduation_year: "" });
      setIsAdding(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add education"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${employeeId}/education/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-education", employeeId] });
      toast.success("Education removed");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to delete education"),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-3">
        <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-zinc-500" />
          Education
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 py-1 px-3 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <Plus className="h-3.5 w-3.5" /> Add Degree
          </button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addMutation.mutate(formData);
          }}
          className="p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Institution</label>
            <input
              type="text"
              required
              value={formData.institution_name}
              onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
              className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Degree</label>
            <input
              type="text"
              required
              placeholder="e.g. S1, Bachelor"
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Field of Study</label>
            <input
              type="text"
              required
              placeholder="Computer Science"
              value={formData.field_of_study}
              onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
              className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Graduation Year</label>
              <input
                type="number"
                required
                value={formData.graduation_year}
                onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm"
              />
            </div>
            <button
              type="submit"
              className="py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 h-[38px]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="py-2 px-3 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 h-[38px]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      ) : education.length === 0 ? (
        <p className="text-xs text-zinc-500 italic">No education recorded.</p>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-900 font-medium">
              <tr>
                <th className="px-4 py-2">Institution</th>
                <th className="px-4 py-2">Degree</th>
                <th className="px-4 py-2">Field</th>
                <th className="px-4 py-2">Year</th>
                <th className="px-4 py-2 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-700 dark:text-zinc-300">
              {education.map((edu: any) => (
                <tr key={edu.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-2.5 font-semibold">{edu.institution_name}</td>
                  <td className="px-4 py-2.5">{edu.degree}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{edu.field_of_study}</td>
                  <td className="px-4 py-2.5 text-zinc-550 font-medium">{edu.graduation_year}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(edu.id)}
                      className="p-1 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. EXPERIENCE SECTION
// ==========================================
export function ExperienceSection({ employeeId }: SubSectionProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ company_name: "", position: "", start_date: "", end_date: "", description: "" });

  const { data: experience, isLoading } = useQuery({
    queryKey: ["employee-experience", employeeId],
    queryFn: () => api.get(`/employees/${employeeId}/experience`).then((res) => res.data.data?.data || res.data.data || []),
  });

  const addMutation = useMutation({
    mutationFn: (newExp: typeof formData) => api.post(`/employees/${employeeId}/experience`, newExp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-experience", employeeId] });
      toast.success("Work experience added");
      setFormData({ company_name: "", position: "", start_date: "", end_date: "", description: "" });
      setIsAdding(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add experience"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${employeeId}/experience/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-experience", employeeId] });
      toast.success("Work experience removed");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to delete experience"),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-3">
        <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-zinc-500" />
          Work Experience
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 py-1 px-3 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <Plus className="h-3.5 w-3.5" /> Add Position
          </button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addMutation.mutate(formData);
          }}
          className="p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end"
        >
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Company Name</label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Role / Position</label>
            <input
              type="text"
              required
              placeholder="e.g. Sales Specialist"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Start Date</label>
            <input
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">End Date</label>
            <input
              type="date"
              required
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm"
            />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm"
            />
          </div>
          <div className="col-span-1 sm:col-span-2 flex justify-end gap-2">
            <button
              type="submit"
              className="py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90"
            >
              Save Experience
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="py-2 px-3 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      ) : experience.length === 0 ? (
        <p className="text-xs text-zinc-500 italic">No previous experience recorded.</p>
      ) : (
        <div className="space-y-4">
          {experience.map((exp: any) => (
            <div
              key={exp.id}
              className="flex justify-between items-start p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950"
            >
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {exp.position} at {exp.company_name}
                </h4>
                <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {exp.start_date} &mdash; {exp.end_date}
                </p>
                {exp.description && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 pt-1 leading-relaxed">
                    {exp.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteMutation.mutate(exp.id)}
                className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
