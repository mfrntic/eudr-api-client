EUDR API specifications for Operators

Conformance Test 5

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

  V1.4           Support of additional changes (see also Submission
                 service)
  -----------------------------------------------------------------------

# Contents

[1 Contents [2](#_Toc204070566)](#_Toc204070566)

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

[6.3 Web Service list of errors
[6](#web-service-list-of-errors)](#web-service-list-of-errors)

[7 Annex [7](#annex)](#annex)

[7.1 Example valid for V1 - Request
[7](#example-valid-for-v1---request)](#example-valid-for-v1---request)

[7.2 Example valid for V2 - Request
[7](#example-valid-for-v2---request)](#example-valid-for-v2---request)

[7.3 Amend DDS response -- common for all versions
[7](#amend-dds-response-common-for-all-versions)](#amend-dds-response-common-for-all-versions)

# Introduction

This is the fifth CF Test in the process of enabling the successful
interaction of the Participant system with the central EUDR system.
Participants are required to have first read the document "EUDR -- API
for EO Specifications".

The scope of this test covers:

-   Ability to successfully amend an available DDS.

-   Ability to manage the errors in the response of the call.

It is important to note that the "amend DDS" Web service described in
these specifications consists in providing a [complete]{.underline} DDS
which will overwrite the previously submitted version of the DDS in the
EUDR central system.

A new version of the Amend service has been created and will co-exist
for a while with the previous version since not backward compatible. The
new version allows Authorized Representative to amend a DDS providing
the address of the operators in 3 separate fields (for street & number,
Postcode, City) while the previous version forced to submit all the data
in a unique field.

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

[The participants are requested to read the documentation concerning the
Submission Service where the amend operation is described.]{.underline}

After the call of the Amend web service, the participant shall test if
the http return code is successful or not and take the appropriate
measures.

# Prerequisites

Technological expertise: Very good understanding and capability to
develop SOAP web service calls.

## Previous CF Tests

It is assumed that Conformance test 1, 2, 3 & 4 have been successfully
completed.

## Data Visibility

Participants are requested not to use sensitive or confidential data in
the generation of Tests, e.g., the information provided in the DDS
should not be sourced from real information.

# Objectives

Primary objectives:

-   Successful Call of the Amend DDS Web service

Secondary objectives:

-   In case of an "Authorized Representative" role, amend the DDS with
    the address in separate fields (version V2). Also support other
    changes available in the submission operation.

-   Manage the possible errors in the response of the call.

At the completion of this CF test, it is expected that the participants
have developed a high-level strategy for the integration of call of the
Amend DDS Webservice into its system.

# Tasks

## High level specification of the Web Service call

As stated above, the objective of this task is to test the capability to
"amend" a DDS.

["Amend DDS" operation:]{.underline}

The operation has the following parameters:

-   DDS data

    -   UUID - the participant should use the UUID received in the CF
        test 2,

    -   Basic data,

    -   Geolocation data,

    -   Referenced DDS data,

    -   Confidentiality flag,

    -   Company Internal Reference number.

Notes:

-   Some part of the basic data cannot be changed.\
    For ex; the activity type must remain the same as the initially
    Submitted DDS (see also 6.3 for list of errors):

-   The Reference Number is the number which has been provided in the
    response of CF3.

The operation returns the following parameter in case of success (see
also 6.3 for list of errors):

-   The http return code 200 (successful)

## Web Service Endpoint 

Refer to the document "**EUDR - API for EO specifications**", chapter 4
**Documentation (Amend WS)** for the specific server URL of the
environment you're using. The operation to execute is
{EUDRSubmissionService_URL}**#amendDDS.**

The initial version with joint fields for addresses is numbered V1.0.\
The second version with separate fields for addresses and the other
changes is numbered V2.0

After the call of the "Amend DDS" web service, the participant shall
test if the http return code is successful.

## Web Service list of errors

The list of errors can be found in the specifications for CF4.

There are however additional possible errors as described in the table
below (valid for V1 and V2):

  ----------------------------------------------------------------------------------
  **Error Code**                                    **Error Description**
  ------------------------------------------------- --------------------------------
  EUDR_API_AMEND_ACTIVITY_TYPE_CHANGE_NOT_ALLOWED   The existing DDS activity cannot
                                                    be modified.

  EUDR_API_AMEND_OR_WITHDRAW_DDS_NOT_POSSIBLE       The user cannot amend a DDS if
                                                    it is referenced in another DDS
                                                    or if the amend cutoff date has
                                                    expired.

  EUDR_API_AMEND_NOT_ALLOWED_FOR_STATUS             The user can only amend when the
                                                    DDS is in status Available.

  EUDR_API_NO_DDS                                   No DDS corresponding to the
                                                    provided UUID.
  ----------------------------------------------------------------------------------

# 

# Annex

Note that the attached instructions or examples may be based on a
specific environment (often Acceptance Alpha). Participants should adapt
the request based on the environment they actually need to use (see also
document "**EUDR -- API for EO Specifications**").

## 

## Example valid for V1 - Request

> ![](media/image1.emf)

## Example valid for V2 - Request

> ![](media/image2.emf)

## Amend DDS response -- common for all versions

> ![](media/image3.emf)
