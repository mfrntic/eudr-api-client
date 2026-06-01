# Epic: Migracija EUDR Operator API klijenta na V3

## Opis
Nova dokumentacija u [docs/eudr_docs 1.5/EUDR Operator API Reference v1.0.md](e:/DEVGIT/eudr-api-client/docs/eudr_docs%201.5/EUDR%20Operator%20API%20Reference%20v1.0.md) uvodi EUDR Operator API V3 kao novi, nekompatibilni ugovor koji zamjenjuje postojeće V1/V2 DDS tokove. V3 spaja dosadašnje submission i retrieval operacije u jedinstveni DDS servis, uvodi novi Simplified Declaration servis i mijenja endpointe, namespaceove, operacije, tipove zahtjeva/odgovora i dio poslovnih pravila.

Ovaj epic definira radni plan za implementaciju V3 podrške u biblioteci bez neposrednog mijenjanja koda u ovoj fazi. Cilj dokumenta je poslužiti kao specifikacija za izradu koda, testova i dokumentacije.

## Goal
Uvesti potpunu i jasno odvojenu podršku za EUDR Operator API V3, uz zadržavanje postojećih V1/V2 klijenata tijekom tranzicije, tako da korisnici biblioteke mogu koristiti:
- DDS V3 submission/amend/withdraw operacije
- DDS V3 retrieval operacije iz jedinstvenog servisa
- novi Simplified Declaration V3 servis
- ažurirane endpointe, namespaceove i response modele
- dokumentiranu migracijsku putanju iz V1/V2 prema V3

## Pozadina i sažetak potvrđenih promjena
Na temelju [docs/eudr_docs 1.5/EUDR Operator API Reference v1.0.md](e:/DEVGIT/eudr-api-client/docs/eudr_docs%201.5/EUDR%20Operator%20API%20Reference%20v1.0.md) potvrđeno je sljedeće:

1. V3 uvodi novi DDS endpoint `/tracesnt/ws/EUDRDueDiligenceStatementServiceV3` i novi SD endpoint `/tracesnt/ws/EUDRSimplifiedDeclarationServiceV3`.
2. DDS submission i retrieval više nisu odvojeni servisi; retrieval je spojen u DDS V3 servis.
3. `retractDds` je preimenovan u `withdrawDds`.
4. Retrieval operacije su preimenovane:
- `getDdsInfo` -> `getDds`
- `getDdsInfoByInternalReferenceNumber` -> `getDdsByInternalReference`
- `getStatementByIdentifiers` -> `getDdsByIdentifiers`
5. V3 request/response modeli nisu backward compatible s V1/V2.
6. `operatorType` je zamijenjen s `operatorRole` i skup dozvoljenih vrijednosti je promijenjen.
7. DDS amend/withdraw odgovori više ne vraćaju samo status string, nego `uuid` i lifecycle `status`.
8. V2-only `getReferencedDds` više ne postoji u V3.
9. Uveden je novi Simplified Declaration (SD) servis sa zasebnim operacijama i podatkovnim modelom.
10. Dio DDS modela je izmijenjen: grouped declarations, nova status polja, nova zajednička V3 common shema i dodatne lifecycle vrijednosti.

## Zašto je ovo epic, a ne jedna story
Ovo nije jedna izolirana promjena jer zahvaća više slojeva istovremeno:
- javni API biblioteke u [index.js](e:/DEVGIT/eudr-api-client/index.js) i [services/index.js](e:/DEVGIT/eudr-api-client/services/index.js)
- endpoint i version metadata u [utils/endpoint-utils.js](e:/DEVGIT/eudr-api-client/utils/endpoint-utils.js)
- DDS submission/retrieval implementacije u [services/submission-service.js](e:/DEVGIT/eudr-api-client/services/submission-service.js), [services/submission-service-v2.js](e:/DEVGIT/eudr-api-client/services/submission-service-v2.js), [services/retrieval-service.js](e:/DEVGIT/eudr-api-client/services/retrieval-service.js) i [services/retrieval-service-v2.js](e:/DEVGIT/eudr-api-client/services/retrieval-service-v2.js)
- scenarije i testne inpute u [services/scenarios.js](e:/DEVGIT/eudr-api-client/services/scenarios.js) i [services/scenarios-v2.js](e:/DEVGIT/eudr-api-client/services/scenarios-v2.js)
- README i migracijsku dokumentaciju u [README.md](e:/DEVGIT/eudr-api-client/README.md)
- servisne testove u [tests/services](e:/DEVGIT/eudr-api-client/tests/services)

## Epic Acceptance Criteria
- [ ] Biblioteka ima jasno izložene V3 klijente za DDS i Simplified Declaration
- [ ] V3 endpoint generation radi za standardne environmente bez ručnog endpointa
- [ ] DDS V3 podržava submit, amend, withdraw i retrieval operacije iz jedinstvenog servisa
- [ ] Response modeli za V3 pravilno parsiraju `uuid`, lifecycle `status` i V3 payload strukture
- [ ] V3 ne uvodi regresije u postojeće V1/V2 klijente
- [ ] README jasno razlikuje V1, V2 i V3 podršku te migracijske implikacije
- [ ] Postoje fokusirani testovi za endpoint routing, XML envelope generiranje, response parsing i backward compatibility
- [ ] Scope i ograničenja oko SD, grouped declarations i removed V2 methods su dokumentirani

## Izvan scope-a u prvoj implementacijskoj iteraciji
- Grupiranje deklaracija ako dokumentacija ili acceptance okruženje još nije konačno stabilno
- Versioning Simplified Declaration entiteta ako službeni rollout još nije dostupan
- Downstream Operator and Trader API, koji treba voditi kao zaseban epic
- Refaktoriranje postojećeg V1/V2 koda koje nije nužno za V3 integraciju

## Predložena implementacijska strategija

### Faza 1: V3 foundations
Postaviti zajedničke V3 service metadata i routing bez diranja poslovne logike više nego što je nužno.

Ishodi:
- novi V3 service path i namespace metadata
- novi javni exporti za V3 klijente
- testovi za endpoint generation i version discovery

### Faza 2: DDS V3 client
Implementirati novi DDS V3 klijent kao zasebnu klasu umjesto nasilnog proširenja V1/V2 klijenata.

Razlog:
- V3 je novi ugovor, a ne inkrementalni patch nad V2
- submission i retrieval su spojeni u isti servis
- response i payload modeli se razlikuju dovoljno da zajednička implementacija nosi previsok regresijski rizik

### Faza 3: V3 model mapping i XML generation
Uvesti V3 request builder i parser za response/fault payloadove.

Ishodi:
- mapping za `operatorRole`
- V3 DDS XML envelope i namespaces
- V3 amend/withdraw response parsing (`uuid`, lifecycle `status`)
- retrieval response parsing za unified DDS service

### Faza 4: Simplified Declaration client
Implementirati zaseban SD V3 klijent s vlastitim request/response mappingom.

### Faza 5: README i migration docs
Dokumentirati nove klijente, razlike od V1/V2 i preporučenu migraciju.

## Stories

## Story 1: Zakljucati public API compatibility baseline [GOTOVO]
### Opis
Prije V3 implementacije potrebno je dokumentirati i testno zakljucati trenutni javni API biblioteke,
tako da kasniji rad na adapter/facade sloju ne razbije postojece korisnicke sustave.

Story 1 artefakti:
- [docs/analysis/public-api-inventory.md](docs/analysis/public-api-inventory.md)
- [docs/analysis/compatibility-contract-matrix.md](docs/analysis/compatibility-contract-matrix.md)
- [docs/analysis/contract-test-plan-v3-migration.md](docs/analysis/contract-test-plan-v3-migration.md)

### Datoteke koje ce gotovo sigurno biti zahvacene u implementaciji Story 1 testova
- [tests/services/index.test.js](tests/services/index.test.js)
- [tests/services/submission-service.integration.test.js](tests/services/submission-service.integration.test.js)
- [tests/services/retrieval-service.integration.test.js](tests/services/retrieval-service.integration.test.js)
- novi `tests/contract/*` paket

### Acceptance Criteria
- [x] Svi javni exports iz [index.js](index.js) i [services/index.js](services/index.js) su dokumentirani i zakljucani.
- [x] Sve javne metode iz `services/*.js` su inventarizirane i mapirane na ocekivane response shapeove.
- [x] README-driven primjeri su mapirani na plan contract testova.
- [x] Postoji jasan compatibility plan za high-risk slucajeve (`retractDds/withdrawDds`, `getReferencedDds`, `TRADE`).
- [x] Story 1 isporucuje test plan spreman za implementaciju prije V3 adapter razvoja.

### Procjena
4-8 sati

---

## Story 2: Izloziti V3 facade klijente kroz javni API [GOTOVO]
### Opis
Potrebno je izložiti dva javna V3 klijenta:
- `EudrSubmissionClientV3`
- `EudrRetrievalClientV3`

Interno je dopusteno koristiti zajednicki DDS V3 transport sloj, ali javni API mora pratiti dosadasnji obrazac odvojenih submission/retrieval klasa.

### Napomena
Ova story ne mora odmah uključivati sve operacije; dovoljno je ispravno postaviti konstruktor, konfiguraciju i stabilan javni entry point.

### Datoteke
- [services/due-diligence-statement-service-v3.js](services/due-diligence-statement-service-v3.js)
- [services/submission-service-v3.js](services/submission-service-v3.js)
- [services/retrieval-service-v3.js](services/retrieval-service-v3.js)
- [services/index.js](services/index.js)
- [index.js](index.js)
- [utils/endpoint-utils.js](utils/endpoint-utils.js)

### Acceptance Criteria
- [x] Novi V3 facade klijenti (`EudrSubmissionClientV3`, `EudrRetrievalClientV3`) su javno eksportani
- [x] Konstruktor podrzava standardnu config shemu biblioteke
- [x] Submission i retrieval facade automatski koriste V3 DDS endpoint kada nije eksplicitno zadan `endpoint`
- [x] Ne mijenja ponasanje postojecih V1/V2 exporta

### Procjena
2-3 sata

---

## Story 3: Implementirati DDS V3 submit/amend/withdraw operacije
### Opis
Dodati V3 DDS write operacije s novim imenima, namespaceovima i response modelima.

### Ključne promjene iz specifikacije
- `submitDds` ostaje, ali koristi V3 payload
- `amendDds` ostaje, ali koristi `uuid`
- `retractDds` se zamjenjuje s `withdrawDds`
- amend/withdraw response vraća `uuid` i lifecycle `status`

### Acceptance Criteria
- [x] `submitDds()` generira valjan V3 XML envelope
- [x] `amendDds()` koristi V3 request shape i `uuid`
- [x] `withdrawDds()` postoji kao nova operacija
- [x] Response parsing vraća dosljedan objekt biblioteke s V3 podacima
- [x] SOAP fault handling radi s V3 namespaceovima

### Procjena
1-2 dana

---

## Story 4: Implementirati DDS V3 retrieval operacije kroz V3 retrieval facade
### Opis
V3 DDS servis i dalje objedinjuje retrieval operacije na backendu, ali javni API izlaže ih kroz `EudrRetrievalClientV3` facade radi konzistentnosti s dosadasnjim obrascem biblioteke.

### Operacije
- `getDds()`
- `getDdsByInternalReference()`
- `getDdsByIdentifiers()`

### Acceptance Criteria
- [ ] Retrieval operacije rade kroz `EudrRetrievalClientV3`
- [ ] Response parsing pokriva summary i full-content odgovore
- [ ] Ne uvodi se `getReferencedDds()` u V3 jer ga specifikacija uklanja
- [ ] Javno API ime i dokumentacija jasno razlikuju V2 i V3 retrieval model

### Procjena
1-2 dana

---

## Story 5: Uvesti V3 payload mapping i validaciju domenskih razlika
### Opis
Potrebno je dokumentirano prevesti postojeći input model biblioteke na V3 model tamo gdje je to sigurno, te jasno odbiti ili posebno validirati inpute koji više nisu dopušteni.

### Potvrđene razlike koje treba obraditi
- `operatorType` -> `operatorRole`
- uklonjen `TRADE` za DDS V3
- `associatedStatements` -> `groupedDeclarations`
- nova/common V3 namespace podjela
- dodatne lifecycle vrijednosti (`GROUPED`, `OBSOLETE`, itd.)
- response field rename `ddsIdentifier` -> `uuid`

### Acceptance Criteria
- [ ] Biblioteka ili prevodi stare ulaze gdje je sigurno ili baca jasnu validacijsku grešku
- [ ] Zabranjeni/uklonjeni V1/V2 koncepti imaju jasnu grešku i dokumentaciju
- [ ] V3 status vrijednosti su mapirane i testirane

### Procjena
1-2 dana

---

## Story 6: Implementirati Simplified Declaration V3 klijent
### Opis
Dodati zaseban klijent za novi `EUDRSimplifiedDeclarationServiceV3` s njegovim operacijama.

### Operacije
- `submitSd`
- `updateSd`
- `withdrawSd`
- `getSd`
- `getSdByInternalReference`
- `getSdByIdentifiers`

### Acceptance Criteria
- [ ] SD V3 ima zaseban klijent i zaseban endpoint routing
- [ ] XML builder i parser pokrivaju svih 6 operacija iz specifikacije
- [ ] DDS i SD payloadi nisu miješani u istoj implementaciji
- [ ] README dokumentira kada koristiti DDS, a kada SD servis

### Procjena
2-4 dana

---

## Story 7: Ažurirati README i migracijsku dokumentaciju
### Opis
Potrebno je ažurirati [README.md](e:/DEVGIT/eudr-api-client/README.md) tako da korisnicima bude jasno što je V3, što ostaje od V1/V2 i kako migrirati.

### Acceptance Criteria
- [ ] README opisuje V3 DDS i SD servise
- [ ] Dokumentirana su nova imena operacija i response razlike
- [ ] Jasno je navedeno da je V3 novi ugovor, a ne samo V2.1
- [ ] Postoje minimalni migracijski primjeri V1/V2 -> V3

### Procjena
4-8 sati

---

## Story 8: Pokriti V3 testovima i regresijskom mrežom
### Opis
Za V3 treba postaviti fokusirane testove bez rušenja postojećih V1/V2 paketa.

### Acceptance Criteria
- [ ] Novi testovi pokrivaju endpoint generation za V3
- [ ] Novi testovi pokrivaju XML envelope generation za DDS i SD
- [ ] Novi testovi pokrivaju response parsing za V3 response shape
- [ ] Postojeći V1/V2 testovi ostaju zeleni ili su svjesno prilagođeni uz dokumentiran razlog

### Procjena
1-2 dana

## Predloženi redoslijed implementacije
1. Story 1
2. Story 2
3. Story 3
4. Story 4
5. Story 5
6. Story 8
7. Story 6
8. Story 7

Napomena: Story 6 se može pomaknuti ispred Story 8 ako poslovni prioritet traži SD prije potpune testne mreže, ali tehnički je sigurnije prvo stabilizirati DDS V3 osnovu.

## Rizici
- V3 dokumentacija izričito navodi da dio contracta još može evoluirati prije full rollouta
- Preveliko dijeljenje koda s V1/V2 može povećati regresijski rizik
- Grouped declarations i lifecycle stanja mogu zahtijevati dodatna pojašnjenja nakon pojave WSDL/XSD artefakata u produkcijskom/acceptance okruženju
- SD i DDS imaju slične, ali ne identične modele; prerano spajanje buildera može zakomplicirati održavanje

## Otvorena pitanja
- Treba li V3 klijente izložiti kao potpuno nove klase ili uz aliase zadržati postojeća imena nakon deprecations perioda?
- Želimo li u biblioteci ponuditi adapter sloj koji pomaže migrirati V1/V2 request shape u V3 shape, ili je bolje zadržati strogo odvojene modele?
- Treba li `withdrawDds()` imati i kompatibilni alias `retractDds()` uz deprecation warning, ili želimo strogo pratiti V3 nazivlje?
- Kako ćemo tretirati grupiranje deklaracija u prvoj iteraciji ako endpoint bude dostupan prije konačnog regulatornog zaključavanja?

## Success Metrics
- [ ] Epic razbijen u provedive stories s jasnim acceptance kriterijima
- [ ] Za svaku story postoji jasan skup zahvaćenih datoteka i očekivani ishod
- [ ] Implementacija se može voditi iterativno bez nejasnoća oko scope-a
- [ ] Korisnici biblioteke mogu razumjeti prijelaz s V1/V2 na V3 bez čitanja cijele službene dokumentacije
