export type FlashCard = {
  id: number;
  category: string;
  front: string;
  back: string;
  explanation: string;
  importance: 1 | 2 | 3;
  trap?: string;
};

export const cards: FlashCard[] = [
  {
    id: 1,
    category: "健康・障害",
    front: "健康の定義を示したWHO憲章で、健康は何の状態とされる？",
    back: "身体的・精神的・社会的に完全に良好な状態",
    explanation:
      "健康は単に疾病や虚弱がないことではなく、身体的・精神的・社会的に完全に良好な状態とされる。",
    importance: 3,
    trap: "「病気がない状態」だけでは不十分。",
  },
  {
    id: 2,
    category: "健康・障害",
    front: "ICFとは何の分類？",
    back: "国際生活機能分類",
    explanation:
      "ICFはInternational Classification of Functioning, Disability and Healthの略で、生活機能と障害を分類する。",
    importance: 3,
    trap: "ICDは疾病分類、ICFは生活機能分類。",
  },
  {
    id: 3,
    category: "健康・障害",
    front: "ノーマライゼーションとは？",
    back: "障害者も地域社会で通常の生活を送れるようにする考え方",
    explanation:
      "障害の有無にかかわらず、誰もが普通の生活を送れる社会を目指す考え方。",
    importance: 2,
    trap: "障害者を特別施設に隔離する考え方ではない。",
  },
  {
    id: 4,
    category: "社会保障",
    front: "社会保障制度の4本柱は？",
    back: "社会保険、公的扶助、社会福祉、公衆衛生",
    explanation:
      "日本の社会保障制度は、社会保険、公的扶助、社会福祉、公衆衛生を中心に構成される。",
    importance: 3,
    trap: "医療保険や年金は社会保険に含まれる。",
  },
  {
    id: 5,
    category: "社会保障",
    front: "生活保護は社会保障制度のどれに分類される？",
    back: "公的扶助",
    explanation:
      "生活保護は、生活に困窮する者に対して最低限度の生活を保障する制度で、公的扶助に分類される。",
    importance: 3,
    trap: "社会保険ではない。保険料の拠出を前提としない。",
  },
  {
    id: 6,
    category: "社会保障",
    front: "介護保険の保険者は？",
    back: "市町村および特別区",
    explanation:
      "介護保険の保険者は市町村および特別区である。",
    importance: 3,
    trap: "都道府県や国ではない。",
  },
];