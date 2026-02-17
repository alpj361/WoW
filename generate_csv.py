import json
import csv
import os

input_file = '/Users/pj/Desktop/Wow/procesiones-2026-v3.json'
output_file = '/Users/pj/Desktop/Wow/procesiones-2026.csv'

def get_citations(item):
    citations = set()
    for key, value in item.items():
        if key.endswith('_citation') and value:
            citations.add(value)
    return ", ".join(sorted(list(citations)))

with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

headers = [
    'ID', 'Fecha', 'Dia Liturgico', 'Iglesia', 
    'Tipo', 'Ubicacion', 'Imagen', 'Horario', 'Links'
]

with open(output_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(headers)

    for item in data:
        row = [
            item.get('id_unico', ''),
            item.get('fecha', ''),
            item.get('dia_liturgico', ''),
            item.get('iglesia', ''),
            item.get('tipo_procesion', ''),
            item.get('ubicacion', ''),
            item.get('nombre_imagen', ''),
            item.get('horario_referencia', ''),
            get_citations(item)
        ]
        writer.writerow(row)

print(f"CSV generated at {output_file}")
