"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Loader2, Calendar, Award, GitPullRequest, ArrowDown, UserCheck, ShieldX, UserMinus, FileText } from "lucide-react";

interface TimelineProps {
  employeeId: string;
}

interface LifecycleEvent {
  id: string;
  event_type: string;
  effective_date: string;
  reason: string | null;
  notes: string | null;
  status: string;
  from_position?: { name: string };
  to_position?: { name: string };
  from_department?: { name: string };
  to_department?: { name: string };
  from_branch?: { name: string };
  to_branch?: { name: string };
}

export default function EmployeeTimeline({ employeeId }: TimelineProps) {
  const t = useTranslations();

  const { data: events, isLoading } = useQuery({
    queryKey: ["employee-lifecycle-timeline", employeeId],
    queryFn: async () => {
      const res = await api.get(
        `/lifecycle-events?employee_id=${employeeId}&include=fromPosition,toPosition,fromDepartment,toDepartment,fromBranch,toBranch`
      );
      return res.data.data?.data || res.data.data || [];
    },
    enabled: !!employeeId,
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case "promotion":
        return <Award className="h-4.5 w-4.5 text-amber-500" />;
      case "mutation":
        return <GitPullRequest className="h-4.5 w-4.5 text-blue-500" />;
      case "demotion":
        return <ArrowDown className="h-4.5 w-4.5 text-red-500" />;
      case "status_change":
      case "contract_renewal":
        return <UserCheck className="h-4.5 w-4.5 text-green-500" />;
      case "resignation":
      case "retirement":
        return <UserMinus className="h-4.5 w-4.5 text-zinc-550" />;
      case "termination":
        return <ShieldX className="h-4.5 w-4.5 text-red-650" />;
      default:
        return <FileText className="h-4.5 w-4.5 text-zinc-400" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "promotion":
        return "Promosi";
      case "mutation":
        return "Mutasi";
      case "demotion":
        return "Demotion";
      case "status_change":
        return "Perubahan Status";
      case "contract_renewal":
        return "Pembaruan Kontrak";
      case "resignation":
        return "Resign / Resignation";
      case "retirement":
        return "Pensiun";
      case "termination":
        return "PHK / Pemutusan Hubungan Kerja";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950/40 select-none">
        <p className="text-zinc-500 text-sm">Belum ada riwayat perubahan karir / timeline yang tercatat.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 mb-6 flex items-center gap-2">
        <Calendar className="h-4.5 w-4.5 text-zinc-500" />
        Karir & Riwayat Kerja Karyawan
      </h3>

      <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-4.5 pl-6 space-y-8 pb-4">
        {events.map((event: LifecycleEvent) => (
          <div key={event.id} className="relative">
            {/* Timeline Marker Icon */}
            <span className="absolute -left-10 top-1 flex items-center justify-center w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              {getEventIcon(event.event_type)}
            </span>

            {/* Event Details */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                  {getEventLabel(event.event_type)}
                </span>
                <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md self-start sm:self-auto">
                  Tanggal Efektif: {event.effective_date}
                </span>
              </div>

              {/* Career Changes details */}
              <div className="text-xs text-zinc-650 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-100 dark:border-zinc-900/60 rounded-xl p-4.5 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Position change */}
                  {event.to_position && event.from_position && (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-400">Jabatan</p>
                      <p className="font-semibold text-zinc-850 dark:text-zinc-200">
                        {event.from_position.name} &rarr; {event.to_position.name}
                      </p>
                    </div>
                  )}

                  {/* Department change */}
                  {event.to_department && event.from_department && (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-400">Departemen</p>
                      <p className="font-semibold text-zinc-850 dark:text-zinc-200">
                        {event.from_department.name} &rarr; {event.to_department.name}
                      </p>
                    </div>
                  )}

                  {/* Branch change */}
                  {event.to_branch && event.from_branch && (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-400">Cabang</p>
                      <p className="font-semibold text-zinc-850 dark:text-zinc-200">
                        {event.from_branch.name} &rarr; {event.to_branch.name}
                      </p>
                    </div>
                  )}
                </div>

                {event.reason && (
                  <div className="border-t border-zinc-100 dark:border-zinc-900/60 pt-3">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Alasan Perubahan</p>
                    <p className="text-zinc-650 dark:text-zinc-350 italic mt-0.5">&ldquo;{event.reason}&rdquo;</p>
                  </div>
                )}

                {event.notes && (
                  <div className="border-t border-zinc-100 dark:border-zinc-900/60 pt-3">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Catatan Tambahan</p>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">{event.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
