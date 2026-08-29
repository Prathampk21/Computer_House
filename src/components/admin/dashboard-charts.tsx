"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  dealerPerformance,
  leadSources,
  leadsOverTime,
} from "@/features/analytics/demo";

const colors = ["#0f766e", "#f59e0b", "#2563eb", "#64748b"];

export function AdminDashboardCharts() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-4">
          <h2 className="font-semibold text-slate-950">Leads and sales</h2>
          <p className="text-sm text-muted-foreground">
            Qualified leads and confirmed conversions over time.
          </p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={leadsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="#0f766e"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#f59e0b"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-4">
          <h2 className="font-semibold text-slate-950">Lead sources</h2>
          <p className="text-sm text-muted-foreground">
            Click metrics remain separate from qualified leads.
          </p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={leadSources}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={92}
                paddingAngle={3}
              >
                {leadSources.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-lg border bg-white p-4 xl:col-span-2">
        <div className="mb-4">
          <h2 className="font-semibold text-slate-950">Top dealers</h2>
          <p className="text-sm text-muted-foreground">
            Referral clicks, meaningful leads, and won sales by dealer.
          </p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dealerPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Bar dataKey="clicks" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="leads" fill="#0f766e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sales" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
