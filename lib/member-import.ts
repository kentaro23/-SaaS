export type MemberCsvRow = {
  memberNo: string;
  name: string;
  kana?: string | null;
  affiliation: string;
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
    name: findIndex(headers, ["name", "氏名"]),
    kana: findIndex(headers, ["kana", "かな", "カナ"]),
    affiliation: findIndex(headers, ["affiliation", "所属"]),
    address: findIndex(headers, ["address", "住所"]),
    email: findIndex(headers, ["email", "メール", "emailAddress"]),
    phone: findIndex(headers, ["phone", "電話"]),
    memberType: findIndex(headers, ["memberType", "member_type", "会員種別"]),
    position: findIndex(headers, ["position", "役職"]),
    status: findIndex(headers, ["status", "状態"]),
    joinedAt: findIndex(headers, ["joinedAt", "joined_at", "入会日"]),
    leftAt: findIndex(headers, ["leftAt", "left_at", "退会日"]),
  };

  const required = [index.memberNo, index.name, index.affiliation, index.address, index.email, index.memberType, index.joinedAt];
  if (required.some((i) => i < 0)) {
    throw new Error("CSVヘッダー不足: memberNo,name,affiliation,address,email,memberType,joinedAt（または日本語ヘッダー）を含めてください");
  }

  const rows: MemberCsvRow[] = [];
  let skipped = 0;

  for (let i = 1; i < matrix.length; i += 1) {
    const r = matrix[i];
    const memberNo = pick(r, index.memberNo);
    const name = pick(r, index.name);
    const affiliation = pick(r, index.affiliation);
    const address = pick(r, index.address);
    const email = pick(r, index.email);
    const memberType = pick(r, index.memberType);
    const joinedAt = parseDateOrNull(pick(r, index.joinedAt));

    if (!memberNo && !name && !email) {
      skipped += 1;
      continue;
    }
    if (!memberNo || !name || !affiliation || !address || !email || !memberType || !joinedAt) {
      skipped += 1;
      continue;
    }

    rows.push({
      memberNo,
      name,
      kana: pick(r, index.kana) || null,
      affiliation,
      address,
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
