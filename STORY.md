# Story: Automatizacija konfiguracije endpointa za EUDR servise

## Opis
Trenutno korisnici EUDR API klijenta moraju ručno unositi kompleksne endpointove za svaki servis. Ovo je nepraktično i podložno greškama. Potrebno je implementirati automatsko generiranje endpointova na temelju `webServiceClientId` i API verzije, dok se zadržava mogućnost ručnog override-a.

## Goal
Pojednostaviti konfiguraciju EUDR klijenata automatskim generiranjem endpointova na temelju `webServiceClientId` i API verzije, uz zadržavanje fleksibilnosti za custom endpointove.

## Acceptance Criteria
- [ ] Korisnici ne moraju ručno unositi endpointove za standardne webServiceClientId vrijednosti
- [ ] Endpointi se automatski generiraju na temelju `webServiceClientId` i API verzije
- [ ] `eudr` i `eudr-test` webServiceClientId automatski generiraju endpointove
- [ ] Ostale vrijednosti webServiceClientId zahtijevaju ručno naveden `endpoint`
- [ ] Podržane su obje API verzije (V1 i V2)
- [ ] `endpoint` config opcija ostaje dostupna za override
- [ ] Konfiguracija je jednostavnija i manje podložna greškama
- [ ] Zadržana je backward kompatibilnost

## Trenutni problemi
1. **Endpoint se mora ručno unijeti** - korisnici moraju znati točne URL-ove
2. **Nedostaje dokumentacija endpointova** - u README-u nisu jasno navedeni
3. **Složena konfiguracija** - svaki servis zahtijeva različite endpointove
4. **API verzije nisu jasno odvojene** - V1 vs V2 endpointi nisu automatizirani

## Predložena struktura

### Prije (trenutno):
```javascript
const client = new EudrSubmissionClient({
  endpoint: 'https://webgate.acceptance.ec.europa.eu/tracesnt/ws/EUDRSubmissionServiceV1',
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr-test'
});
```

### Nakon (predloženo):
```javascript
// Automatski generirani endpoint za standardne webServiceClientId:
const client = new EudrSubmissionClient({
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr-test' // endpoint se automatski generira
});

// Ručni override automatski generiranog endpointa:
const client = new EudrSubmissionClient({
  endpoint: 'https://custom-endpoint.com/ws/service', // override automatski generirani
  username: 'user',
  password: 'pass',
  webServiceClientId: 'eudr-test'
});

// Obavezan endpoint za custom webServiceClientId:
const client = new EudrSubmissionClient({
  endpoint: 'https://custom-server.com/ws/service', // obavezan za custom webServiceClientId
  username: 'user',
  password: 'pass',
  webServiceClientId: 'custom-client-id'
});
```

## Taskovi

### Task 1: Implementirati endpoint logiku u svakom servisu
**Opis**: Dodati logiku za automatsko generiranje endpointova direktno u svaki servis na temelju `webServiceClientId`.

**Detalji**:
- Kreirati `utils/endpoint-utils.js` s helper funkcijama
- Importirati helper funkcije u svaki servis
- Implementirati logiku: `eudr` → production, `eudr-test` → acceptance
- Implementirati automatsko dodavanje specifičnih servisnih putanja
- Implementirati automatsko postavljanje SOAP Action-a
- Implementirati validaciju da custom webServiceClientId zahtijevaju `endpoint`

**Acceptance Criteria**:
- [ ] Svi servisi automatski generiraju endpointove za standardne webServiceClientId
- [ ] `eudr` → `https://eudr.webcloud.ec.europa.eu/tracesnt/ws`
- [ ] `eudr-test` → `https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws`
- [ ] `utils/endpoint-utils.js` je kreiran s helper funkcijama
- [ ] Echo Service: automatski dodaje `/EudrEchoService`
- [ ] Retrieval Service: automatski dodaje `/EUDRRetrievalServiceV1`
- [ ] Submission Service V1: automatski dodaje `/EUDRSubmissionServiceV1`
- [ ] Submission Service V2: automatski dodaje `/EUDRSubmissionServiceV2`
- [ ] SOAP Action se automatski postavlja na temelju servisa
- [ ] Ostale vrijednosti webServiceClientId zahtijevaju ručno naveden `endpoint`
- [ ] Endpoint opcija ostaje dostupna za override

**Vrijeme**: 2-3 sata

---

### Task 2: Ažurirati Echo Service
**Opis**: Modificirati Echo Service da koristi automatski generirani endpoint za standardne webServiceClientId.

**Detalji**:
- Modificirati `services/echo-service.js`
- Dodati logiku za automatsko generiranje endpointa za `eudr` i `eudr-test`
- Dodati validaciju da custom webServiceClientId zahtijevaju `endpoint`
- Zadržati mogućnost ručnog override-a
- Ažurirati validaciju konfiguracije

**Acceptance Criteria**:
- [ ] Echo Service automatski generira endpoint za `eudr` i `eudr-test`
- [ ] Custom webServiceClientId zahtijevaju ručno naveden `endpoint`
- [ ] Ručni endpoint override funkcionira
- [ ] Backward kompatibilnost je zadržana
- [ ] Testovi prolaze

**Vrijeme**: 1-2 sata

---

### Task 3: Ažurirati Submission Service V1
**Opis**: Modificirati Submission Service V1 da koristi automatski generirani endpoint.

**Detalji**:
- Modificirati `services/submission-service.js`
- Dodati logiku za automatsko generiranje endpointa
- Zadržati mogućnost ručnog override-a
- Ažurirati validaciju konfiguracije

**Acceptance Criteria**:
- [ ] Submission Service V1 automatski generira endpoint ako nije naveden
- [ ] Ručni endpoint override funkcionira
- [ ] Backward kompatibilnost je zadržana
- [ ] Testovi prolaze

**Vrijeme**: 1-2 sata

---

### Task 4: Ažurirati Submission Service V2
**Opis**: Modificirati Submission Service V2 da koristi automatski generirani endpoint.

**Detalji**:
- Modificirati `services/submission-service-v2.js`
- Dodati logiku za automatsko generiranje endpointa
- Zadržati mogućnost ručnog override-a
- Ažurirati validaciju konfiguracije

**Acceptance Criteria**:
- [ ] Submission Service V2 automatski generira endpoint ako nije naveden
- [ ] Ručni endpoint override funkcionira
- [ ] Backward kompatibilnost je zadržana
- [ ] Testovi prolaze

**Vrijeme**: 1-2 sata

---

### Task 5: Ažurirati Retrieval Service
**Opis**: Modificirati Retrieval Service da koristi automatski generirani endpoint.

**Detalji**:
- Modificirati `services/retrieval-service.js`
- Dodati logiku za automatsko generiranje endpointa
- Zadržati mogućnost ručnog override-a
- Ažurirati validaciju konfiguracije

**Acceptance Criteria**:
- [ ] Retrieval Service automatski generira endpoint ako nije naveden
- [ ] Ručni endpoint override funkcionira
- [ ] Backward kompatibilnost je zadržana
- [ ] Testovi prolaze

**Vrijeme**: 1-2 sata

---

### Task 6: Ažurirati glavni services/index.js
**Opis**: Ažurirati glavni export file da koristi nove endpoint logike.

**Detalji**:
- Modificirati `services/index.js` ako je potrebno
- Osigurati da svi servisi koriste novu logiku
- Provjeriti da nema breaking changes

**Acceptance Criteria**:
- [ ] Glavni export file je ažuriran ako je potrebno
- [ ] Svi servisi su pravilno integrirani
- [ ] Testovi prolaze

**Vrijeme**: 1 sat

---

### Task 7: Ažurirati README dokumentaciju
**Opis**: Ažurirati README s novim pojednostavljenim konfiguracijama i jasnim objašnjenjima endpointova.

**Detalji**:
- Dodati sekciju o automatskom generiranju endpointova
- Objasniti kako koristiti custom endpointove
- Dodati tablicu s dostupnim endpointovima
- Ažurirati sve primjere

**Acceptance Criteria**:
- [ ] README sadrži jasne upute za automatsku konfiguraciju
- [ ] Dokumentirani su svi dostupni endpointovi
- [ ] Primjeri su ažurirani
- [ ] Dokumentacija je jasna i korisna

**Vrijeme**: 2-3 sata

---

### Task 8: Dodati testove za endpoint logiku
**Opis**: Kreirati comprehensive testove za endpoint logiku u svim servisima.

**Detalji**:
- Testirati endpoint generiranje u svim servisima
- Testirati sve kombinacije webServiceClientId
- Testirati error handling
- Testirati backward kompatibilnost

**Acceptance Criteria**:
- [ ] Svi testovi prolaze
- [ ] Pokrivenost je >90%
- [ ] Error scenariji su testirani
- [ ] Backward kompatibilnost je testirana

**Vrijeme**: 2-3 sata

---

### Task 9: Integracijski testovi
**Opis**: Testirati da svi servisi pravilno koriste nove endpoint factory funkcije.

**Detalji**:
- Ažurirati postojeće integracijske testove
- Dodati testove za automatsko generiranje endpointova
- Testirati custom endpoint override funkcionalnost

**Acceptance Criteria**:
- [ ] Svi integracijski testovi prolaze
- [ ] Automatsko generiranje endpointova je testirano
- [ ] Custom endpoint override je testiran
- [ ] Backward kompatibilnost je testirana

**Vrijeme**: 2-3 sata

---

## Ukupno vrijeme
**Procijenjeno vrijeme**: 13-22 sata

## Prioriteti
1. **Visok prioritet**: Task 1, 2, 3, 4, 5 (core funkcionalnost)
2. **Srednji prioritet**: Task 6, 7 (integracija i dokumentacija)
3. **Nizak prioritet**: Task 8, 9 (testovi)

## Tehnologije
- Node.js
- JavaScript/ES6+
- Jest za testiranje
- XML/SOAP

## Dependencies
- Nema vanjskih dependencies
- Helper funkcije su u `utils/endpoint-utils.js`
- Svi servisi importiraju helper funkcije

## Risk Assessment
- **Nizak rizik**: Backward kompatibilnost je zadržana
- **Srednji rizik**: Potrebno je testirati sve servise
- **Visok rizik**: Nema

## Success Metrics
- [ ] Svi taskovi su završeni
- [ ] Svi testovi prolaze
- [ ] Dokumentacija je ažurirana
- [ ] Backward kompatibilnost je zadržana
- [ ] Korisnici mogu koristiti servise bez ručnog unosa endpointova
