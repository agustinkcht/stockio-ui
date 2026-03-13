import re
import random
import string

random.seed()
nums = "".join(chr(ord("0") + x) for x in range(10))
lets = string.ascii_lowercase
chars = nums + lets
seen = set()

def make_id():
    result = []
    for _ in range(8):
        result.append(random.choice(chars))
    code = "".join(result)
    if code in seen:
        return make_id()
    seen.add(code)
    return code

path = "/lib/data/initial-items.ts"
with open(path, "r") as f:
    lines = f.readlines()

out = []
i = 0
while i < len(lines):
    line = lines[i]
    if re.match(r'^\s*\{\s*$', line.rstrip()):
        indent = re.match(r'^(\s*)', line).group(1)
        j = i + 1
        while j < len(lines) and lines[j].strip() == "":
            j += 1
        if j < len(lines) and re.match(r'^\s*name\s*:', lines[j]):
            out.append(line)
            new_id = make_id()
            out.append(indent + '  id: "' + new_id + '",\n')
            i += 1
            continue
    out.append(line)
    i += 1

with open(path, "w") as f:
    f.writelines(out)

count = sum(1 for l in out if 'id: "' in l and len(l.strip()) < 20)
print("Done. IDs injected: " + str(count))
