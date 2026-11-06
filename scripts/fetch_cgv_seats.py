import argparse, json, os, sys, urllib.error, urllib.parse, urllib.request

URL = "https://cgv.co.kr/api/v1/booking/searchIfSeatData"


def load_env(path=".env"):
    if not os.path.exists(path):
        return
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip("\"'"))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--site-no", required=True, help="극장 번호, 예: 0013 (용산아이파크몰)")
    p.add_argument("--date", required=True, help="상영일 YYYYMMDD")
    p.add_argument("--screen-no", required=True, help="상영관 번호, 예: 018")
    p.add_argument("--seq", required=True, help="회차 번호 (scnSseq)")
    p.add_argument("--out", required=True)
    a = p.parse_args()

    load_env()
    token, cust = os.environ.get("CGV_TOKEN"), os.environ.get("CGV_CUST_NO")
    if not token or not cust:
        sys.exit(".env에 CGV_TOKEN과 CGV_CUST_NO를 넣어 주세요.")
    if token.lower().startswith("bearer "):
        token = token[7:].strip()

    query = urllib.parse.urlencode({
        "coCd": "A420", "siteNo": a.site_no, "scnYmd": a.date,
        "scnsNo": a.screen_no, "scnSseq": a.seq, "custNo": cust,
    })
    req = urllib.request.Request(f"{URL}?{query}", headers={
        "Accept": "application/json",
        "Authorization": f"Bearer {token}",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36",
        "Referer": "https://cgv.co.kr/cnm/selectVisitorCnt",
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code}. 401/403이면 토큰이 만료됐거나 헤더가 더 필요합니다.")

    data = json.loads(body)
    if data.get("statusCode") != 0:
        sys.exit(f"CGV가 오류를 돌려줬습니다: {data.get('statusMessage')}")
    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    seats = data["data"]["items"][0]["seats"]
    print(f"{data['data']['siteNm']} {data['data']['scnsNm']}: {len(seats)}석 -> {a.out}")


if __name__ == "__main__":
    main()
