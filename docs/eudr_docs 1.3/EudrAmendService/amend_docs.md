EUDR API specifications for Operators

Conformance Test 5

**_Version 1.3 – dated18<sup>th</sup> February 2025_**

**Technical & Policy contacts:**

Refer to the latest version of document “**EUDR - API for EO specifications**”.

**Release Note:**

| Version | Description |
| --- | --- |
| V1.2 | Updated list of contacts and system URLs |
| V1.3 | Updated list of contacts |

# Contents

[1 Contents 2](#_Toc188286011)

[2 Introduction 3](#_Toc188286012)

[3 Documentation 3](#_Toc188286013)

[4 Prerequisites 3](#_Toc188286014)

[4.1 Previous CF Tests 3](#_Toc188286015)

[4.2 Data Visibility 4](#_Toc188286016)

[5 Objectives 4](#_Toc188286017)

[6 Tasks 5](#_Toc188286018)

[6.1 High level specification of the Web Service call 5](#_Toc188286019)

[6.2 Web Service Endpoint 5](#_Toc188286020)

[6.3 Web Service list of errors 5](#_Toc188286021)

[7 Annex 7](#_Toc188286022)

[7.1 Amend DDS request example. 7](#_Toc188286023)

[7.2 Amend DDS response example. 7](#_Toc188286024)

# Introduction

This is the fifth CF Test in the process of enabling the successful interaction of the Participant system with the central EUDR system. Participants are required to have first read the document “EUDR – API for EO Specifications”.

The scope of this test covers:

- Ability to successfully amend an available DDS.
- Ability to manage the errors in the response of the call.

It is important to note that the “amend DDS” Web service described in these specifications consists in providing a complete DDS which will overwrite the previously submitted version of the DDS in the EUDR central system.

# Documentation

The SOAP web services are described through WSDL files and a schema for each message. Refer to the document “**EUDR – API for EO Specifications**” to retrieve the definition of the services contract and the structure of the data to be exchanged.

The participants are requested to read the documentation concerning the Submission Service where the amend operation is described.

After the call of the Amend web service, the participant shall test if the http return code is successful or not and take the appropriate measures.

# Prerequisites

Technological expertise: Very good understanding and capability to develop SOAP web service calls.  

## Previous CF Tests

It is assumed that Conformance test 1, 2, 3 & 4 have been successfully completed.

## Data Visibility

Participants are requested not to use sensitive or confidential data in the generation of Tests, e.g., the information provided in the DDS should not be sourced from real information.

# Objectives

Primary objectives:

- Successfull Call of the Amend DDS Web service.

Secondary objectives:

- Manage the possible errors in the response of the call.

At the completion of this CF test, it is expected that the participants have developed a high-level strategy for the integration of call of the Amend DDS Webservice into its system.

# Tasks

## High level specification of the Web Service call

As stated above, the objective of this task is to test the capability to “amend” a DDS.

“Amend DDS” operation:

The operation has the following parameters:

- DDS data
  - UUID - the participant should use the UUID received in the CF test 2,
  - Basic data,
  - Geolocation data,
  - Referenced DDS data,
  - Confidentiality flag,
  - Company Internal Reference number.

Notes:

- Some part of the basic data cannot be changed.  
    For ex; the activity type must remain the same as the initially Submitted DDS (see also 6.2 for list of errors):
- The Reference Number is the number which has been provided in the response of CF3.

The operation returns the following parameter in case of success (see also 5.3 for list of errors):

- The http return code 200 (successful)  

## Web Service Endpoint

Refer to the document “**EUDR - API for EO specifications**”, chapter 4 **Documentation (Submission WS)** for the specific server URL of the environment you’re using. The operation to execute is {EUDRSubmissionService_URL}**#amendDds.**

After the call of the “Amend DDS” web service, the participant shall test if the http return code is successful.

## Web Service list of errors

The list of errors can be found in the specifications for CF4.

There are however additional possible errors as described in the table below:

| **Error Code** | **Error Description** |
| --- | --- |
| **EUDR_API_AMEND_ACTIVITY_TYPE_CHANGE_NOT_ALLOWED  <br>** | The existing DDS activity cannot be modified. |
| EUDR_API_AMEND_OR_WITHDRAW_DDS_NOT_POSSIBLE | The user cannot amend a DDS if it is referenced in another DDS or if the amend cutoff date has expired. |
| EUDR_API_AMEND_NOT_ALLOWED_FOR_STATUS | The user can only amend when the DDS is in status Available. |
| EUDR_API_NO_DDS | No DDS corresponding to the provided UUID. |

# Annex

Note that the attached instructions or examples may be based on a specific environment (often Acceptance Alpha). Participants should adapt the request based on the environment they actually need to use (see also document “**EUDR – API for EO Specifications**”).
