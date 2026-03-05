type Option = { value: string; label: string };

function toLabel(value: string | null | undefined, dict: Record<string, string>) {
  if (!value) return "-";
  return dict[value] ?? value;
}

const SOCIETY_MEMBER_STATUS = {
  ACTIVE: "有効",
  INACTIVE: "無効",
} as const;

const INVOICE_STATUS = {
  DRAFT: "下書き",
  APPROVED: "承認済み",
  SENT: "送信済み",
  PAID: "入金済み",
  OVERDUE: "期限超過",
  CANCELLED: "取消",
} as const;

const PAYMENT_METHOD = {
  BANK_TRANSFER: "銀行振込",
  CARD: "カード",
  OTHER: "その他",
} as const;

const SOCIETY_ROLE = {
  OWNER: "オーナー",
  ADMIN: "管理者",
  STAFF: "担当",
  READ_ONLY: "閲覧のみ",
} as const;

const MEETING_TYPE = {
  BOARD: "役員会",
  COMMITTEE: "委員会",
  OTHER: "その他",
} as const;

const MEETING_STATUS = {
  DRAFT: "下書き",
  SCHEDULED: "予定",
  DONE: "実施済み",
} as const;

const ATTENDANCE_STATUS = {
  YES: "出席",
  NO: "欠席",
  MAYBE: "保留",
} as const;

const TASK_STATUS = {
  OPEN: "未対応",
  DONE: "完了",
} as const;

const ARCHIVE_CATEGORY = {
  JOURNAL: "学会誌",
  NOTICE: "お知らせ",
  OTHER: "その他",
} as const;

const SHIPMENT_TYPE = {
  JOURNAL: "学会誌",
  NOTICE: "お知らせ",
} as const;

const SHIPMENT_RECIPIENT_STATUS = {
  QUEUED: "未発送",
  SENT: "発送済み",
  RETURNED: "返送",
} as const;

const EMAIL_APPROVAL_STATUS = {
  DRAFT: "下書き",
  APPROVED: "承認済み",
  SENT: "送信済み",
} as const;

const EMAIL_SEND_STATUS = {
  QUEUED: "送信待ち",
  SENT: "送信済み",
  FAILED: "失敗",
} as const;

const REMINDER_STAGE = {
  NONE: "未督促",
  FIRST: "1次督促",
  SECOND: "2次督促",
  FINAL: "最終督促",
} as const;

const MAIL_PROVIDER = {
  smtp: "SMTP",
  gmail_api: "Gmail API（準備中）",
  console: "コンソール（開発）",
} as const;

export const societyStatusOptions: Option[] = [
  { value: "ACTIVE", label: "有効" },
  { value: "INACTIVE", label: "無効" },
];

export const invoiceStatusOptions: Option[] = [
  { value: "DRAFT", label: "下書き" },
  { value: "APPROVED", label: "承認済み" },
  { value: "SENT", label: "送信済み" },
  { value: "PAID", label: "入金済み" },
  { value: "OVERDUE", label: "期限超過" },
  { value: "CANCELLED", label: "取消" },
];

export const paymentMethodOptions: Option[] = [
  { value: "BANK_TRANSFER", label: "銀行振込" },
  { value: "CARD", label: "カード" },
  { value: "OTHER", label: "その他" },
];

export const roleOptions: Option[] = [
  { value: "OWNER", label: "オーナー" },
  { value: "ADMIN", label: "管理者" },
  { value: "STAFF", label: "担当" },
  { value: "READ_ONLY", label: "閲覧のみ" },
];

export const meetingTypeOptions: Option[] = [
  { value: "BOARD", label: "役員会" },
  { value: "COMMITTEE", label: "委員会" },
  { value: "OTHER", label: "その他" },
];

export const meetingStatusOptions: Option[] = [
  { value: "DRAFT", label: "下書き" },
  { value: "SCHEDULED", label: "予定" },
  { value: "DONE", label: "実施済み" },
];

export const attendanceStatusOptions: Option[] = [
  { value: "YES", label: "出席" },
  { value: "NO", label: "欠席" },
  { value: "MAYBE", label: "保留" },
];

export const taskStatusOptions: Option[] = [
  { value: "OPEN", label: "未対応" },
  { value: "DONE", label: "完了" },
];

export const archiveCategoryOptions: Option[] = [
  { value: "JOURNAL", label: "学会誌" },
  { value: "NOTICE", label: "お知らせ" },
  { value: "OTHER", label: "その他" },
];

export const shipmentTypeOptions: Option[] = [
  { value: "JOURNAL", label: "学会誌" },
  { value: "NOTICE", label: "お知らせ" },
];

export const shipmentRecipientStatusOptions: Option[] = [
  { value: "QUEUED", label: "未発送" },
  { value: "SENT", label: "発送済み" },
  { value: "RETURNED", label: "返送" },
];

export const mailProviderOptions: Option[] = [
  { value: "smtp", label: "SMTP" },
  { value: "gmail_api", label: "Gmail API（準備中）" },
  { value: "console", label: "コンソール（開発）" },
];

export const reminderStageOptions: Option[] = [
  { value: "NONE", label: "未督促" },
  { value: "FIRST", label: "1次督促" },
  { value: "SECOND", label: "2次督促" },
  { value: "FINAL", label: "最終督促" },
];

export const prefectureOptions: Option[] = [
  { value: "北海道", label: "北海道" },
  { value: "青森県", label: "青森県" },
  { value: "岩手県", label: "岩手県" },
  { value: "宮城県", label: "宮城県" },
  { value: "秋田県", label: "秋田県" },
  { value: "山形県", label: "山形県" },
  { value: "福島県", label: "福島県" },
  { value: "茨城県", label: "茨城県" },
  { value: "栃木県", label: "栃木県" },
  { value: "群馬県", label: "群馬県" },
  { value: "埼玉県", label: "埼玉県" },
  { value: "千葉県", label: "千葉県" },
  { value: "東京都", label: "東京都" },
  { value: "神奈川県", label: "神奈川県" },
  { value: "新潟県", label: "新潟県" },
  { value: "富山県", label: "富山県" },
  { value: "石川県", label: "石川県" },
  { value: "福井県", label: "福井県" },
  { value: "山梨県", label: "山梨県" },
  { value: "長野県", label: "長野県" },
  { value: "岐阜県", label: "岐阜県" },
  { value: "静岡県", label: "静岡県" },
  { value: "愛知県", label: "愛知県" },
  { value: "三重県", label: "三重県" },
  { value: "滋賀県", label: "滋賀県" },
  { value: "京都府", label: "京都府" },
  { value: "大阪府", label: "大阪府" },
  { value: "兵庫県", label: "兵庫県" },
  { value: "奈良県", label: "奈良県" },
  { value: "和歌山県", label: "和歌山県" },
  { value: "鳥取県", label: "鳥取県" },
  { value: "島根県", label: "島根県" },
  { value: "岡山県", label: "岡山県" },
  { value: "広島県", label: "広島県" },
  { value: "山口県", label: "山口県" },
  { value: "徳島県", label: "徳島県" },
  { value: "香川県", label: "香川県" },
  { value: "愛媛県", label: "愛媛県" },
  { value: "高知県", label: "高知県" },
  { value: "福岡県", label: "福岡県" },
  { value: "佐賀県", label: "佐賀県" },
  { value: "長崎県", label: "長崎県" },
  { value: "熊本県", label: "熊本県" },
  { value: "大分県", label: "大分県" },
  { value: "宮崎県", label: "宮崎県" },
  { value: "鹿児島県", label: "鹿児島県" },
  { value: "沖縄県", label: "沖縄県" },
];

export function societyStatusLabel(value: string | null | undefined) {
  return toLabel(value, SOCIETY_MEMBER_STATUS);
}

export function memberStatusLabel(value: string | null | undefined) {
  return toLabel(value, SOCIETY_MEMBER_STATUS);
}

export function userStatusLabel(value: string | null | undefined) {
  return toLabel(value, SOCIETY_MEMBER_STATUS);
}

export function invoiceStatusLabel(value: string | null | undefined) {
  return toLabel(value, INVOICE_STATUS);
}

export function paymentMethodLabel(value: string | null | undefined) {
  return toLabel(value, PAYMENT_METHOD);
}

export function roleLabel(value: string | null | undefined) {
  return toLabel(value, SOCIETY_ROLE);
}

export function meetingTypeLabel(value: string | null | undefined) {
  return toLabel(value, MEETING_TYPE);
}

export function meetingStatusLabel(value: string | null | undefined) {
  return toLabel(value, MEETING_STATUS);
}

export function attendanceStatusLabel(value: string | null | undefined) {
  return toLabel(value, ATTENDANCE_STATUS);
}

export function taskStatusLabel(value: string | null | undefined) {
  return toLabel(value, TASK_STATUS);
}

export function archiveCategoryLabel(value: string | null | undefined) {
  return toLabel(value, ARCHIVE_CATEGORY);
}

export function shipmentTypeLabel(value: string | null | undefined) {
  return toLabel(value, SHIPMENT_TYPE);
}

export function shipmentRecipientStatusLabel(value: string | null | undefined) {
  return toLabel(value, SHIPMENT_RECIPIENT_STATUS);
}

export function emailApprovalStatusLabel(value: string | null | undefined) {
  return toLabel(value, EMAIL_APPROVAL_STATUS);
}

export function emailSendStatusLabel(value: string | null | undefined) {
  return toLabel(value, EMAIL_SEND_STATUS);
}

export function mailProviderLabel(value: string | null | undefined) {
  return toLabel(value, MAIL_PROVIDER);
}

export function reminderStageLabel(value: string | null | undefined) {
  return toLabel(value, REMINDER_STAGE);
}
