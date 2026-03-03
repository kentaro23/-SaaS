export type TemplateCategory = "mailing" | "reminder";

export type EmailTemplatePreset = {
  key: string;
  name: string;
  category: TemplateCategory;
  subject: string;
  body: string;
};

export const EMAIL_TEMPLATE_PRESETS: EmailTemplatePreset[] = [
  {
    key: "annual_invoice",
    name: "年会費請求",
    category: "mailing",
    subject: "{{fiscalYear}}年度 年会費のご請求（{{memberName}} 様）",
    body: "{{memberName}} 様\n\n{{fiscalYear}}年度 年会費 {{invoiceAmount}}円 のご請求です。\n支払期限: {{dueDate}}\n\nよろしくお願いいたします。",
  },
  {
    key: "invoice_notice",
    name: "請求案内",
    category: "mailing",
    subject: "年会費請求のご案内（{{memberName}} 様）",
    body: "{{memberName}} 様\n\n請求内容をご確認ください。\n金額: {{invoiceAmount}}円\n支払期限: {{dueDate}}\n\nご不明点があればご連絡ください。",
  },
  {
    key: "reminder_1",
    name: "督促1回目",
    category: "reminder",
    subject: "【ご確認】年会費のお支払い（{{memberName}} 様）",
    body: "{{memberName}} 様\n\n年会費 {{invoiceAmount}}円 が未納です。\n支払期限: {{dueDate}}\nご対応をお願いいたします。",
  },
  {
    key: "reminder_final",
    name: "最終督促",
    category: "reminder",
    subject: "【最終のご案内】年会費未納について（{{memberName}} 様）",
    body: "{{memberName}} 様\n\n年会費 {{invoiceAmount}}円 が未納のため、最終のご案内です。\n至急お手続きをお願いいたします。\n支払期限: {{dueDate}}",
  },
];

export function presetsByCategory(category: TemplateCategory) {
  return EMAIL_TEMPLATE_PRESETS.filter((t) => t.category === category);
}
