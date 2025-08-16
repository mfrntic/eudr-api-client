EUDR API specifications for Operators

Conformance Test 7

**_Version 1.3 – dated18<sup>th</sup> February 2025_**

**Technical & Policy contacts:**

Refer to the latest version of document "**EUDR - API for EO specifications**".

**Release Note:**

| Version | Description |
| --- | --- |
| V1.2 | Updated list of contacts and system URLs |
| V1.3 | Updated list of contacts |

# Contents

[1\. Contents 2](#_Toc188286057)

[2\. Introduction 3](#_Toc188286058)

[3\. Documentation 3](#_Toc188286059)

[4\. Prerequisites 3](#_Toc188286060)

[4.1. Previous CF Tests 3](#_Toc188286061)

[5\. Objectives 4](#_Toc188286062)

[6\. Tasks 5](#_Toc188286063)

[6.1. High level specification of the Web Service call 5](#_Toc188286064)

[6.2. Web Service Endpoint 5](#_Toc188286065)

[6.3. Error handling 6](#_Toc188286066)

[7\. Annex 7](#_Toc188286067)

[7.1. Retrieve DDS by identifiers request example. 7](#_Toc188286068)

[7.2. Retrieve DDS by identifiers successful response example. 7](#_Toc188286069)

# Introduction

This is the seventh Conformance Test in the process of enabling the successful interaction of the Participant system with the central EUDR system. Participants are required to have first read the document "**EUDR – API for EO Specifications**".

The scope of this test covers:

- Ability to retrieve a unique DDS by providing its reference number and verification number.

This service is used for retrieving a valid DDS only (that is either in AVAILABLE or in ARCHIVED status). A DDS in any other status cannot be retrieved.  

# Documentation

The SOAP web services are described through WSDL files and a schema for each message. Refer to the document "**EUDR – API for EO Specifications**" to retrieve the definition of the services contract and the structure of the data to be exchanged.

The participants are requested to read the documentation concerning the Retrieval Service.

# Prerequisites

Technological expertise: Very good understanding and capability to develop SOAP web service calls.  

## Previous CF Tests

It is assumed Conformance test 1, 2, 3 & 4 have been successfully completed. The definition of the connection attributes contained in the Request Header should continue to be used.

# Objectives

Primary objectives:

- Successfully Call the "Get DDS by Ref number" Web service.

Secondary objectives:

- Management of errors when calling the service

At the completion of this test, it is expected that the participants have developed a high-level strategy for the integration of call of the Webservice into its existing system.

# Tasks

## High level specification of the Web Service call

As stated above, the objective of this task is to test the capability to retrieve the content of a DDS, based on its reference number and its verification number.

Retrieve DDS by identifiers operation (GetStatementByIdentifiers):

The operation has the following parameters:

- Reference number
- Verification number

The participant must have obtained the reference number and verification number outside of the system, in normal operation usually from an upstream operator.

The operation returns the following parameters:

- The http return code 200 (successful)
- The DDS content (reference number, activity, geolocation file, etc.). Geolocation for the referenced statement will be shown based on the geolocation indicator.
- The list of number of the referenced DDS
- Availability date.

If the pair reference number/verification number is invalid — meaning it is empty, contains prohibited characters, or exceeds the maximum allowed length — an error will be returned (see section 6.3).

If the DDS is not found for the provided reference number/verification number or if it is found but in an invalid state other than Available/Archived, an error will be returned (see also section 6.3).

If the system returns an http code other than 200, the main reason could be from a general authorization problem or the unavailability of the service.

## Web Service Endpoint

Refer to the document "**EUDR - API for EO specifications**", chapter 4 **Documentation (Retrieval WS)** for the specific server URL of the environment you're using. The operation to execute is {EUDRRetrievalService_URL}**#getStatementByIdentifiers**

## Error handling

It is important to note that errors can be classified in 2 categories:

1. Errors coming from authentication issues or from disrespect of the API schema definition,
2. Business errors which reflect unallowed or illegal cases.

The below table describes a list of errors of type (b).

The first column corresponds to the technical value of the error returned by the central EUDR system.

| **Error Code** | **Error Description** |
| --- | --- |
| EUDR_NUMBER_EMPTY | The reference or verification number is null or empty or has only empty spaces. |
| EUDR_NUMBER_INVALID | The reference or verification number is invalid (has not allowed characters) |
| EUDR_NUMBER_TOO_LONG | The reference or verification number has more characters than the maximum allowed. |
| EUDR_WEBSERVICE_STATEMENT_NOT_FOUND | The referenced DDS was not found or is not in AVAILABLE or ARCHIVED status |

# Annex

Note that the attached instructions or examples may be based on a specific environment (often Acceptance Alpha). Participants should adapt the request based on the environment they actually need to use (see also document "**EUDR – API for EO Specifications**").

## Retrieve DDS by identifiers request example 

See example XML file: [EUDR - API EO CF7 v1.0 - ANNEX - Eudr_getstatement_by_identifiers_request.xml](EUDR - API EO CF7 v1.0 - ANNEX - Eudr_getstatement_by_identifiers_request.xml)

## Retrieve DDS by identifiers successful response example
 
See example XML file: [EUDR - API EO CF7 v1.0 - ANNEX - Eudr_getstatement_by_identifiers_response_with_Geolocation_visibility_ON.xml](EUDR - API EO CF7 v1.0 - ANNEX - Eudr_getstatement_by_identifiers_response_with_Geolocation_visibility_ON.xml)

See example XML file: [EUDR - API EO CF7 v1.0 - ANNEX - Eudr_getstatement_by_identifiers_response_with_Geolocation_visibility_ON.xml](EUDR - API EO CF7 v1.0 - ANNEX - Eudr_getstatement_by_identifiers_response_with_Geolocation_visibility_ON.xml)