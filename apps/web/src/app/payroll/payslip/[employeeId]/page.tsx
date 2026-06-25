"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { ArrowLeft, Printer, Landmark, ShieldCheck, Mail } from "lucide-react";
import Link from "next/link";

interface PayslipDetail {
  id: string;
  basic_salary: number;
  total_earnings: number;
  total_deductions: number;
  gross_salary: number;
  tax_amount: number;
  bpjs_tk_employee: number;
  bpjs_tk_company: number;
  bpjs_kes_employee: number;
  bpjs_kes_company: number;
  net_salary: number;
  take_home_pay: number;
  tax_method: string;
  employee?: { first_name: string; last_name: string | null; employee_code: string };
  payroll_period?: { name: string; start_date: string; end_date: string };
  details: {
    id: string;
    component_name: string;
    type: "earning" | "deduction";
    amount: number;
    notes: string | null;
  }[];
}

export default function PayslipDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  const employeeId = params.employeeId as string;
  const periodId = searchParams.get("period_id");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch Payslip Data
  const { data: payslip, isLoading, error } = useQuery<PayslipDetail>({
    queryKey: ["employee-payslip", employeeId, periodId],
    queryFn: async () => {
      const res = await api.get(`/payslips/${employeeId}?period_id=${periodId}`);
      return res.data.data;
    },
    enabled: isAuthenticated && !!employeeId && !!periodId,
  });

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const formatCurrency = (val: any) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  if (!mounted || !isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex items-center justify-center">
        <p className="text-sm text-zinc-500">Memuat slip gaji...</p>
      </div>
    );
  }

  if (error || !payslip) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex flex-col items-center justify-center space-y-4">
        <p className="text-sm text-red-500 font-semibold">Gagal memuat slip gaji atau data tidak ditemukan.</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 py-2 px-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
      </div>
    );
  }

  const earnings = payslip.details.filter((d) => d.type === "earning");
  const deductions = payslip.details.filter((d) => d.type === "deduction");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16 print:bg-white print:pb-0">
      {/* Header, hidden on print */}
      <div className="print:hidden">
        <Header
          title="Slip Gaji Karyawan"
          subtitle="Tinjauan resmi pendapatan dan potongan gaji bersih periode berjalan."
          backUrl={`/payroll/periods`}
        />
      </div>

      <main className="max-w-3xl mx-auto px-6 mt-8 space-y-6 print:mt-0 print:px-0">
        {/* Action bar, hidden on print */}
        <div className="flex justify-between items-center print:hidden">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 py-2 px-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm select-none cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 shadow-sm cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Cetak Slip Gaji
          </button>
        </div>

        {/* Payslip Document Box */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-8 shadow-sm space-y-8 print:border-0 print:shadow-none print:p-0">
          {/* Company Title & Document Title */}
          <div className="flex justify-between items-start border-b pb-6 border-zinc-150 dark:border-zinc-900">
            <div>
              <h1 className="text-xl font-black text-zinc-955 dark:text-zinc-50 tracking-tight">HBM CORP.</h1>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">PLATFORM HRIS INTEGRASI</p>
            </div>
            <div className="text-right">
              <h2 className="text-base font-extrabold text-zinc-950 dark:text-zinc-50">SLIP GAJI RESMI</h2>
              <p className="text-[11px] text-zinc-550 dark:text-zinc-400 mt-1 font-semibold">{payslip.payroll_period?.name}</p>
            </div>
          </div>

          {/* Employee Metadata */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <p className="text-zinc-450 dark:text-zinc-500 font-medium">Nama Karyawan</p>
              <p className="font-bold text-zinc-950 dark:text-zinc-50">{payslip.employee?.first_name} {payslip.employee?.last_name || ""}</p>
              <p className="text-[10px] text-zinc-500 font-mono">ID Karyawan: {payslip.employee?.employee_code}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-zinc-450 dark:text-zinc-500 font-medium">Metode PPh 21</p>
              <p className="font-bold text-zinc-900 dark:text-zinc-100 uppercase">{payslip.tax_method}</p>
              <p className="text-[10px] text-zinc-400">Periode: {payslip.payroll_period?.start_date} s/d {payslip.payroll_period?.end_date}</p>
            </div>
          </div>

          {/* Earnings & Deductions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-b py-6 border-zinc-150 dark:border-zinc-900">
            {/* Earnings (Pendapatan) */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-wider">PENDAPATAN (EARNINGS)</h3>
              <div className="space-y-2 text-xs">
                {/* Basic Salary */}
                <div className="flex justify-between items-center">
                  <span className="text-zinc-650 dark:text-zinc-400">Gaji Pokok</span>
                  <span className="font-semibold font-mono text-zinc-950 dark:text-zinc-50">{formatCurrency(payslip.basic_salary)}</span>
                </div>
                {/* Other Earnings */}
                {earnings.map((e) => (
                  <div key={e.id} className="flex justify-between items-center">
                    <span className="text-zinc-650 dark:text-zinc-400">{e.component_name}</span>
                    <span className="font-semibold font-mono text-zinc-950 dark:text-zinc-50">{formatCurrency(e.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Deductions (Potongan) */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-red-600 dark:text-red-450 uppercase tracking-wider">POTONGAN (DEDUCTIONS)</h3>
              <div className="space-y-2 text-xs">
                {/* BPJS Ketenagakerjaan */}
                {Number(payslip.bpjs_tk_employee) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-650 dark:text-zinc-400">BPJS Ketenagakerjaan (Karyawan)</span>
                    <span className="font-semibold font-mono text-zinc-950 dark:text-zinc-50">{formatCurrency(payslip.bpjs_tk_employee)}</span>
                  </div>
                )}
                {/* BPJS Kesehatan */}
                {Number(payslip.bpjs_kes_employee) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-650 dark:text-zinc-400">BPJS Kesehatan (Karyawan)</span>
                    <span className="font-semibold font-mono text-zinc-950 dark:text-zinc-50">{formatCurrency(payslip.bpjs_kes_employee)}</span>
                  </div>
                )}
                {/* Tax (PPh 21) */}
                {Number(payslip.tax_amount) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-650 dark:text-zinc-400">Pajak Penghasilan (PPh 21)</span>
                    <span className="font-semibold font-mono text-zinc-950 dark:text-zinc-50">{formatCurrency(payslip.tax_amount)}</span>
                  </div>
                )}
                {/* Other Deductions */}
                {deductions.map((d) => (
                  <div key={d.id} className="flex justify-between items-center">
                    <span className="text-zinc-650 dark:text-zinc-400">{d.component_name}</span>
                    <span className="font-semibold font-mono text-zinc-950 dark:text-zinc-50">{formatCurrency(d.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary totals */}
          <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Total Pendapatan Kotor (Gross)</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200">{formatCurrency(payslip.gross_salary)}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Total Potongan & BPJS/Pajak</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200">
                -{formatCurrency(
                  Number(payslip.total_deductions) +
                  Number(payslip.bpjs_tk_employee) +
                  Number(payslip.bpjs_kes_employee) +
                  Number(payslip.tax_amount)
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-3 border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-950 dark:text-zinc-50">Sisa Gaji Diterima (Take Home Pay)</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-450">{formatCurrency(payslip.take_home_pay)}</span>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="flex justify-between items-end pt-4 text-[9px] text-zinc-450 dark:text-zinc-500 font-mono">
            <div>
              <p>Slip gaji ini dihasilkan secara elektronik oleh sistem Nexus HR.</p>
              <p>HBM Corp. menyatakan dokumen ini sah dan tidak memerlukan tanda tangan basah.</p>
            </div>
            <div className="text-right">
              <p>Dicetak pada: {new Date().toLocaleDateString("id-ID")}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
