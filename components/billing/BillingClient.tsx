'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatINR, formatDateTime } from '@/lib/format';
import { PAYMENT_MODES, type PaymentMode } from '@/lib/constants';
import { createBill, type Invoice } from '@/app/(app)/billing/actions';

interface LookupItem {
  id: string;
  dress_id: string;
  name: string;
  price: number;
  images: string[];
  availability: string;
}
interface CartRow {
  item: LookupItem;
  quantity: number;
}

const MODE_LABEL: Record<PaymentMode, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  net_banking: 'Net Banking',
};

export function BillingClient({ taxPercent, prefillDressId }: { taxPercent: number; prefillDressId: string }) {
  const [dressId, setDressId] = useState('');
  const [cart, setCart] = useState<CartRow[]>([]);
  const [lookupError, setLookupError] = useState('');
  const [adding, setAdding] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  const subtotal = cart.reduce((s, r) => s + r.item.price * r.quantity, 0);
  const tax = Math.round(subtotal * (taxPercent / 100));
  const total = subtotal + tax;

  async function addByDressId(id: string) {
    const q = id.trim();
    if (!q) return;
    setLookupError('');
    setAdding(true);
    try {
      const res = await fetch(`/api/inventory/lookup?dressId=${encodeURIComponent(q)}`);
      const body = await res.json();
      if (!body.ok) {
        setLookupError(body.error);
        return;
      }
      const item = body.data as LookupItem;
      setCart((prev) => {
        const i = prev.findIndex((r) => r.item.id === item.id);
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i], quantity: next[i].quantity + 1 };
          return next;
        }
        return [...prev, { item, quantity: 1 }];
      });
      setDressId('');
    } catch {
      setLookupError('Lookup failed. Try again.');
    } finally {
      setAdding(false);
    }
  }

  const prefilled = useRef(false);
  useEffect(() => {
    if (prefillDressId && !prefilled.current) {
      prefilled.current = true;
      void addByDressId(prefillDressId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillDressId]);

  function setQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((r) => (r.item.id === id ? { ...r, quantity: r.quantity + delta } : r))
        .filter((r) => r.quantity > 0),
    );
  }

  async function finalise() {
    setError('');
    setSaving(true);
    try {
      const result = await createBill({
        items: cart.map((r) => ({ dressId: r.item.dress_id, quantity: r.quantity })),
        paymentMode,
        paymentRef: paymentRef || undefined,
        customerName: customerName || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInvoice(result.data);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function newBill() {
    setInvoice(null);
    setCart([]);
    setDressId('');
    setPaymentRef('');
    setCustomerName('');
    setPaymentMode('cash');
    setError('');
  }

  if (invoice) return <InvoiceView invoice={invoice} onNew={newBill} />;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      {/* Cart */}
      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold text-ink">Cart</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void addByDressId(dressId);
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1">
            <Input
              label="Dress ID"
              value={dressId}
              onChange={(e) => setDressId(e.target.value)}
              placeholder="e.g. SARE-0001"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={adding}>
            {adding ? 'Adding…' : 'Add'}
          </Button>
        </form>
        {lookupError && <p className="text-sm text-status-danger">{lookupError}</p>}

        {cart.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">Add items by dress ID to start a bill.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {cart.map((r) => (
              <div key={r.item.id} className="flex items-center gap-3 py-3">
                {r.item.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.item.images[0]} alt="" className="h-12 w-12 rounded object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded bg-surface-soft" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{r.item.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="dress-id">{r.item.dress_id}</Badge>
                    {r.item.availability === 'out_of_stock' && <Badge variant="danger">Out of stock</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQty(r.item.id, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded border border-border text-ink-secondary"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{r.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQty(r.item.id, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded border border-border text-ink-secondary"
                  >
                    +
                  </button>
                </div>
                <p className="w-24 text-right text-sm font-semibold text-ink">
                  {formatINR(r.item.price * r.quantity)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Payment */}
      <Card className="flex h-fit flex-col gap-4">
        <h2 className="font-display text-lg font-semibold text-ink">Payment</h2>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPaymentMode(m)}
              className={`rounded-[--radius-button] border px-3 py-2.5 text-sm font-medium transition-colors ${
                paymentMode === m ? 'border-primary bg-primary-soft text-primary' : 'border-border text-ink-secondary'
              }`}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>

        {paymentMode === 'cash' && (
          <Input label="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        )}
        {paymentMode === 'upi' && (
          <Input
            label="Transaction last 4 digits"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            maxLength={4}
          />
        )}
        {paymentMode === 'card' && (
          <Input
            label="Card last 4 digits"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            maxLength={4}
          />
        )}

        <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
          <Row label="Subtotal" value={formatINR(subtotal)} />
          <Row label={`Tax (${taxPercent}%)`} value={formatINR(tax)} />
          <div className="mt-1 flex justify-between border-t border-border pt-2 text-base font-bold text-ink">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-status-danger">{error}</p>}
        <Button onClick={finalise} disabled={cart.length === 0 || saving}>
          {saving ? 'Saving…' : 'Finalise Bill'}
        </Button>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-secondary">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function InvoiceView({ invoice, onNew }: { invoice: Invoice; onNew: () => void }) {
  return (
    <Card className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-ink">Invoice #{invoice.billNumber}</h2>
        <Badge variant={`pay-${invoice.paymentMode === 'net_banking' ? 'netbanking' : invoice.paymentMode}` as 'pay-cash'}>
          {invoice.paymentMode.replace('_', ' ')}
        </Badge>
      </div>
      <p className="text-xs text-ink-muted">{formatDateTime(invoice.createdAt)}</p>

      <div className="flex flex-col divide-y divide-border">
        {invoice.lines.map((l) => (
          <div key={l.dress_id} className="flex items-center justify-between py-2 text-sm">
            <div>
              <p className="font-medium text-ink">{l.name}</p>
              <p className="text-xs text-ink-muted">
                {l.dress_id} · {l.quantity} × {formatINR(l.unit_price)}
              </p>
            </div>
            <span className="font-semibold text-ink">{formatINR(l.total)}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
        <Row label="Subtotal" value={formatINR(invoice.subtotal)} />
        <Row label="Tax" value={formatINR(invoice.tax)} />
        <div className="mt-1 flex justify-between border-t border-border pt-2 text-base font-bold text-ink">
          <span>Total</span>
          <span>{formatINR(invoice.total)}</span>
        </div>
      </div>

      {invoice.customerName && <p className="text-sm text-ink-secondary">Customer: {invoice.customerName}</p>}
      {invoice.paymentRef && <p className="text-sm text-ink-secondary">Ref: ****{invoice.paymentRef}</p>}

      <Button onClick={onNew}>New Bill</Button>
    </Card>
  );
}
