import argparse, json, os, sys


def to_int(v):
    return int(v) if isinstance(v, str) and v.strip().isdigit() else v


def from_cgv(raw):
    d = raw["data"]
    item = d["items"][0]
    seats = [{
        "row": s["seatRowNm"], "number": to_int(s["seatNo"]),
        "x": to_int(s["xcoordStartVal"]) // 2, "y": to_int(s["ycoordStartVal"]) // 2,
        "zone": s.get("szoneNm"), "kind": s.get("stkndNm"),
        "aisleLeft": s.get("leftPwayYn") == "Y", "aisleRight": s.get("rghtPwayYn") == "Y",
    } for s in item["seats"]]
    entrances = [{"x": to_int(b["xcoordStartVal"]) // 2, "y": to_int(b["ycoordStartVal"]) // 2}
                 for b in item.get("sblcks", []) if b.get("sblckKindNm") == "입구"]
    meta = {"chain": "CGV", "theater": d["siteNm"], "siteNo": d["siteNo"],
            "screen": d["scnsNm"], "screenNo": d["scnsNo"], "sampledShowDate": d["scnYmd"]}
    return meta, seats, entrances


def from_lotte(raw, args):
    items = raw["Seats"]["Items"]
    xs = sorted({s["SeatXCoordinate"] for s in items})
    ys = sorted({s["SeatYCoordinate"] for s in items})
    step_x = min(b - a for a, b in zip(xs, xs[1:])) if len(xs) > 1 else 1
    step_y = min(b - a for a, b in zip(ys, ys[1:])) if len(ys) > 1 else 1
    x0, y0 = xs[0], ys[0]
    seats = [{
        "row": s["ShowSeatRow"], "number": s["ShowSeatColumn"],
        "x": round((s["SeatXCoordinate"] - x0) / step_x),
        "y": round((s["SeatYCoordinate"] - y0) / step_y),
        "zone": "스위트스팟" if s.get("SweetSpotYN") == "Y" else None,
        "kind": None,
    } for s in items]
    occupied = {(s["x"], s["y"]) for s in seats}
    for s in seats:
        s["aisleLeft"] = (s["x"] - 1, s["y"]) not in occupied
        s["aisleRight"] = (s["x"] + 1, s["y"]) not in occupied
    entrances = [{"x": round((to_int(e["EnterenceXCoordination"]) - x0) / step_x),
                  "y": round((to_int(e["EnterenceYCoordination"]) - y0) / step_y)}
                 for e in raw.get("Enterences", {}).get("Items", [])]
    meta = {"chain": "롯데시네마", "theater": args.theater, "siteNo": args.site_no,
            "screen": args.screen, "screenNo": args.screen_no, "sampledShowDate": args.date}
    return meta, seats, entrances


def from_megabox(raw):
    info = raw["movieDtlInfo"]
    classes = {c["seatClassCd"]: c["seatClassName"] for c in raw.get("seatClassCdList", [])}
    items = raw["seatListSD01"]
    x0 = min(s["horzCoorVal"] for s in items)
    y0 = min(s["vertCoorVal"] for s in items)
    seats = [{
        "row": s["rowNm"], "number": s["seatNo"],
        "x": s["horzCoorVal"] - x0, "y": s["vertCoorVal"] - y0,
        "zone": None, "kind": classes.get(s.get("seatClassCd"), s.get("seatClassCd")),
    } for s in items]
    occupied = {(s["x"], s["y"]) for s in seats}
    for s in seats:
        s["aisleLeft"] = (s["x"] - 1, s["y"]) not in occupied
        s["aisleRight"] = (s["x"] + 1, s["y"]) not in occupied
    entrances = [{"x": g["horzCoorVal"] - x0, "y": g["vertCoorVal"] - y0}
                 for g in raw.get("seatListSD05", []) if g.get("gateTyCd")]
    meta = {"chain": "메가박스", "theater": "메가박스 " + info["brchNm"], "siteNo": info["brchNo"],
            "screen": info["theabNm"], "screenNo": info["theabNo"], "sampledShowDate": info["playDe"]}
    return meta, seats, entrances


def main():
    p = argparse.ArgumentParser()
    p.add_argument("chain", choices=["cgv", "lotte", "megabox"])
    p.add_argument("src"); p.add_argument("dst")
    for opt in ("--theater", "--screen", "--site-no", "--screen-no", "--date"):
        p.add_argument(opt)
    args = p.parse_args()
    with open(args.src, encoding="utf-8") as f:
        raw = json.load(f)
    if args.chain == "cgv":
        meta, seats, entrances = from_cgv(raw)
    elif args.chain == "lotte":
        meta, seats, entrances = from_lotte(raw, args)
    else:
        meta, seats, entrances = from_megabox(raw)
    seats.sort(key=lambda s: (s["y"], s["x"]))
    cells = [(s["x"], s["y"]) for s in seats]
    if len(set(cells)) != len(cells):
        print(f"경고: {len(cells) - len(set(cells))}개 좌석이 다른 좌석과 같은 칸에 겹칩니다", file=sys.stderr)
    layout = {**meta,
              "grid": {"width": max(s["x"] for s in seats) + 1, "height": max(s["y"] for s in seats) + 1},
              "seatCount": len(seats), "seats": seats, "entrances": entrances}
    os.makedirs(os.path.dirname(args.dst) or ".", exist_ok=True)
    with open(args.dst, "w", encoding="utf-8") as f:
        json.dump(layout, f, ensure_ascii=False, indent=1)
    print(f"{meta['chain']} {meta['theater']} {meta['screen']}: {len(seats)} seats -> {args.dst}")


if __name__ == "__main__":
    main()
