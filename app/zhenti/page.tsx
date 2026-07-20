"use client";

import Layout from "@/components/layout";
import Link from "next/link";

interface ExamEntry {
  year: number;
  type: string;
  label: string;
  sections: string[];
}

const exams: ExamEntry[] = [
  {
    year: 2010,
    type: "英语一",
    label: "2010 年考研英语一",
    sections: ["完型填空"],
  },
];

export default function ZhentiPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">真题练习</h2>
        <p className="text-sm text-gray-500">
          选择年份和题型，在线练习考研英语真题
        </p>

        <div className="grid gap-4">
          {exams.map((exam) => (
            <div
              key={`${exam.year}-${exam.type}`}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {exam.type}
                </span>
                <h3 className="font-semibold text-gray-900">{exam.label}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {exam.sections.map((section) => (
                  <Link
                    key={section}
                    href={`/zhenti/${exam.year}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    {section}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
