# EUDR DDS – Units of Measure Guidance for

# Economic Operators

This document provides guidance on the correct use of Units of Measure (UoM) when registering data in ‘Box 6’
during the DDS submission in the EUDR system. The rules differ depending on the selected Activity type in ‘Box 2 ’
and apply to both UI and API submissions.

## 1. DDS with Activity: Import or Export

**Preconditions: Activity selected = Import OR Export**

### Mandatory Fields

- Net Mass (Kg): Always required for Import / Export activity.

### Supplementary Unit Type

- Read-only and automatically preselected if applicable for the HS code.
- Please see the Commodity Code Dependent Supplementary Unit List in Appendix I of this document. The same
supplementary units are also applicable for sub-codes of the Commodity Codes listed in Appendix I (example: the
supplementary unit for HS Code 4011 also applies to HS Code 4011 10).
- Please note that HS code matching is performed on the first 4 HS code digits (except for the 6-digit HS codes in the
list where an exact match is required)
**- Examples:**

```
HS Code selected Supplementary code applied
47 N/A
4701 KSD (kg 90% sdt)
4410 MTQ (m³)
441011 MTQ (m³)
010221 NAR (p/st)
```
**Important note:** The extension of applicability of supplementary units to the 6-digit sub-headings will be enabled in the
next release. Currently in EUDR (release 7.3.1) the rule applies to the 4-digit codes, except for 010221 and 010229 where
there is corresponding no 4-digit code.


### Supplementary Units

- Mandatory only if the commodity code appears in Appendix I of this document.
- If not applicable, no supplementary unit type or value is allowed, see Annex II point 2, 3rd sentence of the EUDR.


## 2. DDS with Activity: Domestic or Trade

**Preconditions: Activity selected = Domestic OR Trade**

### Valid Units of Measure Combinations

**1. Net Mass and Percentage estimate or deviation**
- Allowed values for Percentage estimate or deviation: 0 – 25.

**2**. **Supplementary unit type and quantity**

- Code list available in Annex Appendix II of this document.
- Display Text from Annex Appendix II of this document appears in the 'Type' field.
- Display on Hover text appears in the dropdown list.

**3**. **Net Mass with Percentage estimate or deviation AND supplementary unit type and quantity**

- Same rules apply as above for Supplementary Unit Type and value, and for the Percentage estimate or deviation.


## Appendix I – Commodity Code Dependent Supplementary Unit List for ‘Import’ and ‘Export’

```
HS Code Supplementary
Unit Type
```
```
Display Text Display on Hover
```
```
010221 NAR NAR (p/st) Number of items
010229 NAR NAR (p/st) Number of items
4011 NAR NAR (p/st) Number of items
4013 NAR NAR (p/st) Number of items
4104 NAR NAR (p/st) Number of items
4403 MTQ MTQ (m³) Cubic metre
4406 MTQ MTQ (m³) Cubic metre
4408 MTQ MTQ (m³) Cubic metre
4410 MTQ MTQ (m³) Cubic metre
4411 MTQ MTQ (m³) Cubic metre
4412 MTQ MTQ (m³) Cubic metre
4413 MTQ MTQ (m³) Cubic metre
4701 KSD KSD (kg 90% sdt) Kilogram of substance 90% dry
4702 KSD KSD (kg 90% sdt) Kilogram of substance 90% dry
4704 KSD KSD (kg 90% sdt) Kilogram of substance 90% dry
4705 KSD KSD (kg 90% sdt) Kilogram of substance 90% dry
```
## Appendix II – Selectable Supplementary Unit Codes List for ‘Domestic’ and ‘Trade’

```
Measurement
Unit Type
```
```
Display Text Display on Hover
```
```
KSD KSD (kg 90% sdt) Kilogram of substance 90% dry
MTK MTK (m²) Square metre
MTQ MTQ (m³) Cubic metre
MTR MTR (m) Metre
NAR NAR (p/st) Number of items
NPR NPR (pa) Number of pairs
```

