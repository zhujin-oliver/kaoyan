"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout";

// ---- Types ----

interface AdminUser {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  totalDays: number;
  streakDays: number;
  planCount: number;
}

// ---- Modal helpers ----

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---- Main page ----

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // Modal states
  const [addModal, setAddModal] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [resetPwUser, setResetPwUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [mergeUser, setMergeUser] = useState<AdminUser | null>(null); // source
  const [mergeTargetId, setMergeTargetId] = useState<number | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 401) { router.push("/login"); return; }
      if (res.status === 403) { router.push("/"); return; }
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((u) => { if (u.id) setCurrentUser(u); });
    fetchUsers();
  }, [fetchUsers]);

  function clearForm() {
    setFormName(""); setFormEmail(""); setFormPassword(""); setError(""); setSuccess("");
  }

  function closeAll() {
    setAddModal(false);
    setEditUser(null);
    setResetPwUser(null);
    setDeleteUser(null);
    setMergeUser(null);
    setMergeTargetId(null);
    clearForm();
  }

  // ---- Actions ----

  async function handleAdd() {
    setError(""); setSuccess("");
    if (!formName || !formEmail || !formPassword) { setError("请填写所有字段"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, email: formEmail, password: formPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("用户创建成功");
        fetchUsers();
        setTimeout(closeAll, 800);
      } else {
        setError(data.error ?? "创建失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit() {
    if (!editUser) return;
    setError(""); setSuccess("");
    if (!formName && !formEmail) { setError("请至少修改一个字段"); return; }
    setSubmitting(true);
    try {
      const body: Record<string, string> = {};
      if (formName) body.name = formName;
      if (formEmail) body.email = formEmail;
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("用户已更新");
        fetchUsers();
        setTimeout(closeAll, 800);
      } else {
        setError(data.error ?? "更新失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPw() {
    if (!resetPwUser) return;
    setError(""); setSuccess("");
    if (!formPassword || formPassword.length < 6) { setError("密码至少6位"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetPwUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("密码已重置");
        setTimeout(closeAll, 800);
      } else {
        setError(data.error ?? "重置失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteUser) return;
    setError(""); setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteUser.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message ?? "已删除");
        fetchUsers();
        setTimeout(closeAll, 800);
      } else {
        setError(data.error ?? "删除失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMerge() {
    if (!mergeUser || !mergeTargetId) return;
    setError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUserId: mergeUser.id, targetUserId: mergeTargetId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message ?? "合并完成");
        fetchUsers();
        setTimeout(closeAll, 1200);
      } else {
        setError(data.error ?? "合并失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Render ----

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
            <h2 className="text-xl font-bold text-gray-900">管理员面板</h2>
            <p className="text-sm text-gray-500 mt-0.5">{users.length} 位用户</p>
          </div>
          <button
            onClick={() => { clearForm(); setAddModal(true); }}
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            ＋ 添加成员
          </button>
        </div>

        {/* User table */}
        {users.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400 text-lg">还没有用户</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">昵称</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap hidden md:table-cell">邮箱</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500 whitespace-nowrap">总打卡</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500 whitespace-nowrap">连续</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500 whitespace-nowrap hidden sm:table-cell">注册时间</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">
                        {u.name}
                        {u.isAdmin && (
                          <span className="ml-1.5 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">管理员</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.email}</td>
                    <td className="px-3 py-3 text-center text-gray-700">{u.totalDays} 天</td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700">
                        🔥 {u.streakDays}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-gray-500 hidden sm:table-cell">
                      {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditUser(u); setFormName(u.name); setFormEmail(u.email); clearForm();
                          }}
                          className="p-1.5 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="编辑"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => { setResetPwUser(u); setFormPassword(""); clearForm(); }}
                          className="p-1.5 rounded text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="重置密码"
                        >
                          🔑
                        </button>
                        {u.id !== currentUser?.id && (
                          <>
                            <button
                              onClick={() => { setDeleteUser(u); clearForm(); }}
                              className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="删除"
                            >
                              🗑️
                            </button>
                            <button
                              onClick={() => { setMergeUser(u); setMergeTargetId(null); clearForm(); }}
                              className="p-1.5 rounded text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                              title="合并到其他用户"
                            >
                              🔀
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====== Modals ====== */}

      {/* Add user modal */}
      {addModal && (
        <Modal title="添加成员" onClose={closeAll}>
          <div className="space-y-3">
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="昵称"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="邮箱"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
            />
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="密码（至少6位）"
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={closeAll} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "创建中..." : "创建"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit user modal */}
      {editUser && (
        <Modal title={`编辑用户: ${editUser.name}`} onClose={closeAll}>
          <div className="space-y-3">
            <label className="block text-sm text-gray-600">昵称</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <label className="block text-sm text-gray-600">邮箱</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={closeAll} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
              <button
                onClick={handleEdit}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset password modal */}
      {resetPwUser && (
        <Modal title={`重置密码: ${resetPwUser.name}`} onClose={closeAll}>
          <div className="space-y-3">
            <label className="block text-sm text-gray-600">新密码（至少6位）</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="输入新密码"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={closeAll} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
              <button
                onClick={handleResetPw}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {submitting ? "重置中..." : "重置密码"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deleteUser && (
        <Modal title="确认删除" onClose={closeAll}>
          <div className="space-y-3">
            <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700">
              <p className="font-medium">⚠️ 此操作不可逆</p>
              <p className="mt-1">
                将删除 <strong>{deleteUser.name}</strong>（{deleteUser.email}）
                及其全部数据（{deleteUser.totalDays} 天打卡，{deleteUser.planCount} 条计划）。
              </p>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={closeAll} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Merge modal */}
      {mergeUser && (
        <Modal title={`合并用户: ${mergeUser.name}`} onClose={closeAll}>
          <div className="space-y-3">
            <div className="bg-purple-50 rounded-lg p-3 text-sm text-purple-700">
              <p>
                将 <strong>{mergeUser.name}</strong> 的所有学习数据合并到另一个用户，
                然后删除 <strong>{mergeUser.name}</strong>。
              </p>
              <p className="mt-1 text-xs text-purple-500">
                打卡 {mergeUser.totalDays} 天 · 连续 {mergeUser.streakDays} 天 · {mergeUser.planCount} 条计划
              </p>
            </div>
            <label className="block text-sm text-gray-600">合并到哪个用户？</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={mergeTargetId ?? ""}
              onChange={(e) => setMergeTargetId(Number(e.target.value) || null)}
            >
              <option value="">请选择目标用户</option>
              {users
                .filter((u) => u.id !== mergeUser.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) — {u.totalDays}天
                  </option>
                ))}
            </select>
            {mergeTargetId && (() => {
              const target = users.find((u) => u.id === mergeTargetId);
              return target ? (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  <p>目标用户 <strong>{target.name}</strong> 当前数据：</p>
                  <p className="text-xs mt-0.5">打卡 {target.totalDays} 天 · 连续 {target.streakDays} 天 · {target.planCount} 条计划</p>
                </div>
              ) : null;
            })()}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={closeAll} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
              <button
                onClick={handleMerge}
                disabled={submitting || !mergeTargetId}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {submitting ? "合并中..." : "确认合并"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
