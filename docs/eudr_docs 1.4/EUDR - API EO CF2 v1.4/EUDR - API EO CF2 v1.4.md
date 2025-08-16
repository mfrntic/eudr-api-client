EUDR API specifications for Operators

Conformance Test 2

***Version 1.4 -- dated 22^nd^ July 2025***

**Technical & Policy contacts:**

Refer to the latest version of document "**EUDR - API for EO
specifications**".

**Release Note:**

+-------------+--------------------------------------------------------+
| Version     | Description                                            |
+=============+========================================================+
| V1.4        | -   Support complete split of operator's address       |
|             |     fields when provided by Authorized Representatives |
|             |                                                        |
|             | -   Fields change in the submission (new field         |
|             |     deviation, removed field volume)                   |
|             |                                                        |
|             | -   Alignment of internal company reference length     |
|             |     with the UI                                        |
+-------------+--------------------------------------------------------+
| V1.3        | Updated list of contacts                               |
+-------------+--------------------------------------------------------+
| V1.2        | Updated list of contacts                               |
+-------------+--------------------------------------------------------+

# Contents

[1 Contents [2](#_Toc204070221)](#_Toc204070221)

[2 Introduction [3](#introduction)](#introduction)

[3 Documentation [3](#documentation)](#documentation)

[4 Prerequisites [4](#prerequisites)](#prerequisites)

[4.1 Previous CF Tests [4](#previous-cf-tests)](#previous-cf-tests)

[4.2 Data Visibility [4](#data-visibility)](#data-visibility)

[5 Objectives [4](#objectives)](#objectives)

[6 Tasks [5](#tasks)](#tasks)

[6.1 High level specification of the Web Service call
[5](#high-level-specification-of-the-web-service-call)](#high-level-specification-of-the-web-service-call)

[6.2 Web Service Endpoint
[5](#web-service-endpoint)](#web-service-endpoint)

[7 Annex [7](#annex)](#annex)

[7.1 GeoJson Example - common for all versions
[7](#geojson-example---common-for-all-versions)](#geojson-example---common-for-all-versions)

[7.1.1 Description of the GEOjson file to be used in the web service.
[7](#description-of-the-geojson-file-to-be-used-in-the-web-service.)](#description-of-the-geojson-file-to-be-used-in-the-web-service.)

[7.2 Examples valid for V1
[7](#examples-valid-for-v1)](#examples-valid-for-v1)

[7.2.1 Submit DDS request -- import scenario by Operator with
geolocation
[7](#submit-dds-request-import-scenario-by-operator-with-geolocation)](#submit-dds-request-import-scenario-by-operator-with-geolocation)

[7.2.2 Submit DDS request -- domestic production scenario by Operator
with geolocation
[7](#submit-dds-request-domestic-production-scenario-by-operator-with-geolocation)](#submit-dds-request-domestic-production-scenario-by-operator-with-geolocation)

[7.2.3 Submit DDS request -- import scenario by Authorized
Representative with geolocation
[7](#submit-dds-request-import-scenario-by-authorized-representative-with-geolocation)](#submit-dds-request-import-scenario-by-authorized-representative-with-geolocation)

[7.2.4 Submit DDS request -- trade scenario without geolocation but with
referenced DDS
[8](#submit-dds-request-trade-scenario-without-geolocation-but-with-referenced-dds)](#submit-dds-request-trade-scenario-without-geolocation-but-with-referenced-dds)

[7.3 Examples valid for V2
[8](#examples-valid-for-v2)](#examples-valid-for-v2)

[7.3.1 Submit DDS request -- by Authorized representative
[8](#submit-dds-request-by-authorized-representative)](#submit-dds-request-by-authorized-representative)

[7.3.2 Submit DDS request -- by Operator
[8](#submit-dds-request-by-operator)](#submit-dds-request-by-operator)

[7.4 Submit DDS response - common for all versions
[8](#submit-dds-response---common-for-all-versions)](#submit-dds-response---common-for-all-versions)

# Introduction

This is the second CF Test in the process of enabling the successful
interaction of the Participant system with the central EUDR system.
Participants are required to have first read the document "EUDR -- API
for EO Specifications".

The scope of this test covers:

-   Ability to successfully submit a new DDS to the central system.

-   Ability to manage the successful response after the submission of
    the DDS.

The management of errors when submitting a DDS falls under the scope of
an ulterior Conformance test 4 (CF4).

A new version of the submit service has been created and will co-exist
for a while with the previous version since not backward compatible. The
new version allows Authorized Representative to submit the address of
the operators in 3 separate fields (for street & number, Postcode, City)
while the previous version forced to submit all the data in a unique
field. It also takes into account new a new field to allow to provide
the percentage of deviation in case the activity is different of import
or export. Finally, the field "Volume" has been removed but the actual
volume figure can be provided via the "supplementary unit" and
supplementary unit type" fields.

The previous version will remain available for a certain duration, to
give time for participants to adapt their system to the new version.

It is recommended to regularly consult the EUDR web sites (Acceptance
and Production) to checks announcements when the previous version will
be decommissioned.

# Documentation

The SOAP web services are described through WSDL files and a schema for
each message. Refer to the document "**EUDR -- API for EO
Specifications**" to retrieve the definition of the services contract
and the structure of the data to be exchanged.

# Prerequisites

Technological expertise: Very good understanding and capability to
develop SOAP web service calls.

## Previous CF Tests

It is assumed that Conformance test 1 (CF1) has been successfully
completed. The definition of the connection attributes contained in the
Request Header should continue to be used.

## Data Visibility

Participants are requested not to use sensitive or confidential data in
the generation of Tests, e.g., the information provided in the DDS
should not be sourced from real information.

# Objectives

Primary objectives:

-   Successfully Call of the Submit DDS Web service.

Secondary objectives:

-   Be able to call the Submit DDS Web service on behalf of many
    Economic Operators in case of an "Authorized Representative" role,
    with the operator address in a unique field (version V1 -- to be
    later decommissioned)

-   Be able to call the Submit DDS Web service on behalf of many
    Economic Operators in case of an "Authorized Representative" role,
    with the address in separate fields (version V2)

-   Be able to call the submit DDS Web service with the new unit of
    measures (and possibly with the percentage of deviation)

At the completion of this CF test, it is expected that the participants
will have developed a high-level strategy for the integration of call of
the Submit DDS Webservice into its system.

# Tasks

## High level specification of the Web Service call

As stated above, the objective of this task is to test the capability to
"submit" DDS.

["Submit" DDS operation:]{.underline}

The operation has the following parameters:

-   DDS data

    -   Basic data,

    -   Geolocation data,

    -   Referenced DDS data,

    -   Confidentiality flag,

    -   Company Internal Reference number.

The geolocation data is a GEOjson file containing several properties
specific for the EUDR regulation. The properties organization about that
file can be found in section 6.1

-   Activity Type declared by the operator.

> The different EUDR activity types (roles) are Operator, Trader,
> Authorized Representative of an operator, and Authorized
> Representative of a trader. Companies having requested more than one
> role in TRACES NT need to specify which role they intend to have when
> submitting a DDS since different validations apply.

The operation returns the following parameters:

-   The http return code 200 (successful)

-   A system generated UUID (Universally Unique Identifier)

The UUID serves as identifier of the DDS in other web service calls
referring to the same DDS. In particular, it will serve for later
retrieval of the reference number in a subsequent Conformance test
(CF3).

## Web Service Endpoint 

Refer to the document "**EUDR - API EO Specifications**", chapter 4:
**Documentation (Submission WS)** for the specific server URL of the
environment you're using. The operation to execute is
{EUDRSubmissionService_URL}**#submitDDS.**

The initial version with joint fields for addresses is numbered V1.0.\
The second version with separate fields for addresses and the other
changes is numbered V2.0.

After the call of the "Submit DDS" service, the participant shall test
if the http return code is successful and store the returned UUID in its
system.

If the status is not the one expected, the participant should
communicate with the contact points to jointly identify the issue.

# Annex

Please note that the attached instructions or examples may be based on a
specific environment (often Acceptance Alpha). Participants should adapt
the request based on the environment they actually need to use (see also
document "**EUDR -- API for EO Specifications**").

## GeoJson Example - common for all versions

### Description of the GEOjson file to be used in the web service.

> ![](media/image1.emf)

## Examples valid for V1

## 

### Submit DDS request -- import scenario by Operator with geolocation

> ![](media/image2.emf)

### Submit DDS request -- domestic production scenario by Operator with geolocation

> ![](media/image3.emf)

### Submit DDS request -- import scenario by Authorized Representative with geolocation

> ![](media/image4.emf)

### Submit DDS request -- trade scenario without geolocation but with referenced DDS

> ![](media/image5.emf)

## 

## Examples valid for V2

## 

### Submit DDS request -- by Authorized representative

> ![](media/image6.emf)

### Submit DDS request -- by Operator

> ![](media/image7.emf)

## Submit DDS response - common for all versions

> ![](media/image8.emf)
