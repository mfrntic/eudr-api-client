EUDR API specifications for Operators

Conformance Test 6

**_Version 1.3 – dated18<sup>th</sup> February 2025_**

**Technical & Policy contacts:**

Refer to the latest version of document "**EUDR - API for EO specifications**".

**Release Note:**

| Version | Description |
| --- | --- |
| V1.2 | Updated list of contacts and system URLs |
| V1.3 | Updated list of contacts |

Contents

[1 Contents 2](#_Toc183178366)

[2 Introduction 3](#_Toc183178367)

[3 Documentation 3](#_Toc183178368)

[4 Prerequisites 3](#_Toc183178369)

[4.1 Previous CF Tests 3](#_Toc183178370)

[5 Objectives 4](#_Toc183178371)

[6 Tasks 5](#_Toc183178372)

[6.1 High level specification of the Web Service call 5](#_Toc183178373)

[6.2 Web Service Endpoint 5](#_Toc183178374)

[6.3 Web Service list of errors 5](#_Toc183178375)

[7 Annex 6](#_Toc183178376)

[7.1 Retract DDS request example. 6](#_Toc183178377)

[7.2 Retract DDS response example. 6](#_Toc183178378)

# Introduction

This is the sixth CF Test in the process of enabling the successful interaction of the Participant system with the central EUDR system. Participants are required to have first read the document "EUDR – API for EO Specifications".

The scope of this test covers:

- Ability to retract a DDS which is in status Submitted or Available

Please note that retracting a DDS in status Submitted corresponds to the functionality "_cancel_" in the web site, and retracting a DDS in status Available corresponds to the functionality "_withdraw_". One unique service is provided for both cases.

# Documentation

The published documentation about the API specifications can be found via the link:

<https://circabc.europa.eu/ui/group/34861680-e799-4d7c-bbad-da83c45da458/library/5fb710e6-075e-4ab9-8290-ca51fa178fd6>

The SOAP web services are described through WSDL files and a schema for each message. Refer to the document "EUDR – API for EO Specifications" to retrieve the definition of the contract's services and the structure of the data to be exchanged.

The participants are requested to read the documentation concerning the Submission Service.

# Prerequisites

Technological expertise: Very good understanding and capability to develop SOAP web service calls.  

## Previous CF Tests

It is assumed that Conformance test 1 & 2 (CF1 & CF2) has been successfully completed. Preferably Conformance test 3 & 4 (CF3 & CF4) should have been also successfully performed.

# Objectives

Primary objectives:

- Successfully Call the "Retract" Web service for one DDS.

Secondary objectives:

- Manage the possible errors in the response of the call.

At the completion of this CF test, it is expected that the participants have developed a high-level strategy for the integration of call of the Retract DDS Webservice into its system.

# Tasks

## High level specification of the Web Service call

As stated above, the objective of this task is to test the capability to Retrieve the reference number of a previously submitted DDS.

"Retract DDS" operation:

The operation has the following parameter:

- UUID : the participant should use the UUID received in the CF test 2.

The operation returns the following parameters in case of success (see also 6.3 for list of errors):

- The http return code 200 (successful)

## Web Service Endpoint

Refer to the document "**EUDR – API for EO Specifications**", chapter 4 **Documentation (Submission WS)** for the specific server URL of the environment you're using. The operation to execute is {EUDRSubmissionService_URL}**#retractDds.**

After the call of the "Retract DDS" web service, the participant shall test if the http return code is successful.

If the status is not the one expected, the participant should contact the contact points to jointly identify the issue.

## Web Service list of errors

The list of errors concerning authorization of using the service can be found in the specifications for CF test 4.

Additional possible errors as described in the table below:

| **Error Code** | **Error Description** |
| --- | --- |
| EUDR_API_AMEND_OR_WITHDRAW_NOT_ALLOWED_FOR_STATUS | The user can only retract a DDS in status SUBMITTED or AVAILABLE. |
| EUDR_API_AMEND_OR_WITHDRAW_DDS_NOT_POSSIBLE | The user cannot retract a DDS if it is referenced in another statement or if the amend cutoff date has expired. |
| EUDR_API_NO_DDS | No DDS corresponding to the provided UUID. |

# Annex

Note that the attached instructions or examples may be based on a specific environment (often Acceptance Alpha). Participants should adapt the request based on the environment they actually need to use (see also document "**EUDR – API for EO Specifications**").

## Retract DDS request example

See example XML file: [EUDR - API EO CF6 v1.0 - ANNEX - Eudr_EO_retractdds_request.xml](EUDR%20-%20API%20EO%20CF6%20v1.0%20-%20ANNEX%20-%20Eudr_EO_retractdds_request.xml)

## Retract DDS response example

See example XML file: [EUDR - API EO CF6 v1.0 - ANNEX - Eudr_EO_retractdds_response.xml](EUDR%20-%20API%20EO%20CF6%20v1.0%20-%20ANNEX%20-%20Eudr_EO_retractdds_response.xml)
