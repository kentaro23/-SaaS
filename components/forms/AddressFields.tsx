"use client";

import { useState } from "react";
import { prefectureOptions } from "@/lib/labels";

type Props = {
  postalCodeDefault?: string;
  prefectureDefault?: string;
  cityDefault?: string;
  addressLine1Default?: string;
  addressLine2Default?: string;
  postalLabel?: string;
};

export function AddressFields({
  postalCodeDefault = "",
  prefectureDefault = "東京都",
  cityDefault = "",
  addressLine1Default = "",
  addressLine2Default = "",
  postalLabel = "郵便番号（ハイフンあり）",
}: Props) {
  const [postalCode, setPostalCode] = useState(postalCodeDefault);
  const [prefecture, setPrefecture] = useState(prefectureDefault || "東京都");
  const [city, setCity] = useState(cityDefault);
  const [addressLine1, setAddressLine1] = useState(addressLine1Default);
  const [addressLine2, setAddressLine2] = useState(addressLine2Default);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string>("");

  async function onLookupClick() {
    const zip = postalCode.replace(/[^0-9]/g, "");
    if (zip.length !== 7) {
      setNotice("郵便番号は7桁で入力してください。");
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
      const data = (await res.json()) as {
        status: number;
        results?: Array<{ address1: string; address2: string; address3: string }>;
        message?: string;
      };
      const row = data.results?.[0];
      if (!row) {
        setNotice(data.message || "該当住所が見つかりませんでした。");
        return;
      }
      setPrefecture(row.address1 || prefecture);
      setCity((row.address2 || "") + (row.address3 || ""));
      if (!addressLine1) setAddressLine1("1-1");
      setNotice("住所を自動入力しました。番地を確認してください。");
    } catch {
      setNotice("住所自動入力に失敗しました。手動入力してください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">{postalLabel}</span>
        <input
          name="postalCode"
          required
          placeholder="123-4567"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
        />
      </label>
      <div className="self-end">
        <button
          type="button"
          onClick={onLookupClick}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {loading ? "検索中..." : "住所を自動入力"}
        </button>
      </div>
      <label className="grid gap-1 text-sm md:col-span-2">
        <span className="font-medium text-slate-700">都道府県</span>
        <select name="prefecture" required value={prefecture} onChange={(e) => setPrefecture(e.target.value)}>
          {prefectureOptions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm md:col-span-2">
        <span className="font-medium text-slate-700">市区町村</span>
        <input name="city" required value={city} onChange={(e) => setCity(e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm md:col-span-2">
        <span className="font-medium text-slate-700">番地</span>
        <input
          name="addressLine1"
          required
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
        />
      </label>
      <label className="md:col-span-2 grid gap-1 text-sm">
        <span className="font-medium text-slate-700">建物名・部屋番号（任意）</span>
        <input name="addressLine2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
      </label>
      {notice ? <p className="md:col-span-2 text-xs text-slate-500">{notice}</p> : null}
    </>
  );
}
