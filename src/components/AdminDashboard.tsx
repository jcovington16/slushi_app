"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  DollarSign,
  LogOut,
  PackageCheck,
  Search,
  ShieldAlert,
  Truck,
  XCircle
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import {
  canCompleteOrder,
  formatOrderStatus,
  nextOperationalStatus,
  orderStatuses,
  paymentTone,
  statusTone
} from "@/lib/order-status";

type DashboardOrder = {
  id: string;
  customerName: string;
  phone: string;
  streetAddress: string;
  houseNumber: string;
  deliveryMethod: string;
  notes: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  containsAdultBooster: boolean;
  idVerificationStatus: string;
  adultAdminApproved: boolean;
  createdAt: string;
  items: { flavor: { name: string }; size: string; quantity: number }[];
};

type FlavorRow = {
  id: string;
  name: string;
  priceSmall: number;
  priceMedium: number;
  priceLarge: number;
  isAvailable: boolean;
};

type AddOnRow = { id: string; name: string; price: number; type: string; isAvailable: boolean };

type Props = {
  orders: DashboardOrder[];
  flavors: FlavorRow[];
  addOns: AddOnRow[];
  allowedStreets: string[];
  dailySales: number;
  popularFlavors: { name: string; count: number }[];
  unpaidCount: number;
};

const filters = ["ACTIVE", "ALL", ...orderStatuses, "UNPAID"];
const activeStatuses = ["NEW", "PREPARING", "READY", "OUT_FOR_DELIVERY"];

export function AdminDashboard(props: Props) {
  const [orders, setOrders] = useState(props.orders);
  const [flavors, setFlavors] = useState(props.flavors);
  const [addOns, setAddOns] = useState(props.addOns);
  const [streets, setStreets] = useState(props.allowedStreets);
  const [newStreet, setNewStreet] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [editingFlavor, setEditingFlavor] = useState<FlavorRow | null>(null);
  const [editingAddOn, setEditingAddOn] = useState<AddOnRow | null>(null);

  const activeOrders = orders.filter((order) => activeStatuses.includes(order.status));
  const readyOrders = orders.filter((order) => order.status === "READY" || order.status === "OUT_FOR_DELIVERY");
  const unpaidOrders = orders.filter((order) => order.paymentStatus === "PENDING");
  const completeToday = orders.filter((order) => order.status === "COMPLETE").length;

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && activeStatuses.includes(order.status)) ||
        (statusFilter === "UNPAID" && order.paymentStatus === "PENDING") ||
        order.status === statusFilter;
      const haystack = `${order.customerName} ${order.phone} ${order.houseNumber} ${order.streetAddress} ${order.items
        .map((item) => item.flavor.name)
        .join(" ")}`.toLowerCase();
      return matchesStatus && haystack.includes(query.toLowerCase());
    });
  }, [orders, query, statusFilter]);

  async function updateOrder(id: string, body: Record<string, unknown>, successMessage?: string) {
    const order = orders.find((item) => item.id === id);
    if (body.status === "COMPLETE" && order) {
      const completionCheck = canCompleteOrder(order);
      if (!completionCheck.ok) {
        setNotice(completionCheck.reason);
        return;
      }
    }

    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (response.ok) {
      setOrders((current) => current.map((item) => (item.id === id ? { ...item, ...data.order } : item)));
      setNotice(successMessage ?? "Order updated.");
    } else {
      setNotice(data.error ?? "Could not update order.");
    }
  }

  async function advanceOrder(order: DashboardOrder) {
    const nextStatus = nextOperationalStatus(order.status, order.deliveryMethod);
    if (!nextStatus) return;
    await updateOrder(order.id, { status: nextStatus }, `Moved to ${formatOrderStatus(nextStatus)}.`);
  }

  async function cancelOrder(order: DashboardOrder) {
    if (!confirm(`Cancel order #${shortId(order.id)} for ${order.customerName}?`)) return;
    await updateOrder(order.id, { status: "CANCELLED" }, "Order cancelled.");
  }

  async function markPaid(order: DashboardOrder) {
    if (!confirm(`Mark ${order.customerName}'s ${formatMoney(order.total)} ${prettyPayment(order.paymentMethod)} order as paid?`)) return;
    const response = await fetch(`/api/admin/payments/${order.id}/mark-paid`, { method: "POST" });
    const data = await response.json();
    if (response.ok) {
      setOrders((current) => current.map((item) => (item.id === order.id ? { ...item, paymentStatus: "PAID" } : item)));
      setNotice("Payment marked paid.");
    } else {
      setNotice(data.error ?? "Could not mark payment paid.");
    }
  }

  async function updateFlavor(id: string, isAvailable: boolean) {
    await fetch("/api/admin/flavors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isAvailable })
    });
    setFlavors((current) => current.map((flavor) => (flavor.id === id ? { ...flavor, isAvailable } : flavor)));
  }

  async function saveFlavorPrices(flavor: FlavorRow) {
    await fetch("/api/admin/flavors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: flavor.id,
        prices: { priceSmall: flavor.priceSmall, priceMedium: flavor.priceMedium, priceLarge: flavor.priceLarge }
      })
    });
    setFlavors((current) => current.map((item) => (item.id === flavor.id ? flavor : item)));
    setEditingFlavor(null);
    setNotice(`${flavor.name} prices updated.`);
  }

  async function updateAddOn(id: string, isAvailable: boolean) {
    await fetch("/api/admin/add-ons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isAvailable })
    });
    setAddOns((current) => current.map((addOn) => (addOn.id === id ? { ...addOn, isAvailable } : addOn)));
  }

  async function saveAddOnPrice(addOn: AddOnRow) {
    await fetch("/api/admin/add-ons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: addOn.id, price: addOn.price })
    });
    setAddOns((current) => current.map((item) => (item.id === addOn.id ? addOn : item)));
    setEditingAddOn(null);
    setNotice(`${addOn.name} price updated.`);
  }

  async function saveStreets(next: string[]) {
    setStreets(next);
    await fetch("/api/admin/allowed-streets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streets: next })
    });
    setNotice("Allowed streets updated.");
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-5 px-4 pb-20 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-5">
        <div className="rounded-[2rem] bg-white p-4 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-berry">Command center</p>
              <h1 className="text-3xl font-black text-ink">Today&apos;s Slushi Run</h1>
              <p className="mt-1 font-bold text-ink/65">Keep orders moving from new to complete.</p>
            </div>
            {notice && (
              <button
                type="button"
                onClick={() => setNotice("")}
                className="focus-ring rounded-2xl bg-bubble/10 px-4 py-3 text-left text-sm font-black text-grape"
              >
                {notice}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric icon={<DollarSign size={19} />} label="Sales" value={formatMoney(props.dailySales)} />
          <Metric icon={<Clock3 size={19} />} label="Active" value={String(activeOrders.length)} />
          <Metric icon={<Truck size={19} />} label="Ready" value={String(readyOrders.length)} />
          <Metric icon={<PackageCheck size={19} />} label="Done" value={String(completeToday)} />
        </div>

        <div className="rounded-[2rem] bg-white p-4 shadow-soft">
          <div className="mb-4 flex flex-col gap-3">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 text-grape" size={18} />
              <input
                className="focus-ring w-full rounded-2xl border-2 border-purple-100 py-3 pl-10 pr-3"
                placeholder="Search name, phone, address, or flavor"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`focus-ring shrink-0 rounded-full px-4 py-2 text-sm font-black ${
                    statusFilter === filter ? "bg-grape text-white" : "bg-purple-50 text-grape"
                  }`}
                >
                  {filter === "ACTIVE" ? "Active" : filter === "ALL" ? "All" : filter === "UNPAID" ? `Unpaid (${unpaidOrders.length})` : formatOrderStatus(filter)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {filteredOrders.length === 0 && (
              <div className="rounded-3xl bg-purple-50 p-5 text-center font-bold text-ink/65">No orders match this view.</div>
            )}
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAdvance={() => advanceOrder(order)}
                onCancel={() => cancelOrder(order)}
                onMarkPaid={() => markPaid(order)}
                onUpdate={(body, message) => updateOrder(order.id, body, message)}
              />
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <Panel title="Unpaid Orders" kicker={`${unpaidOrders.length} need review`}>
          {unpaidOrders.length === 0 ? (
            <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">All manual payments are caught up.</p>
          ) : (
            unpaidOrders.slice(0, 5).map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setStatusFilter("UNPAID")}
                className="focus-ring flex w-full items-center justify-between gap-3 rounded-2xl bg-amber-50 px-3 py-2 text-left font-bold text-amber-900"
              >
                <span>{order.customerName}</span>
                <span>{formatMoney(order.total)}</span>
              </button>
            ))
          )}
        </Panel>

        <Panel title="Flavors" kicker="Availability and prices">
          {flavors.map((flavor) => (
            <InventoryRow
              key={flavor.id}
              title={flavor.name}
              detail={`${formatMoney(flavor.priceSmall)} / ${formatMoney(flavor.priceMedium)} / ${formatMoney(flavor.priceLarge)}`}
              checked={flavor.isAvailable}
              onChange={(checked) => updateFlavor(flavor.id, checked)}
              onEdit={() => setEditingFlavor(flavor)}
            />
          ))}
        </Panel>

        <Panel title="Add-ons" kicker="Extras and toppings">
          {addOns.map((addOn) => (
            <InventoryRow
              key={addOn.id}
              title={addOn.name}
              detail={`${formatMoney(addOn.price)} · ${addOn.type.toLowerCase().replaceAll("_", " ")}`}
              checked={addOn.isAvailable}
              onChange={(checked) => updateAddOn(addOn.id, checked)}
              onEdit={() => setEditingAddOn(addOn)}
            />
          ))}
        </Panel>

        <Panel title="Allowed Streets" kicker="Neighborhood only">
          <div className="flex gap-2">
            <input
              className="focus-ring min-w-0 flex-1 rounded-2xl border-2 border-purple-100 px-3 py-2"
              value={newStreet}
              onChange={(event) => setNewStreet(event.target.value)}
              placeholder="Main Street"
            />
            <button
              type="button"
              className="focus-ring rounded-2xl bg-berry px-4 py-2 font-black text-white"
              onClick={() => {
                if (newStreet.trim()) {
                  void saveStreets([...streets, newStreet.trim()]);
                  setNewStreet("");
                }
              }}
            >
              Add
            </button>
          </div>
          <div className="mt-3 grid gap-2">
            {streets.map((street) => (
              <button
                key={street}
                type="button"
                onClick={() => saveStreets(streets.filter((item) => item !== street))}
                className="focus-ring rounded-2xl bg-purple-50 px-3 py-2 text-left font-bold text-grape"
              >
                Remove {street}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Popular Flavors" kicker="All-time count">
          {props.popularFlavors.length === 0 ? (
            <p className="rounded-2xl bg-purple-50 p-3 text-sm font-bold text-ink/65">Popular flavors will appear after orders come in.</p>
          ) : (
            props.popularFlavors.map((flavor) => (
              <div key={flavor.name} className="flex justify-between rounded-2xl bg-bubble/10 px-3 py-2 font-bold">
                <span>{flavor.name}</span>
                <span>{flavor.count}</span>
              </div>
            ))
          )}
        </Panel>

        <button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            window.location.reload();
          }}
          className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 font-black text-white"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      {editingFlavor && (
        <PriceModal title={`Edit ${editingFlavor.name}`} onClose={() => setEditingFlavor(null)}>
          <NumberInput label="Small" value={editingFlavor.priceSmall} onChange={(priceSmall) => setEditingFlavor({ ...editingFlavor, priceSmall })} />
          <NumberInput label="Medium" value={editingFlavor.priceMedium} onChange={(priceMedium) => setEditingFlavor({ ...editingFlavor, priceMedium })} />
          <NumberInput label="Large" value={editingFlavor.priceLarge} onChange={(priceLarge) => setEditingFlavor({ ...editingFlavor, priceLarge })} />
          <button className="focus-ring mt-4 w-full rounded-2xl bg-grape px-4 py-3 font-black text-white" onClick={() => saveFlavorPrices(editingFlavor)}>
            Save Prices
          </button>
        </PriceModal>
      )}

      {editingAddOn && (
        <PriceModal title={`Edit ${editingAddOn.name}`} onClose={() => setEditingAddOn(null)}>
          <NumberInput label="Price" value={editingAddOn.price} onChange={(price) => setEditingAddOn({ ...editingAddOn, price })} />
          <button className="focus-ring mt-4 w-full rounded-2xl bg-grape px-4 py-3 font-black text-white" onClick={() => saveAddOnPrice(editingAddOn)}>
            Save Price
          </button>
        </PriceModal>
      )}
    </section>
  );
}

function OrderCard({
  order,
  onAdvance,
  onCancel,
  onMarkPaid,
  onUpdate
}: {
  order: DashboardOrder;
  onAdvance: () => void;
  onCancel: () => void;
  onMarkPaid: () => void;
  onUpdate: (body: Record<string, unknown>, message?: string) => void;
}) {
  const nextStatus = nextOperationalStatus(order.status, order.deliveryMethod);
  const completionCheck = canCompleteOrder(order);
  const canMarkPaid = order.paymentStatus !== "PAID" && order.paymentMethod !== "APPLE_PAY_CARD";

  return (
    <article className="rounded-3xl border-2 border-purple-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-ink">{order.customerName}</h2>
            <Pill className={statusTone(order.status)}>{formatOrderStatus(order.status)}</Pill>
            <Pill className={paymentTone(order.paymentStatus)}>{order.paymentStatus.toLowerCase()}</Pill>
          </div>
          <p className="mt-1 text-sm font-bold text-ink/65">
            #{shortId(order.id)} · {order.phone}
          </p>
          <p className="text-sm font-bold text-ink/65">
            {order.deliveryMethod === "DELIVERY" ? "Deliver" : "Pickup"} · {order.houseNumber} {order.streetAddress}
          </p>
        </div>
        <span className="rounded-full bg-bubble/20 px-3 py-1 text-sm font-black text-grape">{formatMoney(order.total)}</span>
      </div>

      <div className="mt-3 rounded-2xl bg-purple-50 p-3">
        <p className="text-sm font-black text-grape">Items</p>
        <p className="font-bold text-ink">
          {order.items.map((item) => `${item.quantity} ${item.size.toLowerCase()} ${item.flavor.name}`).join(", ")}
        </p>
        {order.notes && <p className="mt-1 text-sm font-bold text-ink/65">Note: {order.notes}</p>}
      </div>

      {order.containsAdultBooster && (
        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-black text-amber-800">
          <div className="flex items-center gap-2">
            <ShieldAlert size={17} />
            Adult booster: ID {order.idVerificationStatus.toLowerCase()}, approval {order.adultAdminApproved ? "yes" : "needed"}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => onUpdate({ idVerificationStatus: "VERIFIED" }, "ID marked verified.")} className="focus-ring rounded-full bg-white px-3 py-1 text-amber-900">
              Mark ID Verified
            </button>
            <button type="button" onClick={() => onUpdate({ adultAdminApproved: true }, "Adult approval recorded.")} className="focus-ring rounded-full bg-white px-3 py-1 text-amber-900">
              Adult Approve
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {nextStatus && (
          <button
            type="button"
            onClick={onAdvance}
            disabled={nextStatus === "COMPLETE" && !completionCheck.ok}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-grape px-3 py-3 font-black text-white disabled:bg-purple-200 disabled:text-grape"
            title={nextStatus === "COMPLETE" && !completionCheck.ok ? completionCheck.reason : undefined}
          >
            <CheckCircle2 size={18} />
            {nextStatus === "COMPLETE" ? "Mark Complete" : `Move to ${formatOrderStatus(nextStatus)}`}
          </button>
        )}
        {canMarkPaid && (
          <button type="button" onClick={onMarkPaid} className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-3 py-3 font-black text-white">
            <DollarSign size={18} />
            Mark Paid
          </button>
        )}
        {order.status !== "CANCELLED" && order.status !== "COMPLETE" && (
          <button type="button" onClick={onCancel} className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-pink-100 px-3 py-3 font-black text-pink-700">
            <XCircle size={18} />
            Cancel
          </button>
        )}
      </div>
      {nextStatus === "COMPLETE" && !completionCheck.ok && (
        <p className="mt-2 rounded-2xl bg-amber-50 p-2 text-sm font-bold text-amber-800">{completionCheck.reason}</p>
      )}
    </article>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-soft">
      <div className="mb-2 inline-grid h-9 w-9 place-items-center rounded-2xl bg-bubble/20 text-grape">{icon}</div>
      <p className="text-xs font-black uppercase text-grape">{label}</p>
      <p className="text-2xl font-black text-ink">{value}</p>
    </div>
  );
}

function Panel({ title, kicker, children }: { title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] bg-white p-4 shadow-soft">
      <div className="mb-3">
        <h2 className="text-xl font-black">{title}</h2>
        {kicker && <p className="text-sm font-bold text-ink/60">{kicker}</p>}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function InventoryRow({
  title,
  detail,
  checked,
  onChange,
  onEdit
}: {
  title: string;
  detail: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-2xl bg-purple-50 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-ink">{title}</p>
          <p className="text-sm font-bold text-ink/60">{detail}</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-black text-grape">
          <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
          {checked ? "On" : "Off"}
        </label>
      </div>
      <button type="button" onClick={onEdit} className="focus-ring mt-2 rounded-full bg-white px-3 py-1 text-sm font-black text-grape">
        Edit price
      </button>
    </div>
  );
}

function PriceModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/35 p-4 sm:place-items-center">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="focus-ring rounded-full bg-purple-50 px-3 py-1 font-black text-grape">
            Close
          </button>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black text-grape">{label}</span>
      <input
        type="number"
        min="0"
        step="0.25"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="focus-ring w-full rounded-2xl border-2 border-purple-100 px-4 py-3 font-bold"
      />
    </label>
  );
}

function Pill({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${className}`}>{children}</span>;
}

function shortId(id: string) {
  return id.slice(-6).toUpperCase();
}

function prettyPayment(method: string) {
  return method.replaceAll("_", " ").toLowerCase();
}
