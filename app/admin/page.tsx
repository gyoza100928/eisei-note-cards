"use client";

import { useEffect, useMemo, useState } from "react";
import { cards } from "../../data/cards";
import { supabase } from "../../lib/supabase";

type Student = {
  student_code: string;
  name: string | null;
  class_code: string | null;
  created_at: string;
};

type Progress = {
  student_code: string;
  card_id: number;
  status: "remembered" | "not_yet";
  updated_at: string;
};

type StudentSummary = {
  student_code: string;
  name: string;
  remembered: number;
  notYet: number;
  unstudied: number;
  progressRate: number;
  lastUpdated: string;
};

export default function AdminPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [progressList, setProgressList] = useState<Progress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const totalCards = cards.length;

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setIsLoading(true);
    setMessage("");

    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("student_code, name, class_code, created_at")
      .order("student_code", { ascending: true });

    if (studentsError) {
      console.error(studentsError);
      setMessage(`学生データの読み込みに失敗しました：${studentsError.message}`);
      setIsLoading(false);
      return;
    }

    const { data: progressData, error: progressError } = await supabase
      .from("progress")
      .select("student_code, card_id, status, updated_at");

    if (progressError) {
      console.error(progressError);
      setMessage(`進捗データの読み込みに失敗しました：${progressError.message}`);
      setIsLoading(false);
      return;
    }

    setStudents(studentsData || []);
    setProgressList((progressData || []) as Progress[]);
    setIsLoading(false);
  }

  const summaries = useMemo<StudentSummary[]>(() => {
    return students.map((student) => {
      const studentProgress = progressList.filter(
        (progress) => progress.student_code === student.student_code
      );

      const remembered = studentProgress.filter(
        (progress) => progress.status === "remembered"
      ).length;

      const notYet = studentProgress.filter(
        (progress) => progress.status === "not_yet"
      ).length;

      const studied = remembered + notYet;
      const unstudied = Math.max(totalCards - studied, 0);
      const progressRate =
        totalCards === 0 ? 0 : Math.round((remembered / totalCards) * 100);

      const lastUpdated =
        studentProgress.length === 0
          ? "-"
          : studentProgress
              .map((progress) => progress.updated_at)
              .sort()
              .reverse()[0];

      return {
        student_code: student.student_code,
        name: student.name || "",
        remembered,
        notYet,
        unstudied,
        progressRate,
        lastUpdated,
      };
    });
  }, [students, progressList, totalCards]);

  const totalStudents = students.length;
  const averageProgress =
    summaries.length === 0
      ? 0
      : Math.round(
          summaries.reduce((sum, item) => sum + item.progressRate, 0) /
            summaries.length
        );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              EISEI NOTE 管理画面
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              学生ごとの学習進捗を確認できます。
            </p>
          </div>

          <button
            onClick={loadAdminData}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow"
          >
            更新
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow">
            <p className="text-sm font-bold text-slate-500">登録学生数</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalStudents}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow">
            <p className="text-sm font-bold text-slate-500">カード総数</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalCards}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow">
            <p className="text-sm font-bold text-slate-500">平均進捗率</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {averageProgress}%
            </p>
          </div>
        </div>

        {message && (
          <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {message}
          </p>
        )}

        <div className="mt-6 overflow-x-auto rounded-3xl bg-white shadow">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">
              読み込み中...
            </div>
          ) : summaries.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              まだ学生データがありません。
            </div>
          ) : (
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                  <th className="px-4 py-3 font-bold">学生ID</th>
                  <th className="px-4 py-3 font-bold">名前</th>
                  <th className="px-4 py-3 font-bold">覚えた</th>
                  <th className="px-4 py-3 font-bold">まだ</th>
                  <th className="px-4 py-3 font-bold">未学習</th>
                  <th className="px-4 py-3 font-bold">進捗率</th>
                  <th className="px-4 py-3 font-bold">最終更新</th>
                </tr>
              </thead>

              <tbody>
                {summaries.map((summary) => (
                  <tr
                    key={summary.student_code}
                    className="border-b border-slate-100 last:border-none"
                  >
                    <td className="px-4 py-4 font-bold text-slate-900">
                      {summary.student_code}
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {summary.name || "-"}
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {summary.remembered}
                    </td>

                    <td className="px-4 py-4 text-red-600">
                      {summary.notYet}
                    </td>

                    <td className="px-4 py-4 text-slate-500">
                      {summary.unstudied}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-900"
                            style={{ width: `${summary.progressRate}%` }}
                          />
                        </div>

                        <span className="font-bold text-slate-900">
                          {summary.progressRate}%
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-500">
                      {summary.lastUpdated === "-"
                        ? "-"
                        : new Date(summary.lastUpdated).toLocaleString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          進捗率は「覚えた」にしたカード数 ÷ 全カード数で計算しています。
        </p>
      </div>
    </main>
  );
}