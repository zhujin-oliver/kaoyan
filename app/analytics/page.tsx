"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout";

interface AnalyticsData {
  totalDays: number;
  avgCompletion: number;
  streakDays: number;
  completionDistribution: { label: string; count: number }[];
  recentTrend: { date: string; completion: number; itemCount: number }[];
  avgItemCount: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
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

  if (!data || data.totalDays === 0) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">还没有数据</p>
          <p className="text-gray-400 text-sm mt-1">先写一些计划再来看看吧 📊</p>
        </div>
      </Layout>
    );
  }

  const statsCards = [
    { label: "总打卡天数", value: data.totalDays, unit: "天", color: "bg-blue-50 text-blue-700" },
    { label: "平均完成度", value: data.avgCompletion, unit: "%", color: "bg-green-50 text-green-700" },
    { label: "连续打卡", value: data.streakDays, unit: "天", color: "bg-purple-50 text-purple-700" },
    { label: "平均每日项数", value: data.avgItemCount, unit: "项", color: "bg-orange-50 text-orange-700" },
  ];

  const maxCount = Math.max(...data.completionDistribution.map((d) => d.count), 1);
  const maxTrend = Math.max(...data.recentTrend.map((d) => d.completion), 1);

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">复盘分析</h2>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statsCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-xl p-4 ${card.color}`}
            >
              <p className="text-xs opacity-75">{card.label}</p>
              <p className="text-2xl font-bold mt-1">
                {card.value}
                <span className="text-sm font-normal ml-0.5">{card.unit}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Completion trend chart (SVG) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-700 mb-3">近30天完成趋势</h3>
          <div className="relative h-40">
            <svg
              viewBox={`0 0 ${data.recentTrend.length} 100`}
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1={0}
                  y1={100 - y}
                  x2={data.recentTrend.length}
                  y2={100 - y}
                  stroke="#f0f0f0"
                  strokeWidth="0.5"
                />
              ))}
              {/* Data line */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={data.recentTrend
                  .map((d, i) => `${i},${100 - d.completion}`)
                  .join(" ")}
              />
              {/* Area fill */}
              <polygon
                fill="url(#gradient)"
                points={`0,100 ${data.recentTrend
                  .map((d, i) => `${i},${100 - d.completion}`)
                  .join(" ")} ${data.recentTrend.length - 1},100`}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{data.recentTrend[0]?.date}</span>
            <span>{data.recentTrend[data.recentTrend.length - 1]?.date}</span>
          </div>
        </div>

        {/* Completion distribution bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-700 mb-3">完成度分布</h3>
          <div className="space-y-2">
            {data.completionDistribution.map((d) => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-16 text-right">{d.label}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all flex items-center justify-end pr-2"
                    style={{ width: `${(d.count / maxCount) * 100}%` }}
                  >
                    {d.count > 0 && (
                      <span className="text-[10px] text-white font-medium">{d.count}天</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
