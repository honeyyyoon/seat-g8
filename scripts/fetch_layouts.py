import argparse, html, json, os, sys, time, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timedelta
from types import SimpleNamespace

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extract_seat_layout import from_cgv, from_lotte, from_megabox, to_layout

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36"
DELAY = 1.0


def fetch(url, data=None, headers=None):
    time.sleep(DELAY)
    req = urllib.request.Request(url, data=data, headers={"User-Agent": UA, "Accept": "application/json", **(headers or {})})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def first_per_screen(rows, key, done):
    seen = {}
    for row in rows:
        if str(key(row)) not in done:
            seen.setdefault(str(key(row)), row)
    return list(seen.values())


def cgv_get(path, params):
    return fetch(f"https://cgv.co.kr/api/v1/booking/{path}?{urllib.parse.urlencode(params)}",
                 headers={"Referer": "https://cgv.co.kr/cnm/movieBook/cinema"})


def cgv_layouts(site, date, done):
    rows = cgv_get("searchMovScnInfo", {"coCd": "A420", "siteNo": site, "scnYmd": date,
                                        "movNo": "", "rtctlScopCd": "08"}).get("data") or []
    for row in first_per_screen(rows, lambda r: r["scnsNo"], done):
        raw = cgv_get("searchIfSeatData", {"coCd": "A420", "siteNo": site, "scnYmd": date,
                                           "scnsNo": row["scnsNo"], "scnSseq": row["scnSseq"]})
        items = (raw.get("data") or {}).get("items") or []
        if not items or not items[0].get("seats"):
            yield None, f"CGV {site} {row['scnsNo']}: 좌석 없음"
            continue
        yield from_cgv(raw), None


LOTTE_URL = "https://www.lottecinema.co.kr/LCWS/Ticketing/TicketingData.aspx"


def lotte_post(params):
    body = urllib.parse.urlencode({"ParamList": json.dumps(
        {"channelType": "HO", "osType": "W", "osVersion": UA, **params})}).encode()
    return fetch(LOTTE_URL, data=body, headers={"Content-Type": "application/x-www-form-urlencoded",
                                                "Referer": "https://www.lottecinema.co.kr/NLCHS/Ticketing"})


def lotte_layouts(cinema, date, done):
    play_date = f"{date[:4]}-{date[4:6]}-{date[6:]}"
    rows = (lotte_post({"MethodName": "GetPlaySequence", "playDate": play_date,
                        "cinemaID": f"1|0001|{cinema}", "representationMovieCode": ""})
            .get("PlaySeqs") or {}).get("Items") or []
    for row in first_per_screen(rows, lambda r: r["ScreenID"], done):
        raw = lotte_post({"MethodName": "GetSeats", "cinemaId": row["CinemaID"], "screenId": row["ScreenID"],
                          "playDate": row["PlayDt"], "playSequence": row["PlaySequence"],
                          "screenDivisionCode": row["ScreenDivisionCode"]})
        if not (raw.get("Seats") or {}).get("Items"):
            yield None, f"롯데 {cinema} {row['ScreenID']}: 좌석 없음"
            continue
        args = SimpleNamespace(theater="롯데시네마 " + row["CinemaNameKR"], site_no=str(row["CinemaID"]),
                               screen=row["ScreenNameKR"], screen_no=str(row["ScreenID"]), date=date)
        yield from_lotte(raw, args), None


def megabox_post(path, body):
    return fetch(f"https://www.megabox.co.kr/on/oh/{path}", data=json.dumps(body).encode(),
                 headers={"Content-Type": "application/json;charset=UTF-8",
                          "Referer": "https://www.megabox.co.kr/booking"})


def megabox_layouts(branch, date, done):
    rows = megabox_post("ohc/Brch/schedulePage.do",
                        {"masterType": "brch", "brchNo1": branch, "playDe": date})["megaMap"]["movieFormList"]
    for row in first_per_screen(rows, lambda r: r["theabNo"], done):
        raw = megabox_post("ohz/PcntSeatChoi/selectSeatList.do", {"playSchdlNo": row["playSchdlNo"]})
        if not raw.get("seatListSD01"):
            yield None, f"메가박스 {branch} {row['theabNo']}: 좌석 없음"
            continue
        yield from_megabox(raw), None


CHAINS = {"cgv": cgv_layouts, "lotte": lotte_layouts, "megabox": megabox_layouts}


def save(out_dir, chain, result):
    meta, seats, entrances = result
    seats = [s for s in seats if "PRIVATE" not in (s["kind"] or "").upper()]
    if not seats:
        print(f"{meta['theater']} {meta['screen']}: 남은 좌석 없음", file=sys.stderr)
        return str(meta["screenNo"])
    meta = {**meta, "theater": html.unescape(meta["theater"]), "screen": html.unescape(meta["screen"])}
    layout = to_layout(meta, seats, entrances)
    path = os.path.join(out_dir, f"{chain}-{meta['siteNo']}-{meta['screenNo']}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(layout, f, ensure_ascii=False, indent=1)
    print(f"{layout['theater']} {layout['screen']}: {layout['seatCount']}석 -> {path}")
    return str(meta["screenNo"])


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--date", required=True, help="첫 상영일 YYYYMMDD")
    p.add_argument("--days", type=int, default=7, help="며칠 치 시간표를 볼지 (회차가 있는 날의 상영관만 받습니다)")
    p.add_argument("--out-dir", required=True)
    for chain in CHAINS:
        p.add_argument(f"--{chain}", nargs="*", default=[], metavar="ID")
    a = p.parse_args()
    start = datetime.strptime(a.date, "%Y%m%d")
    dates = [(start + timedelta(days=i)).strftime("%Y%m%d") for i in range(a.days)]
    os.makedirs(a.out_dir, exist_ok=True)
    saved, failed = 0, 0
    for chain, fetch_layouts in CHAINS.items():
        for theater in getattr(a, chain):
            done = set()
            for date in dates:
                try:
                    for result, error in fetch_layouts(theater, date, done):
                        if error:
                            print(error, file=sys.stderr)
                            failed += 1
                            continue
                        done.add(save(a.out_dir, chain, result))
                        saved += 1
                except (urllib.error.URLError, KeyError, ValueError) as e:
                    print(f"{chain} {theater} {date}: {e}", file=sys.stderr)
                    failed += 1
    print(f"저장 {saved}개, 실패 {failed}개")


if __name__ == "__main__":
    main()
