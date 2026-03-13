import re
import os
import secrets

def gen_id(existing):
    while True:
        raw = secrets.token_bytes(6)
        val = int.from_bytes(raw, "big")
        code = ""
        while val:
            code = "0123456789abcdefghijklmnopqrstuvwxyz"[val % 36] + code
            val //= 36
        code = code.zfill(8)[:8]
        if code not in existing:
            existing.add(code)
            return code

path = "/lib/data/initial-items.ts"
with open(path, "r") as f:
    lines = f.readlines()

existing_ids = set()
out = []
# Match lines that open an item/variant/child object: a line with only `{`
# preceded by context, or a standalone `{` after an array entry.
# Strategy: insert `id: "XXXXXXXX",` after every line that is `    {` or `      {`
# and whose NEXT non-empty line starts with `name:`

i = 0
while i < len(lines):
    line = lines[i]
    stripped = line.rstrip()
    # Check if this line is just an opening brace (with whitespace)
    if re.match(r'^(\s*)\{$', stripped):
        indent = re.match(r'^(\s*)', stripped).group(1)
        # Look ahead for next non-empty line
        j = i + 1
        while j < len(lines) and lines[j].strip() == "":
            j += 1
        if j < len(lines) and re.match(r'^\s*name\s*:', lines[j]):
            new_id = gen_id(existing_ids)
            out.append(line)
            out.append(f'{indent}  id: "{new_id}",\n')
            i += 1
            continue
    out.append(line)
    i += 1

with open(path, "w") as f:
    f.writelines(out)

added = len([l for l in out if 'id: "' in l and len(l.strip()) < 25])
print(f"Done. Injected {added} IDs.")
