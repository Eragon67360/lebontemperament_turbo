// « Exporter (Excel) »: the sale as a formatted .xlsx workbook, five sheets:
// « Résumé » (the figures), « Acheteurs » (one row per buyer, one column per
// product), « Détail par acheteur » (each buyer's lines, to prepare the
// bags), « Fournisseurs » (what to order from each) and « Paiements ».
// Pure: it returns the sheets; the page writes them with write-excel-file.
// The totals come from @repo/domain/utils/orders and are never recomputed.
import type { SaleDetail } from "@/utils/orders/types";
import { fulfilmentLabel, saleDatesLine, slugify } from "@/utils/orders/view";
import {
  BALANCE_LABELS,
  type BalanceStatus,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
  saleSummary,
} from "@repo/domain/utils/orders";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { CellObject, Row, Sheet } from "write-excel-file/universal";

export type WorkbookSheet = Sheet<never>;

export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function xlsxFilename(title: string): string {
  return `commandes-${slugify(title)}.xlsx`;
}

// The admin's teal (globals.css) and the status tones of the sale page.
const TEAL = "#156C71";
const TEAL_SOFT = "#E4F2F2";
const TEAL_LINE = "#B3DADC";
const BAND = "#F5FAFA";
const INK = "#16201F";
const MUTED = "#5B6B6A";

const STATUS_COLORS: Record<BalanceStatus, { text: string; fill: string }> = {
  empty: { text: MUTED, fill: "#F1F3F3" },
  unpaid: { text: "#B42318", fill: "#FDE8E7" },
  partial: { text: "#8A5300", fill: "#FDF1D6" },
  paid: { text: "#1F7A4D", fill: "#E3F4EA" },
  overpaid: { text: "#1D5FA8", fill: "#E5EEF9" },
};

/** « 1 234,50 € » in a French Excel (the separators follow the reader's locale). */
const EUROS = '#,##0.00 "€";-#,##0.00 "€"';
const DAY = "dd/mm/yyyy";

const euros = (cents: number): number => cents / 100;

const title = (value: string, columnSpan: number): CellObject => ({
  value,
  columnSpan,
  fontSize: 16,
  fontWeight: "bold",
  textColor: TEAL,
  height: 30,
  alignVertical: "center",
});

const subtitle = (value: string, columnSpan: number): CellObject => ({
  value,
  columnSpan,
  fontStyle: "italic",
  textColor: MUTED,
  height: 18,
});

const header = (
  value: string,
  extra: Partial<CellObject> = {},
): CellObject => ({
  value,
  fontWeight: "bold",
  textColor: "#FFFFFF",
  backgroundColor: TEAL,
  alignVertical: "center",
  borderColor: TEAL,
  borderStyle: "thin",
  height: 22,
  ...extra,
});

/** A body cell: thin teal grid, banded every other row. */
const body = (
  value: CellObject["value"] | null,
  band: boolean,
  extra: Partial<CellObject> = {},
): CellObject => {
  const empty = value === null || value === undefined || value === "";
  // The library refuses a `format` on an empty cell (no phone, no note).
  const { format, type, ...style } = extra;
  return {
    ...(empty ? {} : { value, type, format }),
    textColor: INK,
    alignVertical: "center",
    borderColor: TEAL_LINE,
    borderStyle: "thin",
    ...(band ? { backgroundColor: BAND } : {}),
    ...style,
  };
};

const money = (
  cents: number,
  band: boolean,
  extra: Partial<CellObject> = {},
): CellObject =>
  body(euros(cents), band, { type: Number, format: EUROS, ...extra });

const total = (extra: Partial<CellObject> = {}): Partial<CellObject> => ({
  fontWeight: "bold",
  backgroundColor: TEAL_SOFT,
  topBorderColor: TEAL,
  topBorderStyle: "medium",
  ...extra,
});

const status = (s: BalanceStatus): CellObject => ({
  value: BALANCE_LABELS[s],
  fontWeight: "bold",
  textColor: STATUS_COLORS[s].text,
  backgroundColor: STATUS_COLORS[s].fill,
  align: "center",
  alignVertical: "center",
  borderColor: TEAL_LINE,
  borderStyle: "thin",
});

/** A yyyy-MM-dd day as a date Excel can sort (UTC midnight, no shift). */
function day(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function saleWorkbook(
  detail: SaleDetail,
  now: Date = new Date(),
): WorkbookSheet[] {
  const summary = saleSummary(detail.products, detail.orders);
  const products = new Map(detail.products.map((p) => [p.id, p]));
  const orders = new Map(detail.orders.map((o) => [o.id, o]));
  const soldBy = (orderId: string) => {
    const id = orders.get(orderId)?.sold_by;
    return id ? (detail.sellers[id] ?? null) : null;
  };
  const exported = `Exporté le ${format(now, "d MMMM yyyy 'à' HH:mm", { locale: fr })}`;
  const dates = saleDatesLine(detail.sale, now);
  const sheetTitle = detail.sale.title;
  /** Title, then the dates and the export time on their own lines. */
  const heading = (span: number, lines: (string | null)[]): Row[] => {
    const pad = Array(span - 1).fill(null);
    return [
      [title(sheetTitle, span), ...pad],
      ...lines
        .filter((line): line is string => !!line)
        .map((line): Row => [subtitle(line, span), ...pad]),
    ];
  };

  // --- Résumé ---------------------------------------------------------------
  const deliveries = detail.orders.filter(
    (o) => o.fulfilment === "delivery",
  ).length;
  const figures: [string, CellObject["value"], boolean][] = [
    ["Commandes", summary.orderCount, false],
    ["Livraisons", deliveries, false],
    ["Retraits", summary.orderCount - deliveries, false],
    ["Acheteurs qui ont tout payé", summary.paidCount, false],
    ["Acheteurs qui doivent encore", summary.owingCount, false],
    ["Montant total", euros(summary.totalCents), true],
    ["Déjà payé", euros(summary.paidCents), true],
    ["Reste à payer", euros(summary.dueCents), true],
  ];
  if (summary.overpaidCents > 0) {
    figures.push(["Trop perçu (à rendre)", euros(summary.overpaidCents), true]);
  }
  const summaryRows: Row[] = [
    ...heading(3, [dates, exported]),
    [],
    [header("En chiffres", { columnSpan: 2 }), null],
    ...figures.map(([label, value, isMoney], i): Row => {
      const band = i % 2 === 1;
      const strong = label === "Reste à payer";
      return [
        body(label, band, strong ? { fontWeight: "bold" } : {}),
        isMoney
          ? body(value, band, {
              type: Number,
              format: EUROS,
              ...(strong ? { fontWeight: "bold" } : {}),
            })
          : body(value, band, { align: "right" }),
      ];
    }),
    [],
    [header("Paiements reçus"), header("Montant", { align: "right" })],
    ...PAYMENT_METHODS.map((m: PaymentMethod, i): Row => [
      body(PAYMENT_METHOD_LABELS[m], i % 2 === 1),
      money(summary.byMethod[m], i % 2 === 1),
    ]),
    [
      body("Total reçu", false, total()),
      money(summary.paidCents, false, total()),
    ],
    [],
    [
      header("Fournisseur"),
      header("Articles", { align: "right" }),
      header("Montant", { align: "right" }),
    ],
    ...summary.suppliers.map((s, i): Row => [
      body(s.supplier ?? "Sans fournisseur", i % 2 === 1),
      body(s.quantity, i % 2 === 1, { align: "right" }),
      money(s.amountCents, i % 2 === 1),
    ]),
    [
      body("Total", false, total()),
      body(
        summary.suppliers.reduce((n, s) => n + s.quantity, 0),
        false,
        total({ align: "right" }),
      ),
      money(summary.totalCents, false, total()),
    ],
  ];

  // --- Acheteurs (one column per ordered product) ---------------------------
  const info = ["Acheteur", "Téléphone", "Adresse", "Vendu par", "Mode"];
  const money4 = ["Total", "Payé", "Reste à payer", "État"];
  const width = info.length + summary.products.length + money4.length;
  // Categories over the product columns, as on the order form.
  const groups: Row = [
    header("Acheteur", { columnSpan: info.length, align: "center" }),
    ...info.slice(1).map(() => null),
  ];
  for (let i = 0; i < summary.products.length;) {
    const category = summary.products[i]!.category;
    let span = 1;
    while (summary.products[i + span]?.category === category) span += 1;
    groups.push(
      header(category, {
        columnSpan: span,
        align: "center",
        backgroundColor: "#1A878D",
      }),
    );
    for (let k = 1; k < span; k += 1) groups.push(null);
    i += span;
  }
  groups.push(
    header("Paiement", { columnSpan: money4.length, align: "center" }),
    ...money4.slice(1).map(() => null),
  );
  const heads: Row = [
    ...info.map((h) => header(h, { height: 165, alignVertical: "bottom" })),
    ...summary.products.map((p) =>
      header(p.label, {
        textRotation: 90,
        align: "center",
        alignVertical: "bottom",
        wrap: true,
      }),
    ),
    ...money4.map((h, i) =>
      header(h, {
        alignVertical: "bottom",
        align: i < 3 ? "right" : "center",
        wrap: true,
      }),
    ),
  ];
  const buyerRows: Row[] = summary.buyers.map((b, i) => {
    const band = i % 2 === 1;
    const o = orders.get(b.orderId);
    const qty = new Map(b.lines.map((l) => [l.productId, l.quantity]));
    return [
      body(b.buyerName, band, { fontWeight: "bold" }),
      body(o?.buyer_phone ?? null, band, { type: String, format: "@" }),
      body(o?.buyer_address ?? null, band, { wrap: true }),
      body(soldBy(b.orderId), band),
      body(fulfilmentLabel(b.fulfilment), band),
      ...summary.products.map((p) =>
        body(qty.get(p.productId) ?? null, band, { align: "center" }),
      ),
      money(b.totalCents, band),
      money(b.paidCents, band),
      money(b.dueCents, band, { fontWeight: "bold" }),
      status(b.status),
    ];
  });
  const buyersTotal: Row = [
    body("Total", false, total()),
    body(count(summary.orderCount, "commande", "commandes"), false, total()),
    body(null, false, total()),
    body(null, false, total()),
    body(null, false, total()),
    ...summary.products.map((p) =>
      body(p.quantity, false, total({ align: "center" })),
    ),
    money(summary.totalCents, false, total()),
    money(summary.paidCents, false, total()),
    money(summary.dueCents - summary.overpaidCents, false, total()),
    body(null, false, total()),
  ];

  // --- Détail par acheteur ----------------------------------------------------
  const detailRows: Row[] = heading(4, [dates, exported]);
  for (const b of summary.buyers) {
    const o = orders.get(b.orderId);
    const facts = [
      fulfilmentLabel(b.fulfilment),
      o?.buyer_phone,
      b.fulfilment === "delivery" ? o?.buyer_address : null,
      soldBy(b.orderId) && `vendu par ${soldBy(b.orderId)}`,
    ].filter((x): x is string => !!x && x.trim() !== "");
    detailRows.push(
      [],
      [
        header(b.buyerName, { columnSpan: 3, fontSize: 12 }),
        null,
        null,
        status(b.status),
      ],
      [
        {
          value: facts.join(" · "),
          columnSpan: 4,
          textColor: MUTED,
          wrap: true,
        },
        null,
        null,
        null,
      ],
    );
    if (o?.notes?.trim()) {
      detailRows.push([
        {
          value: `Note : ${o.notes.trim()}`,
          columnSpan: 4,
          fontStyle: "italic",
          textColor: MUTED,
          wrap: true,
        },
        null,
        null,
        null,
      ]);
    }
    detailRows.push([
      body("Produit", false, {
        fontWeight: "bold",
        backgroundColor: TEAL_SOFT,
      }),
      body("Qté", false, {
        fontWeight: "bold",
        backgroundColor: TEAL_SOFT,
        align: "center",
      }),
      body("Prix", false, {
        fontWeight: "bold",
        backgroundColor: TEAL_SOFT,
        align: "right",
      }),
      body("Montant", false, {
        fontWeight: "bold",
        backgroundColor: TEAL_SOFT,
        align: "right",
      }),
    ]);
    b.lines.forEach((l, i) => {
      const band = i % 2 === 1;
      detailRows.push([
        body(l.label, band),
        body(l.quantity, band, { align: "center" }),
        money(l.unitPriceCents, band),
        money(l.amountCents, band),
      ]);
    });
    if (b.lines.length === 0) {
      detailRows.push([
        body("Rien commandé", false, { columnSpan: 4, textColor: MUTED }),
        null,
        null,
        null,
      ]);
    }
    detailRows.push(
      [
        body("Total", false, total({ columnSpan: 3, align: "right" })),
        null,
        null,
        money(b.totalCents, false, total()),
      ],
      [
        body("Payé", false, { columnSpan: 3, align: "right" }),
        null,
        null,
        money(b.paidCents, false),
      ],
      [
        body(b.dueCents < 0 ? "Trop perçu" : "Reste à payer", false, {
          columnSpan: 3,
          align: "right",
          fontWeight: "bold",
        }),
        null,
        null,
        money(Math.abs(b.dueCents), false, {
          fontWeight: "bold",
          textColor: STATUS_COLORS[b.status].text,
        }),
      ],
    );
  }

  // --- Fournisseurs -------------------------------------------------------------
  const supplierRows: Row[] = heading(4, [
    "Ce qu'il faut commander à chaque fournisseur",
    exported,
  ]);
  for (const s of summary.suppliers) {
    supplierRows.push(
      [],
      [
        header(s.supplier ?? "Sans fournisseur", {
          columnSpan: 4,
          fontSize: 12,
        }),
        null,
        null,
        null,
      ],
      [
        body("Produit", false, {
          fontWeight: "bold",
          backgroundColor: TEAL_SOFT,
        }),
        body("Quantité", false, {
          fontWeight: "bold",
          backgroundColor: TEAL_SOFT,
          align: "center",
        }),
        body("Prix", false, {
          fontWeight: "bold",
          backgroundColor: TEAL_SOFT,
          align: "right",
        }),
        body("Montant", false, {
          fontWeight: "bold",
          backgroundColor: TEAL_SOFT,
          align: "right",
        }),
      ],
      ...s.products.map((p, i): Row => {
        const band = i % 2 === 1;
        return [
          body(p.label, band),
          body(p.quantity, band, { align: "center" }),
          money(products.get(p.productId)?.unit_price_cents ?? 0, band),
          money(p.amountCents, band),
        ];
      }),
      [
        body(`Total ${s.supplier ?? "sans fournisseur"}`, false, total()),
        body(s.quantity, false, total({ align: "center" })),
        body(null, false, total()),
        money(s.amountCents, false, total()),
      ],
    );
  }
  if (summary.suppliers.length === 0) {
    supplierRows.push(
      [],
      [
        { value: "Aucun produit commandé.", columnSpan: 4, textColor: MUTED },
        null,
        null,
        null,
      ],
    );
  }

  // --- Paiements ----------------------------------------------------------------
  const payments = detail.orders
    .flatMap((o) => o.payments.map((p) => ({ ...p, buyer: o.buyer_name })))
    .sort(
      (a, b) =>
        a.paid_on.localeCompare(b.paid_on) ||
        a.buyer.localeCompare(b.buyer, "fr"),
    );
  const paymentRows: Row[] = [
    ...heading(5, [exported]),
    [],
    [
      header("Date"),
      header("Acheteur"),
      header("Mode"),
      header("Montant", { align: "right" }),
      header("Note"),
    ],
    ...payments.map((p, i): Row => {
      const band = i % 2 === 1;
      return [
        body(day(p.paid_on), band, { type: Date, format: DAY, align: "left" }),
        body(p.buyer, band),
        body(
          PAYMENT_METHOD_LABELS[p.method as PaymentMethod] ?? p.method,
          band,
        ),
        money(
          p.amount_cents,
          band,
          p.amount_cents < 0 ? { textColor: "#B42318" } : {},
        ),
        body(p.note, band, { wrap: true }),
      ];
    }),
    [
      body("Total", false, total()),
      body(count(payments.length, "paiement", "paiements"), false, total()),
      body(null, false, total()),
      money(summary.paidCents, false, total()),
      body(null, false, total()),
    ],
  ];

  return [
    {
      sheet: "Résumé",
      data: summaryRows,
      columns: [{ width: 36 }, { width: 16 }, { width: 18 }],
      showGridLines: false,
    },
    {
      sheet: "Acheteurs",
      data: [
        [title(sheetTitle, width), ...Array(width - 1).fill(null)],
        groups,
        heads,
        ...buyerRows,
        buyersTotal,
      ],
      columns: [
        { width: 24 },
        { width: 16 },
        { width: 34 },
        { width: 16 },
        { width: 11 },
        ...summary.products.map(() => ({ width: 5.5 })),
        { width: 12 },
        { width: 12 },
        { width: 13 },
        { width: 16 },
      ],
      stickyRowsCount: 3,
      stickyColumnsCount: 1,
      orientation: "landscape",
      showGridLines: false,
    },
    {
      sheet: "Détail par acheteur",
      data: detailRows,
      columns: [{ width: 44 }, { width: 8 }, { width: 12 }, { width: 18 }],
      showGridLines: false,
    },
    {
      sheet: "Fournisseurs",
      data: supplierRows,
      columns: [{ width: 44 }, { width: 10 }, { width: 12 }, { width: 14 }],
      showGridLines: false,
    },
    {
      sheet: "Paiements",
      data: paymentRows,
      columns: [
        { width: 11 },
        { width: 24 },
        { width: 11 },
        { width: 12 },
        { width: 28 },
      ],
      stickyRowsCount: 4,
      showGridLines: false,
    },
  ];
}
