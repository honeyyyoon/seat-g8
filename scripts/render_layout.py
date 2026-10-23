import json, sys
L = json.load(open(sys.argv[1], encoding="utf-8"))
grid = {(s["x"], s["y"]): s for s in L["seats"]}
for y in range(L["grid"]["height"]):
    row = next((s["row"] for s in L["seats"] if s["y"] == y), " ")
    print(f"{row:>2} " + "".join(("L" if (grid[(x, y)]["zone"] or "").startswith("Light") else "o") if (x, y) in grid else "." for x in range(L["grid"]["width"])))
