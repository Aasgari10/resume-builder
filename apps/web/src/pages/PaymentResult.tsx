// Landing page after the payment gateway. The server has already verified the payment;
// this page only reads the order status.

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError, api, type Order } from "../api";
import { formatToman, readReturnPath } from "../format";

export function PaymentResult() {
  const [params] = useSearchParams();
  const orderId = params.get("order");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(params.get("error") ? "پرداخت پیدا نشد." : null);
  const [returnPath] = useState(readReturnPath);

  useEffect(() => {
    if (!orderId) {
      setError((e) => e ?? "سفارشی مشخص نشده است.");
      return;
    }
    api
      .getOrder(orderId)
      .then(({ order }) => setOrder(order))
      .catch((e) => setError(e instanceof ApiError ? e.message : "خطا در دریافت وضعیت پرداخت"));
  }, [orderId]);

  const back = (
    <Link to={returnPath} className="btn">
      {returnPath === "/dashboard" ? "رفتن به داشبورد" : "بازگشت به ویرایشگر"}
    </Link>
  );

  if (error) {
    return (
      <div className="card narrow center stack">
        <p className="error">{error}</p>
        {back}
      </div>
    );
  }
  if (!order) return <p className="center muted">در حال بررسی پرداخت…</p>;

  const paid = order.status === "PAID";
  return (
    <div className="card narrow center stack payment-result">
      <div className={`payment-icon ${paid ? "ok" : "fail"}`} aria-hidden>
        {paid ? "✓" : "✕"}
      </div>
      <h2>{paid ? "پرداخت موفق بود" : order.status === "PENDING" ? "پرداخت هنوز تأیید نشده" : "پرداخت انجام نشد"}</h2>
      {order.template && (
        <p>
          قالب «{order.template.name}» · {formatToman(order.amount)}
        </p>
      )}
      {paid ? (
        <>
          {order.refId && (
            <p className="muted">
              کد پیگیری: <span className="ltr">{order.refId}</span>
            </p>
          )}
          <p>قالب فعال شد و حالا می‌توانید سایت را با آن منتشر کنید.</p>
        </>
      ) : (
        <p className="muted">اگر مبلغی از حساب شما کم شده، طبق قوانین بانکی حداکثر تا ۷۲ ساعت بعد برمی‌گردد.</p>
      )}
      {back}
    </div>
  );
}
