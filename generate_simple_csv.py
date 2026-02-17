import json
import csv
import os

input_file = '/Users/pj/Desktop/Wow/procesiones-2026-v3.json'
output_file = '/Users/pj/Desktop/Wow/procesiones-simple-2026.csv'

def get_citations(item):
    citations = set()
    for key, value in item.items():
        if key.endswith('_citation') and value:
            multivalues = value.split(', ')
            for val in multivalues:
                if val.startswith('http'):
                    citations.add(val.strip())
                else: 
                     # Handle comma separation differently if needed
                     # but simple split is ok for now. 
                     if 'http' in val:
                         citations.add(val.strip())
    
    # Also check if value itself contains multiple links separated by commas
    # The previous script just added value.
    if not citations:
        for key, value in item.items():
            if isinstance(value, str) and value.startswith('http'):
                citations.add(value)
            # Check lists like horarios_puntos_referencia
            if key == 'horarios_puntos_referencia':
                for pt in value:
                     for k2, v2 in pt.items():
                         if k2.endswith('_citation') and v2:
                             citations.add(v2)

    return ", ".join(sorted(list(citations)))

def get_procession_name(item):
    # Priority: nombre_procesion -> nombre_imagen -> (tipo_procesion + " - " + ecclesia)
    name = item.get('nombre_procesion')
    if name:
        return name
    
    name = item.get('nombre_imagen')
    if name:
        return name
        
    tipo = item.get('tipo_procesion', 'Procesión')
    church = item.get('iglesia', 'Desconocida')
    return f"{tipo} - {church}"

with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

headers = ['Links', 'Procesion']

with open(output_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(headers)

    for item in data:
        row = [
            get_citations(item),
            get_procession_name(item)
        ]
        writer.writerow(row)

print(f"CSV generated at {output_file}")
