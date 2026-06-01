## **EUDR Information System - Operator API Reference** 

**Due Diligence Statements and Simplified Declarations** 

_DG ENV - European Commission_ _**Documentation version:** 1.0_ _**API specification:** V3_ _**Release date:** 2026-05-29_ 

Table of contents 

## Table of contents 

**==> picture [513 x 625] intentionally omitted <==**

**----- Start of picture text -----**<br>
1. EUDR Information System - Operator API Reference 4<br>1.1 Overview 4<br>1.2 Quick Start 4<br>1.3 Target audience 5<br>1.4 Contact information 5<br>1.5 Versioning policy 5<br>2. Acquiring Credentials for a Web Service User 7<br>2.1 Introduction 7<br>2.2 Acquiring Credentials for a Web Service User 7<br>2.3 Usage Recommendations and Limits 9<br>2.4 Recommended Business Behaviour 10<br>3. Echo Service — API Reference 11<br>3.1 Overview 11<br>3.2 WSDL 11<br>3.3 Operations 11<br>3.4 Request / Response Types 11<br>3.5 Authentication 12<br>3.6 Sample Request 12<br>3.7 Sample Response 12<br>3.8 Sample Fault 12<br>3.9 Troubleshooting 13<br>4. V3 API Reference 14<br>4.1 Due Diligence Statement (DDS) — V3 API Reference 14<br>4.2 Simplified Declaration (SD) — V3 API Reference 26<br>5. Sample XML 38<br>5.1 DDS Sample XML Requests & Responses 38<br>5.2 SD Sample XML Requests & Responses 43<br>6. Migration Guide 48<br>6.1 DDS Migration: V1 to V3 48<br>6.2 DDS Migration: V2 to V3 51<br>7. Field-Level Mapping 53<br>7.1 DDS Field-Level Mapping: V1 → V3 53<br>7.2 DDS Field-Level Mapping: V2 → V3 57<br>8. Change Log 61<br>8.1 V3 API Changes (post-amendment release) 61<br>**----- End of picture text -----**<br>


- 2/72 - 

Table of contents 

**==> picture [539 x 702] intentionally omitted <==**

**----- Start of picture text -----**<br>
|||
|---|---|
|8.2 Regulatory Background (2025 Amendment)|61|
|9. EUDR GeoJSON File Description|63|
|9.1 Introduction|63|
|9.2 Definitions|63|
|9.3 File Variants Description|64|
|9.4 Examples|65|
|9.5 Common GeoJSON file errors|65|
|10. API and UI Validation Rules|68|
|10.1 Target audience|68|
|10.2 Introduction|68|
|10.3 Rules description|68|
|11. FAQ|70|
|11.1 General|70|
|11.2 Operators and Roles|70|
|11.3 Lifecycle and Status|71|
|11.4 Geolocation|71|
|11.5 Risk and Compliance|71|
|11.6 System and Integration|71|

**----- End of picture text -----**<br>


- 3/72 - 

1. EUDR Information System - Operator API Reference 

## 1. EUDR Information System - Operator API Reference 

Welcome to the EUDR SOAP API documentation for operators, micro or small primary operators, and authorised representatives integrating with the EUDR Information System. 

## 1.1 Overview 

The EU Deforestation Regulation (EUDR), Regulation (EU) 2023/1115, requires operators placing relevant commodities (cattle, cocoa, coffee, oil palm, rubber, soya and wood) on the EU market to demonstrate that their products are deforestation-free and produced in compliance with the legislation of the country of production. 

The regulation establishes an Information System where operators submit due diligence statements before market placement or export. 

Concerning the amendment procedure of the Implementing Regulation (EU) 2024/3084 that is currently undergoing, this version of documentation may not be final and will be adapted as needed. In particular, certain features such as the grouping of submissions and versioning of Simplified Declarations are planned for subsequent releases and may not be available in the first release. Readers are encouraged to check the European Commission website for updates and subscribe to the Newsletter for the latest information. 

## 1.2 Quick Start 

## 1.2.1 Base URL 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Environment Base URL<br>Production https://eudr.webcloud.ec.europa.eu/tracesnt/<br>Acceptance https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/<br>**----- End of picture text -----**<br>


## 1.2.2 Which service do I use? 

**==> picture [521 x 116] intentionally omitted <==**

**----- Start of picture text -----**<br>
You are... Service Endpoint<br>An  operator  or  authorised representative  placing DDS  — Due Diligence /ws/EUDRDueDiligenceStatementServiceV3?<br>products on the market or exporting Statement wsdl<br>A  micro or small primary operator  established in a low- SD  — Simplified /ws/EUDRSimplifiedDeclarationServiceV3?<br>risk country, producing and placing own products Declaration wsdl<br>Testing connectivity and WS-Security credentials Echo  — Connectivity /ws/eudr/echo?wsdl<br>Test<br>**----- End of picture text -----**<br>


## 1.2.3 Authentication 

Both services use **WS-Security** (UsernameToken over HTTPS): 

- Transport: HTTPS with TLS 

- Token: UsernameToken  with PasswordDigest  (hashed) 

- Timestamp: Required ( wsu:Created  / wsu:Expires ) 

- • Header: WebServiceClientId  - your client identifier, visible in the "Web Services Access" section of your profile (see Acquiring Credentials) 

## 1.2.4 XSD access 

Replace ?wsdl  with ?xsd=1 , ?xsd=2  etc to retrieve the XSD schema (refer to the <xs:import>  section in the WSDL for schema numbering). 

- 4/72 - 

1.3 Target audience 

## **Service availability** 

The V3 endpoints and WSDLs listed above are not yet accessible and will become available once the system goes online. As noted above, the service contracts are subject to change as the amendment of the Implementing Regulation (EU) 2024/3084 is finalised. 

## 1.3 Target audience 

This documentation is intended for: 

- **Economic operators** with IT systems that manage DDS electronically and wish to automate submission to the EUDR Information System 

- **Authorised representatives** acting on behalf of operators 

- **Micro or small primary operators** submitting simplified declarations 

- • **Software providers** developing solutions to service operators' needs in submitting DDS or SD to the EUDR system 

## 1.4 Contact information 

**==> picture [521 x 80] intentionally omitted <==**

**----- Start of picture text -----**<br>
Purpose Contact<br>Registration and technical support SANTE-TRACES@ec.europa.eu<br>Policy questions (Deforestation Regulation) ENV-DEFORESTATION@ec.europa.eu<br>Implementation guidance Deforestation Regulation implementation<br>**----- End of picture text -----**<br>


## **Note** 

When contacting technical support, email titles must start with **"EUDR API"** . Questions should concern API behaviour, testing, errors, or integration. 

## 1.5 Versioning policy 

Service versions are identified by the suffix in the endpoint URL (e.g., V3 ). 

- When a new version is released without backward compatibility, the previous version remains available for a transition period to allow operators to adapt their systems. 

- For the production environment, the duration of version coexistence is published in advance. 

- 

- Old versions are decommissioned after the transition period — operators are required to switch to the latest available version. • Readers are invited to regularly verify whether new specifications are published, as services and their behaviour may evolve. 

## 1.5.1 API version history 

The EUDR Information System API has been released in three major versions: 

- **V1** - the initial API, released with the original Regulation (EU) 2023/1115. Supported DDS submission and retrieval for operators. 

- **V2** - an incremental update to V1 with additional retrieval operations and minor data model refinements. Both V1 and V2 supported only the Due Diligence Statement (DDS). 

- **V3** (current) - a redesign driven by Regulation (EU) 2025/2650, which introduced new actor types (micro or small primary operators, downstream operators), the Simplified Declaration (SD), and grouped declarations. V3 replaces the V1/V2 service contracts with new namespaces, operations, and data structures. 

The Migration Guide and Field-Level Mapping sections document the detailed differences between versions. 

## 1.5.2 Previous API versions (V1 and V2) 

API versions V1 and V2, which were available before the entry into application of Regulation (EU) 2025/2650, will be decommissioned with the release of V3. The regulatory amendment introduces structural changes to the data model and service contracts that are not backward-compatible. 

- 5/72 - 

1.5.2 Previous API versions (V1 and V2) 

Due diligence statements submitted before the amendment remain accessible in read-only mode through the V3 API. 

- 6/72 - 

2. Acquiring Credentials for a Web Service User 

## 2. Acquiring Credentials for a Web Service User 

## 2.1 Introduction 

This document is intended for Economic Operators involved in the EU Deforestation Regulation having an IT system which manages electronically their statements (Due Diligence Statements or Simplified Declarations) and willing to develop the interconnection with the central EUDR system to submit the information in an automated manner. It is also intended for public institutions or private companies willing to develop software to service Economic Operators' needs in submitting information to the central EUDR system. This includes the information exchange introduced by the EUDR Amendment Regulation (2025/2650). 

## 2.2 Acquiring Credentials for a Web Service User 

## 2.2.1 Creation of an operator and a user in EUDR 

The participant needs to manually create the "Operator" corresponding to the company to be registered in the system or join an existing one. 

Details on this process can be found in the EUDR user guide which can be accessed through this link: Deforestation Regulation Implementation 

For every Operator, at least one user must also be created. That first user will be the reference (administrator) user, which will be recorded as the "responsible person" in the operator. It cannot be an anonymous or fictional account. 

Alternatively, if the operator entry already exists, the web service user can request and join this operator instead of creating a new one. 

## **Warning** 

Web Service users cannot belong to more than one Operator entity. 

## 2.2.2 Request and get authorization for the Web Service user 

Once the Operator is created and validated, and user successfully joined, proceed to acquire a "web service user" and an authentication key: 

## **Recommended approach** 

Complete the credential setup and test your integration in the acceptance environment first. Once connectivity and authentication are verified, repeat the process for the production environment. 

## **1. Get the username of the EU Login account** 

To locate the username, follow the next steps: 

- Log in to the EUDR Information System, 

- Click in the top-right corner of the screen, 

- In the Popup, click on **"Edit Profile"** : 

- 7/72 - 

2.2.2 Request and get authorization for the Web Service user 

- In the right box **"Personal Information"** there is an attribute **"username"** . This value can now be used within your system for later tasks. 

## **2. Get the "Authentication key" for the Participant's system** 

- Go back to the page "Edit your profile", 

- Scroll to the section **"Web Services Access"** , 

- If the previous steps have been completed successfully, the button **"Active"** should appear in this Section. Click on this Button. The section will contain a new field labeled **"Authentication Key"** . Click the **"eye"** next to the field to see the value. This value can now be used within the procedure described in later tasks. 

- 8/72 - 

2.3 Usage Recommendations and Limits 

## **Authentication Key is Private** 

The Authentication Key is private and should only be used with your application. The person identified by the EU Login user that was created in the first step is responsible for the data that shall be submitted into EUDR. 

## 2.3 Usage Recommendations and Limits 

## 2.3.1 Statement (DDS / SD) Retrieval Service Limits 

The following recommendations are intended to ensure fair and stable use of the shared EUDR Information System when accessing it via Web Services. Operators are encouraged to design their integrations so that they remain within the limits described below and avoid unnecessary load on the system. 

When planning bulk retrievals, operators should design batching strategies that respect these limits and avoid repeatedly requesting the same datasets where local caching can be used instead. 

## 2.3.2 Global and individual IP throttling limits 

|**Retrieval Method**|||**Limit**|
|---|---|---|---|
|Retrieved via UUID|||100 DDS / SD per call|
|Retrieved via Internal Reference Number|||1000 DDS / SD per call|
|**Limit Type**|**Value**|||
|Global limit|10,000 calls per minute|||
|Per-IP limit|5 calls per second|||



These limits will be monitored and may be adjusted depending on system load. 

## **Note** 

It is highly recommended that Web Service users respect these guidelines to allow fair use of resources for all users. Sustained abuses may lead to operator accounts being further limited. 

- 9/72 - 

2.4 Recommended Business Behaviour 

## 2.4 Recommended Business Behaviour 

To support stable and fair use of the EUDR Information System, operators and traders are encouraged to align their usage with the system's technical limits. 

In addition to respecting the rate limits (10,000 requests per minute globally and 5 requests per second per IP), users should: 

- **Avoid unnecessary high-frequency polling** — after submitting a DDS, allow at least 30 minutes before checking its status to support efficient completion of internal processes, including risk assessment. 

- **Use caching and structured retry intervals** — this contributes to balanced system utilisation and reduces unnecessary load on the system. 

- **Prepare complete and accurate data before submission** — this facilitates compliance with the 25 MB size limit and reduces repeated uploads. 

- **Consolidate DDS within the regulatory framework** — rather than fragmenting them excessively, this supports efficient processing and clearer traceability. 

- **Organise mixing for bulk commodities in accordance with traceability rules** — avoid dependence on widespread "declaration in excess" practices. 

These behaviours support smooth system functioning, timely processing and checks, and fair access for all users of the public IT infrastructure. 

- 10/72 - 

3. Echo Service — API Reference 

## 3. Echo Service — API Reference 

Service: EudrEchoService 

Namespace: http://ec.europa.eu/tracesnt/eudr/echo Endpoint: /tracesnt/ws/eudr/echo 

Security: WS-Security (UsernameToken over HTTPS) 

## 3.1 Overview 

The EUDR Echo Service is a lightweight connectivity test endpoint that allows integrators to verify that their WS-Security credentials and SOAP client configuration are working correctly before attempting to call the main EUDR services (DDS, SD, Verification). 

Use this service to confirm: 

- Your **UsernameToken** (username + authentication key) is valid • Your **SOAP envelope** is correctly formed (timestamp, headers, signature) 

- Your **WebServiceClientId** header is properly included • Network connectivity to the EUDR SOAP infrastructure is established 

## **Note** 

The EUDR Echo Service is available in the acceptance environment for integration testing. To verify production connectivity, use a real API call with restrictive filters - a successful empty response confirms credentials and network access. 

## 3.2 WSDL 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Environment WSDL URL<br>Production https://eudr.webcloud.ec.europa.eu/tracesnt/ws/eudr/echo?wsdl<br>Acceptance https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/eudr/echo?wsdl<br>**----- End of picture text -----**<br>


## 3.3 Operations 

## 3.3.1 testEcho 

Send a test query string and receive a status response confirming successful authentication and connectivity. 

- **Request:** EudrEchoRequest 

- **Response:** EudrEchoResponse 

- **Faults:** EudrEchoServiceFault 

## 3.4 Request / Response Types 

## 3.4.1 EudrEchoRequest 

**==> picture [529 x 118] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>query xs:string Yes Test parameter — any arbitrary string to echo back<br>3.4.2 EudrEchoResponse<br>Field Type Required Description<br>status xs:string Yes Status of the echo operation confirming successful<br>processing<br>**----- End of picture text -----**<br>


- 11/72 - 

3.4.3 EudrEchoServiceFault 

## 3.4.3 EudrEchoServiceFault 

**==> picture [521 x 41] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>errorMessage xs:string No Generated error message during process<br>**----- End of picture text -----**<br>


## 3.5 Authentication 

The Echo Service uses the same **WS-Security** mechanism as all other EUDR services: 

- Transport: HTTPS with TLS 

- Token: UsernameToken  with PasswordDigest  (hashed) • Timestamp: Required ( wsu:Created  / wsu:Expires ) • Header: WebServiceClientId  - your client identifier from the "Web Services Access" section of your profile 

## 3.6 Sample Request 

- <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:echo="http://ec.europa.eu/tracesnt/eudr/echo" xmlns:base="http://ec.europa.eu/sanco/tracesnt/base/v4"> 

- <soapenv:Header> <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"> 

- <wsu:Timestamp> <wsu:Created>2026-01-15T10:00:00.000Z</wsu:Created> <wsu:Expires>2026-01-15T10:05:00.000Z</wsu:Expires> 

- </wsu:Timestamp> <wsse:UsernameToken> <wsse:Username>your-username</wsse:Username> <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">digest-value</wsse:Password> <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">nonce-value</wsse:Nonce> <wsu:Created>2026-01-15T10:00:00.000Z</wsu:Created> 

- </wsse:UsernameToken> 

- </wsse:Security> <base:WebServiceClientId>YOUR_CLIENT_ID</base:WebServiceClientId> 

- </soapenv:Header> <soapenv:Body> <echo:EudrEchoRequest> <echo:query>Hello EUDR</echo:query> 

- </echo:EudrEchoRequest> 

- </soapenv:Body> 

- </soapenv:Envelope> 

## 3.7 Sample Response 

- <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:echo="http://ec.europa.eu/tracesnt/eudr/echo"> 

- <soapenv:Body> <echo:EudrEchoResponse> <echo:status>OK</echo:status> 

- </echo:EudrEchoResponse> 

- </soapenv:Body> 

- </soapenv:Envelope> 

## 3.8 Sample Fault 

- <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:echo="http://ec.europa.eu/tracesnt/eudr/echo"> 

- <soapenv:Body> <soapenv:Fault> <faultcode>soapenv:Server</faultcode> <faultstring>EudrEchoServiceFault</faultstring> <detail> <echo:EudrEchoServiceFault> <echo:errorMessage>Authentication failed</echo:errorMessage> 

- </echo:EudrEchoServiceFault> 

- </detail> 

- </soapenv:Fault> 

- </soapenv:Body> 

- </soapenv:Envelope> 

- 12/72 - 

3.9 Troubleshooting 

## 3.9 Troubleshooting 

**==> picture [521 x 147] intentionally omitted <==**

**----- Start of picture text -----**<br>
Symptom Likely Cause Resolution<br>Authentication failed Invalid username or Verify credentials in EU Login profile (see Acquiring Credentials)<br>authentication key<br>Timestamp expired Clock skew between client Ensure system clock is synchronized (NTP);  wsu:Created  must be<br>and server within 5 minutes of server time<br>Missing  Header not included in SOAP Add  <base:WebServiceClientId>  to the SOAP header<br>WebServiceClientId envelope<br>Connection timeout Network/firewall issue Verify HTTPS connectivity to the endpoint URL; check proxy<br>settings<br>**----- End of picture text -----**<br>


- 13/72 - 

4. V3 API Reference 

## 4. V3 API Reference 

## 4.1 Due Diligence Statement (DDS) — V3 API Reference 

Service: EUDRDueDiligenceStatementServiceV3 Namespace: http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3 Endpoint: /tracesnt/ws/EUDRDueDiligenceStatementServiceV3 Security: WS-Security (UsernameToken over HTTPS) 

## 4.1.1 Overview 

EUDR Due Diligence Statement (DDS) service for operators pursuant to Regulation. A Due Diligence Statement is submitted by an Information System user prior to placing relevant products on the market or exporting them. The due diligence process comprises three steps: information gathering, risk assessment, and risk mitigation. An operator is any natural or legal person who, in the course of a commercial activity, places relevant products on the market or exports them. The Information System assigns a reference number and a verification number to each submitted DDS. 

## 4.1.2 Operations 

## **submitDds** 

Submit a new Due Diligence Statement. The operator or authorised representative submits a DDS prior to placing relevant products on the Union market or exporting them. Accepts optional references for grouping: the voluntary act of creating a new DDS that references previously submitted DDS or SD declarations via their reference numbers. Referenced declarations receive GROUPED status and cannot be individually withdrawn or amended while the referencing grouped declaration is active. Blocked if any referenced statement is not in available status. Role: OPERATOR or REPRESENTATIVE_OPERATOR. Returns the UUID assigned by the Information System. 

• **Request:** SubmitDdsRequest  (Type: SubmitDdsRequestType ) • **Response:** SubmitDdsResponse  (Type: SubmitDdsResponseType ) • **Faults:** BusinessRulesValidationException , PermissionDeniedException 

## **amendDds** 

Amend an existing Due Diligence Statement within the 72-hour amendment window. The 72-hour window starts from submission and allows the operator to amend the declaration while retaining the same reference number. After this window closes, amendments result in a new submission with a new identifier. Re-triggers risk profiling — the identification of risks of noncompliance based on risk criteria for the purpose of assigning a risk status to the DDS. Blocked if the DDS is not in available status or is subject to a customs lock — the immutability constraint applied once the DDS has been used for customs clearance (release for free circulation or export). 

• **Request:** AmendDdsRequest  (Type: AmendDdsRequestType ) • **Response:** AmendDdsResponse  (Type: DdsModificationResponseType ) • **Faults:** BusinessRulesValidationException , PermissionDeniedException 

## **withdrawDds** 

Withdraw a Due Diligence Statement within the 72-hour amendment window. Blocked if the DDS has GROUPED status — a lifecycle state assigned when the DDS has been associated to a grouped declaration. Also blocked if the DDS is under active checks by competent authorities or is subject to a customs lock. 

• **Request:** WithdrawDdsRequest  (Type: WithdrawDdsRequestType ) • **Response:** WithdrawDdsResponse  (Type: DdsModificationResponseType ) • **Faults:** BusinessRulesValidationException , PermissionDeniedException 

- 14/72 - 

4.1.3 Types 

## **getDds** 

Retrieve DDS overview (status, reference number, and verification number) by providing the UUID assigned by the Information System. 

- **Request:** GetDdsRequest  (Type: GetDdsRequestType ) 

- **Response:** GetDdsResponse  (Type: DdsOverviewResponseType ) 

- **Faults:** NotFoundException 

## **getDdsByInternalReference** 

Retrieve DDS overview (status, reference number, and verification number) by providing the internal reference number assigned by the operator's own system. 

- **Request:** GetDdsByInternalReferenceRequest  (Type: GetDdsByInternalReferenceRequestType ) 

- • **Response:** GetDdsByInternalReferenceResponse  (Type: DdsOverviewResponseType ) • **Faults:** NotFoundException 

## **getDdsByIdentifiers** 

Retrieve full DDS content by providing the reference number and verification number. The verification number is a security number assigned by the Information System to ensure additional security of data. 

- **Request:** GetDdsByIdentifiersRequest  (Type: GetDdsByIdentifiersRequestType ) 

- **Response:** GetDdsByIdentifiersResponse  (Type: GetDdsByIdentifiersResponseType ) 

- **Faults:** NotFoundException 

## 4.1.3 Types 

## **SubmitDdsRequestType** 

Submit a new Due Diligence Statement pursuant to Regulation. The DDS documents the three-step due diligence process: information gathering, risk assessment, and risk mitigation. Accepts optional references for grouping — the voluntary act of creating a new DDS that references previously submitted DDS or SD declarations via their reference numbers. Validation is atomic: blocked if any referenced statement has GROUPED status. The Information System assigns a reference number and verification number upon successful submission. 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>operatorRole OperatorRoleType Yes —<br>statement DueDiligenceStatementBaseType Yes —<br>**----- End of picture text -----**<br>


## **SubmitDdsResponseType** 

Response containing the UUID assigned by the Information System to the submitted DDS. 

**==> picture [521 x 41] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>uuid UuidType Yes —<br>**----- End of picture text -----**<br>


## **AmendDdsRequestType** 

Amend an existing DDS within the 72-hour amendment window. The operator may amend the declaration while retaining the same reference number. After this window closes, amendments result in a new submission with a new identifier. Blocked if the 

- 15/72 - 

4.1.3 Types 

DDS is not in available status or is subject to a customs lock — the immutability constraint applied once used for customs clearance. Re-triggers risk profiling. 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>uuid UuidType Yes —<br>statement DueDiligenceStatementBaseType Yes —<br>**----- End of picture text -----**<br>


## **WithdrawDdsRequestType** 

Withdraw a DDS within the 72-hour amendment window. Blocked if the DDS is not in available status — a lifecycle state assigned when associated to a grouped declaration. 

**==> picture [521 x 41] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>uuid UuidType Yes —<br>**----- End of picture text -----**<br>


## **DdsModificationResponseType** 

Response for amend/withdraw operations, containing the resulting DDS lifecycle status. 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>uuid UuidType Yes —<br>status EudrStatusType Yes —<br>**----- End of picture text -----**<br>


## **GetDdsRequestType** 

Request to retrieve DDS overview by one or more UUIDs assigned by the Information System. 

**==> picture [521 x 41] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>uuidList UuidType Yes —<br>**----- End of picture text -----**<br>


## **GetDdsByInternalReferenceRequestType** 

Request to retrieve DDS overview from the operator-assigned internal reference number. 

**==> picture [521 x 42] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>internalReference InternalReferenceNumberType Yes —<br>**----- End of picture text -----**<br>


## **DdsOverviewResponseType** 

Response containing DDS overview information: UUID, internal reference, reference number, verification number, lifecycle status, and optional rejection reason or communication from competent authority. 

**==> picture [521 x 42] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>ddsOverviewList OverviewType No —<br>**----- End of picture text -----**<br>


- 16/72 - 

4.1.3 Types 

## **GetDdsByIdentifiersRequestType** 

Request to retrieve full DDS content by providing the reference number and verification number — the security number assigned by the Information System to ensure additional security of data. 

**==> picture [521 x 41] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>referenceAndVerificationNumber ReferenceAndVerificationNumberType Yes —<br>**----- End of picture text -----**<br>


## **GetDdsByIdentifiersResponseType** 

Response containing the full DDS statement payload retrieved by reference and verification numbers. 

**==> picture [529 x 554] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>statement DueDiligenceStatementBaseType Yes —<br>DueDiligenceStatementBaseType<br>Core payload of a Due Diligence Statement. Contains the information of product details, operator identification, geolocation of<br>production plots, and country of production. Relevant commodities: cattle, cocoa, coffee, oil palm, rubber, soya and wood.<br>Relevant products: products listed in Annex I that contain, have been fed with or have been made using relevant commodities.<br>Products must be deforestation-free: produced on land not deforested after 31 Dec 2020; for wood, harvested without inducing<br>forest degradation after 31 Dec 2020.<br>Field Type Required Description<br>internalReferenceNumber InternalReferenceNumberType No Internal reference in the operator's own<br>system. If not provided, generated by the<br>Information System.<br>activityType ActivityType Yes The type of commercial activity: IMPORT<br>(release for free circulation), EXPORT, or<br>DOMESTIC (placing on the market).<br>representedOperator EconomicOperatorIdentificationType No The represented operator on whose behalf<br>the authorised representative is acting.<br>Required when operatorRole is<br>REPRESENTATIVE_OPERATOR. Contains<br>operatorReferenceNumber, address,<br>email, name and phone.<br>countryOfActivity EuropeanCountryType No EU Member State where the economic<br>activity takes place.<br>borderCrossCountry EuropeanCountryType No Country of entry (for IMPORT activity) or<br>country of exit (for EXPORT activity) at<br>the customs territory border.<br>comment EditorialCommentType No Editorial comment for the competent<br>authority.<br>commodities DdsCommodityType Yes Relevant commodities and products<br>declared in this DDS. Each commodity<br>includes HS code, commercial<br>description, quantity, producer<br>geolocation, and country of production.<br>geoLocationConfidential boolean Yes If TRUE, geolocation data is confidential<br>and not disclosed down the supply chain.<br>If FALSE, geolocation data can be<br>**----- End of picture text -----**<br>


- 17/72 - 

4.1.3 Types 

**==> picture [529 x 423] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>disclosed to downstream operators and<br>traders.<br>groupedDeclarations GroupedDeclarationsType No List of previously submitted DDS or SD<br>declarations referenced by this statement<br>for grouping. Each reference includes a<br>reference number and verification<br>number. Referenced declarations receive<br>GROUPED status.<br>DdsCommodityType<br>A commodity entry in the DDS, representing a relevant commodity or relevant product. Includes HS code classification,<br>commercial description, species information (for wood), and producer geolocation data.<br>Field Type Required Description<br>position long No Ordinal position of this commodity within the DDS.<br>descriptors CommercialDescriptionType Yes Commercial description and quantity measures for<br>this commodity.<br>hsHeading HSHeadingType Yes Commodity code from the Harmonized Commodity<br>Description and Coding System (HS). 2 to 6 digit code<br>identifying the product category.<br>speciesInfo SpeciesInformationType No Species information required for wood-based products<br>to support verification that harvesting did not induce<br>forest degradation.<br>producers DdsProducerType No Producers of this commodity with geolocation of the<br>plot of land where the commodity was produced.<br>Geolocation must be expressed as lat/long coordinates<br>with 6 decimal digits minimum; polygons required for<br>plots greater than 4 hectares (except cattle).<br>**----- End of picture text -----**<br>


## **DdsProducerType** 

Producer information including country of production and geolocation of the plot of land where the commodity was produced. Geolocation is provided as GeoJSON geometry (base64 encoded): lat/long coordinates with minimum 6 decimal digits; polygons for plots greater than 4 hectares (except cattle where establishment coordinates suffice). 

**==> picture [521 x 182] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>position long No Ordinal position of this producer within the commodity.<br>country CountryType Yes Country of production: the country where the relevant<br>commodity was produced. ISO 3166-1 alpha-2 code.<br>name string (max 500) No Name of the producer (natural or legal person).<br>geometryGeojson base64Binary Yes GeoJSON geometry (base64 encoded) representing the<br>geolocation of the plot of land. Must contain lat/long<br>coordinates with minimum 6 decimal digits. Polygons<br>required for plots greater than 4 hectares (except cattle<br>where point coordinates for the establishment suffice).<br>Supported geometry types: Point, MultiPoint, Polygon,<br>MultiPolygon, GeometryCollection.<br>**----- End of picture text -----**<br>


- 18/72 - 

4.1.4 Common Types 

## **SpeciesInformationType** 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>scientificName ScientificNameType No The scientific name is string not case sensitive.<br>commonName ScientificNameType No The common name is string not case sensitive.<br>**----- End of picture text -----**<br>


## **OperatorRoleType** 

Roles permitted for DDS submission. OPERATOR: any natural or legal person who, in the course of a commercial activity, places relevant products on the market or exports them, excluding downstream operators. REPRESENTATIVE_OPERATOR: an authorised representative — any natural or legal person established in the Union who has received a written mandate from an operator to act on its behalf in relation to specified tasks with regard to the operator's obligations under Regulation. 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Value Description<br>OPERATOR Operator: places relevant products on the market or exports them<br>REPRESENTATIVE_OPERATOR Authorised representative: acts on behalf of an operator under written mandate<br>**----- End of picture text -----**<br>


_Constraints: Base: string_ 

## **ScientificNameType** 

Used to specify the scientific (or common) name (Box 6). _Constraints: Base: string , Max length: 200, Min length: 1_ 

## 4.1.4 Common Types 

## **AddressType** 

**==> picture [521 x 120] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>country CountryType Yes —<br>street StreetAndNumberType Yes —<br>postalCode PostalCodeType Yes —<br>city CityType Yes —<br>fullAddress NonStructuredAddressType No —<br>**----- End of picture text -----**<br>


## **EconomicOperatorIdentificationType** 

**==> picture [521 x 120] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>operatorReferenceNumber EconomicOperatorReferenceNumberType No —<br>operatorAddress AddressType No —<br>operatorEmail EmailType No —<br>operatorPhone PhoneType No —<br>operatorName string (max 200) Yes —<br>**----- End of picture text -----**<br>


- 19/72 - 

4.1.4 Common Types 

## **EconomicOperatorReferenceNumberType** 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>identifierType IdentifierTypeType Yes —<br>identifierValue IdentifierValueType Yes —<br>**----- End of picture text -----**<br>


## **GroupedDeclarationsType** 

**==> picture [521 x 41] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>groupedDeclaration ReferenceNumberType Yes —<br>**----- End of picture text -----**<br>


## **ReferenceAndVerificationNumberType** 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>referenceNumber ReferenceNumberType Yes —<br>verificationNumber VerificationNumberType Yes —<br>**----- End of picture text -----**<br>


## **OverviewType** 

**==> picture [521 x 218] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>uuid UuidType Yes —<br>internalReferenceNumber InternalReferenceNumberType Yes —<br>referenceNumber ReferenceNumberType No —<br>verificationNumber VerificationNumberType No —<br>status EudrStatusType Yes —<br>rejectionReason RejectionReasonType No —<br>communicationToOperator CommunicationToOperatorType No —<br>date dateTime No —<br>updatedBy UpdatedByType No —<br>version integer No —<br>**----- End of picture text -----**<br>


## **CommunicationToOperatorType** 

Communication sent by CA to Operator 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>date dateTime Yes Creation or amend date.<br>content string (max 1000) Yes Message content.<br>**----- End of picture text -----**<br>


- 20/72 - 

4.1.4 Common Types 

## **CommercialDescriptionType** 

This type allows you to express one single commercial description and associate it with individual quantitative metrics. 

**==> picture [529 x 299] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>descriptionOfGoods string (max 150) Yes Single commercial description.<br>goodsMeasure GoodsMeasureType Yes Units of measurement combinations for the declared<br>commodity<br>GoodsMeasureType<br>Field Type Required Description<br>percentageEstimationOrDeviation DecimalThreePrecType No Percentage estimate or deviation<br>netWeight DecimalSixteenTotalSixPrecType No This is mandatory if activity type is<br>IMPORT/EXPORT. The weight must be<br>provided in Kg.<br>supplementaryUnit DecimalSixteenTotalSixPrecType No The number of units, when a<br>manufactured product is quantified in<br>this way.<br>supplementaryUnitQualifier SupplementaryUnitQualifierType No This field must be provided if the value<br>is provided in supplementaryUnit field.<br>It represents the type of the<br>numberofUnits field.<br>**----- End of picture text -----**<br>


## **EudrStatusType** 

Universal lifecycle status for EUDR documents 

**==> picture [521 x 211] intentionally omitted <==**

**----- Start of picture text -----**<br>
Value Description<br>SUBMITTED —<br>AVAILABLE —<br>REJECTED —<br>WITHDRAWN —<br>ARCHIVED —<br>SUSPENDED Not active in current release<br>UPDATED Not active in current release<br>GROUPED —<br>OBSOLETE —<br>Constraints: Base:  string<br>**----- End of picture text -----**<br>


## **ReferenceNumberType** 

_Constraints: Base: string , Max length: 14_ 

- 21/72 - 

4.1.4 Common Types 

## **InternalReferenceNumberType** 

_Constraints: Base: string , Max length: 35_ 

## **CountryType** 

ISO 3166-1 alpha-2 codes 

_Constraints: Base: string , Pattern: [a-zA-Z]{2}_ 

## **StreetAndNumberType** 

_Constraints: Base: string , Max length: 300, Min length: 1_ 

## **NonStructuredAddressType** 

_Constraints: Base: string , Max length: 250, Min length: 1_ 

## **UuidType** 

Universally unique identifier (UUID). 

_Constraints: Base: string , Pattern: [0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_ 

## **VerificationNumberType** 

Verification number 

_Constraints: Base: string , Max length: 35, Min length: 5_ 

## **ActivityType** 

**==> picture [521 x 93] intentionally omitted <==**

**----- Start of picture text -----**<br>
Value Description<br>DOMESTIC —<br>IMPORT —<br>EXPORT —<br>Constraints: Base:  string<br>**----- End of picture text -----**<br>


## **PostalCodeType** 

_Constraints: Base: string , Max length: 80, Min length: 1_ 

## **CityType** 

_Constraints: Base: string , Max length: 200, Min length: 1_ 

## **EmailType** 

_Constraints: Base: string , Pattern: [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,} , Max length: 200_ 

- 22/72 - 

4.1.4 Common Types 

## **PhoneType** 

_Constraints: Base: string , Max length: 50_ 

## **EditorialCommentType** 

A version of a SD may have an editorial comment associated to it, with an explanation for the CA (Box 5) _Constraints: Base: string , Max length: 2000_ 

## **UpdatedByType** 

_Constraints: Base: string , Max length: 200, Min length: 1_ 

## **RejectionReasonType** 

Rejection reason of the DDS 

_Constraints: Base: string , Max length: 1000, Min length: 0_ 

## **IdentifierTypeType** 

**==> picture [521 x 218] intentionally omitted <==**

**----- Start of picture text -----**<br>
Value Description<br>eori Economic Operators Registration and Identification number (EORI)<br>vat VAT identification number (VATIN)<br>gln Global location number<br>tin Tax Identification Number (TIN)<br>cbr Central Business Register (CBR)<br>cin Company Identification Number (CIN)<br>duns The nine-digit D-U-N-S Number (DUNS)<br>comp_num National company number (NCN)<br>comp_reg Registration number in official national company register (NCR)<br>oni Other National Identifier (ONI)<br>**----- End of picture text -----**<br>


_Constraints: Base: string_ 

## **IdentifierValueType** 

_Constraints: Base: string , Max length: 80_ 

## **SupplementaryUnitQualifierType** 

_Constraints: Base: string , Max length: 4, Min length: 3_ 

## **DecimalThreePrecType** 

Decimal type with precision three 

- 23/72 - 

4.1.4 Common Types 

_Constraints: Base: decimal_ 

## **DecimalSixteenTotalSixPrecType** 

Decimal number with a total of 16 and 6 fraction digits 

_Constraints: Base: decimal_ 

## **HSHeadingType** 

Commodity code from the Harmonized Commodity Description and Coding System 

_Constraints: Base: string , Pattern: [0-9]{2,6} , Max length: 6, Min length: 2_ 

## **EuropeanCountryType** 

**==> picture [521 x 491] intentionally omitted <==**

**----- Start of picture text -----**<br>
Value Description<br>AT Austria<br>BE Belgium<br>BG Bulgaria<br>CY Cyprus<br>CZ Czech Republic<br>DE Germany<br>DK Denmark<br>EE Estonia<br>ES Spain<br>FI Finland<br>FR France<br>GR Greece<br>HR Croatia<br>HU Hungary<br>IE Ireland<br>IT Italy<br>LT Lithuania<br>LU Luxembourg<br>LV Latvia<br>MT Malta<br>NL Netherlands<br>PL Poland<br>PT Portugal<br>RO Romania<br>**----- End of picture text -----**<br>


- 24/72 - 

4.1.4 Common Types 

**==> picture [521 x 100] intentionally omitted <==**

**----- Start of picture text -----**<br>
Value Description<br>SE Sweden<br>SI Slovenia<br>SK Slovakia (Slovak Republic)<br>XI United Kingdom (Northern Ireland)<br>**----- End of picture text -----**<br>


_Constraints: Base: string_ 

- 25/72 - 

4.2 Simplified Declaration (SD) — V3 API Reference 

## 4.2 Simplified Declaration (SD) — V3 API Reference 

Service: EUDRSimplifiedDeclarationServiceV3 Namespace: http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3 Endpoint: /tracesnt/ws/EUDRSimplifiedDeclarationServiceV3 Security: WS-Security (UsernameToken over HTTPS) 

## 4.2.1 Overview 

EUDR Simplified Declaration (SD) service for micro or small primary operators pursuant to Regulation. A simplified declaration is a one-time submission in the Information System by micro or small primary operators, containing the information set out in Annex III, submitted before placing relevant products on the market or exporting them. It replaces the per-shipment due diligence statement for eligible operators. A micro or small primary operator is an operator who is a natural person or micro/ small undertaking established in a low-risk country, who places on market or exports relevant products they themselves produced in that country. Upon submission, the Information System assigns a declaration identifier which accompanies relevant products through the supply chain in place of a DDS reference number. 

## 4.2.2 Operations 

## **submitSd** 

Submit a new Simplified Declaration. This is a one-time submission — micro or small primary operators submit a single simplified declaration covering all relevant products they produce, rather than a per-shipment due diligence statement. The declaration remains valid indefinitely unless major changes occur. Accepts optional SD-only references for grouping; DDS references are rejected. Referenced declarations receive GROUPED status. Role: MSPO (micro or small primary operator) or authorised representative acting for MSPO. Returns the declaration identifier assigned by the Information System. 

- **Request:** SubmitSdRequest  (Type: SubmitSdRequestType ) 

- **Response:** SubmitSdResponse  (Type: SubmitSdResponseType ) 

• **Faults:** BusinessRulesValidationException , PermissionDeniedException 

## **updateSd** 

Update an existing Simplified Declaration. The SD may be updated following major changes to the information provided. Retriggers risk profiling — the identification of risks of non-compliance based on risk criteria for the purpose of assigning a risk status. Blocked if the SD is not in available status or is subject to a customs lock. 

- **Request:** UpdateSdRequest  (Type: UpdateSdRequestType ) 

- • **Response:** UpdateSdResponse  (Type: SdModificationResponseType ) • **Faults:** BusinessRulesValidationException , PermissionDeniedException , NotFoundException 

## **withdrawSd** 

Withdraw a Simplified Declaration. Blocked if the SD is not in available status — a lifecycle state assigned when the SD has been associated to a grouped declaration. Also blocked if the SD is under active checks by competent authorities or is subject to a customs lock. 

• **Request:** WithdrawSdRequest  (Type: WithdrawSdRequestType ) • **Response:** WithdrawSdResponse  (Type: SdModificationResponseType ) • **Faults:** BusinessRulesValidationException , PermissionDeniedException , NotFoundException 

- 26/72 - 

4.2.3 Types 

## **getSd** 

Retrieve SD overview (status, declaration identifier, and verification number) by providing the UUID assigned by the Information System. 

- **Request:** GetSdRequest  (Type: GetSdRequestType ) 

- **Response:** GetSdResponse  (Type: SdOverviewResponseType ) 

- **Faults:** NotFoundException 

## **getSdByInternalReference** 

Retrieve SD overview (status, declaration identifier, and verification number) by providing the internal reference number assigned by the operator's own system. 

- **Request:** GetSdByInternalReferenceRequest  (Type: GetSdByInternalReferenceRequestType ) 

- **Response:** GetSdByInternalReferenceResponse  (Type: SdOverviewResponseType ) 

- • **Faults:** NotFoundException 

## **getSdByIdentifiers** 

Retrieve full SD content by providing the declaration identifier and verification number. The verification number is a security number assigned by the Information System to ensure additional security of data. 

- **Request:** GetSdByIdentifiersRequest  (Type: GetSdByIdentifiersRequestType ) 

- **Response:** GetSdByIdentifiersResponse  (Type: GetSdByIdentifiersResponseType ) 

- **Faults:** NotFoundException 

## 4.2.3 Types 

## **SubmitSdRequestType** 

Initial submission of a Simplified Declaration pursuant to Regulation. A simplified declaration is a one-time submission by micro or small primary operators, containing the information set out in Annex III, submitted before placing relevant products on the market or exporting them. Replaces the per-shipment due diligence statement for eligible operators. The declaration remains valid indefinitely unless major changes occur. Accepts optional SD-only references for grouping; DDS references are rejected. The Information System assigns a declaration identifier upon successful submission. 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>operatorRole SdOperatorRoleType Yes —<br>statement SimplifiedDeclarationBaseType Yes —<br>**----- End of picture text -----**<br>


## **SubmitSdResponseType** 

Response containing the declaration identifier — the unique identifier assigned by the Information System to the micro or small primary operator upon submission of a simplified declaration. Accompanies relevant products through the supply chain in place of a DDS reference number. 

**==> picture [521 x 42] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>sdIdentifier UuidType Yes —<br>**----- End of picture text -----**<br>


- 27/72 - 

4.2.3 Types 

## **UpdateSdRequestType** 

Update a Simplified Declaration. Re-triggers risk profiling. Blocked if the SD is not in available status or is subject to a customs lock. 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>sdIdentifier UuidType Yes —<br>statement SimplifiedDeclarationBaseType Yes —<br>**----- End of picture text -----**<br>


## **WithdrawSdRequestType** 

Withdraw a Simplified Declaration. Blocked if the SD is not in available status — a lifecycle state assigned when associated to a grouped declaration. Also blocked if under active checks by competent authorities or subject to a customs lock. 

**==> picture [521 x 42] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>sdIdentifier UuidType Yes —<br>**----- End of picture text -----**<br>


## **SdModificationResponseType** 

Response for update/withdraw operations, containing the resulting SD lifecycle status. 

**==> picture [521 x 80] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>uuid UuidType Yes —<br>version integer No —<br>status EudrStatusType Yes —<br>**----- End of picture text -----**<br>


## **GetSdRequestType** 

Request to retrieve SD overview by one or more UUIDs and optional version number. 

**==> picture [521 x 42] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>uuidAndVersionNumberList UuidAndVersionNumberType Yes —<br>**----- End of picture text -----**<br>


## **GetSdByInternalReferenceRequestType** 

Request to retrieve SD overview by the internal reference number from the operator's own system. 

**==> picture [521 x 42] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>internalReference InternalReferenceNumberType Yes —<br>**----- End of picture text -----**<br>


## **SdOverviewResponseType** 

Response containing SD overview information: UUID, internal reference, declaration identifier, verification number, lifecycle status, and optional rejection reason or communication from competent authority. 

**==> picture [521 x 41] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>sdOverviewList OverviewType No —<br>**----- End of picture text -----**<br>


- 28/72 - 

4.2.3 Types 

## **GetSdByIdentifiersRequestType** 

Request to retrieve full SD content by providing the declaration identifier and verification number — the security number assigned by the Information System to ensure additional security of data. 

**==> picture [521 x 41] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>referenceAndVerificationNumber ReferenceAndVerificationNumberType Yes —<br>**----- End of picture text -----**<br>


## **GetSdByIdentifiersResponseType** 

Response containing the full SD statement payload retrieved by declaration identifier and verification number. 

**==> picture [521 x 42] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>statement SimplifiedDeclarationBaseType Yes —<br>**----- End of picture text -----**<br>


## **SimplifiedDeclarationBaseType** 

Core payload of a Simplified Declaration pursuant to Regulation. Contains the information set out in Annex III for micro or small primary operators established in a low-risk country. Unlike the DDS, this is a one-time submission covering all relevant products the operator produces, rather than a per-shipment declaration. Relevant commodities: cattle, cocoa, coffee, oil palm, rubber, soya and wood. Products must be deforestation-free: produced on land not deforested after 31 Dec 2020; for wood, harvested without inducing forest degradation after 31 Dec 2020. 

**==> picture [521 x 404] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>internalReferenceNumber ReferenceNumberType Yes Operator defined reference. If not<br>provided, generated by the Information<br>System.<br>activityType ActivityType Yes The type of commercial activity: IMPORT<br>(release for free circulation), EXPORT, or<br>DOMESTIC (placing on the market). (Box<br>2)<br>representedOperator EconomicOperatorIdentificationType No The represented micro or small primary<br>operator on whose behalf the authorised<br>representative is acting (Box 3). Required<br>when operatorRole is<br>REPRESENTATIVE_MSPO. Identified by<br>standard ID.<br>countryOfActivity EuropeanCountryType No EU Member State where the economic<br>activity takes place (Box 4). Must be a<br>low-risk country for MSPO eligibility.<br>borderCrossCountry EuropeanCountryType No Country of entry (for IMPORT activity) or<br>country of exit (for EXPORT activity) at<br>the customs territory border (Box 4).<br>comment EditorialCommentType No Editorial comment for the competent<br>authority (Box 5).<br>commodities SdCommodityType Yes Relevant commodities and products<br>declared in this SD. Corresponds to Boxes<br>6, 9 to 16.<br>geoLocationConfidential boolean Yes If TRUE, geolocation data is confidential<br>and not disclosed down the supply chain<br>to downstream operators and traders. If<br>**----- End of picture text -----**<br>


- 29/72 - 

4.2.3 Types 

**==> picture [521 x 104] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>FALSE, geolocation data can be disclosed<br>to anyone down the supply chain.<br>groupedDeclarations GroupedDeclarationsType No List of previously submitted SD<br>declarations referenced by this statement<br>for grouping. Each reference includes a<br>reference number.<br>**----- End of picture text -----**<br>


## **SdReferenceType** 

Reference to a previously submitted Simplified Declaration for grouping. Only SD references are accepted; DDS references are rejected. The referenced SD receives GROUPED status and cannot be individually withdrawn or updated while the referencing grouped declaration is active. 

**==> picture [521 x 72] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>referenceNumber ReferenceNumberType Yes Reference number of the SD to be grouped.<br>verificationNumber VerificationNumberType Yes Verification number of the SD to be grouped — ensures<br>additional security of data.<br>**----- End of picture text -----**<br>


## **SdCommodityType** 

A commodity entry in the Simplified Declaration, representing a relevant commodity or relevant product. Includes HS code classification, commercial description, and producer location data. 

**==> picture [521 x 182] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>position long No Ordinal position of this commodity within the SD.<br>descriptors CommercialDescriptionType Yes Commercial description and quantity measures for<br>this commodity.<br>hsHeading HSHeadingType Yes Box 10: commodity code from the Harmonized<br>Commodity Description and Coding System (HS), plus<br>the (optional) corresponding quantity information. 2 to<br>6 digit code.<br>producers SdProducerType No Producers of this commodity with location<br>information. For SD, location may be provided as<br>GeoJSON geometry or postal address(es), unlike DDS<br>which requires GeoJSON geolocation.<br>**----- End of picture text -----**<br>


## **SdProducerType** 

Producer information for a Simplified Declaration. Includes country of production and location data. Unlike DDS producers which require GeoJSON geolocation, SD producers may provide either GeoJSON geometry or postal address(es). 

**==> picture [521 x 112] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>producerPosition long No Ordinal position of this producer within the commodity.<br>producerCountry CountryType Yes Country of production: the country where the relevant<br>commodity was produced. ISO 3166-1 alpha-2 code.<br>producerName string (max 500) No Name of the producer (natural or legal person).<br>producerLocation SdProducerLocationType Yes —<br>**----- End of picture text -----**<br>


- 30/72 - 

4.2.4 Common Types 

## **SdProducerLocationType** 

Choice between GeoJSON geometry, address-based location(s), or cadastral identifier for SD producers. For Simplified Declarations, micro or small primary operators may provide either geolocation as GeoJSON, postal address(es), or a cadastral identifier as an alternative. This contrasts with DDS where GeoJSON geolocation is mandatory. 

**==> picture [521 x 174] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>geometryGeojson base64Binary Choice GeoJSON geometry (base64 encoded) representing<br>the geolocation of the plot of land. Must contain<br>lat/long coordinates with minimum 6 decimal<br>digits. Supported types: Point, MultiPoint, Polygon,<br>MultiPolygon, GeometryCollection.<br>postalAddress SdProducerPostalAddressType Choice Postal address(es) of the production location.<br>Alternative to GeoJSON geolocation for micro or<br>small primary operators.<br>cadastralIdentifier string (max 80) Choice Cadastral identifier(s) referencing the plot(s) of<br>land in a national land registry. Maximum 80<br>characters each.<br>**----- End of picture text -----**<br>


## **SdProducerPostalAddressType** 

Postal address of a production location for SD producers. Used as an alternative to GeoJSON geolocation for micro or small primary operators. 

**==> picture [521 x 81] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>producerStreet StreetAndNumberType No Street name and number of the production location.<br>producerPostalCode PostalCodeType Yes Postal code of the production location.<br>producerCity CityType Yes City of the production location.<br>**----- End of picture text -----**<br>


## **SdOperatorRoleType** 

Roles permitted for SD submission. MICRO_OPERATOR: a micro or small primary operator — an operator who is a natural person or micro/small undertaking, irrespective of legal form, established in a low-risk country, who places on market or exports relevant products they themselves produced in that country. REPRESENTATIVE_MSPO: an authorised representative acting on behalf of a micro or small primary operator under written mandate. 

**==> picture [521 x 80] intentionally omitted <==**

**----- Start of picture text -----**<br>
Value Description<br>MICRO_OPERATOR —<br>REPRESENTATIVE_MSPO —<br>MEMBER_STATE Member State authority<br>**----- End of picture text -----**<br>


_Constraints: Base: string_ 

## 4.2.4 Common Types 

## **UuidAndVersionNumberType** 

**==> picture [521 x 41] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>uuid UuidType Yes —<br>**----- End of picture text -----**<br>


- 31/72 - 

4.2.4 Common Types 

**==> picture [521 x 42] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>versionNumber integer No —<br>**----- End of picture text -----**<br>


## **AddressType** 

**==> picture [521 x 120] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>country CountryType Yes —<br>street StreetAndNumberType Yes —<br>postalCode PostalCodeType Yes —<br>city CityType Yes —<br>fullAddress NonStructuredAddressType No —<br>**----- End of picture text -----**<br>


## **EconomicOperatorIdentificationType** 

**==> picture [521 x 120] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>operatorReferenceNumber EconomicOperatorReferenceNumberType No —<br>operatorAddress AddressType No —<br>operatorEmail EmailType No —<br>operatorPhone PhoneType No —<br>operatorName string (max 200) Yes —<br>**----- End of picture text -----**<br>


## **EconomicOperatorReferenceNumberType** 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>identifierType IdentifierTypeType Yes —<br>identifierValue IdentifierValueType Yes —<br>**----- End of picture text -----**<br>


## **GroupedDeclarationsType** 

**==> picture [521 x 41] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>groupedDeclaration ReferenceNumberType Yes —<br>**----- End of picture text -----**<br>


## **ReferenceAndVerificationNumberType** 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>referenceNumber ReferenceNumberType Yes —<br>verificationNumber VerificationNumberType Yes —<br>**----- End of picture text -----**<br>


- 32/72 - 

4.2.4 Common Types 

## **OverviewType** 

**==> picture [521 x 217] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>uuid UuidType Yes —<br>internalReferenceNumber InternalReferenceNumberType Yes —<br>referenceNumber ReferenceNumberType No —<br>verificationNumber VerificationNumberType No —<br>status EudrStatusType Yes —<br>rejectionReason RejectionReasonType No —<br>communicationToOperator CommunicationToOperatorType No —<br>date dateTime No —<br>updatedBy UpdatedByType No —<br>version integer No —<br>**----- End of picture text -----**<br>


## **CommunicationToOperatorType** 

Communication sent by CA to Operator 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>date dateTime Yes Creation or amend date.<br>content string (max 1000) Yes Message content.<br>**----- End of picture text -----**<br>


## **CommercialDescriptionType** 

This type allows you to express one single commercial description and associate it with individual quantitative metrics. 

**==> picture [521 x 73] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>descriptionOfGoods string (max 150) Yes Single commercial description.<br>goodsMeasure GoodsMeasureType Yes Units of measurement combinations for the declared<br>commodity<br>**----- End of picture text -----**<br>


## **GoodsMeasureType** 

**==> picture [521 x 168] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>percentageEstimationOrDeviation DecimalThreePrecType No Percentage estimate or deviation<br>netWeight DecimalSixteenTotalSixPrecType No This is mandatory if activity type is<br>IMPORT/EXPORT. The weight must be<br>provided in Kg.<br>supplementaryUnit DecimalSixteenTotalSixPrecType No The number of units, when a<br>manufactured product is quantified in<br>this way.<br>supplementaryUnitQualifier SupplementaryUnitQualifierType No This field must be provided if the value<br>is provided in supplementaryUnit field.<br>**----- End of picture text -----**<br>


- 33/72 - 

4.2.4 Common Types 

**==> picture [521 x 49] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>It represents the type of the<br>numberofUnits field.<br>**----- End of picture text -----**<br>


## **EudrStatusType** 

Universal lifecycle status for EUDR documents 

**==> picture [521 x 198] intentionally omitted <==**

**----- Start of picture text -----**<br>
Value Description<br>SUBMITTED —<br>AVAILABLE —<br>REJECTED —<br>WITHDRAWN —<br>ARCHIVED —<br>SUSPENDED Not active in current release<br>UPDATED Not active in current release<br>GROUPED —<br>OBSOLETE —<br>**----- End of picture text -----**<br>


_Constraints: Base: string_ 

## **ReferenceNumberType** 

_Constraints: Base: string , Max length: 14_ 

## **InternalReferenceNumberType** 

_Constraints: Base: string , Max length: 35_ 

## **CountryType** 

ISO 3166-1 alpha-2 codes 

_Constraints: Base: string , Pattern: [a-zA-Z]{2}_ 

## **StreetAndNumberType** 

_Constraints: Base: string , Max length: 300, Min length: 1_ 

## **NonStructuredAddressType** 

_Constraints: Base: string , Max length: 250, Min length: 1_ 

## **UuidType** 

Universally unique identifier (UUID). 

_Constraints: Base: string , Pattern: [0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_ 

- 34/72 - 

4.2.4 Common Types 

## **VerificationNumberType** 

Verification number 

_Constraints: Base: string , Max length: 35, Min length: 5_ 

## **ActivityType** 

**==> picture [521 x 94] intentionally omitted <==**

**----- Start of picture text -----**<br>
Value Description<br>DOMESTIC —<br>IMPORT —<br>EXPORT —<br>Constraints: Base:  string<br>**----- End of picture text -----**<br>


## **PostalCodeType** 

_Constraints: Base: string , Max length: 80, Min length: 1_ 

## **CityType** 

_Constraints: Base: string , Max length: 200, Min length: 1_ 

## **EmailType** 

_Constraints: Base: string , Pattern: [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,} , Max length: 200_ 

## **PhoneType** 

_Constraints: Base: string , Max length: 50_ 

## **EditorialCommentType** 

A version of a SD may have an editorial comment associated to it, with an explanation for the CA (Box 5) 

_Constraints: Base: string , Max length: 2000_ 

## **UpdatedByType** 

_Constraints: Base: string , Max length: 200, Min length: 1_ 

## **RejectionReasonType** 

Rejection reason of the DDS 

_Constraints: Base: string , Max length: 1000, Min length: 0_ 

- 35/72 - 

4.2.4 Common Types 

## **IdentifierTypeType** 

**==> picture [521 x 217] intentionally omitted <==**

**----- Start of picture text -----**<br>
Value Description<br>eori Economic Operators Registration and Identification number (EORI)<br>vat VAT identification number (VATIN)<br>gln Global location number<br>tin Tax Identification Number (TIN)<br>cbr Central Business Register (CBR)<br>cin Company Identification Number (CIN)<br>duns The nine-digit D-U-N-S Number (DUNS)<br>comp_num National company number (NCN)<br>comp_reg Registration number in official national company register (NCR)<br>oni Other National Identifier (ONI)<br>**----- End of picture text -----**<br>


_Constraints: Base: string_ 

## **IdentifierValueType** 

_Constraints: Base: string , Max length: 80_ 

## **SupplementaryUnitQualifierType** 

_Constraints: Base: string , Max length: 4, Min length: 3_ 

## **DecimalThreePrecType** 

Decimal type with precision three _Constraints: Base: decimal_ 

## **DecimalSixteenTotalSixPrecType** 

Decimal number with a total of 16 and 6 fraction digits 

_Constraints: Base: decimal_ 

## **HSHeadingType** 

Commodity code from the Harmonized Commodity Description and Coding System _Constraints: Base: string , Pattern: [0-9]{2,6} , Max length: 6, Min length: 2_ 

## **EuropeanCountryType** 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Value Description<br>AT Austria<br>BE Belgium<br>**----- End of picture text -----**<br>


- 36/72 - 

4.2.4 Common Types 

**==> picture [521 x 531] intentionally omitted <==**

**----- Start of picture text -----**<br>
Value Description<br>BG Bulgaria<br>CY Cyprus<br>CZ Czech Republic<br>DE Germany<br>DK Denmark<br>EE Estonia<br>ES Spain<br>FI Finland<br>FR France<br>GR Greece<br>HR Croatia<br>HU Hungary<br>IE Ireland<br>IT Italy<br>LT Lithuania<br>LU Luxembourg<br>LV Latvia<br>MT Malta<br>NL Netherlands<br>PL Poland<br>PT Portugal<br>RO Romania<br>SE Sweden<br>SI Slovenia<br>SK Slovakia (Slovak Republic)<br>XI United Kingdom (Northern Ireland)<br>**----- End of picture text -----**<br>


_Constraints: Base: string_ 

- 37/72 - 

5. Sample XML 

## 5. Sample XML 

## 5.1 DDS Sample XML Requests & Responses 

Sample SOAP requests and responses for the EUDRDueDiligenceStatementServiceV3 . 

## **Note** 

Replace {{wsse_*}}  placeholders with your WS-Security credentials. 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Environment Endpoint<br>Production https://eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRDueDiligenceStatementServiceV3<br>Acceptance https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRDueDiligenceStatementServiceV3<br>**----- End of picture text -----**<br>


## 5.1.1 submitDds 

## **Request** 

- <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4" xmlns:dds="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3" xmlns:eudrCommon="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3"> <soapenv:Header> <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"> <wsu:Timestamp wsu:Id="TS-1"> <wsu:Created>{{wsse_created}}</wsu:Created> <wsu:Expires>{{wsse_expires}}</wsu:Expires> </wsu:Timestamp> <wsse:UsernameToken wsu:Id="UT-1"> <wsse:Username>{{wsse_username}}</wsse:Username> <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">{{wsse_passwordDigest}}</wsse:Password> <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">{{wsse_nonce}}</wsse:Nonce> <wsu:Created>{{wsse_created}}</wsu:Created> </wsse:UsernameToken> </wsse:Security> <v4:WebServiceClientId>YOUR_CLIENT_ID</v4:WebServiceClientId> </soapenv:Header> <soapenv:Body> <dds:SubmitDdsRequest> <dds:operatorRole>OPERATOR</dds:operatorRole> <dds:statement> <dds:internalReferenceNumber></dds:internalReferenceNumber> <dds:activityType>IMPORT</dds:activityType> <dds:countryOfActivity>BE</dds:countryOfActivity> <dds:borderCrossCountry>BE</dds:borderCrossCountry> <dds:commodities> <dds:position>1</dds:position> <dds:descriptors> <eudrCommon:descriptionOfGoods>Test wood product</eudrCommon:descriptionOfGoods> <eudrCommon:goodsMeasure> <eudrCommon:netWeight>200</eudrCommon:netWeight> <eudrCommon:supplementaryUnit>20</eudrCommon:supplementaryUnit> <eudrCommon:supplementaryUnitQualifier>MTQ</eudrCommon:supplementaryUnitQualifier> </eudrCommon:goodsMeasure> </dds:descriptors> <dds:hsHeading>4410</dds:hsHeading> <dds:speciesInfo> <dds:scientificName>Bifora testiculata</dds:scientificName> <dds:commonName>Test Name</dds:commonName> </dds:speciesInfo> <dds:producers> <dds:position>1</dds:position> <dds:country>FR</dds:country> <dds:name>Producer Name</dds:name> <dds:geometryGeojson>BASE64_ENCODED_GEOJSON</dds:geometryGeojson> </dds:producers> </dds:commodities> <dds:geoLocationConfidential>false</dds:geoLocationConfidential> </dds:statement> </dds:SubmitDdsRequest> </soapenv:Body> 

- </soapenv:Envelope> 

- 38/72 - 

5.1.2 submitDds (with Grouped Declarations) 

## **Response** 

<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"> <S:Header> <ns2:Security xmlns:ns1="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:ns2="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"> <ns1:Timestamp> <ns1:Created>2026-05-20T11:52:32.854+02:00</ns1:Created> <ns1:Expires>2026-05-20T11:52:37.855+02:00</ns1:Expires> </ns1:Timestamp> </ns2:Security> </S:Header> <S:Body> <ns5:SubmitDdsResponse xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3" xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3"> <ns5:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</ns5:uuid> </ns5:SubmitDdsResponse> </S:Body> </S:Envelope> 

## 5.1.2 submitDds (with Grouped Declarations) 

Submit a DDS that references previously submitted declarations for grouping. 

## **Request** 

**==> picture [513 x 382] intentionally omitted <==**

**----- Start of picture text -----**<br>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"<br>xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4"<br>xmlns:dds="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3"<br>xmlns:eudrCommon="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3"><br><!-- SOAP Header with WS-Security (same as submitDds) --><br><soapenv:Body><br><dds:SubmitDdsRequest><br><dds:operatorRole>OPERATOR</dds:operatorRole><br><dds:statement><br><dds:internalReferenceNumber>GROUPED-REF-001</dds:internalReferenceNumber><br><dds:activityType>IMPORT</dds:activityType><br><dds:countryOfActivity>BE</dds:countryOfActivity><br><dds:borderCrossCountry>BE</dds:borderCrossCountry><br><dds:commodities><br><dds:position>1</dds:position><br><dds:descriptors><br><eudrCommon:descriptionOfGoods>Grouped cocoa shipment</eudrCommon:descriptionOfGoods><br><eudrCommon:goodsMeasure><br><eudrCommon:netWeight>5000</eudrCommon:netWeight><br></eudrCommon:goodsMeasure><br></dds:descriptors><br><dds:hsHeading>1801</dds:hsHeading><br><dds:speciesInfo><br><dds:scientificName>Theobroma cacao</dds:scientificName><br><dds:commonName>Cacao</dds:commonName><br></dds:speciesInfo><br><dds:producers><br><dds:position>1</dds:position><br><dds:country>BR</dds:country><br><dds:name>Producer Name</dds:name><br><dds:geometryGeojson>BASE64_ENCODED_GEOJSON</dds:geometryGeojson><br></dds:producers><br></dds:commodities><br><dds:geoLocationConfidential>false</dds:geoLocationConfidential><br><!-- Grouped declarations: references to previously submitted DDS/SD --><br><dds:groupedDeclarations><br><eudrCommon:groupedDeclaration>26FRYUI34JTQKB</eudrCommon:groupedDeclaration><br></dds:groupedDeclarations><br><dds:groupedDeclarations><br><eudrCommon:groupedDeclaration>26FRLSCV861ZVV</eudrCommon:groupedDeclaration><br></dds:groupedDeclarations><br></dds:statement><br></dds:SubmitDdsRequest><br></soapenv:Body><br></soapenv:Envelope><br>Grouped declarations behaviour<br>**----- End of picture text -----**<br>


Referenced declarations receive GROUPED  status and cannot be individually withdrawn or amended while the referencing grouped declaration is active. Submission is blocked if any referenced statement is not in AVAILABLE status. 

- 39/72 - 

5.1.3 amendDds 

## 5.1.3 amendDds 

## **Request** 

<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4" xmlns:dds="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3" xmlns:eudrCommon="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3"> <!-- SOAP Header with WS-Security (same as submitDds) --> <soapenv:Body> <dds:AmendDdsRequest> <dds:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</dds:uuid> <dds:statement> <dds:internalReferenceNumber></dds:internalReferenceNumber> <dds:activityType>IMPORT</dds:activityType> <dds:countryOfActivity>BE</dds:countryOfActivity> <dds:borderCrossCountry>BE</dds:borderCrossCountry> <dds:commodities> <dds:position>1</dds:position> <dds:descriptors> <eudrCommon:descriptionOfGoods>Test wood product amended</eudrCommon:descriptionOfGoods> <eudrCommon:goodsMeasure> <eudrCommon:netWeight>300</eudrCommon:netWeight> <eudrCommon:supplementaryUnit>30</eudrCommon:supplementaryUnit> <eudrCommon:supplementaryUnitQualifier>MTQ</eudrCommon:supplementaryUnitQualifier> </eudrCommon:goodsMeasure> </dds:descriptors> <dds:hsHeading>4410</dds:hsHeading> <dds:speciesInfo> <dds:scientificName>Bifora testiculata</dds:scientificName> <dds:commonName>Test Name</dds:commonName> </dds:speciesInfo> <dds:producers> <dds:position>1</dds:position> <dds:country>FR</dds:country> <dds:name>Producer Name amended</dds:name> <dds:geometryGeojson>BASE64_ENCODED_GEOJSON</dds:geometryGeojson> </dds:producers> </dds:commodities> <dds:geoLocationConfidential>false</dds:geoLocationConfidential> </dds:statement> </dds:AmendDdsRequest> </soapenv:Body> </soapenv:Envelope> 

## **Response** 

<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"> <!-- Response Header (same structure as submitDds response) --> <S:Body> <ns5:AmendDdsResponse xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3" xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3"> <ns5:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</ns5:uuid> <ns5:status>AVAILABLE</ns5:status> </ns5:AmendDdsResponse> </S:Body> </S:Envelope> 

## 5.1.4 withdrawDds 

## **Request** 

<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4" xmlns:dds="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3"> <!-- SOAP Header with WS-Security (same as submitDds) --> <soapenv:Body> <dds:WithdrawDdsRequest> <dds:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</dds:uuid> </dds:WithdrawDdsRequest> </soapenv:Body> </soapenv:Envelope> 

## **Response** 

<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"> <!-- Response Header (same structure as submitDds response) --> <S:Body> <ns5:WithdrawDdsResponse xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3" xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3"> <ns5:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</ns5:uuid> 

<ns5:status>WITHDRAWN</ns5:status> 

- 40/72 - 

5.1.5 getDds 

</ns5:WithdrawDdsResponse> </S:Body> </S:Envelope> 

## 5.1.5 getDds 

## **Request** 

- <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4" xmlns:dds="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3"> 

- <!-- SOAP Header with WS-Security (same as submitDds) --> <soapenv:Body> 

- <dds:GetDdsRequest> 

- <dds:uuidList>071874bd-8c62-4cac-8eb6-b2fbe003410c</dds:uuidList> 

- </dds:GetDdsRequest> 

- </soapenv:Body> 

- </soapenv:Envelope> 

## **Response** 

- <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"> 

- <!-- Response Header (same structure as submitDds response) --> 

- <S:Body> 

- <ns5:GetDdsResponse xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3" xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3"> 

- <ns5:ddsOverviewList> 

- <ns3:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</ns3:uuid> 

- <ns3:internalReferenceNumber>26BEDWNW9JD1TN</ns3:internalReferenceNumber> 

- <ns3:referenceNumber>26BE7XTVCZAQ2S</ns3:referenceNumber> 

- <ns3:verificationNumber>SFFCB4Y3</ns3:verificationNumber> <ns3:status>AVAILABLE</ns3:status> 

- <ns3:date>2026-05-20T09:55:01.000Z</ns3:date> 

- <ns3:updatedBy>User3 User3</ns3:updatedBy> 

- <ns3:version>1</ns3:version> </ns5:ddsOverviewList> </ns5:GetDdsResponse> 

- </S:Body> 

- </S:Envelope> 

## 5.1.6 getDdsByInternalReference 

## **Request** 

- <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4" xmlns:dds="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3"> <!-- SOAP Header with WS-Security (same as submitDds) --> <soapenv:Body> 

- <dds:GetDdsByInternalReferenceRequest> 

- <dds:internalReference>26BEDWNW9JD1TN</dds:internalReference> 

- </dds:GetDdsByInternalReferenceRequest> 

- </soapenv:Body> 

- </soapenv:Envelope> 

## **Response** 

- <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"> 

- <!-- Response Header (same structure as submitDds response) --> 

- <S:Body> 

- <ns5:GetDdsByInternalReferenceResponse xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3" xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3"> 

- <ns5:ddsOverviewList> 

- <ns3:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</ns3:uuid> 

- <ns3:internalReferenceNumber>26BEDWNW9JD1TN</ns3:internalReferenceNumber> 

- <ns3:referenceNumber>26BE7XTVCZAQ2S</ns3:referenceNumber> 

- <ns3:verificationNumber>SFFCB4Y3</ns3:verificationNumber> 

- <ns3:status>AVAILABLE</ns3:status> 

- <ns3:date>2026-05-20T09:55:01.000Z</ns3:date> 

- <ns3:updatedBy>User3 User3</ns3:updatedBy> 

- <ns3:version>1</ns3:version> </ns5:ddsOverviewList> </ns5:GetDdsByInternalReferenceResponse> </S:Body> 

- </S:Envelope> 

- 41/72 - 

5.1.7 getDdsByIdentifiers 

## 5.1.7 getDdsByIdentifiers 

## **Request** 

- <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4" xmlns:dds="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3" xmlns:eudrCommon="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3"> 

- <!-- SOAP Header with WS-Security (same as submitDds) --> <soapenv:Body> 

- <dds:GetDdsByIdentifiersRequest> 

- <dds:referenceAndVerificationNumber> 

- <eudrCommon:referenceNumber>26BE7XTVCZAQ2S</eudrCommon:referenceNumber> <eudrCommon:verificationNumber>SFFCB4Y3</eudrCommon:verificationNumber> 

- </dds:referenceAndVerificationNumber> 

- </dds:GetDdsByIdentifiersRequest> 

- </soapenv:Body> 

- </soapenv:Envelope> 

## **Response** 

- <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"> <!-- Response Header (same structure as submitDds response) --> <S:Body> <ns5:GetDdsByIdentifiersResponse xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3" xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3"> <ns5:statement> 

- <ns5:activityType>IMPORT</ns5:activityType> 

- <ns5:commodities> 

- <ns5:position>1</ns5:position> 

- <ns5:descriptors> <ns3:descriptionOfGoods>Test wood product amended</ns3:descriptionOfGoods> <ns3:goodsMeasure> 

- <ns3:netWeight>300.000000</ns3:netWeight> 

- <ns3:supplementaryUnit>30.000000</ns3:supplementaryUnit> 

- <ns3:supplementaryUnitQualifier>MTQ</ns3:supplementaryUnitQualifier> </ns3:goodsMeasure> </ns5:descriptors> <ns5:hsHeading>4410</ns5:hsHeading> <ns5:speciesInfo> <ns5:scientificName>Bifora testiculata</ns5:scientificName> <ns5:commonName>Test Name</ns5:commonName> </ns5:speciesInfo> <ns5:producers> <ns5:country>FR</ns5:country> <ns5:geometryGeojson>BASE64_ENCODED_GEOJSON</ns5:geometryGeojson> </ns5:producers> </ns5:commodities> <ns5:geoLocationConfidential>false</ns5:geoLocationConfidential> </ns5:statement> </ns5:GetDdsByIdentifiersResponse> </S:Body> 

- </S:Envelope> 

- 42/72 - 

5.2 SD Sample XML Requests & Responses 

## 5.2 SD Sample XML Requests & Responses 

Sample SOAP requests and responses for the EUDRSimplifiedDeclarationServiceV3 

## **Note** 

Replace {{wsse_*}}  placeholders with your WS-Security credentials. 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Environment Endpoint<br>Production https://eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRSimplifiedDeclarationServiceV3<br>Acceptance https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRSimplifiedDeclarationServiceV3<br>**----- End of picture text -----**<br>


## 5.2.1 submitSd 

## **Request** 

**==> picture [510 x 474] intentionally omitted <==**

**----- Start of picture text -----**<br>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"<br>xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4"<br>xmlns:sd="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3"<br>xmlns:eudrCommon="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3"><br><soapenv:Header><br><wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"<br>xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"><br><wsu:Timestamp wsu:Id="TS-1"><br><wsu:Created>{{wsse_created}}</wsu:Created><br><wsu:Expires>{{wsse_expires}}</wsu:Expires><br></wsu:Timestamp><br><wsse:UsernameToken wsu:Id="UT-1"><br><wsse:Username>{{wsse_username}}</wsse:Username><br><wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">{{wsse_passwordDigest}}</wsse:Password><br><wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">{{wsse_nonce}}</wsse:Nonce><br><wsu:Created>{{wsse_created}}</wsu:Created><br></wsse:UsernameToken><br></wsse:Security><br><v4:WebServiceClientId>YOUR_CLIENT_ID</v4:WebServiceClientId><br></soapenv:Header><br><soapenv:Body><br><sd:SubmitSdRequest><br><sd:operatorRole>MICRO_OPERATOR</sd:operatorRole><br><sd:statement><br><sd:internalReferenceNumber></sd:internalReferenceNumber><br><sd:activityType>IMPORT</sd:activityType><br><sd:countryOfActivity>BE</sd:countryOfActivity><br><sd:borderCrossCountry>BE</sd:borderCrossCountry><br><sd:commodities><br><sd:position>1</sd:position><br><sd:descriptors><br><eudrCommon:descriptionOfGoods>Test cocoa product</eudrCommon:descriptionOfGoods><br><eudrCommon:goodsMeasure><br><eudrCommon:netWeight>200</eudrCommon:netWeight><br><eudrCommon:supplementaryUnit>20</eudrCommon:supplementaryUnit><br><eudrCommon:supplementaryUnitQualifier>MTQ</eudrCommon:supplementaryUnitQualifier><br></eudrCommon:goodsMeasure><br></sd:descriptors><br><sd:hsHeading>4410</sd:hsHeading><br><!-- Producer with GeoJSON location --><br><sd:producers><br><sd:producerPosition>1</sd:producerPosition><br><sd:producerCountry>BE</sd:producerCountry><br><sd:producerName>Producer with geojson</sd:producerName><br><sd:producerLocation><br><sd:geometryGeojson>BASE64_ENCODED_GEOJSON</sd:geometryGeojson><br></sd:producerLocation><br></sd:producers><br><!-- Producer with postal address location --><br><sd:producers><br><sd:producerPosition>2</sd:producerPosition><br><sd:producerCountry>BE</sd:producerCountry><br><sd:producerName>Producer with address</sd:producerName><br><sd:producerLocation><br><sd:postalAddress><br><sd:producerStreet>Rue De Geneve 4</sd:producerStreet><br><sd:producerPostalCode>1140</sd:producerPostalCode><br><sd:producerCity>Brussels</sd:producerCity><br></sd:postalAddress><br></sd:producerLocation><br></sd:producers><br><!-- Producer with cadastral identifier --><br><sd:producers><br>**----- End of picture text -----**<br>


- 43/72 - 

5.2.2 updateSd 

- <sd:producerPosition>3</sd:producerPosition> <sd:producerCountry>BE</sd:producerCountry> <sd:producerName>Producer with cadastral</sd:producerName> <sd:producerLocation> <sd:cadastralIdentifier>BE-BRU-2024-PARCEL-001</sd:cadastralIdentifier> 

- </sd:producerLocation> 

- </sd:producers> 

- </sd:commodities> <sd:geoLocationConfidential>false</sd:geoLocationConfidential> 

- </sd:statement> 

- </sd:SubmitSdRequest> 

- </soapenv:Body> 

- </soapenv:Envelope> 

## **Response** 

- <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"> <S:Header> <ns2:Security xmlns:ns1="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:ns2="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"> 

- <ns1:Timestamp> <ns1:Created>2026-05-20T12:17:41.575+02:00</ns1:Created> <ns1:Expires>2026-05-20T12:17:46.576+02:00</ns1:Expires> 

- </ns1:Timestamp> 

- </ns2:Security> 

- </S:Header> <S:Body> <ns5:SubmitSdResponse xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3"> <ns5:sdIdentifier>e3b3206d-6625-47a0-b2ef-b8a7b9da1217</ns5:sdIdentifier> 

- </ns5:SubmitSdResponse> 

- </S:Body> 

- </S:Envelope> 

## 5.2.2 updateSd 

## **Request** 

- <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4" xmlns:sd="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3" xmlns:eudrCommon="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3"> 

- <!-- SOAP Header with WS-Security (same as submitSd) --> <soapenv:Body> <sd:UpdateSdRequest> <sd:sdIdentifier>e3b3206d-6625-47a0-b2ef-b8a7b9da1217</sd:sdIdentifier> <sd:statement> <sd:internalReferenceNumber>26BEDWNW9JD1TN</sd:internalReferenceNumber> <sd:activityType>IMPORT</sd:activityType> <sd:countryOfActivity>BE</sd:countryOfActivity> <sd:borderCrossCountry>BE</sd:borderCrossCountry> <sd:commodities> <sd:position>1</sd:position> <sd:descriptors> <eudrCommon:descriptionOfGoods>Test cocoa product amended</eudrCommon:descriptionOfGoods> <eudrCommon:goodsMeasure> <eudrCommon:netWeight>300</eudrCommon:netWeight> <eudrCommon:supplementaryUnit>30</eudrCommon:supplementaryUnit> <eudrCommon:supplementaryUnitQualifier>MTQ</eudrCommon:supplementaryUnitQualifier> 

- </eudrCommon:goodsMeasure> 

- </sd:descriptors> <sd:hsHeading>4410</sd:hsHeading> <sd:producers> <sd:producerPosition>1</sd:producerPosition> <sd:producerCountry>BE</sd:producerCountry> <sd:producerName>Producer Name amended</sd:producerName> <sd:producerLocation> <sd:geometryGeojson>BASE64_ENCODED_GEOJSON</sd:geometryGeojson> 

- </sd:producerLocation> 

- </sd:producers> 

- </sd:commodities> <sd:geoLocationConfidential>false</sd:geoLocationConfidential> 

- </sd:statement> 

- </sd:UpdateSdRequest> 

- </soapenv:Body> 

- </soapenv:Envelope> 

## **Response** 

- <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"> 

   - <!-- Response Header (same structure as submitSd response) --> 

   - <S:Body> 

      - <ns5:UpdateSdResponse xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3" xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3"> 

      - <ns5:uuid>e3b3206d-6625-47a0-b2ef-b8a7b9da1217</ns5:uuid> 

- 44/72 - 

5.2.3 withdrawSd 

<ns5:version>2</ns5:version> <ns5:status>AVAILABLE</ns5:status> </ns5:UpdateSdResponse> </S:Body> </S:Envelope> 

## 5.2.3 withdrawSd 

## **Request** 

- <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4" xmlns:sd="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3"> 

- <!-- SOAP Header with WS-Security (same as submitSd) --> <soapenv:Body> <sd:WithdrawSdRequest> <sd:sdIdentifier>e3b3206d-6625-47a0-b2ef-b8a7b9da1217</sd:sdIdentifier> 

- </sd:WithdrawSdRequest> 

- </soapenv:Body> 

- </soapenv:Envelope> 

## **Response** 

- <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"> 

   - <!-- Response Header (same structure as submitSd response) --> 

   - <S:Body> 

      - <ns5:WithdrawSdResponse xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3" xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3"> 

      - <ns5:uuid>e3b3206d-6625-47a0-b2ef-b8a7b9da1217</ns5:uuid> 

- <ns5:status>WITHDRAWN</ns5:status> 

- </ns5:WithdrawSdResponse> 

- </S:Body> 

- </S:Envelope> 

## 5.2.4 getSd 

## **Request** 

- <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4" xmlns:sd="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3" xmlns:eudrCommon="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3"> 

   - <!-- SOAP Header with WS-Security (same as submitSd) --> <soapenv:Body> <sd:GetSdRequest> <sd:uuidAndVersionNumberList> <eudrCommon:uuid>e3b3206d-6625-47a0-b2ef-b8a7b9da1217</eudrCommon:uuid> 

      - </sd:uuidAndVersionNumberList> 

- </sd:GetSdRequest> 

- </soapenv:Body> 

- </soapenv:Envelope> 

## **Response** 

- <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"> <!-- Response Header (same structure as submitSd response) --> 

   - <S:Body> 

      - <ns5:GetSdResponse xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3" xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3"> 

      - <ns5:sdOverviewList> <ns3:uuid>e3b3206d-6625-47a0-b2ef-b8a7b9da1217</ns3:uuid> 

- <ns3:internalReferenceNumber>REF-0001000087</ns3:internalReferenceNumber> <ns3:referenceNumber>S26BECB39D2GRX</ns3:referenceNumber> <ns3:verificationNumber>H6ORMNTX</ns3:verificationNumber> <ns3:status>AVAILABLE</ns3:status> <ns3:date>2026-05-20T10:20:01.000Z</ns3:date> <ns3:updatedBy>User25 User25</ns3:updatedBy> 

- </ns5:sdOverviewList> 

- </ns5:GetSdResponse> 

- </S:Body> 

- </S:Envelope> 

## 5.2.5 getSdByInternalReference 

## **Request** 

- 45/72 - 

5.2.6 getSdByIdentifiers 

- <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4" xmlns:sd="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3"> 

- <!-- SOAP Header with WS-Security (same as submitSd) --> <soapenv:Body> <sd:GetSdByInternalReferenceRequest> <sd:internalReference>REF-0001000087</sd:internalReference> 

- </sd:GetSdByInternalReferenceRequest> 

- </soapenv:Body> 

- </soapenv:Envelope> 

## **Response** 

- <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"> <!-- Response Header (same structure as submitSd response) --> <S:Body> <ns5:GetSdByInternalReferenceResponse xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3" xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3"> 

- <ns5:sdOverviewList> <ns3:uuid>e3b3206d-6625-47a0-b2ef-b8a7b9da1217</ns3:uuid> <ns3:internalReferenceNumber>REF-0001000087</ns3:internalReferenceNumber> <ns3:referenceNumber>S26BECB39D2GRX</ns3:referenceNumber> <ns3:verificationNumber>H6ORMNTX</ns3:verificationNumber> <ns3:status>AVAILABLE</ns3:status> <ns3:date>2026-05-20T10:20:01.000Z</ns3:date> <ns3:updatedBy>User25 User25</ns3:updatedBy> 

- </ns5:sdOverviewList> 

- </ns5:GetSdByInternalReferenceResponse> 

- </S:Body> 

- </S:Envelope> 

## 5.2.6 getSdByIdentifiers 

## **Request** 

- <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4" xmlns:sd="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3" xmlns:eudrCommon="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3"> 

- <!-- SOAP Header with WS-Security (same as submitSd) --> <soapenv:Body> <sd:GetSdByIdentifiersRequest> <sd:referenceAndVerificationNumber> <eudrCommon:referenceNumber>S26BECB39D2GRX</eudrCommon:referenceNumber> <eudrCommon:verificationNumber>H6ORMNTX</eudrCommon:verificationNumber> 

- </sd:referenceAndVerificationNumber> 

- </sd:GetSdByIdentifiersRequest> 

- </soapenv:Body> 

- </soapenv:Envelope> 

## **Response** 

- <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"> <!-- Response Header (same structure as submitSd response) --> <S:Body> <ns5:GetSdByIdentifiersResponse xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3" xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3"> 

- <ns5:statement> <ns5:activityType>IMPORT</ns5:activityType> <ns5:operator> <ns3:operatorAddress> <ns3:country>BE</ns3:country> 

- </ns3:operatorAddress> <ns3:operatorName>user3-mspo-operator</ns3:operatorName> 

- </ns5:operator> <ns5:commodities> <ns5:position>1</ns5:position> <ns5:descriptors> <ns3:descriptionOfGoods>Test cocoa product</ns3:descriptionOfGoods> <ns3:goodsMeasure> <ns3:netWeight>200.000000</ns3:netWeight> <ns3:supplementaryUnit>20.000000</ns3:supplementaryUnit> <ns3:supplementaryUnitQualifier>MTQ</ns3:supplementaryUnitQualifier> 

- </ns3:goodsMeasure> 

- </ns5:descriptors> <ns5:hsHeading>4410</ns5:hsHeading> <ns5:producers> <ns5:producerCountry>BE</ns5:producerCountry> <ns5:producerLocation> <ns5:geometryGeojson>BASE64_ENCODED_GEOJSON</ns5:geometryGeojson> 

- </ns5:producerLocation> 

- </ns5:producers> <ns5:producers> <ns5:producerCountry>BE</ns5:producerCountry> 

- 46/72 - 

5.2.6 getSdByIdentifiers 

</ns5:producers> </ns5:commodities> 

<ns5:geoLocationConfidential>false</ns5:geoLocationConfidential> </ns5:statement> </ns5:GetSdByIdentifiersResponse> </S:Body> </S:Envelope> 

- 47/72 - 

6. Migration Guide 

## 6. Migration Guide 

## 6.1 DDS Migration: V1 to V3 

## **Detailed field-by-field mapping** 

## For a complete field-level mapping, see DDS Field-Level Mapping V1→V3. 

**V1 Submission:** EUDRSubmissionServiceV1  — /tracesnt/ws/EUDRSubmissionServiceV1 **V1 Retrieval:** EUDRRetrievalServiceV1  — /tracesnt/ws/ EUDRRetrievalServiceV1 **V3 (unified):** EUDRDueDiligenceStatementServiceV3  — /tracesnt/ws/EUDRDueDiligenceStatementServiceV3 

**Key change:** V3 consolidates submission and retrieval into a single service. 

**Namespace change:** http://ec.europa.eu/tracesnt/certificate/eudr/submission/v1  → http://ec.europa.eu/tracesnt/certificate/eudr/due-diligencestatement/v3 http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v1  → merged into the above http://ec.europa.eu/tracesnt/certificate/eudr/ model/v1  → http://ec.europa.eu/tracesnt/certificate/eudr/common/v3  (shared types) 

## 6.1.1 Operation changes 

**==> picture [529 x 383] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 Service V1 Operation V3 Operation Change<br>Submission submitDds submitDds Request/response types renamed;<br>operatorRole  replaces  operatorType<br>Submission amendDds amendDds Request/response types renamed<br>Submission retractDds withdrawDds Renamed  from  retract  to  withdraw<br>Retrieval getDdsInfo getDds Renamed ; moved to DDS service<br>Retrieval getDdsInfoByInternalReferenceNumber getDdsByInternalReference Renamed ; moved to DDS service<br>Retrieval getStatementByIdentifiers getDdsByIdentifiers Renamed ; moved to DDS service<br>6.1.2 Request/Response type changes<br>Submission operations<br>V1 V3 Notes<br>SubmitStatementRequest SubmitDdsRequest Renamed; adds  operatorRole  replacing  operatorType ; values reduced to  OPERATOR  /<br>REPRESENTATIVE_OPERATOR<br>SubmitStatementResponse SubmitDdsResponse Field renamed:  ddsIdentifier  →  uuid<br>AmendStatementRequest AmendDdsRequest Field renamed:  ddsIdentifier  →  uuid<br>AmendStatementResponse AmendDdsResponse Now returns  uuid  and  status  (lifecycle status, e.g. AVAILABLE) instead of<br>HTTP status string<br>RetractStatementRequest WithdrawDdsRequest Operation + type renamed; field  ddsIdentifier  →  uuid<br>RetractStatementResponse WithdrawDdsResponse Now returns  uuid  and  status  (lifecycle status, e.g. WITHDRAWN) instead of<br>HTTP status string<br>**----- End of picture text -----**<br>


## **Retrieval operations (new in V3 DDS service)** 

**==> picture [521 x 40] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 V3 Notes<br>GetStatementInfoRequest GetDdsRequest Renamed; accepts up to 100 UUIDs<br>**----- End of picture text -----**<br>


- 48/72 - 

6.1.3 Fault changes 

**==> picture [521 x 120] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 V3 Notes<br>GetStatementInfoResponse GetDdsResponse Renamed; uses  OverviewType  from common XSD<br>GetDdsInfoByInternalReferenceNumberRequest GetDdsByInternalReferenceRequest Renamed<br>GetDdsInfoByInternalReferenceNumberResponse GetDdsByInternalReferenceResponse Renamed<br>GetStatementByIdentifiersRequest GetDdsByIdentifiersRequest Renamed<br>GetStatementByIdentifiersResponse GetDdsByIdentifiersResponse Renamed<br>**----- End of picture text -----**<br>


## 6.1.3 Fault changes 

**==> picture [521 x 92] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 V3 Notes<br>DdsPermissionDeniedException PermissionDeniedException Renamed (generic)<br>BusinessRulesValidationException BusinessRulesValidationException Unchanged<br>— NotFoundException New  — used by getDds, getDdsByInternalReference,<br>getDdsByIdentifiers<br>**----- End of picture text -----**<br>


## 6.1.4 Data model changes 

**==> picture [521 x 409] intentionally omitted <==**

**----- Start of picture text -----**<br>
Change Details<br>operatorType  →  operatorRole Field renamed; values reduced to  OPERATOR  /  REPRESENTATIVE_OPERATOR  (TRADER roles<br>removed)<br>ddsIdentifier  →  uuid Identifier field renamed across all request types<br>nameAndAddress  →  operatorAddress  +  operatorName V1 combined name+address split into structured fields<br>volume  removed from GoodsMeasure Use  netWeight  or  supplementaryUnit  instead<br>netWeight  type changed From  DecimalThreePrecType  to  DecimalSixteenTotalSixPrecType  (16 total, 6 fraction)<br>supplementaryUnit  type changed From  nonNegativeInteger  to  DecimalSixteenTotalSixPrecType<br>supplementaryUnitQualifier  type changed From fixed enum (60+ values) to free-text string (3-4 chars)<br>percentageEstimationOrDeviation  added New field in GoodsMeasure<br>ScientificNameType  max length Increased from 100 to 200<br>speciesInfo  moved Now in DDS-specific namespace<br>Operator identifier types reduced Only  eori ,  vat ,  gln ,  tin  remain (8 types removed)<br>operatorName  added New mandatory field (was inside address in V1)<br>TRADE  activity type removed Traders no longer submit DDS<br>associatedStatements  →  groupedDeclarations Renamed; now uses  GroupedDeclarationsType  with  groupedDeclaration  reference<br>numbers (max 2000)<br>Common model introduced V3 uses shared  eudr-common.xsd  types<br>Retrieval merged into DDS service No separate retrieval service<br>GROUPED ,  OBSOLETE ,  SUSPENDED ,  UPDATED ,  DRAFT New in V3<br>statuses<br>CANCELLED  status removed Removed from external enumeration<br>**----- End of picture text -----**<br>


- 49/72 - 

6.1.5 Status values 

## 6.1.5 Status values 

**==> picture [521 x 237] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 Value V3 Value Change<br>AVAILABLE AVAILABLE Unchanged<br>SUBMITTED SUBMITTED Unchanged<br>REJECTED REJECTED Unchanged<br>CANCELLED — Removed<br>WITHDRAWN WITHDRAWN Unchanged<br>ARCHIVED ARCHIVED Unchanged<br>— DRAFT New<br>— SUSPENDED New  — not active in current release<br>— UPDATED New  — not active in current release<br>— GROUPED New  — grouped declaration status<br>— OBSOLETE New  — superseded declaration<br>**----- End of picture text -----**<br>


## 6.1.6 Error codes (Retrieval) 

**==> picture [521 x 100] intentionally omitted <==**

**----- Start of picture text -----**<br>
Error Code Description<br>EUDR_NUMBER_EMPTY Reference or verification number is null/empty<br>EUDR_NUMBER_INVALID Contains prohibited characters<br>EUDR_NUMBER_TOO_LONG Exceeds maximum allowed length<br>EUDR_WEBSERVICE_STATEMENT_NOT_FOUND DDS not found or not in AVAILABLE/ARCHIVED status<br>**----- End of picture text -----**<br>


- 50/72 - 

6.2 DDS Migration: V2 to V3 

## 6.2 DDS Migration: V2 to V3 

## **Detailed field-by-field mapping** 

For a complete field-level mapping with types, constraints, and regulatory references, see DDS Field-Level Mapping. 

**V2 Submission:** EUDRSubmissionServiceV2  — /tracesnt/ws/EUDRSubmissionServiceV2 

**V2 Retrieval:** EUDRRetrievalServiceV2  — /tracesnt/ws/EUDRRetrievalServiceV2 

**V3 (unified):** EUDRDueDiligenceStatementServiceV3  — /tracesnt/ws/EUDRDueDiligenceStatementServiceV3 

**Key change:** V3 consolidates submission and retrieval into a single service. 

## **Namespace change:** 

http://ec.europa.eu/tracesnt/certificate/eudr/submission/v2  → http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3 http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v2  → merged into the above 

## 6.2.1 Operation changes 

**==> picture [529 x 402] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 Service V2 Operation V3 Operation Change<br>Submission submitDds submitDds Request/response types renamed (see<br>below)<br>Submission amendDds amendDds Request/response types renamed<br>Submission retractDds withdrawDds Renamed  from  retract  to  withdraw<br>Retrieval getDdsInfo getDds Renamed ; moved to DDS service<br>Retrieval getDdsInfoByInternalReferenceNumber getDdsByInternalReference Renamed ; moved to DDS service<br>Retrieval getStatementByIdentifiers getDdsByIdentifiers Renamed ; moved to DDS service<br>Retrieval getReferencedDds — Removed  in V3<br>6.2.2 Request/Response type changes<br>Submission operations<br>V2 V3 Notes<br>SubmitStatementRequest SubmitDdsRequest Renamed; adds  operatorRole  field ( OPERATOR  /  REPRESENTATIVE_OPERATOR ) replacing<br>operatorType<br>SubmitStatementResponse SubmitDdsResponse Field renamed:  ddsIdentifier  →  uuid<br>AmendStatementRequest AmendDdsRequest Field renamed:  ddsIdentifier  →  uuid<br>AmendStatementResponse AmendDdsResponse Now returns  uuid  and  status  (lifecycle status, e.g. AVAILABLE) instead of<br>HTTP status string<br>RetractStatementRequest WithdrawDdsRequest Operation + type renamed; field  ddsIdentifier  →  uuid<br>RetractStatementResponse WithdrawDdsResponse Now returns  uuid  and  status  (lifecycle status, e.g. WITHDRAWN) instead of<br>HTTP status string<br>**----- End of picture text -----**<br>


## **Retrieval operations** 

**==> picture [521 x 41] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 V3 Notes<br>GetStatementInfoRequest GetDdsRequest Renamed; accepts up to 100 UUIDs<br>**----- End of picture text -----**<br>


- 51/72 - 

6.2.3 Fault changes 

**==> picture [521 x 159] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 V3 Notes<br>GetStatementInfoResponse GetDdsResponse Renamed; uses  OverviewType  from common XSD<br>GetDdsInfoByInternalReferenceNumberRequest GetDdsByInternalReferenceRequest Renamed<br>GetDdsInfoByInternalReferenceNumberResponse GetDdsByInternalReferenceResponse Renamed<br>GetStatementByIdentifiersRequest GetDdsByIdentifiersRequest Renamed<br>GetStatementByIdentifiersResponse GetDdsByIdentifiersResponse Renamed; returns full  DueDiligenceStatementBaseType<br>GetReferencedDdsRequest — Removed<br>GetReferencedDdsResponse — Removed<br>**----- End of picture text -----**<br>


## 6.2.3 Fault changes 

**==> picture [529 x 399] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 V3 Notes<br>DdsPermissionDeniedException PermissionDeniedException Renamed (generic)<br>BusinessRulesValidationException BusinessRulesValidationException Unchanged<br>— NotFoundException New  — used by getDds, getDdsByInternalReference,<br>getDdsByIdentifiers<br>6.2.4 Data model changes<br>Change Details<br>operatorType  →  operatorRole Field renamed in submit request; values changed to  OPERATOR  /  REPRESENTATIVE_OPERATOR<br>(TRADER roles removed)<br>ddsIdentifier  →  uuid Identifier field renamed across all request types<br>speciesInfo  added to  New  — supports  scientificName  and  commonName  (up to 500 per commodity)<br>DdsCommodityType<br>Producer type restructured producerPosition  →  position ,  producerCountry  →  country ,  producerName  →  name<br>Producer location V3 DDS requires  geometryGeojson  only (no postal address option)<br>associatedStatements  →  Renamed; now uses  GroupedDeclarationsType  with  groupedDeclaration  reference numbers (max<br>groupedDeclarations 2000)<br>GROUPED  /  OBSOLETE  statuses New lifecycle states for grouped declarations<br>Common model V3 uses shared  eudr-common.xsd  types ( UuidType ,  ActivityType , etc.) instead of V2's  model/v2/<br>eudr.xsd<br>getReferencedDds  removed Supply chain traversal operation no longer available in V3<br>Retrieval merged into DDS No separate retrieval service — all operations on one endpoint<br>service<br>**----- End of picture text -----**<br>


- 52/72 - 

7. Field-Level Mapping 

## 7. Field-Level Mapping 

## 7.1 DDS Field-Level Mapping: V1 → V3 

Migration diff showing what changed between V1 (separate Submission + Retrieval services) and V3 (unified DDS service). 

## **Full V3 field reference** 

For complete type definitions, see DDS V3 API Reference. 

## 7.1.1 Submit Request 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 Field V3 Field Change<br>operatorType operatorRole Renamed ; values reduced (see Operator Role below)<br>statement statement Type restructured (see below)<br>**----- End of picture text -----**<br>


## 7.1.2 Submit Response 

**==> picture [520 x 40] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 Field V3 Field Change<br>ddsIdentifier uuid Renamed<br>**----- End of picture text -----**<br>


## 7.1.3 Amend Request 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 Field V3 Field Change<br>ddsIdentifier uuid Renamed<br>statement statement Type restructured<br>**----- End of picture text -----**<br>


## 7.1.4 Retract → Withdraw Request 

**==> picture [521 x 41] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 Field V3 Field Change<br>ddsIdentifier uuid Renamed ; operation renamed from  retractDds  to  withdrawDds<br>**----- End of picture text -----**<br>


## 7.1.5 Operator Role Values 

**==> picture [521 x 100] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 Value V3 Value Change<br>OPERATOR OPERATOR Unchanged<br>REPRESENTATIVE_OPERATOR REPRESENTATIVE_OPERATOR Unchanged<br>TRADER — Removed  — traders subject to collect-and-keep obligation<br>REPRESENTATIVE_TRADER — Removed<br>**----- End of picture text -----**<br>


## 7.1.6 Activity Type Values 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 Value V3 Value Change<br>DOMESTIC DOMESTIC Unchanged<br>IMPORT IMPORT Unchanged<br>**----- End of picture text -----**<br>


- 53/72 - 

7.1.7 Operator Identification 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 Value V3 Value Change<br>EXPORT EXPORT Unchanged<br>TRADE — Removed  — traders no longer submit DDS<br>**----- End of picture text -----**<br>


## 7.1.7 Operator Identification 

**==> picture [521 x 131] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 Field V3 Field Change<br>referenceNumber operatorReferenceNumber Renamed<br>nameAndAddress operatorAddress Restructured  — V1 combined  base:NameAndAddressType  replaced by structured<br>AddressType  with separate fields<br>email operatorEmail Renamed<br>phone operatorPhone Renamed<br>— operatorName New  — mandatory in V3 (was inside nameAndAddress in V1)<br>**----- End of picture text -----**<br>


## 7.1.8 Address Type 

**==> picture [521 x 139] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 ( base:NameAndAddressType ) V3 ( eudrCommon:AddressType ) Change<br>Combined name+address — Removed  — split into separate fields<br>— country New  — explicit country field<br>— street New  — explicit street field<br>— postalCode New  — explicit postal code field<br>— city New  — explicit city field<br>— fullAddress New  — optional non-structured address<br>**----- End of picture text -----**<br>


## 7.1.9 GoodsMeasure Type 

**==> picture [529 x 239] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 Field V3 Field Change<br>volume  ( DecimalThreePrecType ) — Removed<br>netWeight  ( DecimalThreePrecType ) netWeight Type changed  — 3 fraction → 16 total / 6<br>( DecimalSixteenTotalSixPrecType ) fraction (0–9999999999.999999)<br>supplementaryUnit supplementaryUnit Type changed  — integer → decimal 16/6<br>( nonNegativeInteger ) ( DecimalSixteenTotalSixPrecType )<br>supplementaryUnitQualifier  (enum, supplementaryUnitQualifier  ( string , 3-4 Type changed  — fixed enumeration → free-<br>60+ values) chars) text<br>— percentageEstimationOrDeviation New<br>( DecimalThreePrecType )<br>7.1.10 ScientificName Type<br>V1 V3 Change<br>ScientificNameType  (max 100) ScientificNameType  (max 200) Max length increased  from 100 to 200<br>**----- End of picture text -----**<br>


- 54/72 - 

7.1.11 Statement Payload (DueDiligenceStatementBaseType) 

## 7.1.11 Statement Payload (DueDiligenceStatementBaseType) 

**==> picture [521 x 233] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 Field V3 Field Change<br>internalReferenceNumber internalReferenceNumber Max length reduced  from 50 to 35<br>(max 50) (max 35)<br>activityType activityType TRADE  value removed<br>operator representedOperator Renamed  — now only for represented operator when role is<br>representative<br>countryOfActivity countryOfActivity Type moved to common namespace<br>borderCrossCountry borderCrossCountry Type moved to common namespace<br>comment comment Unchanged<br>commodities commodities Type renamed; GoodsMeasure restructured<br>geoLocationConfidential geoLocationConfidential Unchanged<br>associatedStatements groupedDeclarations Renamed  — now uses  GroupedDeclarationsType  with<br>groupedDeclaration  reference numbers (max 2000)<br>**----- End of picture text -----**<br>


## 7.1.12 Commodity / Producer 

**==> picture [521 x 120] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 Field V3 Field Change<br>position position Unchanged<br>descriptors descriptors GoodsMeasure restructured<br>hsHeading hsHeading Unchanged<br>speciesInfo speciesInfo ScientificName max length increased; moved to DDS namespace<br>producers producers Unchanged structure<br>**----- End of picture text -----**<br>


## 7.1.13 Status Values 

**==> picture [521 x 238] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 Value V3 Value Change<br>AVAILABLE AVAILABLE Unchanged<br>SUBMITTED SUBMITTED Unchanged<br>REJECTED REJECTED Unchanged<br>CANCELLED — Removed<br>WITHDRAWN WITHDRAWN Unchanged<br>ARCHIVED ARCHIVED Unchanged<br>— DRAFT New<br>— SUSPENDED New  — not active in current release<br>— UPDATED New  — not active in current release<br>— GROUPED New  — grouped declaration status<br>— OBSOLETE New  — superseded declaration<br>**----- End of picture text -----**<br>


- 55/72 - 

7.1.14 New in V3 (No V1 Equivalent) 

## 7.1.14 New in V3 (No V1 Equivalent) 

**==> picture [521 x 276] intentionally omitted <==**

**----- Start of picture text -----**<br>
V3 Addition Context<br>getDds  operation Query by UUID (replaces  getDdsInfo )<br>getDdsByInternalReference  operation Query by internal reference<br>getDdsByIdentifiers  operation Query by reference + verification number<br>NotFoundException  fault For query operations<br>operatorName  field Mandatory operator name<br>percentageEstimationOrDeviation Deviation percentage in GoodsMeasure<br>groupedDeclarations  field References to previously submitted DDS/SD for grouping<br>GROUPED  status Grouped declaration lifecycle<br>OBSOLETE  status Superseded declaration<br>SUSPENDED  /  UPDATED  status Not active in current release<br>rejectionReason  in response CA rejection reason<br>communicationToOperator  in response CA message to operator<br>Simplified Declaration (SD) service Entirely new service for micro/small primary operators<br>**----- End of picture text -----**<br>


## 7.1.15 Removed in V3 

**==> picture [521 x 222] intentionally omitted <==**

**----- Start of picture text -----**<br>
V1 Item Reason<br>EUDRSubmissionServiceV1 Merged into  EUDRDueDiligenceStatementServiceV3<br>EUDRRetrievalServiceV1 Merged into  EUDRDueDiligenceStatementServiceV3<br>TRADE  activity type Traders no longer submit DDS<br>TRADER  /  REPRESENTATIVE_TRADER  roles Traders excluded from DDS submission<br>volume  in GoodsMeasure Removed — use netWeight or supplementaryUnit<br>nameAndAddress  combined type Replaced by structured  operatorAddress  +  operatorName<br>SupplementaryUnitQualifier  enum (60+ Replaced by free-text string (3-4 chars)<br>values)<br>ship_man_comp_imo ,  ship_reg_owner_imo ,  Removed (maritime/REMOS, not EUDR-relevant). V3 retains 10 types: eori, vat, gln,<br>remos  identifiers tin, cbr, cin, duns, comp_num, comp_reg, oni<br>CANCELLED  status Removed from external enumeration<br>**----- End of picture text -----**<br>


- 56/72 - 

7.2 DDS Field-Level Mapping: V2 → V3 

## 7.2 DDS Field-Level Mapping: V2 → V3 

Migration diff showing what changed between V2 ( EUDRSubmissionServiceV2 ) and V3 ( EUDRDueDiligenceStatementServiceV3 ). 

## **Full V3 field reference** 

For complete type definitions, constraints, and documentation, see DDS V3 API Reference. 

**Namespace change:** http://ec.europa.eu/tracesnt/certificate/eudr/submission/v2  → http://ec.europa.eu/tracesnt/certificate/eudr/due-diligencestatement/v3 

## 7.2.1 Submit Request 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 Field V3 Field Change<br>operatorType operatorRole Renamed ; values changed (see Operator Role below)<br>statement statement Type moved to DDS-specific namespace<br>**----- End of picture text -----**<br>


## 7.2.2 Submit Response 

**==> picture [521 x 42] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 Field V3 Field Change<br>ddsIdentifier uuid Renamed<br>**----- End of picture text -----**<br>


## 7.2.3 Amend Request 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 Field V3 Field Change<br>ddsIdentifier uuid Renamed<br>statement statement Type moved to DDS-specific namespace<br>**----- End of picture text -----**<br>


## 7.2.4 Retract → Withdraw Request 

**==> picture [521 x 41] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 Field V3 Field Change<br>ddsIdentifier uuid Renamed ; operation renamed from  retractDds  to  withdrawDds<br>**----- End of picture text -----**<br>


## 7.2.5 DueDiligenceStatementBaseType 

**==> picture [521 x 189] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 Field V3 Field Change<br>internalReferenceNumber internalReferenceNumber Max length reduced from 50 to 35<br>activityType activityType TRADE  value  removed<br>operator representedOperator Renamed  — now only for represented operator when role is<br>representative<br>countryOfActivity countryOfActivity Type renamed to common namespace<br>borderCrossCountry borderCrossCountry Type renamed to common namespace<br>comment comment Unchanged<br>commodities commodities Type renamed to  DdsCommodityType<br>geoLocationConfidential geoLocationConfidential Unchanged<br>**----- End of picture text -----**<br>


- 57/72 - 

7.2.6 Operator Role Values 

**==> picture [521 x 54] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 Field V3 Field Change<br>associatedStatements groupedDeclarations Renamed  — now uses  GroupedDeclarationsType  with  groupedDeclaration<br>reference numbers (max 2000)<br>**----- End of picture text -----**<br>


## 7.2.6 Operator Role Values 

**==> picture [521 x 100] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 Value V3 Value Change<br>OPERATOR OPERATOR Unchanged<br>REPRESENTATIVE_OPERATOR REPRESENTATIVE_OPERATOR Unchanged<br>TRADER — Removed  — traders subject to collect-and-keep obligation<br>REPRESENTATIVE_TRADER — Removed<br>**----- End of picture text -----**<br>


## 7.2.7 Activity Type Values 

**==> picture [521 x 100] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 Value V3 Value Change<br>DOMESTIC DOMESTIC Unchanged<br>IMPORT IMPORT Unchanged<br>EXPORT EXPORT Unchanged<br>TRADE — Removed  — traders no longer submit DDS<br>**----- End of picture text -----**<br>


## 7.2.8 Operator Identification 

**==> picture [521 x 120] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 Field V3 Field Change<br>referenceNumber operatorReferenceNumber Renamed<br>operatorAddress operatorAddress Type restructured (see Address below)<br>email operatorEmail Renamed<br>phone operatorPhone Renamed<br>— operatorName New  — mandatory in V3<br>**----- End of picture text -----**<br>


## 7.2.9 Address Type 

**==> picture [521 x 139] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 Field V3 Field Change<br>name — Removed  — moved to  operatorName  at parent level<br>country country Type moved to common namespace<br>street street Unchanged<br>postalCode postalCode Unchanged<br>city city Unchanged<br>fullAddress fullAddress Unchanged<br>**----- End of picture text -----**<br>


- 58/72 - 

7.2.10 Commodity Type 

## 7.2.10 Commodity Type 

**==> picture [521 x 120] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 Field V3 Field Change<br>position position Unchanged<br>descriptors descriptors Type moved to common namespace<br>hsHeading hsHeading Type moved to common namespace<br>speciesInfo speciesInfo Type moved to DDS namespace<br>producers producers Type renamed to  DdsProducerType<br>**----- End of picture text -----**<br>


## 7.2.11 Producer Type 

**==> picture [521 x 100] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 Field V3 Field Change<br>position position Unchanged<br>country country Type moved to common namespace<br>name name Unchanged<br>geometryGeojson geometryGeojson Unchanged<br>**----- End of picture text -----**<br>


## 7.2.12 Status Values 

**==> picture [521 x 237] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 Value V3 Value Change<br>AVAILABLE AVAILABLE Unchanged<br>SUBMITTED SUBMITTED Unchanged<br>REJECTED REJECTED Unchanged<br>CANCELLED — Removed  from external status<br>WITHDRAWN WITHDRAWN Unchanged<br>ARCHIVED ARCHIVED Unchanged<br>— DRAFT New<br>— SUSPENDED New  — not active in current release<br>— UPDATED New  — not active in current release<br>— GROUPED New  — grouped declaration status<br>— OBSOLETE New  — superseded declaration<br>**----- End of picture text -----**<br>


## 7.2.13 New in V3 (No V2 Equivalent) 

**==> picture [521 x 119] intentionally omitted <==**

**----- Start of picture text -----**<br>
V3 Addition Context<br>getDds  operation Query by UUID<br>getDdsByInternalReference  operation Query by internal reference<br>getDdsByIdentifiers  operation Query by reference + verification number<br>NotFoundException  fault For query operations<br>operatorName  field Mandatory operator name<br>**----- End of picture text -----**<br>


- 59/72 - 

7.2.14 Removed in V3 

**==> picture [521 x 140] intentionally omitted <==**

**----- Start of picture text -----**<br>
V3 Addition Context<br>groupedDeclarations  field References to previously submitted DDS/SD for grouping<br>GROUPED  status Grouped declaration lifecycle<br>OBSOLETE  status Superseded declaration<br>SUSPENDED  /  UPDATED  status Not active in current release<br>rejectionReason  in response CA rejection reason<br>communicationToOperator  in response CA message to operator<br>**----- End of picture text -----**<br>


## 7.2.14 Removed in V3 

**==> picture [521 x 131] intentionally omitted <==**

**----- Start of picture text -----**<br>
V2 Item Reason<br>TRADE  activity type Traders no longer submit DDS<br>TRADER  /  REPRESENTATIVE_TRADER  roles Traders excluded from DDS submission<br>ship_man_comp_imo ,  ship_reg_owner_imo ,  Removed (maritime/REMOS, not EUDR-relevant). V3 retains 10 types: eori, vat, gln,<br>remos  identifiers tin, cbr, cin, duns, comp_num, comp_reg, oni<br>CANCELLED  status Removed from external enumeration<br>name  in AddressType Moved to  operatorName  at parent level<br>**----- End of picture text -----**<br>


- 60/72 - 

8. Change Log 

## 8. Change Log 

## 8.1 V3 API Changes (post-amendment release) 

## 8.1.1 New in V3 

- **Simplified Declaration service** : New EUDRSimplifiedDeclarationServiceV3  with 6 operations (submitSd, updateSd, withdrawSd, getSd, getSdByInternalReference, getSdByIdentifiers) for MSPOs, authorised representatives, and Member States (Art 4a(4)). 

- • **Declaration versioning** : getSd  and getDds  accept an optional version  parameter to retrieve a specific version. Responses include a version  field. 

- • **New status values** : EudrStatusType  now includes SUSPENDED , UPDATED , GROUPED , and OBSOLETE  alongside existing values. SUSPENDED  and UPDATED  are not active in the current release. 

- **New event types** : EudrEventType  includes GROUPED , SUSPENDED , UPDATED , ACCEPTED  in addition to existing event types. 

- • **SD reference number format** : 14 characters starting with S  (e.g., S26FRNMNBSA96Q ), same length as DDS but with the S  prefix distinguishing the type. 

- • **Postal address for SD** : Simplified declarations may use postal address instead of GeoJSON geolocation for plots of land. 

## 8.1.2 Changed from V2 

- **Namespace** : DDS service namespace changed to http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3 

- • **Endpoint** : DDS changed to /tracesnt/ws/EUDRDueDiligenceStatementServiceV3 • **Operator identification** : EconomicOperatorIdentificationType  replaces the previous operator reference structure. Supports multiple identifier types (EORI, VAT, TIN, etc.). 

## 8.1.3 Breaking changes 

- V2 clients must update their WSDL/XSD bindings to the V3 namespace and endpoint. • New enum values in EudrStatusType  and EudrEventType  may require client-side updates to avoid unmarshalling errors. • **DDS amend/withdraw responses** now return uuid  and status  (lifecycle status such as AVAILABLE or WITHDRAWN). Previously returned only a status string ( SC_200_OK ). Response parsing must be updated. 

- • Response structure changes in operator and commodity type definitions. 

## 8.1.4 Authentication 

- **Current** : WS-Security (UsernameToken with PasswordDigest over HTTPS), unchanged from V2. 

- • **Future** : mTLS-based authentication is planned for a subsequent release. The current UsernameToken mechanism will be maintained during a transition period. 

## 8.2 Regulatory Background (2025 Amendment) 

## 8.2.1 Simplified Declaration (New Article 4a) 

- Micro or small primary operators submit a one-time simplified declaration (not per-shipment DDS) • Information system assigns a declaration identifier upon submission • Content requirements defined in new Annex III • May use postal address instead of geolocation for plots of land (Art 4a(5)) • Exemption where equivalent data already in national databases (Art 4a(4)) 

- 8.2.2 Downstream Operator & Trader Obligations (New Article 5) 

- Non-SME downstream operators and non-SME traders must register in information system • All downstream operators/traders must collect and keep: supplier info, DDS reference numbers or declaration identifiers, buyer info 

- • First downstream operator/trader ensures traceability by collecting reference numbers 

- 5-year record retention 

- Notification obligations on non-compliance 

- 61/72 - 

8.2.3 Modified Operator Definition (Art 2(15)) 

## 8.2.3 Modified Operator Definition (Art 2(15)) 

- Operator now explicitly excludes downstream operators 

- Authorised representatives can now submit simplified declarations on behalf of micro/small primary operators (Art 6) 

- 62/72 - 

9. EUDR GeoJSON File Description 

## 9. EUDR GeoJSON File Description 

Version 1.3 - updated 29 May 2026 

Technical contacts: See the Contact information section. 

## 9.1 Introduction 

This document is intended for users (Economic Operators) of the European Commission's EUDR Information System (IS) and for parties interested in producing compatible geolocation files for use in the central EUDR information system. 

The EUDR Information System supports the import, processing, and export of GeoJSON files for defining production place coordinates for declared commodities in a Due Diligence Statement. 

GeoJSON is an Internet Engineering Task Force RFC: https://datatracker.ietf.org/doc/html/rfc7946. It is a geospatial data interchange format based on JavaScript Object Notation (JSON). It defines several types of JSON objects and the way they are combined to represent data about geographic features, their properties, and their spatial extents. This standard implies a single option for the coordinate reference system (CRS). 

GeoJSON uses the World Geodetic System 1984 (WGS 84) [WGS84] datum, with longitude and latitude units of decimal degrees. Two variants of GeoJSON files can be produced and submitted depending on the application: Type I and Type II. The corresponding details can be found in section "File Variants Description" of this document. 

**EUDR IS users:** Please note that the first production version of the EUDR Information System will support the above standard exclusively. 

If the geocoordinates available to the Economic Operator are in another coordinates system, these must be converted to the WGS84 (EPSG:4326) coordinate system with longitude and latitude units of decimal degrees. There are several tools available that can convert most other coordinate system formats to the EUDR IS supported system format. 

Support of additional coordinate system formats is deferred for future versions of the system. 

Please also note that the information in this document applies to both the User Interface (UI) and the web services (API) for importing geocoordinates files. 

## 9.2 Definitions 

The GeoJSON file standard includes a number of mandatory and optional strings to define the various properties. 

A GeoJSON geometry object of any type other than "GeometryCollection" must have a member with the name "coordinates". The value of the coordinates member is always an array. The structure for the elements in this array is determined by the type of geometry. 

A position is the fundamental geometry construct. The "coordinates" member of a geometry object is composed of one position (in the case of a Point geometry), an array of positions (MultiPoint geometry), an array of arrays of positions (Polygons), or a multidimensional array of positions (MultiPolygon). 

A position is represented by an array of numbers. There must be at least two elements and may be more. The order of elements must follow longitude, latitude for coordinates in the EPSG:4326 geographic coordinate reference system. 

The terms "geometry" and "type" refer to seven case-sensitive strings: 

**Point:** Point geometry types consist of two coordinate values. 

**MultiPoint:** MultiPoint geometry types consist of two or more points (coordinate pairs). 

**Polygon:** Polygon geometry types consist of at least four pairs of coordinates and represent an enclosed area by these coordinate points. 

**MultiPolygon:** MultiPolygon geometry types contain two or more polygon definitions. 

Please note that the first and last point's coordinates of polygons are the same (they coincide geographically to close the shape). 

**Important note:** Polygons with holes (i.e., doughnut shapes) and shapes with crossing lines (like a figure eight for example) are not supported and will not be processed. If a doughnut shape is needed, it can be defined by combining two half-doughnut shaped polygons. 

**Feature:** A feature contains a single geometry object with the addition of properties. It will therefore be treated like described for the geometry types above. An example follows: 

- 63/72 - 

9.3 File Variants Description 

{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [[-105.029865, 40.622831]] } } 

**FeatureCollection:** One or more features as in this example: 

**==> picture [510 x 275] intentionally omitted <==**

**----- Start of picture text -----**<br>
{<br>"type": "FeatureCollection",<br>"features": [<br>{<br>"type": "Feature",<br>"geometry": {<br>"type": "Point",<br>"coordinates": [102.0, 0.5]<br>},<br>"properties": {<br>"prop0": "value0"<br>}<br>},<br>{<br>"type": "Feature",<br>"geometry": {<br>"type": "Polygon",<br>"coordinates": [<br>[<br>[100.0, 0.0],<br>[101.0, 0.0],<br>[101.0, 1.0],<br>[100.0, 1.0],<br>[100.0, 0.0]<br>]<br>]<br>},<br>"properties": {<br>"prop0": "value0",<br>"prop1": {<br>"this": "that"<br>}<br>}<br>}<br>]<br>}<br>**----- End of picture text -----**<br>


## **GeometryCollection:** Two or more geometries. 

Please note that geometry types of **"LineString"** and **"MultiLineString"** do not represent valid geocoordinate shapes for declaring production places and will not be accepted/processed. 

The system additionally accepts and will process the following optional properties: 

**ProducerName:** An optional producer name for the corresponding geometry type. 

**ProducerCountry:** The country of production ISO2 code. 

**ProductionPlace:** An optional name for the corresponding geometry type. 

**Area:** This represents the area in Hectares of the geometry element "Point" in the GeoJSON file. 

Any other properties that are syntactically valid but not included in the optional properties list above, will be ignored. 

## 9.3 File Variants Description 

For both variants described below, the file structure is the same. The only differences are in some of the properties provided. 

## 9.3.1 Type I 

This file variant is for use by the web services interface (API) and via the application's UI import utility at producer level and has the following characteristics: 

1. Includes any required features listed in the "Definitions" section (such as point, polygon). 

2. May include any of the optional properties. 

## 9.3.2 Type II 

This file variant is for use via the application's UI file import utility at commodity level. It contains multiple producers grouped by the "ProducerName" and "ProducerCountry" and has the following additional characteristics: 

1. Includes any required features listed in the "Definitions" section (such as point, multipoint, polygon, multipolygon). 

2. Includes the "ProducerCountry" property per "Feature". 

3. May include any of the optional properties. 

- 64/72 - 

9.4 Examples 

## **Important notes for users of the EUDR IS:** 

1. It is recommended to provide the optional GeoJSON property "ProductionPlace" in the generated geocoordinates files for importing into the system. This optional property is used to describe the production place name. The information system will truncate coordinate points to 6 decimal places before storing. It is superfluous/wasteful to send a higher resolution, and may, in extreme cases, even result in invalid geometries where the original is valid. 

2. The property "Area" for points is optional. If it is not provided, then it will be set by default to "4" (four) hectares when processed by the EUDR system. 

## 9.4 Examples 

## 9.4.1 Type I – geocoordinates list - single producer 

{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"ProductionPlace":"FAZENDA TABOAO I","Area":23.72,"ProducerCountry":"BR"},"geometry": {"type":"Polygon","coordinates":[[[-49.004616,-22.734322],[-49.004675,-22.734318],[-49.00683,-22.73526],[-49.00909,-22.736299],[-49.009249,-22.740009],[-49.009222,-22.74001], [-49.00901,-22.740068],[-49.007133,-22.740146],[-49.005412,-22.740232],[-49.004941,-22.740254],[-49.004873,-22.740185],[-49.004855,-22.740185],[-49.004855,-22.740179], [-49.004811,-22.740181],[-49.004758,-22.740166],[-49.004722,-22.739385],[-49.004968,-22.739492],[-49.005333,-22.739625],[-49.005474,-22.739651],[-49.005552,-22.739628], [-49.00562,-22.739575],[-49.005653,-22.739531],[-49.005655,-22.739477],[-49.005627,-22.739379],[-49.005577,-22.739193],[-49.005505,-22.738907],[-49.005313,-22.7387], [-49.005248,-22.738522],[-49.005198,-22.738186],[-49.005113,-22.738079],[-49.004984,-22.738001],[-49.004763,-22.737887],[-49.004712,-22.737884],[-49.004541,-22.734322], [-49.004588,-22.734324],[-49.004616,-22.734322]]]}},{"type":"Feature","properties":{"ProductionPlace":"FAZENDA TABOAO II","Area":2.39,"ProducerCountry":"BR"},"geometry": {"type":"Polygon","coordinates":[[[-48.186023,-22.880156],[-48.186128,-22.880023],[-48.186271,-22.879937],[-48.186509,-22.879844],[-48.186677,-22.879827],[-48.186853,-22.879906], [-48.187031,-22.880049],[-48.187185,-22.88015],[-48.187214,-22.880164],[-48.187169,-22.880216],[-48.187148,-22.880317],[-48.187223,-22.880431],[-48.187365,-22.880416], [-48.187428,-22.880321],[-48.187456,-22.88036],[-48.187496,-22.88055],[-48.187491,-22.88091],[-48.187622,-22.881404],[-48.187712,-22.881757],[-48.187831,-22.88206],[-48.187887,-22.88214], [-48.187745,-22.882094],[-48.187763,-22.882069],[-48.18777,-22.882054],[-48.187776,-22.882034],[-48.187779,-22.882013],[-48.187779,-22.881992],[-48.187775,-22.881971], [-48.187768,-22.881951],[-48.187758,-22.881932],[-48.187745,-22.881916],[-48.187729,-22.881901],[-48.187711,-22.88189],[-48.187692,-22.881881],[-48.187671,-22.881875], [-48.187399,-22.881809],[-48.186554,-22.881342],[-48.186573,-22.881321],[-48.186581,-22.881262],[-48.186504,-22.881222],[-48.186498,-22.881225],[-48.18644,-22.881271], [-48.186319,-22.881194],[-48.186338,-22.881162],[-48.18631,-22.881087],[-48.186335,-22.881001],[-48.186286,-22.880875],[-48.186036,-22.88084],[-48.186046,-22.880804], [-48.186046,-22.880447],[-48.186023,-22.880156]]]}}]} 

## 9.4.2 Type II – geocoordinates list - multiple producers 

{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"ProductionPlace":"Cocoa Farm 01","Area":20813.59,"ProducerCountry":"AO"},"geometry": {"type":"Polygon","coordinates":[[[17.10022,-12.364149],[17.065887,-12.427189],[17.133179,-12.487532],[17.185364,-12.479487],[17.234802,-12.382928],[17.160645,-12.317194], [17.10022,-12.364149]]]}},{"type":"Feature","properties":{"ProductionPlace":"Cocoa Farm 02","Area":20670.76,"ProducerCountry":"AO"},"geometry":{"type":"Polygon","coordinates": [[[17.155151,-12.534456],[17.216949,-12.526412],[17.285614,-12.612197],[17.219696,-12.633638],[17.107086,-12.656418],[17.078247,-12.567968],[17.155151,-12.534456]]]}}, {"type":"Feature","properties":{"ProductionPlace":"Cocoa Farm 03","Area":9551.97,"ProducerCountry":"CM"},"geometry":{"type":"Polygon","coordinates":[[[12.032089,4.817997],[12.023163, 4.756414],[12.056122,4.733832],[12.10144,4.730411],[12.13028,4.783785],[12.117233,4.817312],[12.069855,4.822786],[12.032089,4.817997]]]}},{"type":"Feature","properties": {"ProductionPlace":"Cocoa Farm 04","Area":6950.29,"ProducerCountry":"CM"},"geometry":{"type":"Polygon","coordinates":[[[12.137146,4.827576],[12.151566,4.791311],[12.205811,4.804312], [12.229156,4.874784],[12.184525,4.878889],[12.144012,4.861101],[12.137146,4.827576]]]}}]} 

## 9.5 Common GeoJSON file errors 

## **1. Coordinate lines crossing (i.e. figure eight shapes or intersecting polygon lines):** 

## **2. Overlapping sides:** 

Internal overlap or holes where part of the polygon folds inward, creating a concave shape within the boundary are not accepted by the system: 

- 65/72 - 

9.5 Common GeoJSON file errors 

## **3. Coordinate shapes with holes (i.e. doughnut shapes)** 

Workaround: Two half-moon shapes: 

**4. "Open" polygons.** All polygons must represent closed shapes (i.e. the 1st coordinate pair same as the last): 

## **5. Invalid geometry types (i.e. LineString).** 

## **6. Coordinates representing straight lines.** 

**7. Duplicate coordinates due to 6 decimals rounding in the system** (For example the 2 following points with 10 decimals become the same after rounding): 

-5.8227391234 ,144.2567071234 -> -5.822739,144.256707 -5.8227394567,144.2567074567 -> -5.822739,144.256707 

- 66/72 - 

9.5 Common GeoJSON file errors 

**8. File syntax errors** (i.e. missing ")" or "}"). 

**9. Invalid property names** (ex. "geomerty" or not correct property keyword case – "productionplace" instead of "ProductionPlace"). 

## **10. Invalid file format** (PDF, txt). 

**11. Invalid coordinate range** (outside the value ranges 90/-90 or 180/-180). 

## **12. Invalid producer country ISO2 code.** 

## **13. Password Protected files.** 

## **14. Data representation issues:** 

- For example, "Area": "3"  instead of "Area": 3  will result in area = 0 because the value 3 in quotes is not recognized as a number which is what is expected. 

- The coordinates for points should be array and not array of arrays. While uploading these files, no coordinates are rendered. 

## **15. Polygons with holes inside:** 

The system does not take into account holes inside a polygon, but only the outer boundaries. The user needs to provide separate polygons to simulate the holes. 

**==> picture [21 x 10] intentionally omitted <==**

**----- Start of picture text -----**<br>
➡<br>**----- End of picture text -----**<br>


- 67/72 - 

10. API and UI Validation Rules 

## 10. API and UI Validation Rules 

## 10.1 Target audience 

This document is intended to be read by Economic Operators, involved in the EU deforestation Regulation, who will use the EUDR web site (UI: User Interface) of the EUDR API (application programming interface) for managing their DDS (Due Diligence Statement). 

## 10.2 Introduction 

The EUDR central system has implemented several validation rules which are executed at different steps in the workflow of a DDS. Some rules are purely syntactical and other have business relevance. 

Not every rule is described in this document when they can obviously be deduced by the user in the system. For example: 

• in the UI, when a field is numeric, characters are not allowed to be keyed in • In the API, when a field has a maximum length, it is described in the XSD validation Please note that specific rules concerning the geolocation information are part of another document. Rules concerning compliance to the regulation are not described here neither. 

## 10.3 Rules description 

**==> picture [521 x 431] intentionally omitted <==**

**----- Start of picture text -----**<br>
Rule context Description Remark/<br>Relevance<br>Mandatory activity The activity type of a DDS is mandatory. In case a DDS is amended, the UI, API (via XSD<br>type activity type cannot be changed. If the operator is not from an EU country, validation)<br>the only allowed activity is IMPORT.<br>Activity type The selected activity type must be compatible with the rights of the user API<br>compatibility profile.<br>Activity type and The operator must have an EORI identifier if the activity type IMPORT or UI, API<br>identifier EXPORT is selected.<br>Web service user The web service user cannot belong to more than one operator. API<br>Operator filled by an The mandatory fields of the operator or trader must be filled by the UI, API<br>authorized authorized representative (name, address and at least one identifier). The<br>representative EORI number must be a valid number.<br>Mandatory At least one commodity must be provided in the DDS. UI, API (via XSD<br>commodity validation)<br>Maximum of The number of commodities per DDS cannot exceed a certain amount UI, API (via XSD<br>commodities (presently set to 100). validation)<br>Description of a There must be a description for every commodity. UI, API (via XSD<br>commodity validation)<br>Quantities of a At least one quantity must be provided per commodity. In addition, if the UI, API<br>commodity activity type is IMPORT or EXPORT then the net mass is mandatory. Values<br>must all be positive.<br>Supplementary unit In case a supplementary unit value is provided, the type of that value UI, API<br>type (supplementary unit type) must also be provided.<br>Production country Every production place must contain a valid country. UI, API<br>Mandatory In case at least one referenced DDS is provided, a commodity need not have UI, API<br>geolocation production places. However, if a production place is provided, the<br>geolocation information is required (even if there are referenced DDS).<br>**----- End of picture text -----**<br>


- 68/72 - 

10.3 Rules description 

**==> picture [539 x 702] intentionally omitted <==**

**----- Start of picture text -----**<br>
||||
|---|---|---|
|Rule context|Description|Remark/|
|Relevance|
|Geolocation area for|In case a point is provided for a geolocation, the area is mandatory. If the|UI, API|
|point|user provided no data, the value 4 (ha) is introduced by default for the area.|
|If the commodity is not cattle and the user provided a value higher than 4ha|
|then the system will raise an error. When provided, the area must also be|
|higher or equal to 0.0001ha.|
|Geolocation invalid|Latitude and longitude values of coordinates must be in range. Note that if|UI, API|
|coordinates|there are more than 6 decimals for the coordinates, the system truncate the|
|value to 6 decimals.|
|Geolocation invalid|The geolocation data cannot contain invalid geometry (for ex, invalid|UI, API|
|geometry|polygons).|
|Scientific and|If the commodity is sourced from timber, then at least one scientific name|UI, API|
|Common names|and common name must be provided. The total number of pairs of scientific|
|names & common names per commodity cannot exceed a certain amount|
|(presently set to 500).|
|Geolocation data size|The total size of geolocation data per DDS cannot exceed a certain amount|UI, API|
|(presently set to 25Mb).|
|Geolocation|The total number of producers data per commodity cannot exceed a certain|UI, API|
|Producers|amount (presently set to 1000). The total number of producers data per|
|information|DDS cannot exceed a certain amount (presently set to 10,000).|
|Referenced DDS|The reference & verification numbers must correspond to an existing DDS|UI, API|
|in status Available or Archived. A DDS cannot be referenced by itself. The|
|total number of referenced DDS per DDS cannot exceed a certain amount|
|(presently set to 2000).|
|Draft DDS|The maximum number of draft DDS per operator cannot exceed a certain|UI only|
|amount (presently set to 50).|
|Amend or withdraw|The amend or withdraw action on a DDS are available until a certain delay.|UI, API|
|action|If the delay is expired, only the CA can extend it. If a DDS is referenced in|
|one or more other DDS, it cannot be amended or withdrawn.|

**----- End of picture text -----**<br>


- 69/72 - 

11. FAQ 

## 11. FAQ 

Common questions and regulatory definitions relevant to the EUDR SOAP API. 

## 11.1 General 

## 11.1.1 What is a Due Diligence Statement (DDS)? 

A Due Diligence Statement is submitted by an Information System user pursuant to Regulation (EU) 2023/1115. It documents the three-step due diligence process: information gathering, risk assessment, and risk mitigation. Operators must submit a DDS prior to placing relevant products on the market or exporting them. 

## 11.1.2 What is a Simplified Declaration (SD)? 

A simplified declaration is a one-time submission in the Information System by micro or small primary operators, containing the information set out in Annex III, submitted before placing relevant products on the market or exporting them. It replaces the pershipment due diligence statement for eligible operators. The declaration remains valid indefinitely unless major changes occur. 

## 11.1.3 What are relevant commodities? 

Relevant commodities are: cattle, cocoa, coffee, oil palm, rubber, soya and wood. 

## 11.1.4 What are relevant products? 

Relevant products are products listed in Annex I that contain, have been fed with or have been made using relevant commodities. 

## 11.1.5 What does "deforestation-free" mean? 

Deforestation-free means: (a) commodities produced on land not deforested after 31 December 2020; (b) for wood, harvested without inducing forest degradation after 31 December 2020. 

## 11.2 Operators and Roles 

## 11.2.1 What is an operator? 

An operator is any natural or legal person who, in the course of a commercial activity, places relevant products on the market or exports them, excluding downstream operators. 

## 11.2.2 What is a micro or small primary operator? 

A micro or small primary operator is an operator who is a natural person or micro/small undertaking, irrespective of legal form, established in a low-risk country, who places on market or exports relevant products they themselves produced in that country. 

## 11.2.3 What is an authorised representative? 

An authorised representative is any natural or legal person established in the Union who has received a written mandate from an operator to act on its behalf in relation to specified tasks with regard to the operator's obligations under the Regulation. 

## 11.2.4 What is a downstream operator? 

A downstream operator is any natural or legal person who, in the course of a commercial activity, places on the market or exports relevant products made using relevant products, all of which are covered by a due diligence statement or by a simplified declaration. 

## 11.2.5 What is the collect-and-keep obligation? 

The collect-and-keep obligation is the core obligation for downstream operators and traders: to collect and keep supplier information, DDS reference numbers or declaration identifiers (from operator suppliers only), and buyer information, for at least five years. It replaces the DDS submission obligation for these actors. 

- 70/72 - 

11.3 Lifecycle and Status 

## 11.3 Lifecycle and Status 

## 11.3.1 What is GROUPED status? 

GROUPED status is a lifecycle state assigned to a DDS or SD when it has been associated to a grouped declaration. A GROUPED declaration cannot be individually withdrawn or amended while the referencing grouped declaration is active. 

## 11.3.2 What is grouping? 

Grouping is the voluntary act by an Information System user of creating a new DDS or SD that references previously submitted declarations via their reference numbers. The resulting grouped declaration receives a standard reference number, inherits geolocation data from referenced declarations, and represents all referenced declarations for compliance purposes. Referenced declarations receive GROUPED status. 

## 11.4 Geolocation 

## 11.4.1 What is geolocation in EUDR context? 

Geolocation means latitude/longitude coordinates with a minimum of 6 decimal digits. Polygons are required for plots of land greater than 4 hectares (except for cattle, where point coordinates for the establishment suffice). 

## 11.4.2 What is a plot of land? 

A plot of land is land within a single real-estate property with homogeneous conditions for risk evaluation. 

## 11.4.3 Can SD use postal address instead of geolocation? 

Yes. Unlike DDS (which requires GeoJSON geolocation), the Simplified Declaration allows micro or small primary operators to provide postal address(es) as an alternative to GeoJSON geometry. 

## 11.5 Risk and Compliance 

## 11.5.1 What is risk profiling? 

Risk profiling is the identification of the risks of non-compliance of a relevant product, based on risk criteria, for the purpose of assigning to each DDS a risk status. It is performed automatically by the Information System. 

## 11.5.2 What is a low-risk country? 

A low-risk country is a country or part thereof classified by the Commission as presenting low risk of producing commodities or products not in compliance with Article 3. It enables micro or small primary operator status for eligible producers and a reduced minimum check rate of 1%. 

## 11.6 System and Integration 

## 11.6.1 What is the Information System? 

The Information System is the system established and maintained by the Commission pursuant to Article 33 of Regulation (EU) 2023/1115. 

## 11.6.2 What is a reference number? 

A reference number is the unique reference number assigned by the Information System to a Due Diligence Statement or Simplified Declaration submitted by the user. 

## 11.6.3 What is a verification number? 

A verification number is a security number assigned by the Information System to the DDS/SD to ensure additional security of data. 

- 71/72 - 

11.6.4 What is a declaration identifier? 

## 11.6.4 What is a declaration identifier? 

A declaration identifier is the unique identifier assigned by the Information System to a micro or small primary operator upon submission of a simplified declaration. It accompanies relevant products through the supply chain in place of a DDS reference number and must be made available to customs authorities before release for free circulation or export. 

## 11.6.5 What is a contingency reference number? 

A contingency reference number is a fallback reference number generated by a competent authority or customs authority during periods when the Information System is unavailable for more than 60 minutes. It must be replaced by a system-generated reference number once the system is restored. 

- 72/72 - 

