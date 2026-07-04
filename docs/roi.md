# Plantbase — ROI-levezetés (5 fős lakberendező iroda)

## Baseline (a BRS alapján)
- 1 lakberendező: havi 5 ügyfél × 3 szoba = 15 szoba
- Kézi keresés: 10–15 perc/szoba (konzervatívan 10 perccel számolunk)
- Agenttel: < 5 perc/szoba (KPI)
- Órabér: 6 500 Ft (becsült, konzervatív)

## Haszon-oldal (hard ROI)
| Tétel | Számítás | Érték | Címke |
|---|---|---|---|
| Időmegtakarítás / fő | 15 szoba × 5 perc | 1,25 óra/hó | Becsült |
| Iroda (5 fő) | 5 × 1,25 óra | 6,25 óra/hó | Becsült |
| Forintosítva | 6,25 × 6 500 Ft | ~40 600 Ft/hó | Becsült |
| Éves haszon | × 12 | ~487 500 Ft/év | Becsült |

Nem számszerűsített upside: olcsóbb kosár (akciófigyelés, jobb ár-érték alternatívák) —
adat hiányában nem tesszük a business case-be.

## Költség-oldal
| Tétel | Érték | Címke |
|---|---|---|
| Fejlesztés (egyszeri) | ~8 óra × 6 500 Ft = 52 000 Ft | Becsült |
| Token (~10 Ft/kérdés, naplóból mérve, ~150 kérdés/hó) | ~1 500 Ft/hó | Mért |
| Karbantartás | ~6 500 Ft/hó (1 óra/hó) | Átalány |
| Infrastruktúra (lokális futtatás) | 0 Ft | Mért |
| **Éves költség összesen** | 52 000 + (6 500 x 12) + (1500 x 12) = **148 000 Ft** | |

## Eredmény
- Havi nettó haszon: ~32 600 Ft
- **Megtérülési pont: ~1,6 hónap**
- **12 havi ROI: (487 500 − 148 000) / 148 000 ≈ 229%**

## Soft ROI (narratíva, nem a számokban)
- Gyorsabb, pontosabb ajánlat → elégedettebb ügyfél → több ajánlás
- A lakberendező tervezéssel foglalkozik, nem webshop-böngészéssel

## Módszertan
Konzervatív forecast: alsó becslés a haszonra, felső a költségre; minden tétel
Mért / Becsült / Átalány címkével. A token-költség a valós futási naplókból
(logs/*.jsonl usage-mezői) származik.
