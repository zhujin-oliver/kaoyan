interface PlanItemData {
  content: string;
  completed: boolean;
}

interface PlanCardProps {
  userName: string;
  items: PlanItemData[];
  completion: number;
  note?: string | null;
  isOwn?: boolean;
}

export default function PlanCard({ userName, items, completion, note, isOwn }: PlanCardProps) {
  const completionColor =
    completion >= 80
      ? "bg-green-500"
      : completion >= 50
        ? "bg-yellow-500"
        : completion >= 20
          ? "bg-orange-500"
          : "bg-red-400";

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 ${isOwn ? "border-blue-300 ring-1 ring-blue-200" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">
          {userName}
          {isOwn && <span className="ml-2 text-xs text-blue-500 font-normal">我</span>}
        </h3>
        <span className="text-xs text-gray-400">今天</span>
      </div>

      {/* Plan items */}
      <ul className="space-y-1.5 mb-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className={`mt-0.5 text-xs flex-shrink-0 ${item.completed ? "text-green-500" : "text-gray-300"}`}>
              {item.completed ? "✓" : "○"}
            </span>
            <span className={item.completed ? "text-gray-400 line-through" : "text-gray-700"}>
              {item.content}
            </span>
          </li>
        ))}
      </ul>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>完成度</span>
          <span className="font-medium">{completion}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${completionColor}`}
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      {note && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 leading-relaxed">
            📝 {note}
          </p>
        </div>
      )}
    </div>
  );
}
