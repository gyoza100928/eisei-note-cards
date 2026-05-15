"use client";

import { useEffect, useMemo, useState } from "react";
import { cards } from "../data/cards";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [notYetIds, setNotYetIds] = useState<number[]>([]);

  useEffect(() => {
    const savedNotYetIds = localStorage.getItem("notYetIds");

    if (savedNotYetIds) {
      setNotYetIds(JSON.parse(savedNotYetIds));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("notYetIds", JSON.stringify(notYetIds));
  }, [notYetIds]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(cards.map((card) => card.category))
    );

    return ["すべて", "まだだけ復習", ...uniqueCategories];
  }, []);

  const filteredCards = useMemo(() => {
    if (selectedCategory === "すべて") {
      return cards;
    }

    if (selectedCategory === "まだだけ復習") {
      return cards.filter((card) => notYetIds.includes(card.id));
    }

    return cards.filter((card) => card.category === selectedCategory);
  }, [selectedCategory, notYetIds]);

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

  function markNotYet() {
    if (!currentCard) return;

    if (!notYetIds.includes(currentCard.id)) {
      setNotYetIds([...notYetIds, currentCard.id]);
    }

    goNextCard();
  }

  function markRemembered() {
    if (!currentCard) return;

    setNotYetIds(notYetIds.filter((id) => id !== currentCard.id));
    goNextCard();
  }

  function resetNotYetCards() {
    const result = confirm("「まだ」のカードをすべてリセットしますか？");

    if (result) {
      setNotYetIds([]);
      setCurrentIndex(0);
      setIsAnswerVisible(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-slate-900">
          EISEI NOTE Cards
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          公衆衛生・社会歯科 単語カード
        </p>

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

          <p>まだ：{notYetIds.length}枚</p>
        </div>

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

                <span className="text-yellow-500">
                  {"★".repeat(currentCard.importance)}
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

                  <p className="mt-2 leading-relaxed text-slate-700">
                    {currentCard.explanation}
                  </p>

                  {currentCard.trap && (
                    <>
                      <p className="mt-6 text-sm font-bold text-red-500">
                        ひっかけ
                      </p>

                      <p className="mt-2 leading-relaxed text-red-700">
                        {currentCard.trap}
                      </p>
                    </>
                  )}
                </div>
              )}
            </button>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={markNotYet}
                className="rounded-2xl bg-white py-4 font-bold text-slate-700 shadow"
              >
                まだ
              </button>

              <button
                onClick={markRemembered}
                className="rounded-2xl bg-slate-900 py-4 font-bold text-white shadow"
              >
                覚えた
              </button>
            </div>
          </>
        )}

        <button
          onClick={resetNotYetCards}
          className="mt-5 w-full rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-500"
        >
          まだリストをリセット
        </button>
      </div>
    </main>
  );
}