EUDR API specifications for Operators

Conformance Test 7

***Version 1.4 -- dated 22^nd^ July 2025***

**Technical & Policy contacts:**

Refer to the latest version of document "**EUDR - API for EO
specifications**".

**Release Note:**

  -----------------------------------------------------------------------
  Version        Description
  -------------- --------------------------------------------------------
  V1.2           Updated list of contacts and system URLs

  V1.3           Updated list of contacts

  V1.4           Added new service for retrieving subsequent referenced
                 DDS in the supply chain, without knowing their
                 verification numbers
  -----------------------------------------------------------------------

# Contents

[1. Contents [2](#_Toc204076049)](#_Toc204076049)

[2. Introduction [3](#introduction)](#introduction)

[3. Documentation [3](#documentation)](#documentation)

[4. Prerequisites [3](#prerequisites)](#prerequisites)

[4.1. Previous CF Tests [3](#previous-cf-tests)](#previous-cf-tests)

[5. Objectives [4](#objectives)](#objectives)

[6. Tasks [4](#tasks)](#tasks)

[6.1. High level specification of the Web Service calls
[4](#high-level-specification-of-the-web-service-calls)](#high-level-specification-of-the-web-service-calls)

[6.1.1. Retrieve DDS based on its reference number and its verification
number
[4](#retrieve-dds-based-on-its-reference-number-and-its-verification-number)](#retrieve-dds-based-on-its-reference-number-and-its-verification-number)

[6.1.2. Web Service Endpoint
[5](#web-service-endpoint)](#web-service-endpoint)

[6.1.3. Retrieve subsequent referenced DDS without verification number
[5](#retrieve-subsequent-referenced-dds-without-verification-number)](#retrieve-subsequent-referenced-dds-without-verification-number)

[6.1.4. Web Service Endpoint
[6](#web-service-endpoint-1)](#web-service-endpoint-1)

[6.2. Error handling [6](#error-handling)](#error-handling)

[7. Annex [8](#annex)](#annex)

[7.1. Retrieve DDS by identifiers request example -- common for all
versions
[8](#retrieve-dds-by-identifiers-request-example-common-for-all-versions)](#retrieve-dds-by-identifiers-request-example-common-for-all-versions)

[7.2. Retrieve DDS by identifiers response examples for V1
[8](#retrieve-dds-by-identifiers-response-examples-for-v1)](#retrieve-dds-by-identifiers-response-examples-for-v1)

[7.3. Retrieve DDS by identifiers response example for V2
[8](#retrieve-dds-by-identifiers-response-example-for-v2)](#retrieve-dds-by-identifiers-response-example-for-v2)

[7.4. Retrieve further referenced DDS request example (exists only in
V2)
[8](#retrieve-further-referenced-dds-request-example-exists-only-in-v2)](#retrieve-further-referenced-dds-request-example-exists-only-in-v2)

# Introduction

This is the seventh Conformance Test in the process of enabling the
successful interaction of the Participant system with the central EUDR
system. Participants are required to have first read the document
"**EUDR -- API for EO Specifications**".

The scope of this test covers:

-   Ability to retrieve a unique DDS by providing its reference number
    and verification number.

-   Ability to retrieved subsequent referenced DDS along the supply
    chain

This service is used for retrieving a valid DDS only (that is either in
AVAILABLE or in ARCHIVED status). A DDS in any other status cannot be
retrieved.

# Documentation

The SOAP web services are described through WSDL files and a schema for
each message. Refer to the document "**EUDR -- API for EO
Specifications**" to retrieve the definition of the services contract
and the structure of the data to be exchanged.

The participants are requested to read the documentation concerning the
Retrieval Service.

# Prerequisites

Technological expertise: Very good understanding and capability to
develop SOAP web service calls.

## Previous CF Tests

It is assumed Conformance test 1, 2, 3 & 4 have been successfully
completed. The definition of the connection attributes contained in the
Request Header should continue to be used.

# Objectives

Primary objectives:

-   Successfully Call the "Get DDS by Ref number" Web service.

Secondary objectives:

-   Ability for retrieving subsequent referenced DDS in the supply
    chain, without the verification number

-   Management of errors when calling the service

At the completion of this test, it is expected that the participants
have developed a high-level strategy for the integration of call of the
Webservice into its existing system.

# Tasks

## High level specification of the Web Service calls

## Retrieve DDS based on its reference number and its verification number 

The objective of this task is to test the capability to retrieve the
content of a DDS, based on its reference number and its verification
number, or without the verification number

[Retrieve DDS by identifiers operation
(]{.underline}GetStatementByIdentifiers[):]{.underline}

The operation has the following parameters:

-   Reference number

-   Verification number

The participant must have obtained the reference number and verification
number outside of the system, in normal operation usually from an
upstream operator.

The operation returns the following parameters:

-   The http return code 200 (successful)

-   The DDS content (reference number, activity, geolocation file,
    etc.). Geolocation for the referenced statement will be shown based
    on the geolocation indicator.

-   A list of referenced DDS

    -   The reference number of the DDS

    -   a security number ("Reference Verification Number") which is
        different than the verification number and can be used to
        retrieve the subsequent referenced DDS in the supply chain (see
        6.1.3). The security number can be used only by the operator
        which called the service.

-   Availability date.

If the pair reference number/verification number is invalid --- meaning
it is empty, contains prohibited characters, or exceeds the maximum
allowed length --- an error will be returned (see section 6.3).

If the DDS is not found for the provided reference number/verification
number or if it is found but in an invalid state other than
Available/Archived, an error will be returned (see also section 6.3).

If the system returns an http code other than 200, the main reason could
be from a general authorization problem or the unavailability of the
service.

## Web Service Endpoint 

> Refer to the document "**EUDR - API for EO specifications**", chapter
> 4 **Documentation (Retrieval WS)** for the specific server URL of the
> environment you're using. The operation to execute is
> {EUDRRetrievalService_URL}**#getStatementByIdentifiers**

## Retrieve subsequent referenced DDS without verification number 

The objective of this task is to test the capability to retrieve the
content of subsequent referenced DDS in the supply chain, without having
the verification number.

For doing so, the participant must first retrieve the DDS for which it
has the verification number and then use the security number ("Reference
Verification Number") provided in the response to call the service call.
That number is NOT the verification number of the subsequent DDS and is
only valid for the operator which successfully performed the retrieve
operation of the initial DDS. If it is reused separately to the initial
call, the operation will fail.

[Retrieve DDS by security number operation
(]{.underline}GetReferencedDDS[):]{.underline}

The operation has the following parameters:

-   Reference number

-   Security number ("Reference Verification Number")

The participant must have obtained the security number from a previous
call of the service **getStatementByIdentifiers**.

The operation returns the following parameters:

-   The http return code 200 (successful)

-   The DDS content (reference number, activity, geolocation file,
    etc.). Geolocation for the referenced statement will be shown based
    on the geolocation indicator.

-   A list of referenced DDS

    -   The reference number of the DDS

    -   a security number ("Reference Verification Number") which can be
        used to retrieve again further subsequent referenced DDS in the
        supply chain

-   Availability date.

If the pair reference number/security number is invalid --- meaning it
is empty, contains prohibited characters, or exceeds the maximum allowed
length --- an error will be returned (see section 6.2).

If the DDS is not found for the provided reference number/security
number or if it is found but in an invalid state other than
Available/Archived, an error will be returned (see also section 6.2).

If the system returns an http code other than 200, the main reason could
be from a general authorization problem or the unavailability of the
service.

## Web Service Endpoint 

> Refer to the document "**EUDR - API for EO specifications**", chapter
> 4 **Documentation (Retrieval WS)** for the specific server URL of the
> environment you're using. The operation to execute is
> {EUDRRetrievalService_URL}**#getReferencedDDS**

## Error handling

It is important to note that errors can be classified in 2 categories:

a)  Errors coming from authentication issues or from disrespect of the
    API schema definition,

b)  Business errors which reflect unallowed or illegal cases.

The below table describes a list of errors of type (b).

The first column corresponds to the technical value of the error
returned by the central EUDR system.

  -----------------------------------------------------------------------
  **Error Code**                           **Error Description**
  ---------------------------------------- ------------------------------
  EUDR\_ NUMBER_EMPTY                      The reference or verification
                                           number is null or empty or has
                                           only empty spaces.

  EUDR_NUMBER_INVALID                      The reference or verification
                                           number is invalid (has not
                                           allowed characters)

  EUDR_NUMBER_TOO_LONG                     The reference or verification
                                           number has more characters
                                           than the maximum allowed.

  EUDR_WEBSERVICE_STATEMENT_NOT_FOUND      The referenced DDS was not
                                           found or is not in AVAILABLE
                                           or ARCHIVED status
  -----------------------------------------------------------------------

# Annex

Note that the attached instructions or examples may be based on a
specific environment (often Acceptance Alpha). Participants should adapt
the request based on the environment they actually need to use (see also
document "**EUDR -- API for EO Specifications**").

## Retrieve DDS by identifiers request example -- common for all versions

> ![](media/image1.emf)

## Retrieve DDS by identifiers response examples for V1

> ![](media/image2.emf)![](media/image3.emf)

## Retrieve DDS by identifiers response example for V2

> ![](media/image4.emf)

## Retrieve further referenced DDS request example (exists only in V2)

> ![](media/image5.emf)
