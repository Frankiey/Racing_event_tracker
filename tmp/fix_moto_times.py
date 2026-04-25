from datetime import datetime, timedelta
import json

motogp = json.load(open('data/silver/motogp.json'))
moto2 = json.load(open('data/seed/moto2.json'))
moto3 = json.load(open('data/seed/moto3.json'))

# Build map from round -> {fp2, wu}
refs = {}
for e in motogp:
    r = e['round']
    s = {s['type']: s['startTimeUTC'] for s in e['sessions']}
    refs[r] = {'fp2': s['FP2'], 'wu': s['Warm Up']}


def parse(t):
    return datetime.fromisoformat(t.replace('Z', '+00:00'))


def fmt(dt):
    return dt.strftime('%Y-%m-%dT%H:%M:%SZ')


# Fix Moto3: Q = FP2 - 3h35m, Race = WU - 40min
for e in moto3:
    r = e['round']
    ref = refs[r]
    fp2 = parse(ref['fp2'])
    wu = parse(ref['wu'])
    e['sessions'] = [
        {'type': 'Qualifying', 'startTimeUTC': fmt(fp2 - timedelta(minutes=215))},
        {'type': 'Race',       'startTimeUTC': fmt(wu  - timedelta(minutes=40))},
    ]

# Fix Moto2: Q = FP2 - 2h35m, Race = WU + 40min
for e in moto2:
    r = e['round']
    ref = refs[r]
    fp2 = parse(ref['fp2'])
    wu = parse(ref['wu'])
    e['sessions'] = [
        {'type': 'Qualifying', 'startTimeUTC': fmt(fp2 - timedelta(minutes=155))},
        {'type': 'Race',       'startTimeUTC': fmt(wu  + timedelta(minutes=40))},
    ]

with open('data/seed/moto3.json', 'w') as f:
    json.dump(moto3, f, indent=2, ensure_ascii=False)
    f.write('\n')

with open('data/seed/moto2.json', 'w') as f:
    json.dump(moto2, f, indent=2, ensure_ascii=False)
    f.write('\n')

# Spot-check R4 Spain
r4m3 = next(e for e in moto3 if e['round'] == 4)
r4m2 = next(e for e in moto2 if e['round'] == 4)
print('Moto3 Spain:', r4m3['sessions'])
print('Moto2 Spain:', r4m2['sessions'])
print('Done - updated both seed files')
