EUDR API specifications for Operators

Conformance Test 3

***Version 1.4 -- dated 22^nd^ July 2025***

**Technical & Policy contacts:**

Refer to the latest version of document "EUDR - API for EO
specifications".

**Release Note:**

+-------------+--------------------------------------------------------+
| Version     | Description                                            |
+=============+========================================================+
| V1.2        | -   Updated list of contacts                           |
|             |                                                        |
|             | -   The Operator can retrieve information from the     |
|             |     submitted DDS via the company internal reference   |
|             |     number.                                            |
|             |                                                        |
|             | -   The internal reference number is also in the list  |
|             |     of the returned information.                       |
|             |                                                        |
|             | -   The maximum DDS information records retrieved via  |
|             |     Internal Reference Number is 1000.                 |
+-------------+--------------------------------------------------------+
| V1.3        | -   Updated list of contacts                           |
+-------------+--------------------------------------------------------+
| V1.4        | -   The retrieved DDS contains the communication       |
|             |     provided by the CA and the rejection reason, if    |
|             |     any.                                               |
+-------------+--------------------------------------------------------+

# Contents

[1 Contents [2](#_Toc204070378)](#_Toc204070378)

[2 Introduction [3](#introduction)](#introduction)

[3 Documentation [3](#documentation)](#documentation)

[4 Prerequisites [3](#prerequisites)](#prerequisites)

[4.1 Previous CF Tests [3](#previous-cf-tests)](#previous-cf-tests)

[5 Objectives [4](#objectives)](#objectives)

[6 Tasks [5](#tasks)](#tasks)

[6.1 High level specification of the Web Service call
[5](#high-level-specification-of-the-web-service-call)](#high-level-specification-of-the-web-service-call)

[6.2 Web Service Endpoint and Operations
[6](#web-service-endpoint-and-operations)](#web-service-endpoint-and-operations)

[7 Annex [7](#annex)](#annex)

[7.1 Retrieve DDS number request examples.
[7](#retrieve-dds-number-request-examples.)](#retrieve-dds-number-request-examples.)

[7.2 Retrieve DDS number successful response example.
[7](#retrieve-dds-number-successful-response-example.)](#retrieve-dds-number-successful-response-example.)

# Introduction

This is the third CF Test in the process of enabling the successful
interaction of the Participant system with the central EUDR system.
Participants are required to have first read the document "EUDR -- API
for EO Specifications".

The scope of this test covers:

-   Ability to retrieve the Reference Number, the Verification Number,
    the status and the company internal reference number of a previously
    successfully submitted DDS to the central EUDR system.

Please note a single call of the service can contain the retrieval of
reference numbers for many DDS. Presently a limit of 100 DDS per call is
imposed when retrieved via UUID.\
A limit of 1000 DDS per call is imposed when retrieved via Internal
Reference Number.

# Documentation

The SOAP web services are described through WSDL files and a schema for
each message. Refer to the document "**EUDR -- API for EO
Specifications**" to retrieve the definition of the contract's services
and the structure of the data to be exchanged.

The participants are requested to read the documentation concerning the
Retrieval Service.

# Prerequisites

Technological expertise: understanding and ability to develop web
service calls.

## Previous CF Tests

It is assumed that Conformance tests 1 & 2 (CF1 & CF2) have been
successfully completed. The definition of the connection attributes
contained in the Request Header should continue to be used.

# Objectives

Primary objectives:

-   Successfully Call the "Retrieve DDS number" Web service for one DDS.

Secondary objectives:

-   Be able to analyze the status of the DDS,

-   Be able to call the "Retrieve DDS number" web service for more than
    one DDS.

At the completion of this CF test, it is expected that the participants
have developed a high-level strategy for the integration of call of the
"Retrieve DDS number" Webservice into its existing system.

# Tasks

## High level specification of the Web Service call

As stated above, the objective of this task is to test the capability to
Retrieve the reference number (and other data) of a previously submitted
DDS.

["Retrieve" DDS number via UUID operation:]{.underline}

The operation has the following parameter:

-   UUID

> The participant should use the UUID received in the CF test 2. If more
> than one test is required, the participant can run the CF test 2 many
> times to reuse the UUIDs in CF test 3.

The operation returns the following information:

-   The http return code 200 (successful)

-   The status of the DDS (Submitted, Available, etc.)

-   The rejection reason in case the status is "Rejected"

-   The reference number of the DDS,

-   The verification number of the DDS,

-   The UUID that identifies which DDS is concerned,

-   The internal reference number of the DDS

-   The Communication from the CA

> If the provided UUID is incorrect or if the user has no permission to
> access the DDS, no value is returned in the parameters. In addition,
> values for reference number and verification number are returned only
> if the DDS is in status Available (or Expired or Withdrawn) at the
> time of the call.
>
> If the system returns another http code than 200, the main reason
> comes from a general authorization problem or the unavailability of
> the service.

["Retrieve" DDS number via Internal Reference Number
operation:]{.underline}

The operation has the following parameter:

-   Internal reference number (string: min 3, max 50 characters)

> The participant can use the Internal Reference Number provided via the
> submission in CF test 2.

The operation returns the following information:

-   The http return code 200 (successful)

-   The status of the DDS (Submitted, Available, etc.)

-   The rejection reason in case the status is "Rejected"

-   The reference number of the DDS,

-   The verification number of the DDS,

-   The UUID that identifies which DDS is concerned,

-   The internal reference number of the DDS

-   The Communication from the CA.

> The system will return up to 1000 DDS information records
> corresponding to the following rules:

-   The internal reference number of the returned DDS contains the
    string parameter (ie. partial matching)

-   The matching is not case sensitive.

> If the system returns another http code than 200, the main reason
> comes from a general authorization problem or the unavailability of
> the service.
>
> The participant is encouraged to test the web service by retrieving
> the DDS information data for more than one DDS. To do so, the
> participant needs to have priorly executed many times CF2 and perform
> a single call of the "Retrieve DDS number" containing all UUIDs as
> input parameter.
>
> To retrieve the Communication from the CA, the participants are
> encouraged to not poll too frequently for all DDS to verify if there
> is a new communication coming from the Competent Authority. It is
> recommended to have contact outside of the system and use that feature
> only for DDS where operators know that the CA want to provide a
> communication.

## Web Service Endpoint and Operations

> Refer to the document "**EUDR - API for EO specifications**", chapter
> 4: **Documentation (Retrieval WS)** for the specific server URL of the
> environment you're using.
>
> The Retrieve DDS number [via UUID]{.underline} operation is
> {EUDRRetrievalService_URL}**#getDdsInfo**
>
> The Retrieve DDS number [via internal reference number]{.underline}
> operation is
> {EUDRRetrievalService_URL}**#GetDdsInfoByInternalReferenceNumberRequest**

# Annex

Note that the attached instructions or examples may be based on a
specific environment (often Acceptance Alpha). Participants should adapt
the request based on the environment they actually need to use (see also
document "**EUDR -- API for EO Specifications**").

## Retrieve DDS number request examples.

![](media/image1.emf)

![](media/image2.emf)

## Retrieve DDS number successful response example.

![](media/image3.emf)
