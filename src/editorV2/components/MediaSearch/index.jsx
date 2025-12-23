import React, { useEffect, useMemo, useRef, useState } from "react";
import "./index.css";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const RU_WIKI_SUMMARY = "https://ru.wikipedia.org/api/rest_v1/page/summary/";
const RU_WIKI_API = "https://ru.wikipedia.org/w/api.php";
const PER_PAGE = 24;

const MODES = [
  { key: "photo", label: "Фото" },
  { key: "vector", label: "Вектор" },
  { key: "flag", label: "Флаги" },
  { key: "map", label: "Карты" },
];

function useDebounced(value, delay = 320) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function cleanText(s) { return (s || "").toString().trim().replace(/\s+/g, " ").slice(0, 180); }
function niceFileTitle(title) { return (title || "").replace(/^File:/, "").replace(/_/g, " ").trim(); }
function stripHtml(s) { return (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(); }

function safeTitleFromQuery(q) {
  const s = cleanText(q);
  if (!s) return "";
  const stop = new Set(["флаг", "герб", "карта", "фото", "png", "svg"]);
  const parts = s.toLowerCase().replace(/[^\p{L}\p{N}\s-]+/gu, " ").split(/\s+/).filter(Boolean);
  const filtered = parts.filter((w) => !stop.has(w));
  const pick = (filtered.length ? filtered : parts).sort((a, b) => b.length - a.length)[0] || "";
  return pick ? pick.charAt(0).toUpperCase() + pick.slice(1) : "";
}

function scoreItem(it, mode) {
  const w = Number(it.width || 0);
  const h = Number(it.height || 0);
  let s = Math.min((w * h) / 280000, 6.5);
  const isSvg = it.mime === "image/svg+xml";
  if (mode === "vector") s += isSvg ? 8 : -3.5;
  else if (mode === "photo") s += isSvg ? -4 : 1.2;
  const lt = (it.niceTitle || "").toLowerCase();
  if (mode === "flag" && lt.includes("flag")) s += 4.2;
  if (mode === "map" && lt.includes("map")) s += 4.2;
  return s;
}

async function commonsSearch(srsearch, page = 1) {
  const sroffset = (page - 1) * PER_PAGE;
  const url1 = new URL(COMMONS_API);
  url1.searchParams.set("action", "query");
  url1.searchParams.set("format", "json");
  url1.searchParams.set("origin", "*");
  url1.searchParams.set("list", "search");
  url1.searchParams.set("srsearch", srsearch);
  url1.searchParams.set("srnamespace", "6");
  url1.searchParams.set("srlimit", String(PER_PAGE));
  url1.searchParams.set("sroffset", String(sroffset));
  const r1 = await fetch(url1.toString());
  const j1 = await r1.json();
  const hits = j1?.query?.search || [];
  const total = j1?.query?.searchinfo?.totalhits ?? 0;
  const pageids = hits.map((h) => h.pageid).filter(Boolean);
  if (!pageids.length) return { items: [], total };
  const url2 = new URL(COMMONS_API);
  url2.searchParams.set("action", "query");
  url2.searchParams.set("format", "json");
  url2.searchParams.set("origin", "*");
  url2.searchParams.set("prop", "imageinfo|info");
  url2.searchParams.set("inprop", "url");
  url2.searchParams.set("pageids", pageids.join("|"));
  url2.searchParams.set("iiprop", "url|size|mime|extmetadata");
  url2.searchParams.set("iiurlwidth", "800");
  const r2 = await fetch(url2.toString());
  const j2 = await r2.json();
  const pages = j2?.query?.pages || {};
  const raw = Object.values(pages).map((p) => {
    const ii = p?.imageinfo?.[0];
    const meta = ii?.extmetadata || {};
    return {
      pageid: p.pageid,
      title: p.title,
      niceTitle: niceFileTitle(p.title),
      thumb: ii?.thumburl || "",
      url: ii?.url || "",
      width: ii?.width,
      height: ii?.height,
      mime: ii?.mime || "",
      licenseShort: stripHtml(meta?.LicenseShortName?.value || "CC"),
      credit: stripHtml(meta?.Credit?.value || meta?.Artist?.value || "Commons Source"),
    };
  }).filter(x => x.thumb);
  return { items: raw, total };
}

async function wikiSummaryRu(title) {
  try {
    const r = await fetch(RU_WIKI_SUMMARY + encodeURIComponent(title));
    if (!r.ok) return null;
    const j = await r.json();
    return { title: j.title, extract: j.extract, thumbnail: j.thumbnail?.source, page: j.content_urls?.desktop?.page };
  } catch { return null; }
}

export default function MediaSearch({ onBack, onPick }) {
  const [q, setQ] = useState("Таджикистан");
  const debouncedQ = useDebounced(q, 400);
  const [mode, setMode] = useState("photo");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const runIdRef = useRef(0);

  async function load(query, p) {
    const runId = ++runIdRef.current;
    setLoading(true);
    try {
      const modeQuery = mode === "photo" ? query : `${query} ${mode}`;
      const res = await commonsSearch(modeQuery, p);
      if (runId !== runIdRef.current) return;
      setItems(res.items.sort((a, b) => scoreItem(b, mode) - scoreItem(a, mode)));
      setTotal(res.total);
      const sum = await wikiSummaryRu(safeTitleFromQuery(query));
      if (runId === runIdRef.current) setInfo(sum);
    } finally {
      if (runId === runIdRef.current) setLoading(false);
    }
  }

  useEffect(() => { setPage(1); }, [debouncedQ, mode]);
  useEffect(() => { load(debouncedQ, page); }, [debouncedQ, page, mode]);

  return (
    <div className="ms-page">
      <header className="ms-topbar">
        <div className="ms-leonardo-container">
          <div className="ms-search-inner">
            <input 
              className="ms-input" 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              placeholder="Что ищем?" 
            />
            <button className="ms-btn-action" onClick={() => load(q, 1)}>Найти</button>
          </div>
        </div>

        <div className="ms-modes">
          {MODES.map(m => (
            <button key={m.key} className={`ms-chip ${mode === m.key ? 'is-active' : ''}`} onClick={() => setMode(m.key)}>
              {m.label}
            </button>
          ))}
        </div>
        <button className="ms-backBtn" onClick={onBack}>Назад</button>
      </header>

      <main className="ms-layout">
        <section className="ms-results">
          <div className="ms-toolbar">
            <span>Результатов: <b>{total}</b></span>
            <div className="ms-pager">
              <button className="ms-miniBtn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
              <button className="ms-miniBtn" onClick={() => setPage(p => p + 1)}>→</button>
            </div>
          </div>
          <div className="ms-grid">
            {loading ? Array.from({length: 12}).map((_, i) => (
              <div key={i} className="ms-card ms-skeleton" style={{height: 240}} />
            )) : items.map(it => (
              <div key={it.pageid} className="ms-card" onClick={() => setModal(it)}>
                <div className="ms-thumb"><img src={it.thumb} className="ms-img" alt="" /></div>
                <div className="ms-meta">
                  <span className="ms-label">{it.licenseShort}</span>
                  <div className="ms-name">{it.niceTitle}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="ms-side">
          <div className="ms-infoCard">
            {info ? (
              <>
                {info.thumbnail && <div className="ms-flag"><img src={info.thumbnail} className="ms-flagImg" alt="" /></div>}
                <h2 className="ms-title">{info.title}</h2>
                <p className="ms-sub">{info.extract}</p>
<a 
  href={info.page} 
  target="_blank" 
  rel="noreferrer" 
  className="ms-wiki-btn"
>
  Читать в Википедии
</a>
              </>
            ) : <div style={{opacity: 0.5}}>Инфо не найдено</div>}
          </div>
        </aside>
      </main>

      {modal && (
        <div className="ms-modalBack" onClick={() => setModal(null)}>
          <div className="ms-modal" onClick={e => e.stopPropagation()}>
            <div className="ms-modalTop">
              <div className="ms-name" style={{fontSize: 18, fontWeight: 700}}>{modal.niceTitle}</div>
              <button className="ms-use" onClick={() => { onPick(modal); setModal(null); }}>Использовать</button>
            </div>
            <div className="ms-modalImgWrap">
              <img src={modal.url} className="ms-modalImg" alt="" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}