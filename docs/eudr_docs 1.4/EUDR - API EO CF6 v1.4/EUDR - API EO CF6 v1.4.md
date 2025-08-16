EUDR API specifications for Operators

Conformance Test 6

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

  V1.4           Version alignment
  -----------------------------------------------------------------------

Contents

[1 Introduction [3](#introduction)](#introduction)

[2 Documentation [3](#documentation)](#documentation)

[3 Prerequisites [3](#prerequisites)](#prerequisites)

[3.1 Previous CF Tests [3](#previous-cf-tests)](#previous-cf-tests)

[4 Objectives [4](#objectives)](#objectives)

[5 Tasks [5](#tasks)](#tasks)

[5.1 High level specification of the Web Service call
[5](#high-level-specification-of-the-web-service-call)](#high-level-specification-of-the-web-service-call)

[5.2 Web Service Endpoint
[5](#web-service-endpoint)](#web-service-endpoint)

[5.3 Web Service list of errors
[5](#web-service-list-of-errors)](#web-service-list-of-errors)

[6 Annex [7](#annex)](#annex)

[6.1 Retract DDS request examples -- equivalent for V1 and V2
[7](#retract-dds-request-examples-equivalent-for-v1-and-v2)](#retract-dds-request-examples-equivalent-for-v1-and-v2)

[6.2 Retract DDS response example.
[7](#retract-dds-response-example.)](#retract-dds-response-example.)

# Introduction

This is the sixth CF Test in the process of enabling the successful
interaction of the Participant system with the central EUDR system.
Participants are required to have first read the document "EUDR -- API
for EO Specifications".

The scope of this test covers:

-   Ability to retract a DDS which is in status Submitted or Available

Please note that retracting a DDS in status Submitted corresponds to the
functionality "***cancel***" in the web site, and retracting a DDS in
status Available corresponds to the functionality "***withdraw***". One
unique service is provided for both cases.

# Documentation

The SOAP web services are described through WSDL files and a schema for
each message. Refer to the document "**EUDR -- API for EO
Specifications**" to retrieve the definition of the services contract
and the structure of the data to be exchanged.

# Prerequisites

Technological expertise: Very good understanding and capability to
develop SOAP web service calls.

## Previous CF Tests

It is assumed that Conformance test 1 & 2 (CF1 & CF2) has been
successfully completed. Preferably Conformance test 3 & 4 (CF3 & CF4)
should have been also successfully performed.

# Objectives

Primary objectives:

-   Successfully Call the "Retract" Web service for one DDS.

Secondary objectives:

-   Manage the possible errors in the response of the call.

At the completion of this CF test, it is expected that the participants
have developed a high-level strategy for the integration of call of the
Retract DDS Webservice into its system.

# Tasks

## High level specification of the Web Service call

As stated above, the objective of this task is to test the capability to
Retrieve the reference number of a previously submitted DDS.

["Retract DDS" operation:]{.underline}

The operation has the following parameter:

-   UUID : the participant should use the UUID received in the CF test
    2.

The operation returns the following parameters in case of success (see
also 6.3 for list of errors):

-   The http return code 200 (successful)

## Web Service Endpoint 

Refer to the document "**EUDR -- API for EO Specifications**", chapter 4
**Documentation (Submission WS)** for the specific server URL of the
environment you're using. The operation to execute is
{EUDRSubmissionService_URL}**#retractDDS.**

The initial version is numbered V1.0.\
The second version is numbered V2.0 but contains no change for the
Retract operation.

After the call of the "Retract DDS" web service, the participant shall
test if the http return code is successful.

If the status is not the one expected, the participant should contact
the contact points to jointly identify the issue.

## Web Service list of errors

The list of errors concerning authorization of using the service can be
found in the specifications for CF test 4. Additional possible errors
are described in the table below (valid for all versions):

  ---------------------------------------------------------------------------------
  **Error Code**                                      **Error Description**
  --------------------------------------------------- -----------------------------
  EUDR_API_AMEND_OR_WITHDRAW_NOT_ALLOWED_FOR_STATUS   The user can only retract a
                                                      DDS in status SUBMITTED or
                                                      AVAILABLE.

  EUDR_API_AMEND_OR_WITHDRAW_DDS_NOT_POSSIBLE         The user cannot retract a DDS
                                                      if it is referenced in
                                                      another statement or if the
                                                      amend cutoff date has
                                                      expired.

  EUDR_API_NO_DDS                                     No DDS corresponding to the
                                                      provided UUID.
  ---------------------------------------------------------------------------------

# 

# Annex

Note that the attached instructions or examples may be based on a
specific environment (often Acceptance Alpha). Participants should adapt
the request based on the environment they actually need to use (see also
document "**EUDR -- API for EO Specifications**").

## Retract DDS request examples -- equivalent for V1 and V2

![](media/image1.emf)

![](media/image2.emf)

## Retract DDS response example.

![](media/image3.emf)
