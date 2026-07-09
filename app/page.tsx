"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import PlanCard from "@/components/plan-card";
import Link from "next/link";

interface TodayPlanItem {
  content: string;
  completed: boolean;
}

interface TodayPlan {
  id: number;
  userId: number;
  userName: string;
  items: TodayPlanItem[];
  completion: number;
  note: string | null;
}

interface TodayData {
  date: string;
  count: number;
  plans: TodayPlan[];
}

export default function HomePage() {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [todayRes, meRes] = await Promise.all([
          fetch("/api/plans/today"),
          fetch("/api/auth/me"),
        ]);
        const todayData = await todayRes.json();
        const meData = await meRes.json();

        setData(todayData);
        setCurrentUserId(meData.id ?? null);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">今日计划</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {data?.date} · {data?.count ?? 0} 位同学已打卡
            </p>
          </div>
          <Link
            href={`/plans/${new Date().toISOString().slice(0, 10)}`}
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            ✏️ 写计划
          </Link>
        </div>

        {/* Plans grid */}
        {data && data.plans.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.plans.map((p) => (
              <PlanCard
                key={p.id}
                userName={p.userName}
                items={p.items}
                completion={p.completion}
                note={p.note}
                isOwn={p.userId === currentUserId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400 text-lg">今天还没有人写计划</p>
            <p className="text-gray-400 text-sm mt-1">快来写下第一个计划吧 🎯</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
