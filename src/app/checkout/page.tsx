"use client";

import {
  Check,
  CreditCard,
  MapPin,
  PackageCheck,
  Pencil,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-provider";
import { useStore } from "@/context/store-provider";
import { shippingServices } from "@/data/shipping";
import { createOrder } from "@/features/orders/order-storage";
import { formatCurrency } from "@/lib/formatters";
import type { CustomerAddress, PaymentMethod } from "@/types/commerce";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, hydrated: authHydrated } = useAuth();
  const {
    displayLines,
    subtotal,
    clearCart,
    hydrated: cartHydrated,
  } = useStore();

  const [shippingId, setShippingId] = useState(shippingServices[0].id);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("bank-transfer");
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherCode, setVoucherCode] = useState<string>();
  const [voucherMessage, setVoucherMessage] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const shipping =
    shippingServices.find((item) => item.id === shippingId) ??
    shippingServices[0];

  const discount = useMemo(
    () =>
      voucherCode === "AQUA10"
        ? Math.min(Math.round(subtotal * 0.1), 25000)
        : 0,
    [subtotal, voucherCode],
  );

  const grandTotal = subtotal - discount + shipping.price;
  const totalItems = displayLines.reduce(
    (total, line) => total + line.quantity,
    0,
  );

  useEffect(() => {
    if (authHydrated && !user) {
      router.replace("/login?next=/checkout");
    }
  }, [authHydrated, router, user]);

  function applyVoucher() {
    const code = voucherInput.trim().toUpperCase();

    if (code === "AQUA10") {
      setVoucherCode(code);
      setVoucherMessage("Voucher AQUA10 diterapkan.");
      return;
    }

    setVoucherCode(undefined);
    setVoucherMessage("Kode tidak dikenali. Coba gunakan AQUA10.");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!displayLines.length || !user) return;

    setSubmitting(true);

    const customer: CustomerAddress = {
      ...user.profile,
      note: note.trim(),
    };

    const order = createOrder({
      customer,
      items: displayLines,
      shipping,
      paymentMethod,
      voucherCode,
      discount,
    });

    clearCart();
    router.push(
      paymentMethod === "cod"
        ? `/orders/${order.orderNumber}`
        : `/payment/${order.orderNumber}`,
    );
  }

  if (!authHydrated || !cartHydrated || !user) {
    return (
      <div className="shell loading-state">Menyiapkan checkout pelanggan...</div>
    );
  }

  if (!displayLines.length) {
    return (
      <section className="shell empty-state">
        <PackageCheck size={48} />
        <span className="section-kicker">Keranjang kosong</span>
        <h1>Belum ada produk untuk diproses.</h1>
        <p>Pilih produk terlebih dahulu sebelum melanjutkan checkout.</p>
        <Button href="/catalog">Buka katalog</Button>
      </section>
    );
  }

  return (
    <section className="checkout-page section shell">
      <div className="checkout-heading">
        <div>
          <span className="section-kicker">Checkout aman</span>
          <h1>Selesaikan pesanan</h1>
          <p>
            Alamat diambil dari profil pelanggan. Anda tidak perlu mengisi data
            penerima berulang kali.
          </p>
        </div>
        <div className="checkout-steps" aria-label="Tahapan checkout">
          <span className="complete">
            <Check size={14} /> Keranjang
          </span>
          <i />
          <span className="active">2. Checkout</span>
          <i />
          <span>3. Pembayaran</span>
        </div>
      </div>

      <form className="checkout-layout" onSubmit={handleSubmit}>
        <div className="checkout-main">
          <section className="checkout-block address-block">
            <div className="block-heading">
              <div className="block-icon">
                <MapPin size={20} />
              </div>
              <div>
                <span>ALAMAT PENGIRIMAN</span>
                <h2>Alamat utama akun</h2>
              </div>
              <Link href="/account" className="edit-link">
                <Pencil size={15} /> Ubah profil
              </Link>
            </div>

            <div className="address-sheet">
              <div className="address-sheet__person">
                <UserRound size={20} />
                <div>
                  <strong>{user.profile.fullName}</strong>
                  <span>
                    {user.profile.phone} · {user.profile.email}
                  </span>
                </div>
              </div>
              <p>
                {user.profile.address}, {user.profile.district},{" "}
                {user.profile.city}, {user.profile.province}{" "}
                {user.profile.postalCode}
              </p>
              <small>Alamat ini disalin ke invoice dan label pengiriman.</small>
            </div>

            <label className="checkout-note">
              Catatan untuk pesanan
              <textarea
                value={note}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setNote(event.target.value)
                }
                rows={3}
                placeholder="Opsional: instruksi packing atau catatan untuk kurir"
              />
            </label>
          </section>

          <section className="checkout-block">
            <div className="block-heading">
              <div className="block-icon">
                <Truck size={20} />
              </div>
              <div>
                <span>PENGIRIMAN</span>
                <h2>Pilih layanan kurir</h2>
              </div>
            </div>

            <div className="choice-list">
              {shippingServices.map((item) => {
                const active = shippingId === item.id;

                return (
                  <label
                    key={item.id}
                    className={active ? "choice-card active" : "choice-card"}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      value={item.id}
                      checked={active}
                      onChange={() => setShippingId(item.id)}
                    />
                    <span className="choice-card__mark">
                      {active && <Check size={13} />}
                    </span>
                    <div>
                      <strong>
                        {item.courier} <b>{item.service}</b>
                      </strong>
                      <p>{item.description}</p>
                      <small>Estimasi tiba {item.eta}</small>
                    </div>
                    <em>
                      {item.price === 0 ? "Gratis" : formatCurrency(item.price)}
                    </em>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="checkout-block">
            <div className="block-heading">
              <div className="block-icon">
                <CreditCard size={20} />
              </div>
              <div>
                <span>PEMBAYARAN</span>
                <h2>Pilih metode pembayaran</h2>
              </div>
            </div>

            <div className="payment-choices">
              <label
                className={paymentMethod === "bank-transfer" ? "active" : ""}
              >
                <input
                  type="radio"
                  checked={paymentMethod === "bank-transfer"}
                  onChange={() => setPaymentMethod("bank-transfer")}
                />
                <span>
                  Transfer Bank
                  <small>Virtual account</small>
                </span>
                <b>VA</b>
              </label>

              <label className={paymentMethod === "qris" ? "active" : ""}>
                <input
                  type="radio"
                  checked={paymentMethod === "qris"}
                  onChange={() => setPaymentMethod("qris")}
                />
                <span>
                  QRIS
                  <small>Pembayaran kode QR</small>
                </span>
                <b>QR</b>
              </label>

              <label className={paymentMethod === "cod" ? "active" : ""}>
                <input
                  type="radio"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <span>
                  Bayar di Tempat
                  <small>COD saat paket diterima</small>
                </span>
                <b>COD</b>
              </label>
            </div>
          </section>
        </div>

        <aside className="checkout-summary summary-card">
          <div className="summary-title">
            <span>RINGKASAN PESANAN</span>
            <strong>{totalItems} barang</strong>
          </div>

          <div className="checkout-items">
            {displayLines.map((line) => (
              <article key={line.product.id}>
                <img src={line.product.image} alt="" />
                <div>
                  <strong>{line.product.shortName}</strong>
                  <span>
                    {line.quantity} × {formatCurrency(line.unitPrice)}
                  </span>
                </div>
                <b>{formatCurrency(line.subtotal)}</b>
              </article>
            ))}
          </div>

          <div className="voucher-field">
            <input
              value={voucherInput}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setVoucherInput(event.target.value)
              }
              placeholder="Kode promo"
            />
            <button type="button" onClick={applyVoucher}>
              Terapkan
            </button>
          </div>

          {voucherMessage && (
            <p
              className={
                voucherCode ? "voucher-message success" : "voucher-message"
              }
            >
              {voucherMessage}
            </p>
          )}

          <div className="price-lines">
            <div>
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <div>
              <span>Diskon</span>
              <strong>-{formatCurrency(discount)}</strong>
            </div>
            <div>
              <span>Pengiriman</span>
              <strong>
                {shipping.price === 0
                  ? "Gratis"
                  : formatCurrency(shipping.price)}
              </strong>
            </div>
          </div>

          <div className="summary-card__total">
            <span>Total pembayaran</span>
            <strong>{formatCurrency(grandTotal)}</strong>
          </div>

          <button
            className="button button--primary full-width"
            disabled={submitting}
          >
            {submitting ? "Membuat pesanan..." : "Buat pesanan"}
          </button>

          <div className="summary-security">
            <ShieldCheck size={16} />
            <span>
              Pembayaran pada versi pratinjau belum terhubung ke payment gateway.
            </span>
          </div>
        </aside>
      </form>
    </section>
  );
}
