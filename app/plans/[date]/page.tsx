"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/layout";

interface PlanItem {
  id?: number;
  content: string;
  completed: boolean;
}

export default function PlanEditPage() {
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;

  const [items, setItems] = useState<PlanItem[]>([{ content: "", completed: false }]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const isPast = date < today;
  const isFuture = date > today;
  const isToday = date === today;

  const loadPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/plans?date=${date}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].items?.length > 0) {
        setItems(data[0].items.map((i: PlanItem) => ({ content: i.content, completed: i.completed })));
        setNote(data[0].note ?? "");
      } else {
        setItems([{ content: "", completed: false }]);
        setNote("");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    setItems([{ content: "", completed: false }]);
    setNote("");
    setLoading(true);
    setMessage("");
    loadPlan();
  }, [loadPlan]);

  function addItem() {
    setItems((prev) => [...prev, { content: "", completed: false }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: "content" | "completed", value: string | boolean) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  async function handleSave() {
    const validItems = items.filter((i) => i.content.trim());
    if (validItems.length === 0) {
      setMessage("至少添加一条计划内容");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          items: validItems.map((i) => ({ content: i.content.trim(), completed: i.completed })),
          note: note || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`保存成功 ✅ 完成度 ${data.completion}%`);
      } else {
        setMessage(data.error ?? "保存失败");
      }
    } catch {
      setMessage("网络错误");
    } finally {
      setSaving(false);
    }
  }

  function changeDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    router.push(`/plans/${d.toISOString().slice(0, 10)}`);
  }

  const completedCount = items.filter((i) => i.completed && i.content.trim()).length;
  const totalCount = items.filter((i) => i.content.trim()).length;
  const completion = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
      <div className="max-w-lg mx-auto space-y-5">
        {/* Date navigation */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-3">
          <button
            onClick={() => changeDate(-1)}
            className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
          >
            ← 前一天
          </button>
          <div className="text-center">
            <p className="font-semibold text-gray-900">{date}</p>
            {isToday && <p className="text-xs text-blue-500">今天</p>}
          </div>
          <button
            onClick={() => changeDate(1)}
            className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
          >
            后一天 →
          </button>
        </div>

        {/* Past date notice */}
        {isPast && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500">
            🔒 过去的计划不能修改（只读模式）
          </div>
        )}
        {isFuture && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-sm text-yellow-700">
            🔒 未来日期的计划仅自己可见
          </div>
        )}
        {isToday && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700">
            👀 今天的计划会公开显示给所有同学
          </div>
        )}

        {/* Plan items */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">学习计划</label>
              <span className="text-xs text-gray-400">
                {completedCount}/{totalCount} 项 · 完成度 {completion}%
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    disabled={isPast}
                    onChange={(e) => updateItem(index, "completed", e.target.checked)}
                    className="mt-2.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={item.content}
                      disabled={isPast}
                      onChange={(e) => updateItem(index, "content", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItem();
                        }
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isPast
                          ? "bg-gray-50 border-gray-200 text-gray-400"
                          : "border-gray-300"
                      }`}
                      placeholder={index === 0 ? "例如：背50个单词" : "继续添加..."}
                    />
                  </div>
                  {!isPast && items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="mt-1.5 text-gray-300 hover:text-red-400 text-lg leading-none px-1"
                      title="删除此项"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!isPast && (
              <button
                onClick={addItem}
                className="mt-3 w-full border-2 border-dashed border-gray-200 rounded-lg py-2 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
              >
                + 添加一项
              </button>
            )}
          </div>

          {/* Note */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注 / 反思
            </label>
            <textarea
              value={note}
              disabled={isPast}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y ${
                isPast ? "bg-gray-50 border-gray-200 text-gray-400" : "border-gray-300"
              }`}
              placeholder="有什么想记录的？遇到的困难，明天怎么改进..."
            />
          </div>

          {message && (
            <div
              className={`text-sm rounded-lg px-3 py-2 ${
                message.includes("成功") || message.includes("✅")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message}
            </div>
          )}

          {!isPast && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "保存中..." : "保存计划"}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
