import argparse, html, json, math, os, re, sys, urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_layouts import UA, cgv_get, fetch, lotte_post, megabox_post

SKIP = re.compile(r"씨네드쉐프|휴관|프라이빗")
REFS = [(37.45, 126.85), (37.45, 127.15), (37.65, 127.0), (37.55, 126.98)]


def haversine(a, b):
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(b[1] - a[1]) / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(h))


def trilaterate(dists):
    lat0, lng0 = 37.55, 126.98
    kx, ky = 111.320 * math.cos(math.radians(lat0)), 110.574
    pts = [((lng - lng0) * kx, (lat - lat0) * ky) for lat, lng in REFS]
    (x1, y1), d1 = pts[0], dists[0]
    rows = [((2 * (x - x1), 2 * (y - y1)), d1 ** 2 - d ** 2 + x ** 2 - x1 ** 2 + y ** 2 - y1 ** 2)
            for (x, y), d in zip(pts[1:], dists[1:])]
    a11 = sum(r[0] ** 2 for r, _ in rows)
    a12 = sum(r[0] * r[1] for r, _ in rows)
    a22 = sum(r[1] ** 2 for r, _ in rows)
    c1 = sum(r[0] * v for r, v in rows)
    c2 = sum(r[1] * v for r, v in rows)
    det = a11 * a22 - a12 ** 2
    lat, lng = lat0 + (a11 * c2 - a12 * c1) / det / ky, lng0 + (c1 * a22 - c2 * a12) / det / kx
    for _ in range(50):
        step = 1e-6
        err = lambda p: sum((haversine(p, r) - d) ** 2 for r, d in zip(REFS, dists))
        e = err((lat, lng))
        g = [(err((lat + step, lng)) - e) / step, (err((lat, lng + step)) - e) / step]
        h = 1e-5
        lat, lng = lat - h * g[0], lng - h * g[1]
    return lat, lng, max(abs(haversine((lat, lng), r) - d) for r, d in zip(REFS, dists))


def cgv_theaters():
    dists = {}
    names = {}
    for lat, lng in REFS:
        data = fetch(f"https://cgv.co.kr/api/v1/cnm/site/searchAllRegionAndSite?coCd=A420&lttd={lat}&lntd={lng}",
                     headers={"Referer": "https://cgv.co.kr/cnm/movieBook/cinema"})["data"]
        for site in data["siteInfo"]:
            if site["regnGrpCd"] == "01":
                dists.setdefault(site["siteNo"], []).append(float(site["distance"]))
                names[site["siteNo"]] = site["siteNm"]
    for site_no, ds in dists.items():
        if SKIP.search(names[site_no]) or len(ds) != len(REFS):
            continue
        lat, lng, err = trilaterate(ds)
        if err > 0.05:
            print(f"CGV {names[site_no]}: 위치 오차 {err:.3f}km", file=sys.stderr)
        yield {"id": f"cgv-{site_no}", "chain": "CGV", "name": names[site_no], "lat": round(lat, 6), "lng": round(lng, 6)}


def lotte_theaters():
    items = lotte_post({"MethodName": "GetTicketingPageTOBE", "memberOnNo": ""})["Cinemas"]["Cinemas"]["Items"]
    for c in items:
        if c["DivisionCode"] == 1 and c["DetailDivisionCode"] == "0001" and not SKIP.search(c["CinemaNameKR"]):
            yield {"id": f"lotte-{c['CinemaID']}", "chain": "롯데시네마", "name": c["CinemaNameKR"],
                   "lat": round(float(c["Latitude"]), 6), "lng": round(float(c["Longitude"]), 6)}


def megabox_theaters(date):
    branches = megabox_post("ohb/SimpleBooking/selectBokdList.do", {
        "arrMovieNo": "", "playDe": date, "brchNoListCnt": 0, "brchNo1": "", "areaCd1": "", "spclbYn1": "",
        "theabKindCd1": "", "brchAll": "", "brchSpcl": "", "movieNo1": "", "movieNo2": "", "movieNo3": "",
        "sellChnlCd": ""})["areaBrchList"]
    for b in branches:
        name = html.unescape(b["brchNm"])
        if b["areaCd"] != "10" or SKIP.search(name):
            continue
        req = urllib.request.Request(f"https://www.megabox.co.kr/on/oh/ohc/Brch/infoPage.do?brchNo={b['brchNo']}&firstAt=Y",
                                     headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=20) as r:
            page = r.read().decode("utf-8", "ignore")
        m = re.search(r"lng=([\d.]+)&(?:amp;)?lat=([\d.]+)", page)
        if not m:
            print(f"메가박스 {name}: 좌표 없음", file=sys.stderr)
            continue
        yield {"id": f"megabox-{b['brchNo']}", "chain": "메가박스", "name": name,
               "lat": round(float(m.group(2)), 6), "lng": round(float(m.group(1)), 6)}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--date", required=True, help="메가박스 극장 목록을 볼 날짜 YYYYMMDD")
    p.add_argument("--out", required=True)
    a = p.parse_args()
    theaters = [*cgv_theaters(), *lotte_theaters(), *megabox_theaters(a.date)]
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(theaters, f, ensure_ascii=False, indent=1)
    for chain in ("cgv", "lotte", "megabox"):
        ids = [t["id"].split("-", 1)[1] for t in theaters if t["id"].startswith(chain)]
        print(f"--{chain} {' '.join(ids)}")
    print(f"극장 {len(theaters)}곳 -> {a.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
