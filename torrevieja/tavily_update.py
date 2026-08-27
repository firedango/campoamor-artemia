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
    '"Torrevieja" ("busco comprar" OR "quiero comprar" OR "comprar apartamento" OR "invertir en vivienda")',
    '"Torrevieja" ("property investment" OR "real estate investment" OR "cash investor" OR "capital to invest")',
    '"Torrevieja" ("köpa lägenhet" OR "köpa bostad" OR "investera fastighet")',
    '"Torrevieja" ("kupić mieszkanie" OR "kupić nieruchomość" OR "inwestycja nieruchomości")',
    '"Torrevieja" ("kjøpe leilighet" OR "kjøpe bolig" OR "eiendomsinvestering")',
    '"Torrevieja" ("купить квартиру" OR "купить недвижимость" OR "инвестиции в недвижимость")',
    '"Torrevieja" ("купити квартиру" OR "купити нерухомість" OR "інвестиції в нерухомість")'
]

DIRECT = re.compile(r"\b(i am|i'm|we are|we're|i want|we want|i need|we need|looking to|planning to|moving to|busco|quiero|queremos|cerco|chcę|szukam|jeg vil|vi vil|jag vill|vi vill|хочу|ищу|шукаю|хочемо)\b", re.I)
BUY = re.compile(r"\b(buy|buying|purchase|property|apartment|house|real estate|comprar|compra|vivienda|apartamento|inversi[oó]n|köpa|bostad|fastighet|kupić|nieruchomo|kjøpe|bolig|eiendom|купить|недвиж|купити|нерухом)\b", re.I)
INVEST = re.compile(r"\b(invest|investment|investor|capital|cash|liquidity|yield|roi|invertir|inversi[oó]n|inversor|capital|liquidez|investera|inwest|инвест|інвест)\b", re.I)
PHONE = re.compile(r"(?<!\d)(?:\+?\d[\d\s().-]{7,}\d)(?!\d)")
EMAIL = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
MONEY = re.compile(r"(?:€|EUR\s*|£|GBP\s*|\$|USD\s*)\s*([1-9]\d{1,3}(?:[.,]\d{3})+|[1-9]\d{4,5})|([1-9]\d{2,3})\s*k\b", re.I)

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
        "User-Agent": "TorreviejaLeadMonitor/1.0"
    })
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.load(r)

def euros(text):
    vals=[]
    for m in MONEY.finditer(text):
        raw=(m.group(1) or m.group(2) or "").replace(".","").replace(",","")
        try:
            n=int(raw)
            if m.group(2): n*=1000
            if 100000 <= n <= 500000: vals.append(n)
        except ValueError: pass
    return max(vals) if vals else None

def score(text, url):
    s=0
    if "torrevieja" in text.lower(): s+=30
    if DIRECT.search(text): s+=25
    if BUY.search(text): s+=20
    if INVEST.search(text): s+=10
    if euros(text): s+=10
    if any(x in url.lower() for x in ["reddit.com","forum","expat"]): s+=5
    return min(s,100)

def classify(item):
    title=item.get("title") or ""
    content=item.get("content") or ""
    url=item.get("url") or ""
    text=f"{title}\n{content}"
    sc=score(text,url)
    if sc < 70 or not DIRECT.search(text) or not BUY.search(text):
        return None
    inv=bool(INVEST.search(text))
    b=euros(text)
    emails=EMAIL.findall(text)
    phones=[p.strip() for p in PHONE.findall(text)]
    return {
        "date": datetime.now(timezone.utc).date().isoformat(),
        "name": title[:110] or "Lead web",
        "profile": "",
        "country": "Da verificare",
        "language": "Da verificare",
        "intent": "Investimento immobiliare" if inv else "Acquisto",
        "request": "Investitore con interesse immobiliare" if inv else "Acquisto immobile",
        "purpose": "Investimento" if inv else "Da qualificare",
        "zone": "Torrevieja",
        "budget_min": 100000 if b else None,
        "budget_max": b,
        "phone": phones[0] if phones else "",
        "email": emails[0] if emails else "",
        "source": urllib.parse.urlparse(url).netloc.replace("www.","") if url else "Web",
        "url": url,
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

existing={x.get("url"):x for x in data.get("leads",[]) if x.get("url")}
for lead in candidates:
    existing[lead["url"]]=lead
leads=list(existing.values())
leads.sort(key=lambda x:(x.get("priority")!="Alta",-(x.get("score") or 0),x.get("date") or ""))
leads=leads[:200]
for i,x in enumerate(leads,1): x["id"]=f"TRV-{i:04d}"

now=datetime.now(timezone.utc).isoformat()
data.update({
    "updated_at": now,
    "area": "Torrevieja",
    "currency": "EUR",
    "budget_filter": {"min_eur":100000,"max_eur":500000},
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
print(f"Updated {OUT}: {len(candidates)} candidates, {len(leads)} stored leads")
