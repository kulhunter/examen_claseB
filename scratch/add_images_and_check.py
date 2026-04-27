import json
import os

# Update preguntas.js with image paths
with open('preguntas.js', 'r', encoding='utf-8') as f:
    content = f.read().replace('const bancoPreguntas = ', '').rstrip(';')
    preguntas = json.loads(content)

for q in preguntas:
    img_path = f"img/preguntas/{q['id']}.png"
    if os.path.exists(img_path):
        q['imagen'] = f"./{img_path}"

with open('preguntas.js', 'w', encoding='utf-8') as f:
    f.write("const bancoPreguntas = ")
    json.dump(preguntas, f, indent=4, ensure_ascii=False)
    f.write(";")

# Check what the 26th signal is in senales_data.js
with open('senales_data.js', 'r', encoding='utf-8') as f:
    s_content = f.read().replace('const bancoSenales = ', '').rstrip(';')
    senales = json.loads(s_content)

print(f"26th signal (index 25):")
print(json.dumps(senales[25], indent=2, ensure_ascii=False))

# Look for 'Permitido virar en U'
for i, s in enumerate(senales):
    if any("permitido" in opt.lower() and "virar" in opt.lower() for opt in s['opciones']):
        print(f"Found 'Permitido virar en U' at index {i}: {s['id']}")
