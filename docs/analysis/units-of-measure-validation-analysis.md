# Analiza validacije jedinica mjere - EUDR API Client

## Pregled

Ovaj dokument analizira razlike između službenih uputa za jedinice mjere (Units of Measure) iz dokumenta `economic_operators.md` i trenutne implementacije u `submission-service-v2.js`.

## Ključni dokumenti

- **Službene upute**: `docs/eudr_docs 1.4/economic_operators.md`
- **Trenutna implementacija**: `services/submission-service-v2.js`

## Pravila iz službenih uputa

### 1. DDS s aktivnostima Import ili Export

**Obavezna polja:**
- Net Mass (Kg) - uvijek potrebno

**Dopunska jedinica:**
- Automatski se odabire na temelju HS koda
- Read-only i automatski preselected ako je primjenjivo
- HS kod se uspoređuje na prva 4 znamenke (osim za 6-znamenkaste kodove u listi)
- Ako HS kod nije u Dodatku I, nema dopunske jedinice
- Ako jest u Dodatku I, dopunska jedinica je obavezna

**Primjeri HS kodova s dopunskim jedinicama:**
```
HS Code    | Supplementary Unit Type | Display Text
010221     | NAR                    | NAR (p/st) Number of items
010229     | NAR                    | NAR (p/st) Number of items
4011       | NAR                    | NAR (p/st) Number of items
4013       | NAR                    | NAR (p/st) Number of items
4104       | NAR                    | NAR (p/st) Number of items
4403       | MTQ                    | MTQ (m³) Cubic metre
4406       | MTQ                    | MTQ (m³) Cubic metre
4408       | MTQ                    | MTQ (m³) Cubic metre
4410       | MTQ                    | MTQ (m³) Cubic metre
4411       | MTQ                    | MTQ (m³) Cubic metre
4412       | MTQ                    | MTQ (m³) Cubic metre
4413       | MTQ                    | MTQ (m³) Cubic metre
4701       | KSD                    | KSD (kg 90% sdt) Kilogram of substance 90% dry
4702       | KSD                    | KSD (kg 90% sdt) Kilogram of substance 90% dry
4704       | KSD                    | KSD (kg 90% sdt) Kilogram of substance 90% dry
4705       | KSD                    | KSD (kg 90% sdt) Kilogram of substance 90% dry
```

### 2. DDS s aktivnostima Domestic ili Trade

**Dopuštene kombinacije jedinica mjere:**

1. **Net Mass i postotak procjene/devijacije**
   - Postotak mora biti: 0 – 25

2. **Dopunska jedinica tip i količina**
   - Dostupni kodovi iz Dodatka II

3. **Net Mass s postotkom I dopunska jedinica tip i količina**
   - Ista pravila kao gore

**Dostupni tipovi dopunskih jedinica za Domestic/Trade:**
```
Measurement Unit Type | Display Text              | Display on Hover
KSD                   | KSD (kg 90% sdt)         | Kilogram of substance 90% dry
MTK                   | MTK (m²)                 | Square metre
MTQ                   | MTQ (m³)                 | Cubic metre
MTR                   | MTR (m)                  | Metre
NAR                   | NAR (p/st)               | Number of items
NPR                   | NPR (pa)                 | Number of pairs
```

## Trenutna implementacija u submission-service-v2.js

### Lokacija validacije
- **Funkcija**: `generateCommodityXml()` (linija 424-487)
- **Metode koje koriste**: `submitDds()` i `amendDds()`

### Trenutno ponašanje

```javascript
// Linija 447-450 - samo osnovno postavljanje bez validacije
if (measure.netWeight) xml += `<v21:netWeight>${measure.netWeight}</v21:netWeight>`;
if (measure.supplementaryUnit) xml += `<v21:supplementaryUnit>${measure.supplementaryUnit}</v21:supplementaryUnit>`;
if (measure.supplementaryUnitQualifier) xml += `<v21:supplementaryUnitQualifier>${measure.supplementaryUnitQualifier}</v21:supplementaryUnitQualifier>`;

// Linija 438-440 - postotak bez validacije
if (measure.percentageEstimationOrDeviation !== undefined) {
  xml += `<v21:percentageEstimationOrDeviation>${measure.percentageEstimationOrDeviation}</v21:percentageEstimationOrDeviation>`;
}
```

## Identificirane razlike

### 1. ❌ Nedostaje validacija jedinica mjere prema pravilima

**Problem:**
- Nema provjere da li je Net Mass obavezan za Import/Export
- Nema automatskog odabira dopunske jedinice na temelju HS koda
- Nema provjere da li je dopunska jedinica obavezna za HS kodove iz Dodatka I

**Trenutno stanje (linija 447-449):**
```javascript
// Samo postavljanje bez validacije
if (measure.netWeight) xml += `<v21:netWeight>${measure.netWeight}</v21:netWeight>`;
if (measure.supplementaryUnit) xml += `<v21:supplementaryUnit>${measure.supplementaryUnit}</v21:supplementaryUnit>`;
if (measure.supplementaryUnitQualifier) xml += `<v21:supplementaryUnitQualifier>${measure.supplementaryUnitQualifier}</v21:supplementaryUnitQualifier>`;
```

### 2. ❌ Nedostaje logika za automatski odabir dopunskih jedinica

**Problem:**
- Nema implementacije liste HS kodova iz Dodatka I
- Nema logike za usporedbu HS kodova (4 znamenke vs 6 znamenki)
- Nema automatskog postavljanja dopunske jedinice

**Potrebno:**
- Implementirati mapu HS kodova s dopunskim jedinicama
- Dodati logiku za usporedbu HS kodova
- Automatski postaviti dopunsku jedinicu ako je potrebno

### 3. ❌ Nedostaje validacija postotka procjene/devijacije

**Problem:**
- Nema provjere da li je postotak u rasponu 0-25% za Domestic/Trade
- Nema provjere da li je postotak dozvoljen za određenu aktivnost

**Trenutno stanje (linija 438-440):**
```javascript
// Samo postavljanje bez validacije
if (measure.percentageEstimationOrDeviation !== undefined) {
  xml += `<v21:percentageEstimationOrDeviation>${measure.percentageEstimationOrDeviation}</v21:percentageEstimationOrDeviation>`;
}
```

### 4. ❌ Nedostaje validacija kombinacija jedinica mjere

**Problem:**
- Nema provjere valjanih kombinacija za Domestic/Trade
- Nema provjere da li su kombinacije dozvoljene prema pravilima

**Potrebne kombinacije za Domestic/Trade:**
1. Net Mass + postotak (0-25%)
2. Dopunska jedinica + količina
3. Net Mass + postotak + dopunska jedinica + količina

## Preporučeni pristup za implementaciju

### 1. Integracija s postojećim error handlingom

**Trenutni error handling pattern:**
```javascript
// Linija 649-655 u submitDds() metodi
if (EudrErrorHandler) {
  logger.debug('Using EudrErrorHandler...');
  const handledError = EudrErrorHandler.handleError(error);
  handledError.originalError = error;
  throw handledError;
}
```

**Postojeći error kodovi u EudrErrorHandler-u:**
- `EUDR_COMMODITIES_DESCRIPTOR_NET_MASS_EMPTY`: 'Net Mass is mandatory for IMPORT or EXPORT activity.'
- `EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING`: 'Supplementary units are provided but the supplementary unit qualifier is missing.'
- `EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_NOT_ALLOWED`: 'Supplementary Unit not allowed for import and export where the supplementary unit is not applicable.'
- `EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_INVALID`: 'Percentage estimate or deviation lower than 0 or higher than 50.'

**Preporučeni pristup:**
- Dodati validaciju prije poziva u `submitDds()` i `amendDds()` metodama
- Koristiti isti `EudrErrorHandler` za formatiranje grešaka
- Zadržati konzistentnost s postojećim error response formatom

### 2. Lokacija implementacije

**Predložena struktura:**
```javascript
// U submitDds() metodi (linija 570), prije postojećeg koda
async submitDds(request, options = {}) {
  try {
    // 1. Validacija jedinica mjere (NOVO)
    this.validateUnitsOfMeasure(request.statement);
    
    // 2. Postojeći kod (linija 572+)
    logger.debug({ request }, 'Starting submitDds');
    
    // Encode GeoJSON if requested
    if (options.encodeGeojson) {
      this.encodeGeojsonInRequest(request);
    }
    // ... ostali postojeći kod
  } catch (error) {
    // Postojeći error handling (linija 649+)
  }
}

// Isto za amendDds() metodu (linija 694)
async amendDds(ddsIdentifier, statement, options = {}) {
  try {
    // 1. Validacija jedinica mjere (NOVO)
    this.validateUnitsOfMeasure(statement);
    
    // 2. Postojeći kod (linija 696+)
    // Encode GeoJSON if requested
    if (options.encodeGeojson) {
      this.encodeGeojsonInRequest({ statement });
    }
    // ... ostali postojeći kod
  } catch (error) {
    // Postojeći error handling
  }
}
```

### 3. Potrebne validacije

**Za Import/Export:**
- [ ] Provjera da li je Net Mass prisutan
- [ ] Provjera HS koda u Dodatku I
- [ ] Automatski odabir dopunske jedinice
- [ ] Provjera da li je dopunska jedinica obavezna

**Za Domestic/Trade:**
- [ ] Validacija postotka (0-25%)
- [ ] Validacija kombinacija jedinica mjere
- [ ] Provjera da li su kombinacije dozvoljene

### 4. Prednosti ovog pristupa

- **Konzistentnost**: Isti error format za sve greške
- **Rano otkrivanje**: Greške se hvataju prije nepotrebnih poziva
- **Debugging**: Lakše praćenje grešaka kroz postojeći logging
- **Maintainability**: Jedan error handler za sve tipove grešaka

## Sljedeći koraci

1. ✅ **Analiza postojećeg EudrErrorHandler-a** - razumijevanje formata grešaka
2. ✅ **Definiranje error kodova** - postojeći kodovi su već definirani u EudrErrorHandler-u
3. **Implementacija validacije** - dodavanje provjera prije poziva u `submitDds()` i `amendDds()`
4. **Testiranje** - provjera konzistentnosti s postojećim error handlingom

## Dodatne informacije

### Postojeći error kodovi koji se već koriste:
- `EUDR_COMMODITIES_DESCRIPTOR_NET_MASS_EMPTY` - za obavezan Net Mass
- `EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING` - za nedostajuću dopunsku jedinicu
- `EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_NOT_ALLOWED` - za nedozvoljenu dopunsku jedinicu
- `EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_INVALID` - za nevaljan postotak (trenutno 0-50, treba 0-25)

### Potrebno dodati:
- Error kod za nevaljan postotak za Domestic/Trade (0-25% umjesto 0-50%)
- Error kod za nevaljane kombinacije jedinica mjere
- Error kod za nedostajuću dopunsku jedinicu za HS kodove iz Dodatka I

## Zaključak

Trenutna implementacija ne provodi validaciju jedinica mjere prema službenim uputama. Potrebno je dodati validaciju koja će biti konzistentna s postojećim error handlingom, ali će se izvršavati prije poziva umjesto nakon, što će poboljšati performanse i korisničko iskustvo.
