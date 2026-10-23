import json, os, sys

KEYS = {
    "cgv": {"movAtktNo", "trmnNo", "salNo", "ordNo", "resvSchdNo"},
    "lotte": set(),
    "megabox": {"fstRegrNo", "lstUptrNo"},
}


def redact(node, keys, count):
    if isinstance(node, dict):
        for k, v in node.items():
            if k in keys and v not in (None, ""):
                node[k] = "REDACTED"
                count[0] += 1
            else:
                redact(v, keys, count)
    elif isinstance(node, list):
        for v in node:
            redact(v, keys, count)


def main(chain, src, dst):
    with open(src, encoding="utf-8") as f:
        data = json.load(f)
    count = [0]
    redact(data, KEYS[chain], count)
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    with open(dst, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print(f"{chain}: {count[0]} values redacted -> {dst}")


if __name__ == "__main__":
    main(*sys.argv[1:4])
