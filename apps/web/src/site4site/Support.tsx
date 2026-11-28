// Support (unit 31): the rules of sending a ticket, then the customer's support desk: their tickets, a
// form for a new one and the conversation with the team. Signing in is needed to send a ticket; the
// admin can stop new tickets from the panel, and open ones carry on.

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError, api, type SiteOrderSummary, type SupportInfo, type Ticket, type TicketSummary, type TicketTopic } from "../api";
import { useAuth } from "../auth";
import { OrderThread } from "../components/siteOrders";
import { TICKET_TOPIC, TicketPill } from "../components/tickets";
import { formatDate } from "../format";
import { PageHead, UnitPage } from "./Shell";
import { unitByKey } from "./units";
import "./pages.css";

const fa = (n: number) => n.toLocaleString("fa-IR");

function rules(r: SupportInfo["rules"]) {
  return [
    "برای ارسال تیکت وارد حساب کاربری شوید؛ پاسخ را همین‌جا می‌بینید و با پیامک خبرتان می‌کنیم.",
    "هر تیکت درباره‌ی یک موضوع باشد. اگر درباره‌ی سفارش است، سفارشتان را در فرم انتخاب کنید.",
    `هم‌زمان حداکثر ${fa(r.maxOpen)} تیکت باز می‌توانید داشته باشید؛ وقتی مشکل حل شد، تیکت را ببندید.`,
    `مشکل را با جزئیات بنویسید (دست‌کم ${fa(r.minText)} حرف): چه کردید، چه دیدید و انتظار چه داشتید.`,
    "پشتیبانی هر سایت تا یک ماه بعد از تحویل رایگان است.",
    "به تیکت‌ها در ساعت‌های کاری پاسخ می‌دهیم؛ پشتیبانی شبانه‌روزی نیست.",
    "رمز، کد ورود یا اطلاعات کارت بانکی را هرگز در تیکت ننویسید.",
  ];
}

export function Support() {
  const u = unitByKey("support");
  const { user, loading } = useAuth();
  const [info, setInfo] = useState<SupportInfo | null>(null);
  useEffect(() => {
    document.title = "پشتیبانی | site4site";
    api.support
      .info()
      .then(setInfo)
      .catch(() => setInfo({ ticketsEnabled: true, rules: { maxOpen: 3, minText: 10, maxText: 2000 } }));
  }, []);

  return (
    <UnitPage current="support">
      <PageHead plate={u.plate} title="پشتیبانی" sub="سؤال یا مشکلی دارید؟ تیکت بفرستید؛ جواب را همین‌جا می‌بینید." />

      <div className="sp-top">
        <div className="sp-rules ab-paper">
          <h2>شرایط ارسال تیکت</h2>
          <ol>{info && rules(info.rules).map((r) => <li key={r}>{r}</li>)}</ol>
        </div>
        <div className="sp-side">
          <div>
            <b>سؤال درباره‌ی سفارش؟</b>
            <p>پیام‌های هر سفارش در «سفارش‌های من» هم هست.</p>
            <Link to="/resume/orders" className="s4-btn ghost">
              سفارش‌های من
            </Link>
          </div>
          <div>
            <b>هنوز سفارش نداده‌اید؟</b>
            <p>قیمت و زمان بسته‌ها را در تعرفه‌ها ببینید.</p>
            <Link to="/pricing" className="s4-btn ghost">
              تعرفه‌ها
            </Link>
          </div>
        </div>
      </div>

      <h2 className="s4-h2">میز پشتیبانی</h2>
      {loading || !info ? (
        <p className="sp-empty">…</p>
      ) : !user ? (
        <div className="sp-empty">
          <b>برای ارسال تیکت وارد حساب کاربری شوید</b>
          <p>با شماره‌ی موبایل و کد پیامکی، بدون رمز.</p>
          <Link to="/login" state={{ from: "/support" }} className="s4-btn main">
            ورود / ثبت‌نام
          </Link>
        </div>
      ) : (
        <Desk info={info} />
      )}
    </UnitPage>
  );
}

/** The signed-in customer's tickets, the new-ticket form and the open conversation. */
function Desk({ info }: { info: SupportInfo }) {
  const [tickets, setTickets] = useState<TicketSummary[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [open, setOpen] = useState<Ticket | null>(null);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.support
      .list()
      .then((r) => {
        setTickets(r.tickets);
        if (r.tickets.length === 0) setWriting(true);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "خطا در بارگذاری"));
  }, []);
  useEffect(load, [load]);

  useEffect(() => {
    if (!openId) return setOpen(null);
    api.support
      .get(openId)
      .then((r) => {
        setOpen(r.ticket);
        setTickets((list) => list?.map((t) => (t.id === openId ? { ...t, unreadByUser: false } : t)) ?? list);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "تیکت پیدا نشد"));
  }, [openId]);

  const openCount = tickets?.filter((t) => t.status !== "CLOSED").length ?? 0;
  const canWrite = info.ticketsEnabled && openCount < info.rules.maxOpen;

  function changed(t: Ticket) {
    setOpen(t);
    setTickets((list) => list?.map((x) => (x.id === t.id ? { ...x, status: t.status, updatedAt: t.updatedAt } : x)) ?? list);
  }

  return (
    <div className="sp-desk">
      {!info.ticketsEnabled && <p className="sp-off">ارسال تیکت تازه فعلاً بسته است؛ تیکت‌های باز شما مثل قبل کار می‌کنند.</p>}
      {error && <p className="sp-error">{error}</p>}
      <div className="sp-layout">
        <aside className="sp-list">
          <button
            type="button"
            className="s4-btn main"
            disabled={!canWrite}
            onClick={() => {
              setOpenId(null);
              setWriting(true);
            }}
          >
            + تیکت تازه
          </button>
          {info.ticketsEnabled && openCount >= info.rules.maxOpen && <small className="sp-hint">{fa(info.rules.maxOpen)} تیکت باز دارید؛ برای تیکت تازه یکی را ببندید.</small>}
          {tickets?.length === 0 && <small className="sp-hint">هنوز تیکتی نفرستاده‌اید.</small>}
          <ul>
            {tickets?.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className={`sp-item ${t.id === openId ? "active" : ""}`}
                  onClick={() => {
                    setWriting(false);
                    setOpenId(t.id);
                  }}
                >
                  <span className="top">
                    <b>{t.subject}</b>
                    {t.unreadByUser && <i className="so-dot" aria-label="پاسخ تازه" />}
                  </span>
                  <span className="meta">
                    <TicketPill status={t.status} />
                    <small>
                      {formatDate(t.updatedAt)} · <span className="ltr">{t.code}</span>
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="sp-detail">
          {writing && canWrite ? (
            <NewTicket
              info={info}
              onDone={(t) => {
                setTickets((list) => [{ ...t, lastLine: t.messages[t.messages.length - 1] ?? null, lines: t.messages.length }, ...(list ?? [])]);
                setWriting(false);
                setOpenId(t.id);
              }}
            />
          ) : !open ? (
            <p className="sp-hint center">یک تیکت را انتخاب کنید.</p>
          ) : (
            <div className="sp-ticket">
              <div className="sp-head">
                <div>
                  <h3>{open.subject}</h3>
                  <small>
                    {TICKET_TOPIC[open.topic]}
                    {open.orderCode && (
                      <>
                        {" "}
                        · سفارش <span className="ltr">{open.orderCode}</span>
                      </>
                    )}{" "}
                    · کد <span className="ltr">{open.code}</span> · {formatDate(open.createdAt)}
                  </small>
                </div>
                <TicketPill status={open.status} />
              </div>
              <OrderThread
                lines={open.messages}
                me="customer"
                minLength={info.rules.minText}
                closed={open.status === "CLOSED" ? "این تیکت بسته شده است. برای موضوع تازه، تیکت تازه بفرستید." : undefined}
                onSend={async (text) => changed((await api.support.send(open.id, text)).ticket)}
              />
              {open.status !== "CLOSED" && (
                <button type="button" className="s4-btn ghost sp-close" onClick={async () => changed((await api.support.close(open.id)).ticket)}>
                  مشکلم حل شد، تیکت را ببند
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function NewTicket({ info, onDone }: { info: SupportInfo; onDone: (t: Ticket) => void }) {
  const [topic, setTopic] = useState<TicketTopic>("TECHNICAL");
  const [subject, setSubject] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [text, setText] = useState("");
  const [orders, setOrders] = useState<SiteOrderSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.siteOrders
      .list()
      .then((r) => setOrders(r.orders))
      .catch(() => setOrders([]));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { ticket } = await api.support.create({ topic, subject, text, orderCode: topic === "ORDER" && orderCode ? orderCode : undefined });
      onDone(ticket);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تیکت فرستاده نشد");
      setBusy(false);
    }
  }

  return (
    <form className="sp-form" onSubmit={submit}>
      <h3>تیکت تازه</h3>
      <label>
        <span>موضوع</span>
        <select value={topic} onChange={(e) => setTopic(e.target.value as TicketTopic)}>
          {Object.entries(TICKET_TOPIC).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {topic === "ORDER" && (
        <label>
          <span>کدام سفارش؟</span>
          <select value={orderCode} onChange={(e) => setOrderCode(e.target.value)}>
            <option value="">{orders.length ? "انتخاب کنید (اختیاری)" : "سفارشی ثبت نکرده‌اید"}</option>
            {orders.map((o) => (
              <option key={o.id} value={o.code}>
                {o.business || o.title} · {o.code}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        <span>عنوان</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} required minLength={3} maxLength={120} placeholder="مثلاً: پنل مدیریت باز نمی‌شود" />
      </label>
      <label>
        <span>توضیح</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          rows={6}
          minLength={info.rules.minText}
          maxLength={info.rules.maxText}
          placeholder="چه کردید، چه دیدید و انتظار چه داشتید؟"
        />
        <small>
          {fa(text.trim().length)} / {fa(info.rules.maxText)}
        </small>
      </label>
      {error && <p className="sp-error">{error}</p>}
      <button className="s4-btn main" disabled={busy || text.trim().length < info.rules.minText || subject.trim().length < 3}>
        {busy ? "در حال فرستادن…" : "فرستادن تیکت"}
      </button>
    </form>
  );
}
