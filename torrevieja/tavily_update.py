#!/usr/bin/env python3
import json, os, re, urllib.request, urllib.parse
from datetime import datetime, timezone
from pathlib import Path

API_URL = "https://api.tavily.com/search"
OUT = Path(__file__).with_name("data.json")
API_KEY = os.environ.get("TAVILY_API_KEY", "").strip()
if not API_KEY:
    raise SystemExit("TAVILY_API_KEY missing")

QUERIES = [
    '"Torrevieja" ("looking to buy" OR "want to buy" OR "buying apartment" OR "moving to Torrevieja") property',
    '"Torrevieja" ("busco comprar" OR "quiero comprar" OR "queremos comprar" OR "invertir en vivienda")',
    '"Torrevieja" ("property investment" OR "real estate investment" OR "cash investor" OR "capital to invest")',
    '"Torrevieja" ("acheter un appartement" OR "acheter une maison" OR "je cherche à acheter" OR "nous voulons acheter" OR "investir dans l immobilier")',
    '"Torrevieja" ("köpa lägenhet" OR "köpa bostad" OR "investera fastighet")',
    '"Torrevieja" ("kupić mieszkanie" OR "kupić nieruchomość" OR "inwestycja nieruchomości")',
    '"Torrevieja" ("kjøpe leilighet" OR "kjøpe bolig" OR "eiendomsinvestering")',
    '"Torrevieja" ("купить квартиру" OR "купить недвижимость" OR "инвестиции в недвижимость")',
    '"Torrevieja" ("купити квартиру" OR "купити нерухомість" OR "інвестиції в нерухомість")'
]

STRONG_DIRECT = re.compile(
    r"(looking to buy|want to buy|we want to buy|planning to buy|i am buying|we are buying|"
    r"busco comprar|quiero comprar|queremos comprar|estoy buscando comprar|"
    r"je cherche.{0,40}acheter|je veux acheter|nous voulons acheter|nous cherchons.{0,40}acheter|"
    r"cerco.*comprare|voglio comprare|"
    r"chc[eę].*kupi[cć]|szukam.*kupi[cć]|"
    r"jeg vil.*kj[oø]pe|vi vil.*kj[oø]pe|"
    r"jag vill.*k[oö]pa|vi vill.*k[oö]pa|"
    r"хочу.*купить|ищу.*купить|шукаю.*купити|хочемо.*купити)", re.I)
INVESTOR_DIRECT = re.compile(
    r"(i have|we have|available capital|cash available|capital to invest|liquidity to invest|"
    r"tengo.*(?:capital|liquidez|dinero).*invert|tenemos.*(?:capital|liquidez|dinero).*invert|"
    r"busco.*invertir|quiero.*invertir|queremos.*invertir|"
    r"j ai.*(?:capital|liquidit).{0,40}invest|nous avons.*(?:capital|liquidit).{0,40}invest|je cherche.*investir|je veux.*investir|"
    r"mam.*kapita.*inwest|har.*kapital.*invest|имею.*капитал.*инвест|маю.*капітал.*інвест)", re.I)
INVEST = re.compile(r"\b(invest|investment|investor|capital|cash|liquidity|yield|roi|invertir|inversi[oó]n|inversor|liquidez|investir|investissement|investisseur|liquidit[eé]|investera|inwest|инвест|інвест)\b", re.I)
EMAIL = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
MONEY = re.compile(r"(?:€|EUR\s*|£|GBP\s*|\$|USD\s*)?\s*([1-9]\d{1,3}(?:[.,]\d{3})+|[1-9]\d{4,5})(?:\s*(?:-|–|to|a|à)\s*(?:€|EUR\s*|£|GBP\s*|\$|USD\s*)?\s*([1-9]\d{1,3}(?:[.,]\d{3})+|[1-9]\d{4,5}))?|([1-9]\d{2,3})\s*k\b", re.I)
EXCLUDE_TITLE = re.compile(r"\b(for sale|en venta|à vendre|property for sale|properties for sale|good time to buy|buen momento para comprar|bon moment pour acheter|market report|guide|news|blog)\b", re.I)


def tavily(query):
    payload = json.dumps({
        "query": query,
        "search_depth": "advanced",
        "max_results": 10,
        "topic": "general",
        "time_range": "month",
        "include_answer": False,
        "include_raw_content": False,
        "include_images": False,
        "safe_search": True
    }).encode()
    req = urllib.request.Request(API_URL, data=payload, method="POST", headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "TorreviejaLeadMonitor/1.2"
    })
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.load(r)


def parse_amount(raw):
    if not raw:
        return None
    raw = raw.replace(".", "").replace(",", "")
    try:
        return int(raw)
    except ValueError:
        return None


def budget_range(text):
    vals=[]
    for m in MONEY.finditer(text):
        if m.group(3):
            vals.append(int(m.group(3))*1000)
        else:
            for g in (m.group(1), m.group(2)):
                n=parse_amount(g)
                if n: vals.append(n)
    vals=[n for n in vals if 100000 <= n <= 500000]
    if not vals:
        return None, None
    return min(vals), max(vals)


def direct_intent(text):
    return bool(STRONG_DIRECT.search(text) or INVESTOR_DIRECT.search(text))


def score(text, url):
    s=30 if "torrevieja" in text.lower() else 0
    if STRONG_DIRECT.search(text): s += 35
    if INVESTOR_DIRECT.search(text): s += 35
    if INVEST.search(text): s += 10
    bmin,bmax=budget_range(text)
    if bmin or bmax: s += 15
    if any(x in url.lower() for x in ["facebook.com/groups/", "reddit.com/r/", "forum", "expat"]): s += 10
    return min(s,100)


def classify(item):
    title=item.get("title") or ""
    content=item.get("content") or ""
    url=item.get("url") or ""
    text=f"{title}\n{content}"
    if EXCLUDE_TITLE.search(title) and not direct_intent(content):
        return None
    if not direct_intent(text):
        return None
    sc=score(text,url)
    if sc < 70:
        return None
    inv=bool(INVESTOR_DIRECT.search(text))
    bmin,bmax=budget_range(text)
    emails=EMAIL.findall(text)
    return {
        "date": datetime.now(timezone.utc).date().isoformat(),
        "name": title[:110] or "Lead web",
        "profile": "",
        "country": "Da verificare",
        "language": "Da verificare",
        "intent": "Investimento immobiliare" if inv else "Acquisto",
        "request": "Investitore con capitale/liquidità" if inv else "Acquisto immobile",
        "purpose": "Investimento" if inv else "Da qualificare",
        "zone": "Torrevieja",
        "budget_min": bmin,
        "budget_max": bmax,
        "phone": "",
        "email": emails[0] if emails and any(x in url.lower() for x in ["facebook.com/groups/", "reddit.com/r/", "forum", "expat"]) else "",
        "source": urllib.parse.urlparse(url).netloc.replace("www.","") if url else "Web",
        "url": url,
        "summary_original": content[:360],
        "summary_it": "",
        "summary": content[:360],
        "score": sc,
        "priority": "Alta" if sc >= 80 else "Media",
        "status": "Da verificare"
    }

all_results=[]
for q in QUERIES:
    try:
        response=tavily(q)
        all_results.extend(response.get("results",[]))
    except Exception as e:
        print(f"Search failed: {q}: {e}")

seen=set(); candidates=[]
for item in all_results:
    url=item.get("url") or ""
    if not url or url in seen: continue
    seen.add(url)
    lead=classify(item)
    if lead: candidates.append(lead)

try:
    data=json.loads(OUT.read_text(encoding="utf-8"))
except Exception:
    data={"area":"Torrevieja","currency":"EUR","leads":[],"market":{}}

leads=list(candidates)
leads.sort(key=lambda x:(x.get("priority")!="Alta",-(x.get("score") or 0),x.get("date") or ""))
leads=leads[:200]
for i,x in enumerate(leads,1): x["id"]=f"TRV-{i:04d}"

now=datetime.now(timezone.utc).isoformat()
data.update({
    "updated_at": now,
    "area": "Torrevieja",
    "currency": "EUR",
    "budget_filter": {"min_eur":100000,"max_eur":500000},
    "translation_policy": "Dashboard in italiano; testo originale conservato per verifica",
    "leads": leads,
    "market": {
        **data.get("market",{}),
        "sources_checked": len(seen),
        "new_signals": len(candidates),
        "high_priority": sum(1 for x in leads if x.get("priority")=="Alta"),
        "with_contact": sum(1 for x in leads if x.get("phone") or x.get("email")),
        "last_tavily_run": now
    }
})
OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding="utf-8")
print(f"Updated {OUT}: {len(candidates)} qualified direct leads, {len(leads)} stored leads")
