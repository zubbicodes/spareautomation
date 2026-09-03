import { CheckCircle2, Loader2, PackageCheck, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { SignInRequired } from "@/components/shopify/SignInRequired";
import { submitReturnRequest } from "@/lib/api/cms.functions";
import { getShopifyCustomer } from "@/lib/api/shopify.functions";
import { useContent } from "@/lib/content/ContentContext";

type Customer = Awaited<ReturnType<typeof getShopifyCustomer>>;
type Order = NonNullable<Customer>["orders"][number];

type ReturnReason =
  | "faulty"
  | "damaged"
  | "incorrect"
  | "not_required"
  | "ordered_in_error"
  | "other";

type ReturnItem = {
  key: string;
  title: string;
  orderedQuantity: number;
  quantity: number;
  reason: ReturnReason;
  details: string;
  selected: boolean;
};

const REASONS: { value: ReturnReason; label: string }[] = [
  { value: "faulty", label: "Faulty or not working" },
  { value: "damaged", label: "Damaged in delivery" },
  { value: "incorrect", label: "Incorrect item received" },
  { value: "not_required", label: "No longer required" },
  { value: "ordered_in_error", label: "Ordered in error" },
  { value: "other", label: "Other" },
];

export function ReturnRequestForm() {
  const { messages } = useContent();
  const [customer, setCustomer] = useState<Customer>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState("");
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  const selectedOrder = useMemo(
    () => customer?.orders.find((order) => order.name === orderNumber) ?? null,
    [customer, orderNumber],
  );

  useEffect(() => {
    let active = true;
    async function loadCustomer() {
      try {
        const result = await getShopifyCustomer();
        if (!active) return;
        setCustomer(result);
        const requestedOrder = new URLSearchParams(window.location.search).get("order");
        const order =
          result?.orders.find(
            (candidate) =>
              candidate.name === requestedOrder ||
              String(candidate.orderNumber) === requestedOrder?.replace(/^#/, ""),
          ) ?? null;
        if (order) selectOrder(order);
      } finally {
        if (active) setAccountLoading(false);
      }
    }
    void loadCustomer();
    return () => {
      active = false;
    };
  }, []);

  function selectOrder(order: Order) {
    setOrderNumber(order.name);
    setItems(
      order.lineItems.map((line, index) => ({
        key: `${order.id}-${index}`,
        title: `${line.title}${
          line.variant?.title && line.variant.title !== "Default Title"
            ? ` (${line.variant.title})`
            : ""
        }`,
        orderedQuantity: line.quantity,
        quantity: 1,
        reason: "faulty",
        details: "",
        selected: false,
      })),
    );
  }

  function chooseOrder(value: string) {
    if (!value) {
      setOrderNumber("");
      setItems([]);
      return;
    }
    const order = customer?.orders.find((candidate) => candidate.name === value);
    if (order) selectOrder(order);
  }

  function updateItem(key: string, patch: Partial<ReturnItem>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const selectedItems = items.filter((item) => item.selected);

    if (!selectedOrder) {
      setError(messages["return.selectOrder"]);
      return;
    }
    if (selectedItems.length === 0) {
      setError(messages["return.selectItems"]);
      return;
    }

    setBusy(true);
    try {
      const result = await submitReturnRequest({
        data: {
          orderNumber,
          contactName: String(form.get("contactName") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? "") || undefined,
          company: String(form.get("company") ?? "") || undefined,
          items: selectedItems.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            orderedQuantity: item.orderedQuantity,
            reason: item.reason,
            details: item.details || undefined,
          })),
          resolution: String(form.get("resolution") ?? "refund") as
            | "refund"
            | "replacement"
            | "repair"
            | "advice",
          collectionAddress: String(form.get("collectionAddress") ?? "") || undefined,
          notes: String(form.get("notes") ?? "") || undefined,
          website: String(form.get("website") ?? ""),
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setReference(result.reference);
      window.scrollTo({
        top: document.getElementById("return-request")?.offsetTop ?? 0,
        behavior: "smooth",
      });
    } catch {
      setError(messages["return.submitFailed"]);
    } finally {
      setBusy(false);
    }
  }

  if (accountLoading) {
    return (
      <section
        id="return-request"
        className="flex items-center gap-2 border border-rule bg-surface px-4 py-12 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted md:px-8 md:py-16"
      >
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Checking your account
      </section>
    );
  }

  if (!customer) {
    return (
      <div id="return-request">
        <SignInRequired
          redirect="/returns"
          title={messages["return.signInTitle"]}
          description={messages["return.signInCopy"]}
        />
      </div>
    );
  }

  if (reference) {
    return (
      <section id="return-request" className="border border-green-600/40 bg-green-50 p-6 md:p-9">
        <CheckCircle2 aria-hidden="true" className="h-9 w-9 text-green-700" />
        <p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-green-800">
          Return request received
        </p>
        <h2 className="mt-2 font-display text-2xl font-extrabold uppercase tracking-tight">
          Your reference is {reference}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-muted">
          We have emailed your confirmation. The returns team will check your order and send
          approval and return instructions. Please do not dispatch the goods until those
          instructions arrive.
        </p>
      </section>
    );
  }

  return (
    <section
      id="return-request"
      aria-labelledby="return-request-title"
      className="border border-rule bg-surface"
    >
      <div className="grid border-b border-rule bg-ink p-6 text-white md:grid-cols-[1fr_auto] md:items-end md:p-8">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
            Online returns
          </p>
          <h2
            id="return-request-title"
            className="mt-3 font-display text-2xl font-extrabold uppercase tracking-tight md:text-3xl"
          >
            Request a return
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
            Choose one of your orders, select the exact products and quantities, and receive an
            email reference immediately followed by return instructions from the team.
          </p>
        </div>
        <PackageCheck aria-hidden="true" className="mt-5 h-9 w-9 text-accent md:mt-0" />
      </div>

      <form onSubmit={submit} className="grid gap-8 p-5 md:p-8">
        <fieldset className="grid gap-4">
          <legend className="font-display text-lg font-bold uppercase tracking-tight">
            1. Choose your order
          </legend>
          {customer.orders.length ? (
            <label className="grid gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
                Select an order *
              </span>
              <select
                value={orderNumber}
                onChange={(event) => chooseOrder(event.target.value)}
                required
                className="h-12 border border-rule bg-background px-4 text-sm text-ink outline-none focus:border-accent"
              >
                <option value="">Select an order to return</option>
                {customer.orders.map((order) => (
                  <option key={order.id} value={order.name}>
                    {order.name} ·{" "}
                    {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
                      new Date(order.processedAt),
                    )}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="border border-rule bg-background p-4 text-sm leading-6 text-ink-muted">
              There are no orders linked to your account yet, so there is nothing to return. Orders
              placed with Spares Automation will appear here.
            </p>
          )}
        </fieldset>

        {selectedOrder ? (
          <fieldset className="grid gap-4 border-t border-rule pt-8">
            <legend className="font-display text-lg font-bold uppercase tracking-tight">
              2. Items and quantities
            </legend>
            {items.map((item) => (
              <div
                key={item.key}
                className={`grid gap-4 border p-4 md:p-5 ${
                  item.selected ? "border-accent bg-accent/5" : "border-rule bg-background"
                }`}
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(event) => updateItem(item.key, { selected: event.target.checked })}
                    className="mt-1 h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>
                    <span className="block font-semibold text-ink">{item.title}</span>
                    <span className="mt-1 block text-xs text-ink-muted">
                      {item.orderedQuantity} ordered
                    </span>
                  </span>
                </label>

                {item.selected ? (
                  <div className="grid gap-4 md:grid-cols-[1fr_140px]">
                    <label className="grid gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
                        Reason for return *
                      </span>
                      <select
                        value={item.reason}
                        onChange={(event) =>
                          updateItem(item.key, { reason: event.target.value as ReturnReason })
                        }
                        className="h-12 border border-rule bg-surface px-4 text-sm outline-none focus:border-accent"
                      >
                        {REASONS.map((reason) => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
                        Quantity *
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={item.orderedQuantity}
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(item.key, {
                            quantity: Math.max(
                              1,
                              Math.min(item.orderedQuantity, Number(event.target.value) || 1),
                            ),
                          })
                        }
                        required
                        className="h-12 border border-rule bg-surface px-4 text-sm outline-none focus:border-accent"
                      />
                    </label>
                    <label className="grid gap-2 md:col-span-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
                        What happened? (optional)
                      </span>
                      <textarea
                        rows={2}
                        value={item.details}
                        onChange={(event) => updateItem(item.key, { details: event.target.value })}
                        placeholder={messages["return.notesPlaceholder"]}
                        className="resize-y border border-rule bg-surface px-4 py-3 text-sm outline-none placeholder:text-ink-muted focus:border-accent"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            ))}
          </fieldset>
        ) : null}

        <fieldset className="grid gap-4 border-t border-rule pt-8 md:grid-cols-2">
          <legend className="font-display text-lg font-bold uppercase tracking-tight">
            3. Contact and resolution
          </legend>
          <label className="grid gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
              Contact name *
            </span>
            <input
              name="contactName"
              required
              defaultValue={customer.displayName ?? ""}
              className="h-12 border border-rule bg-background px-4 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="grid gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
              Email address *
            </span>
            <input
              name="email"
              type="email"
              required
              defaultValue={customer.email ?? ""}
              className="h-12 border border-rule bg-background px-4 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="grid gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
              Phone number
            </span>
            <input
              name="phone"
              type="tel"
              defaultValue={customer.phone ?? ""}
              className="h-12 border border-rule bg-background px-4 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="grid gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
              Company
            </span>
            <input
              name="company"
              className="h-12 border border-rule bg-background px-4 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
              Preferred outcome *
            </span>
            <select
              name="resolution"
              required
              className="h-12 border border-rule bg-background px-4 text-sm outline-none focus:border-accent"
            >
              <option value="refund">Refund</option>
              <option value="replacement">Replacement</option>
              <option value="repair">Repair</option>
              <option value="advice">Advice from the returns team</option>
            </select>
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
              Collection address (if collection may be required)
            </span>
            <textarea
              name="collectionAddress"
              rows={3}
              className="resize-y border border-rule bg-background px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
              Additional notes
            </span>
            <textarea
              name="notes"
              rows={3}
              className="resize-y border border-rule bg-background px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="hidden" aria-hidden="true">
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </fieldset>

        <div className="border border-amber/40 bg-amber/10 p-4 text-sm leading-6 text-ink-muted">
          Submitting this form requests a return; it does not approve one. Keep the item and its
          packaging until the team emails return instructions. Your statutory rights are not
          affected.
        </div>
        {error ? (
          <p role="alert" className="border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <button
          disabled={busy}
          className="inline-flex h-13 items-center justify-center gap-2 bg-accent px-6 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white hover:brightness-110 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
          )}
          {busy ? messages["return.submitting"] : messages["return.submit"]}
        </button>
      </form>
    </section>
  );
}
