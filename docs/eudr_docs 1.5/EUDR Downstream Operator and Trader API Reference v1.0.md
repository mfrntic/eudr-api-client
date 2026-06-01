## **EUDR Information System - Downstream Operator and Trader API Reference** 

## **Declaration Verification** 

_DG ENV - European Commission_ _**Documentation version:** 1.0_ _**API specification:** V3_ _**Release date:** 2026-05-29_ 

Table of contents 

## Table of contents 

**==> picture [513 x 480] intentionally omitted <==**

**----- Start of picture text -----**<br>
1. EUDR Information System - Downstream Operator and Trader API Reference 3<br>1.1 Overview 3<br>1.2 Base URL 3<br>1.3 Services 3<br>1.4 Target audience 3<br>1.5 Authentication 4<br>1.6 XSD access 4<br>1.7 Versioning policy 4<br>1.8 Contact information 4<br>2. Acquiring Credentials for a Web Service User 5<br>2.1 Introduction 5<br>2.2 Acquiring Credentials for a Web Service User 5<br>2.3 Usage Recommendations and Limits 7<br>3. Echo Service — API Reference 8<br>3.1 Overview 8<br>3.2 WSDL 8<br>3.3 Operations 8<br>3.4 Request / Response Types 8<br>3.5 Authentication 9<br>3.6 Sample Request 9<br>3.7 Sample Response 9<br>3.8 Sample Fault 9<br>3.9 Troubleshooting 10<br>4. V3 API Reference 11<br>4.1 Verify Declaration — V3 API Reference 11<br>5. Sample XML 13<br>5.1 Verify Declaration Sample XML 13<br>**----- End of picture text -----**<br>


- 2/14 - 

1. EUDR Information System - Downstream Operator and Trader API Reference 

## 1. EUDR Information System - Downstream Operator and Trader API Reference 

Welcome to the EUDR SOAP API documentation for downstream operators and traders verifying declarations in the EUDR Information System. 

## 1.1 Overview 

The EU Deforestation Regulation (EUDR), Regulation (EU) 2023/1115, requires operators placing relevant commodities (cattle, cocoa, coffee, oil palm, rubber, soya and wood) on the EU market to demonstrate that their products are deforestation-free and produced in compliance with the legislation of the country of production. 

Concerning the amendment procedure of the Implementing Regulation (EU) 2024/3084 that is currently undergoing, this version of documentation may not be final and will be adapted as needed. In particular, certain features such as the grouping of submissions and versioning of Simplified Declarations are planned for subsequent releases and may not be available in the first release. Readers are encouraged to check the European Commission website for updates and subscribe to the Newsletter for the latest information. 

Under Article 5, downstream operators and traders must collect and keep the reference numbers of due diligence statements or declaration identifiers associated with the relevant products supplied to them. The verification service enables these actors to confirm that a declaration is authentic and in a usable status before relying on it for their collect-and-keep obligations. 

## 1.2 Base URL 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Environment Base URL<br>Production https://eudr.webcloud.ec.europa.eu/tracesnt/<br>Acceptance https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/<br>**----- End of picture text -----**<br>


## 1.3 Services 

**==> picture [521 x 96] intentionally omitted <==**

**----- Start of picture text -----**<br>
Service Purpose Endpoint<br>Verify Declaration Verify existence and usability of a /ws/EUDRVerifyDeclarationServiceV3?wsdl<br>DDS or SD by reference number and<br>verification number<br>Echo Test connectivity and WS-Security /ws/eudr/echo?wsdl<br>credentials<br>**----- End of picture text -----**<br>


## 1.4 Target audience 

This documentation is intended for: 

- **Downstream operators** (SME and non-SME) verifying upstream declarations as part of their collect-and-keep obligation (Art 5) 

- **Traders** verifying declarations from their suppliers 

- **Operators and authorised representatives** verifying their own or third-party declarations 

- • **Software providers** developing verification solutions for downstream actors 

## **Access restriction** 

The verification API is available to operators, authorised representatives, SME downstream operators or traders, and non-SME downstream operators or traders. 

- 3/14 - 

1.5 Authentication 

## 1.5 Authentication 

All services use **WS-Security** (UsernameToken over HTTPS): 

- Transport: HTTPS with TLS 

- Token: UsernameToken  with PasswordDigest  (hashed) 

- Timestamp: Required ( wsu:Created  / wsu:Expires ) 

- • Header: WebServiceClientId  - your client identifier, visible in the "Web Services Access" section of your profile (see Acquiring Credentials) 

## 1.6 XSD access 

Replace ?wsdl  with ?xsd=1 , ?xsd=2  etc to retrieve the XSD schema (refer to the <xs:import>  section in the WSDL for schema numbering). 

## **Service availability** 

The V3 endpoints and WSDLs listed above are not yet accessible and will become available once the system goes online. As noted above, the service contracts are subject to change as the amendment of the Implementing Regulation (EU) 2024/3084 is finalised. 

## 1.7 Versioning policy 

Service versions are identified by the suffix in the endpoint URL (e.g., V3 ). 

- When a new version is released without backward compatibility, the previous version remains available for a transition period. 

- For the production environment, the duration of version coexistence is published in advance. 

- Old versions are decommissioned after the transition period. 

- Readers are invited to regularly verify whether new specifications are published, as services and their behaviour may evolve. 

## 1.7.1 About this API version 

This service is available as V3 only. The declaration verification capability for downstream operators and traders is introduced by Regulation (EU) 2025/2650. 

## 1.8 Contact information 

**==> picture [521 x 80] intentionally omitted <==**

**----- Start of picture text -----**<br>
Purpose Contact<br>Registration and technical support SANTE-TRACES@ec.europa.eu<br>Policy questions (Deforestation Regulation) ENV-DEFORESTATION@ec.europa.eu<br>Implementation guidance Deforestation Regulation implementation<br>**----- End of picture text -----**<br>


## **Note** 

When contacting technical support, email titles must start with **"EUDR API"** . Questions should concern API behaviour, testing, errors, or integration. 

- 4/14 - 

2. Acquiring Credentials for a Web Service User 

## 2. Acquiring Credentials for a Web Service User 

## 2.1 Introduction 

This document is intended for downstream operators, traders, and their IT service providers integrating with the EUDR Verification API ( EUDRVerifyDeclarationServiceV3 ). The verification service enables actors in the supply chain to confirm that a declaration (DDS or SD) is authentic and in a usable status. 

## 2.2 Acquiring Credentials for a Web Service User 

## 2.2.1 Registration in the Information System 

Non-SME downstream operators and non-SME traders must register in the Information System prior to using the verification API (Art 5(2)). SME downstream operators and traders may also register to access the verification service. 

Once registered, proceed to acquire a web service authentication key: 

## **Recommended approach** 

Complete the credential setup and test your integration in the acceptance environment first. Once connectivity and authentication are verified, repeat the process for the production environment. 

## **1. Get the username of the EU Login account** 

To locate the username, follow the next steps: 

- Log in to the EUDR Information System, 

- Click in the top-right corner of the screen, 

- In the Popup, click on **"Edit Profile"** : 

- In the right box **"Personal Information"** there is an attribute **"username"** . This value can now be used within your system for later tasks. 

- 5/14 - 

2.2.1 Registration in the Information System 

## **2. Get the "Authentication key" for your system** 

- Go back to the page "Edit your profile", 

- Scroll to the section **"Web Services Access"** , 

- If the previous steps have been completed successfully, the button **"Active"** should appear in this Section. Click on this Button. The section will contain a new field labeled **"Authentication Key"** . Click the **"eye"** next to the field to see the value. This value can now be used within the procedure described in later tasks. 

- 6/14 - 

2.3 Usage Recommendations and Limits 

## **Authentication Key is Private** 

The Authentication Key is private and should only be used with your application. The person identified by the EU Login user is responsible for the API calls made using these credentials. 

## 2.3 Usage Recommendations and Limits 

## 2.3.1 Verification Service Limits 

The following recommendations are intended to ensure fair and stable use of the shared EUDR Information System infrastructure when accessing it via Web Services. 

## 2.3.2 Global and individual IP throttling limits 

|**Limit Type**|**Limit Type**|**Value**|
|---|---|---|
|Global limit|Global limit|10,000 calls per minute|
|Per-IP limit|Per-IP limit|5 calls per second|



These limits will be monitored and may be adjusted depending on system load. 

## **Note** 

It is highly recommended that Web Service users respect these guidelines to allow fair use of resources for all users. Sustained violations may lead to accounts being further limited. 

- 7/14 - 

3. Echo Service — API Reference 

## 3. Echo Service — API Reference 

Service: EudrEchoService 

Namespace: http://ec.europa.eu/tracesnt/eudr/echo Endpoint: /tracesnt/ws/eudr/echo 

Security: WS-Security (UsernameToken over HTTPS) 

## 3.1 Overview 

The EUDR Echo Service is a lightweight connectivity test endpoint that allows integrators to verify that their WS-Security credentials and SOAP client configuration are working correctly before attempting to call the main EUDR services (DDS, SD, Verification). 

Use this service to confirm: 

- Your **UsernameToken** (username + authentication key) is valid 

- Your **SOAP envelope** is correctly formed (timestamp, headers, signature) 

- Your **WebServiceClientId** header is properly included 

- Network connectivity to the EUDR SOAP infrastructure is established 

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

**==> picture [521 x 65] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>query xs:string Yes Test parameter — any<br>arbitrary string to echo<br>back<br>**----- End of picture text -----**<br>


- 8/14 - 

3.4.2 EudrEchoResponse 

## 3.4.2 EudrEchoResponse 

**==> picture [529 x 141] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>status xs:string Yes Status of the echo<br>operation confirming<br>successful processing<br>3.4.3 EudrEchoServiceFault<br>Field Type Required Description<br>errorMessage xs:string No Generated error message<br>during process<br>**----- End of picture text -----**<br>


## 3.5 Authentication 

The Echo Service uses the same **WS-Security** mechanism as all other EUDR services: 

- Transport: HTTPS with TLS 

- Token: UsernameToken  with PasswordDigest  (hashed) 

- Timestamp: Required ( wsu:Created  / wsu:Expires ) • Header: WebServiceClientId  - your client identifier from the "Web Services Access" section of your profile 

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

   - <soapenv:Body> <soapenv:Fault> <faultcode>soapenv:Server</faultcode> <faultstring>EudrEchoServiceFault</faultstring> <detail> <echo:EudrEchoServiceFault> 

- 9/14 - 

3.9 Troubleshooting 

<echo:errorMessage>Authentication failed</echo:errorMessage> </echo:EudrEchoServiceFault> </detail> </soapenv:Fault> </soapenv:Body> </soapenv:Envelope> 

## 3.9 Troubleshooting 

**==> picture [521 x 158] intentionally omitted <==**

**----- Start of picture text -----**<br>
Symptom Likely Cause Resolution<br>Authentication failed Invalid username or authentication Verify credentials in EU Login profile<br>key (see Acquiring Credentials)<br>Timestamp expired Clock skew between client and server Ensure system clock is synchronized<br>(NTP);  wsu:Created  must be within 5<br>minutes of server time<br>Missing WebServiceClientId Header not included in SOAP Add  <base:WebServiceClientId>  to the<br>envelope SOAP header<br>Connection timeout Network/firewall issue Verify HTTPS connectivity to the<br>endpoint URL; check proxy settings<br>**----- End of picture text -----**<br>


- 10/14 - 

4. V3 API Reference 

## 4. V3 API Reference 

## 4.1 Verify Declaration — V3 API Reference 

Service: EUDRVerifyDeclarationServiceV3 

Namespace: http://ec.europa.eu/tracesnt/certificate/eudr/verify-declaration/v3 

Endpoint: /tracesnt/ws/EUDRVerifyDeclarationServiceV3 

Security: WS-Security (UsernameToken over HTTPS) 

## 4.1.1 Operations 

## **verifyDeclaration** 

Verify DDS/SD declaration. Only for Operators, Authorised Representative, SME Downstream Operator or Trader, Non-SME Downstream Operator or Trader. 

- **Request:** VerifyDeclarationRequest  (Type: VerifyDeclarationRequestType ) 

- **Response:** VerifyDeclarationResponse  (Type: VerifyDeclarationResponseType ) 

- **Faults:** BusinessRulesValidationException , PermissionDeniedException 

## 4.1.2 Types 

## **VerifyDeclarationRequestType** 

Verify declaration request by providing reference number and verification number as input parameter. 

**==> picture [521 x 61] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>referenceNumber ReferenceNumberType Yes —<br>verificationNumber VerificationNumberType Yes —<br>**----- End of picture text -----**<br>


## **VerifyDeclarationResponseType** 

Verify declaration response is the same for all user roles, including SME downstream operators. Three possible outcomes: (1) exists and is usable, (2) exists but is not usable, (3) not found. 

**==> picture [521 x 81] intentionally omitted <==**

**----- Start of picture text -----**<br>
Field Type Required Description<br>result VerifyResultType Yes —<br>status EudrStatusType No —<br>dateTime dateTime Yes —<br>**----- End of picture text -----**<br>


## **VerifyResultType** 

Verify declaration result type. EXISTING_USABLE : The declaration exists and is in a usable status. For status values other than ARCHIVED and nonAVAILABLE, EXISTING_USABLE will be set. EXISTING_NON_USABLE : The declaration exists but is not 

- 11/14 - 

4.1.3 Common Types 

usable. Status is set when the declaration is not archived and available. NON_EXISTENT : No declaration matches the provided reference number and verification number combination. 

**==> picture [521 x 81] intentionally omitted <==**

**----- Start of picture text -----**<br>
Value Description<br>EXISTING_USABLE —<br>EXISTING_NON_USABLE —<br>NON_EXISTENT —<br>**----- End of picture text -----**<br>


_Constraints: Base: string_ 

## 4.1.3 Common Types 

## **EudrStatusType** 

Universal lifecycle status for EUDR documents 

**==> picture [521 x 198] intentionally omitted <==**

**----- Start of picture text -----**<br>
Value Description<br>SUBMITTED —<br>AVAILABLE —<br>REJECTED —<br>WITHDRAWN —<br>ARCHIVED —<br>SUSPENDED Not active in current release<br>UPDATED Not active in current release<br>GROUPED —<br>OBSOLETE —<br>**----- End of picture text -----**<br>


_Constraints: Base: string_ 

## **ReferenceNumberType** 

_Constraints: Base: string , Max length: 14_ 

## **VerificationNumberType** 

Verification number 

_Constraints: Base: string , Max length: 35, Min length: 5_ 

- 12/14 - 

5. Sample XML 

## 5. Sample XML 

## 5.1 Verify Declaration Sample XML 

Sample SOAP request and responses for the EUDRVerifyDeclarationServiceV3 . 

**Environment Endpoint** Production https://eudr.webcloud.ec.europa.eu/tracesnt/ws/ EUDRVerifyDeclarationServiceV3 Acceptance https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/ EUDRVerifyDeclarationServiceV3 **Note** Replace {{wsse_*}}  placeholders with your WS-Security credentials. 

## 5.1.1 verifyDeclaration — Request 

**==> picture [510 x 201] intentionally omitted <==**

**----- Start of picture text -----**<br>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"<br>xmlns:verify="http://ec.europa.eu/tracesnt/certificate/eudr/verify-declaration/v3"<br>xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4"><br><soapenv:Header><br><wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"<br>xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"><br><wsu:Timestamp wsu:Id="TS-1"><br><wsu:Created>{{wsse_created}}</wsu:Created><br><wsu:Expires>{{wsse_expires}}</wsu:Expires><br></wsu:Timestamp><br><wsse:UsernameToken wsu:Id="UT-1"><br><wsse:Username>{{wsse_username}}</wsse:Username><br><wsse:Password Type="...#PasswordDigest">{{wsse_passwordDigest}}</wsse:Password><br><wsse:Nonce EncodingType="...#Base64Binary">{{wsse_nonce}}</wsse:Nonce><br><wsu:Created>{{wsse_created}}</wsu:Created><br></wsse:UsernameToken><br></wsse:Security><br><v4:WebServiceClientId>YOUR_CLIENT_ID</v4:WebServiceClientId><br></soapenv:Header><br><soapenv:Body><br><verify:VerifyDeclarationRequest><br><verify:referenceNumber>EUDR00000001BE</verify:referenceNumber><br><verify:verificationNumber>VN-2025-ABC12</verify:verificationNumber><br></verify:VerifyDeclarationRequest><br></soapenv:Body><br></soapenv:Envelope><br>**----- End of picture text -----**<br>


## 5.1.2 verifyDeclaration — Response (EXISTING_USABLE) 

Declaration exists and is in a usable status (e.g. AVAILABLE). 

<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"> <soapenv:Body> <verify:VerifyDeclarationResponse xmlns:verify="http://ec.europa.eu/tracesnt/certificate/eudr/verify-declaration/v3"> <verify:result>EXISTING_USABLE</verify:result> <verify:status>AVAILABLE</verify:status> <verify:dateTime>2026-05-20T10:00:00.000Z</verify:dateTime> </verify:VerifyDeclarationResponse> </soapenv:Body> </soapenv:Envelope> 

## 5.1.3 verifyDeclaration — Response (EXISTING_NON_USABLE) 

Declaration exists but is not in a usable status (e.g. WITHDRAWN, REJECTED, SUSPENDED). 

<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"> <soapenv:Body> <verify:VerifyDeclarationResponse xmlns:verify="http://ec.europa.eu/tracesnt/certificate/eudr/verify-declaration/v3"> <verify:result>EXISTING_NON_USABLE</verify:result> <verify:status>WITHDRAWN</verify:status> <verify:dateTime>2026-05-20T10:00:00.000Z</verify:dateTime> 

- 13/14 - 

5.1.4 verifyDeclaration — Response (NON_EXISTENT) 

</verify:VerifyDeclarationResponse> </soapenv:Body> </soapenv:Envelope> 

## 5.1.4 verifyDeclaration — Response (NON_EXISTENT) 

No declaration matches the provided reference and verification numbers. 

<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"> <soapenv:Body> <verify:VerifyDeclarationResponse xmlns:verify="http://ec.europa.eu/tracesnt/certificate/eudr/verify-declaration/v3"> <verify:result>NON_EXISTENT</verify:result> <verify:dateTime>2026-05-20T10:00:00.000Z</verify:dateTime> </verify:VerifyDeclarationResponse> </soapenv:Body> </soapenv:Envelope> 

## 5.1.5 verifyDeclaration — Fault (BusinessRulesValidationException) 

<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"> <soapenv:Body> <soapenv:Fault> <faultcode>soapenv:Server</faultcode> <faultstring>Business rules validation failed</faultstring> <detail> <verify:BusinessRulesValidationException xmlns:verify="http://ec.europa.eu/tracesnt/certificate/eudr/verify-declaration/v3"> <errors> <error> <field>referenceNumber</field> <message>Reference number format is invalid</message> </error> </errors> </verify:BusinessRulesValidationException> </detail> </soapenv:Fault> </soapenv:Body> </soapenv:Envelope> 

## 5.1.6 verifyDeclaration — Fault (PermissionDeniedException) 

<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"> <soapenv:Body> <soapenv:Fault> <faultcode>soapenv:Server</faultcode> <faultstring>Permission denied</faultstring> <detail> <verify:PermissionDeniedException xmlns:verify="http://ec.europa.eu/tracesnt/certificate/eudr/verify-declaration/v3"> <message>User does not have permission to verify declarations</message> </verify:PermissionDeniedException> </detail> </soapenv:Fault> </soapenv:Body> </soapenv:Envelope> 

- 14/14 - 

