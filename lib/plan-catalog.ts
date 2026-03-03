export const corePlanOptions = [
  {
    value: "Core-Light",
    label: "コアライト",
    features: ["会員基本台帳管理", "年会費請求の定型運用", "月次運用レポート"],
  },
  {
    value: "Core-Standard",
    label: "コアスタンダード",
    features: ["会員管理・請求運用", "委員会/役員会の開催実務", "問い合わせ一次受付"],
  },
  {
    value: "Core-Premium",
    label: "コアプレミアム",
    features: ["標準運用フル対応", "会議運用強化", "発送・一次窓口の優先対応"],
  },
] as const;

export const optionDefinitions = [
  { field: "electionSupport", label: "選挙支援", description: "代議員・役員選挙などの事務運用を支援" },
  { field: "shipmentSupport", label: "発送支援", description: "会誌・案内の宛名生成と発送運用を支援" },
  { field: "committeeSupport", label: "委員会支援", description: "委員会運営・議事録管理の実務を支援" },
  { field: "accountingSupport", label: "会計支援", description: "会費入金確認・会計連携向けの運用を支援" },
] as const;
