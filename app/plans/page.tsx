"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/components/layout";

interface PlanItemData {
  content: string;
  completed: boolean;
}

interface DayPlan {
  id: number;
  date: string;
  items: PlanItemData[];
  note: string | null;
}

interface DayPlanWithCompletion extends DayPlan {
  completion: number;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPlans(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  // Build a map of date -> plan with computed completion
  const planMap = new Map<string, DayPlanWithCompletion>(
    plans.map((p) => {
      const completedCount = p.items.filter((i) => i.completed).length;
      const completion =
        p.items.length > 0 ? Math.round((completedCount / p.items.length) * 100) : 0;
      return [p.date, { ...p, completion }];
    })
  );

  // Generate calendar: last 60 days + next 14 days
  const days: { date: string; label: string; isToday: boolean; isPast: boolean; plan?: DayPlanWithCompletion }[] = [];
  const now = new Date();

  for (let i = -60; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const isToday = dateStr === today;
    const isPast = i < 0;

    days.push({
      date: dateStr,
      label: isToday
        ? "今天"
        : `${d.getMonth() + 1}/${d.getDate()}`,
      isToday,
      isPast,
      plan: planMap.get(dateStr),
    });
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">我的计划</h2>

        {/* Quick link to today */}
        <Link
          href={`/plans/${today}`}
          className="block bg-blue-600 text-white rounded-xl p-4 hover:bg-blue-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">今天 — {today}</p>
              <p className="text-sm text-blue-100 mt-0.5">
                {planMap.has(today) ? "点击查看 / 修改今日计划" : "点击写今天的计划"}
              </p>
            </div>
            <span className="text-2xl">{planMap.has(today) ? "📝" : "✏️"}</span>
          </div>
        </Link>

        {/* Calendar grid */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-700 mb-3">历史计划</h3>
          <div className="grid grid-cols-7 gap-1.5">
            {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
              <div key={d} className="text-center text-xs text-gray-400 py-1 font-medium">
                {d}
              </div>
            ))}
            {/* Fill empty cells for alignment with current day of week */}
            {(() => {
              const firstDay = days[0];
              const d = new Date(firstDay.date);
              const dayOfWeek = d.getDay(); // 0=Sun
              const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0
              return Array.from({ length: offset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ));
            })()}
            {days.filter((d) => d.isPast || d.isToday).map((day) => (
              <Link
                key={day.date}
                href={`/plans/${day.date}`}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center text-xs
                  border transition-colors
                  ${day.isToday
                    ? "border-blue-400 bg-blue-50 text-blue-700 font-semibold ring-2 ring-blue-200"
                    : "border-gray-100 hover:border-gray-300 text-gray-600"
                  }
                  ${day.plan
                    ? day.plan.completion >= 80
                      ? "bg-green-50"
                      : day.plan.completion > 0
                        ? "bg-yellow-50"
                        : "bg-gray-100"
                    : "bg-white"
                  }
                `}
              >
                <span>{day.label}</span>
                {day.plan && (
                  <span className="text-[10px] mt-0.5">{day.plan.completion}%</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
