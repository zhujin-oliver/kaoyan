"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout";

interface RankingUser {
  id: number;
  name: string;
  totalDays: number;
  streakDays: number;
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ranking")
      .then((res) => res.json())
      .then(setRanking)
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

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">排行榜</h2>

        {ranking.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400 text-lg">还没有打卡数据</p>
            <p className="text-gray-400 text-sm mt-1">快去写计划吧 🏆</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-16">排名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">昵称</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">连续打卡</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">总打卡</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ranking.map((user, index) => {
                  const rank = index + 1;
                  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";

                  return (
                    <tr
                      key={user.id}
                      className={rank <= 3 ? "bg-yellow-50/30" : "hover:bg-gray-50"}
                    >
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-500">
                          {medal ? `${medal} ` : ""}{rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                          🔥 {user.streakDays} 天
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {user.totalDays} 天
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
