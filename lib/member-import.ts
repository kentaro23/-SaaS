export type MemberCsvRow = {
  memberNo: string;
  familyName: string;
  givenName: string;
  kanaFamily: string;
  kanaGiven: string;
  name: string;
  kana: string;
  affiliation: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine1: string;
  addressLine2?: string | null;
  address: string;
  email: string;
  phone?: string | null;
  memberType: string;
  position?: string | null;
  status: "ACTIVE" | "INACTIVE";
  joinedAt: Date;
  leftAt?: Date | null;
};

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }

  values.push(current.trim());
  return values;
}

export function parseCsv(text: string) {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parseCsvLine);
}

function parseDateOrNull(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeStatus(value?: string | null): "ACTIVE" | "INACTIVE" {
  const v = (value || "").toLowerCase();
  if (["inactive", "停止", "退会", "0"].includes(v)) return "INACTIVE";
  return "ACTIVE";
}

function pick(row: string[], index: number | undefined) {
  if (index === undefined || index < 0 || index >= row.length) return "";
  return row[index] ?? "";
}

function findIndex(headers: string[], aliases: string[]) {
  for (const alias of aliases) {
    const idx = headers.findIndex((h) => h.toLowerCase() === alias.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

export function parseMemberCsvRows(csvText: string): { rows: MemberCsvRow[]; skipped: number } {
  const matrix = parseCsv(csvText);
  if (matrix.length < 2) return { rows: [], skipped: 0 };

  const headers = matrix[0].map((h) => h.trim());
  const index = {
    memberNo: findIndex(headers, ["memberNo", "member_no", "会員番号"]),
    familyName: findIndex(headers, ["familyName", "family_name", "姓", "苗字"]),
    givenName: findIndex(headers, ["givenName", "given_name", "名"]),
    kanaFamily: findIndex(headers, ["kanaFamily", "kana_family", "セイ", "姓かな"]),
    kanaGiven: findIndex(headers, ["kanaGiven", "kana_given", "メイ", "名かな"]),
    name: findIndex(headers, ["name", "氏名"]),
    kana: findIndex(headers, ["kana", "かな", "カナ"]),
    affiliation: findIndex(headers, ["affiliation", "所属"]),
    postalCode: findIndex(headers, ["postalCode", "postal_code", "郵便番号"]),
    prefecture: findIndex(headers, ["prefecture", "都道府県"]),
    city: findIndex(headers, ["city", "市区町村"]),
    addressLine1: findIndex(headers, ["addressLine1", "address_line1", "番地", "住所1"]),
    addressLine2: findIndex(headers, ["addressLine2", "address_line2", "建物名", "住所2"]),
    address: findIndex(headers, ["address", "住所"]),
    email: findIndex(headers, ["email", "メール", "emailAddress"]),
    phone: findIndex(headers, ["phone", "電話"]),
    memberType: findIndex(headers, ["memberType", "member_type", "会員種別"]),
    position: findIndex(headers, ["position", "役職"]),
    status: findIndex(headers, ["status", "状態"]),
    joinedAt: findIndex(headers, ["joinedAt", "joined_at", "入会日"]),
    leftAt: findIndex(headers, ["leftAt", "left_at", "退会日"]),
  };

  const required = [
    index.memberNo,
    index.affiliation,
    index.email,
    index.memberType,
    index.joinedAt,
    index.postalCode,
    index.prefecture,
    index.city,
    index.addressLine1,
  ];
  const hasSplitName = index.familyName >= 0 && index.givenName >= 0;
  const hasLegacyName = index.name >= 0;
  const hasSplitKana = index.kanaFamily >= 0 && index.kanaGiven >= 0;
  const hasLegacyKana = index.kana >= 0;
  if (
    required.some((i) => i < 0) ||
    (!hasSplitName && !hasLegacyName) ||
    (!hasSplitKana && !hasLegacyKana)
  ) {
    throw new Error(
      "CSVヘッダー不足: memberNo,familyName,givenName,kanaFamily,kanaGiven,affiliation,postalCode,prefecture,city,addressLine1,email,memberType,joinedAt を含めてください",
    );
  }

  const rows: MemberCsvRow[] = [];
  let skipped = 0;

  for (let i = 1; i < matrix.length; i += 1) {
    const r = matrix[i];
    const memberNo = pick(r, index.memberNo);
    const familyName = pick(r, index.familyName);
    const givenName = pick(r, index.givenName);
    const name = pick(r, index.name);
    const resolvedFamilyName = familyName || name.split(/\s+/)[0] || "";
    const resolvedGivenName =
      givenName || (name.includes(" ") ? name.split(/\s+/).slice(1).join(" ") : "");
    const kanaFamily = pick(r, index.kanaFamily);
    const kanaGiven = pick(r, index.kanaGiven);
    const kana = pick(r, index.kana);
    const resolvedKanaFamily = kanaFamily || kana.split(/\s+/)[0] || "";
    const resolvedKanaGiven =
      kanaGiven || (kana.includes(" ") ? kana.split(/\s+/).slice(1).join(" ") : "");
    const affiliation = pick(r, index.affiliation);
    const postalCode = pick(r, index.postalCode);
    const prefecture = pick(r, index.prefecture);
    const city = pick(r, index.city);
    const addressLine1 = pick(r, index.addressLine1);
    const addressLine2 = pick(r, index.addressLine2) || null;
    const address = pick(r, index.address);
    const resolvedName = `${resolvedFamilyName} ${resolvedGivenName}`.trim() || name;
    const resolvedAddress =
      [postalCode ? `〒${postalCode.replace(/^〒?/, "")}` : "", prefecture, city, addressLine1, addressLine2]
        .filter(Boolean)
        .join(" ") || address;
    const email = pick(r, index.email);
    const memberType = pick(r, index.memberType);
    const joinedAt = parseDateOrNull(pick(r, index.joinedAt));

    if (!memberNo && !resolvedName && !email) {
      skipped += 1;
      continue;
    }
    if (
      !memberNo ||
      !resolvedFamilyName ||
      !resolvedGivenName ||
      !resolvedKanaFamily ||
      !resolvedKanaGiven ||
      !affiliation ||
      !postalCode ||
      !prefecture ||
      !city ||
      !addressLine1 ||
      !resolvedAddress ||
      !email ||
      !memberType ||
      !joinedAt
    ) {
      skipped += 1;
      continue;
    }

    rows.push({
      memberNo,
      familyName: resolvedFamilyName,
      givenName: resolvedGivenName,
      kanaFamily: resolvedKanaFamily,
      kanaGiven: resolvedKanaGiven,
      name: resolvedName,
      kana: `${resolvedKanaFamily} ${resolvedKanaGiven}`.trim(),
      affiliation,
      postalCode,
      prefecture,
      city,
      addressLine1,
      addressLine2,
      address: resolvedAddress,
      email,
      phone: pick(r, index.phone) || null,
      memberType,
      position: pick(r, index.position) || null,
      status: normalizeStatus(pick(r, index.status) || "ACTIVE"),
      joinedAt,
      leftAt: parseDateOrNull(pick(r, index.leftAt)),
    });
  }

  return { rows, skipped };
}
