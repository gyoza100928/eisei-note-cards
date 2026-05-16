"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "../lib/supabase";
type Card = {
  id: number;
  category: string;
  front: string;
  back: string;
};
type ProgressStatus = "remembered" | "not_yet";

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [studentCode, setStudentCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [message, setMessage] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);

  const [progressMap, setProgressMap] = useState<
    Record<number, ProgressStatus>
  >({});
  function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

async function loadCardsFromCsv() {
  const response = await fetch("/cards.csv");
  const text = await response.text();

  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  const dataLines = lines.slice(1);

  const loadedCards = dataLines
    .map((line) => {
      const [id, category, front, back] = parseCsvLine(line);

      return {
        id: Number(id),
        category: category || "",
        front: front || "",
        back: back || "",
      };
    })
    .filter((card) => card.id && card.front && card.back);

  setCards(loadedCards);
}

  useEffect(() => {
    loadCardsFromCsv();
    const savedStudentCode = localStorage.getItem("studentCode");
    const savedStudentName = localStorage.getItem("studentName");

    if (savedStudentCode) {
      setStudentCode(savedStudentCode);
      setStudentName(savedStudentName || "");
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && studentCode) {
      loadProgress(studentCode);
    }
  }, [isLoggedIn, studentCode]);

  async function loadProgress(code: string) {
    const { data, error } = await supabase
      .from("progress")
      .select("card_id, status")
      .eq("student_code", code);

    if (error) {
      console.error(error);
      setMessage("進捗の読み込みに失敗しました。");
      return;
    }

    const nextProgressMap: Record<number, ProgressStatus> = {};

    data?.forEach((item) => {
      nextProgressMap[item.card_id] = item.status as ProgressStatus;
    });

    setProgressMap(nextProgressMap);
  }

  async function handleStart() {
    const code = studentCode.trim();
    const name = studentName.trim();

    if (!code) {
      setMessage("学生IDを入力してください。");
      return;
    }

    setIsStarting(true);
    setMessage("");

    const { error } = await supabase.from("students").upsert(
      {
        student_code: code,
        name: name,
        class_code: "eisei2026",
      },
      {
        onConflict: "student_code",
      }
    );

    setIsStarting(false);

    if (error) {
      console.error(error);
      setMessage("ログインに失敗しました。もう一度試してください。");
      return;
    }

    localStorage.setItem("studentCode", code);
    localStorage.setItem("studentName", name);

    setStudentCode(code);
    setStudentName(name);
    setIsLoggedIn(true);
  }

  function logout() {
    localStorage.removeItem("studentCode");
    localStorage.removeItem("studentName");
    setStudentCode("");
    setStudentName("");
    setIsLoggedIn(false);
    setProgressMap({});
    setSelectedCategory("すべて");
    setCurrentIndex(0);
    setIsAnswerVisible(false);
  }

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(cards.map((card) => card.category))
    );

    return ["すべて", "まだだけ復習", ...uniqueCategories];
  }, []);

  const notYetIds = useMemo(() => {
    return Object.entries(progressMap)
      .filter(([, status]) => status === "not_yet")
      .map(([cardId]) => Number(cardId));
  }, [progressMap]);

  const rememberedIds = useMemo(() => {
    return Object.entries(progressMap)
      .filter(([, status]) => status === "remembered")
      .map(([cardId]) => Number(cardId));
  }, [progressMap]);

  const filteredCards = useMemo(() => {
    if (selectedCategory === "すべて") {
      return cards;
    }

    if (selectedCategory === "まだだけ復習") {
      return cards.filter((card) => notYetIds.includes(card.id));
    }

    return cards.filter((card) => card.category === selectedCategory);
  }, [selectedCategory, notYetIds]);

  useEffect(() => {
    if (currentIndex >= filteredCards.length) {
      setCurrentIndex(0);
    }
  }, [filteredCards.length, currentIndex]);

  const currentCard = filteredCards[currentIndex];

  function selectCategory(category: string) {
    setSelectedCategory(category);
    setCurrentIndex(0);
    setIsAnswerVisible(false);
  }

  function goNextCard() {
    setIsAnswerVisible(false);

    if (filteredCards.length === 0) {
      setCurrentIndex(0);
      return;
    }

    if (currentIndex + 1 >= filteredCards.length) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }

  async function saveProgress(status: ProgressStatus) {
    if (!currentCard) return;

    const cardId = currentCard.id;

    setProgressMap((prev) => ({
      ...prev,
      [cardId]: status,
    }));

    const { error } = await supabase.from("progress").upsert(
      {
        student_code: studentCode,
        card_id: cardId,
        status: status,
        reviewed_count: 1,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "student_code,card_id",
      }
    );

    if (error) {
      console.error(error);
      setMessage("進捗の保存に失敗しました。");
      return;
    }

    goNextCard();
  }

  async function resetMyProgress() {
    const result = confirm("自分の進捗をすべてリセットしますか？");

    if (!result) return;

    const { error } = await supabase
      .from("progress")
      .delete()
      .eq("student_code", studentCode);

    if (error) {
      console.error(error);
      setMessage("リセットに失敗しました。");
      return;
    }

    setProgressMap({});
    setCurrentIndex(0);
    setIsAnswerVisible(false);
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-md">
          <h1 className="text-3xl font-bold text-slate-900">
            EISEI NOTE Cards
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            公衆衛生・社会歯科 単語カード
          </p>

          <div className="mt-8 rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900">
              学習を始める
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              先生から指定された学生IDを入力してください。
            </p>

            <label className="mt-6 block text-sm font-bold text-slate-700">
              学生ID
            </label>

            <input
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="例：A001"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg outline-none focus:border-slate-900"
            />

            <label className="mt-5 block text-sm font-bold text-slate-700">
              名前・ニックネーム
            </label>

            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="例：山田"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg outline-none focus:border-slate-900"
            />

            {message && (
              <p className="mt-4 text-sm font-bold text-red-600">{message}</p>
            )}

            <button
              onClick={handleStart}
              disabled={isStarting}
              className="mt-6 w-full rounded-2xl bg-slate-900 py-4 font-bold text-white shadow disabled:bg-slate-400"
            >
              {isStarting ? "登録中..." : "はじめる"}
            </button>
          </div>
        </div>
      </main>
    );
  }
if (cards.length === 0) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold text-slate-900">
          EISEI NOTE Cards
        </h1>
        <p className="mt-4 text-slate-600">カードを読み込み中...</p>
      </div>
    </main>
  );
}
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              EISEI NOTE Cards
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              公衆衛生・社会歯科 単語カード
            </p>

            <p className="mt-2 text-xs text-slate-500">
              ID：{studentCode}
              {studentName ? `　${studentName}` : ""}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm"
          >
            ログアウト
          </button>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => selectCategory(category)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold shadow-sm ${
                selectedCategory === category
                  ? "bg-slate-900 text-white"
                  : category === "まだだけ復習"
                  ? "bg-red-50 text-red-700"
                  : "bg-white text-slate-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <p>
            {filteredCards.length === 0 ? 0 : currentIndex + 1} /{" "}
            {filteredCards.length}
          </p>

          <p>
            覚えた：{rememberedIds.length}枚　まだ：{notYetIds.length}枚
          </p>
        </div>

        {message && (
          <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {message}
          </p>
        )}

        {filteredCards.length === 0 ? (
          <div className="mt-4 rounded-3xl bg-white p-8 text-center shadow-lg">
            <p className="text-xl font-bold text-slate-900">
              復習するカードはありません
            </p>

            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              「まだ」を押したカードがここに集まります。
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={() => setIsAnswerVisible(!isAnswerVisible)}
              className="mt-4 min-h-[320px] w-full rounded-3xl bg-white p-6 text-left shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                  {currentCard.category}
                </span>

               
              </div>

              {!isAnswerVisible ? (
                <div className="mt-16 text-center">
                  <p className="text-2xl font-bold leading-relaxed text-slate-900">
                    {currentCard.front}
                  </p>

                  <p className="mt-10 text-sm text-slate-400">
                    タップして答えを見る
                  </p>
                </div>
              ) : (
                <div className="mt-8">
                  <p className="text-sm font-bold text-slate-500">答え</p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {currentCard.back}
                  </p>

                  <p className="mt-6 text-sm font-bold text-slate-500">解説</p>

                 
                
                    <>
                   
                      </p>
                    </>
                  )}
                </div>
              )}
            </button>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => saveProgress("not_yet")}
                className="rounded-2xl bg-white py-4 font-bold text-slate-700 shadow"
              >
                まだ
              </button>

              <button
                onClick={() => saveProgress("remembered")}
                className="rounded-2xl bg-slate-900 py-4 font-bold text-white shadow"
              >
                覚えた
              </button>
            </div>
          </>
        )}

        <button
          onClick={resetMyProgress}
          className="mt-5 w-full rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-500"
        >
          自分の進捗をリセット
        </button>
      </div>
    </main>
  );
}