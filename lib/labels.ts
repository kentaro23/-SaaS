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
