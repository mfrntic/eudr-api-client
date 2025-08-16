EUDR API specifications for Operators

Conformance Test 2

**_Version 1.3 – dated18<sup>th</sup> February 2025_**

**Technical & Policy contacts:**

Refer to the latest version of document “**EUDR - API for EO specifications**”.

**Release Note:**

| Version | Description |
| --- | --- |
| V1.2 | Updated list of contacts |
| V1.3 | Updated list of contacts |

# Contents

[1 Contents 2](#_Toc188285601)

[2 Introduction 3](#_Toc188285602)

[3 Documentation 3](#_Toc188285603)

[4 Prerequisites 3](#_Toc188285604)

[4.1 Previous CF Tests 3](#_Toc188285605)

[4.2 Data Visibility 3](#_Toc188285606)

[5 Objectives 4](#_Toc188285607)

[6 Tasks 5](#_Toc188285608)

[6.1 High level specification of the Web Service call 5](#_Toc188285609)

[6.2 Web Service Endpoint 5](#_Toc188285610)

[7 Annex 7](#_Toc188285611)

[7.1 Description of the geojson file to be used in the web service. 7](#_Toc188285612)

[7.2 Submit DDS request example – import scenario by Operator with geolocation 7](#_Toc188285613)

[7.3 Submit DDS request example – domestic production scenario by Operator with geolocation 7](#_Toc188285614)

[7.4 Submit DDS request example – import scenario by Authorized Representative with geolocation 7](#_Toc188285615)

[7.5 Submit DDS request example – trade scenario without geolocation but with referenced DDS 8](#_Toc188285616)

[7.6 Submit DDS response example. 8](#_Toc188285617)

# Introduction

This is the second CF Test in the process of enabling the successful interaction of the Participant system with the central EUDR system. Participants are required to have first read the document “EUDR – API for EO Specifications”.

The scope of this test covers:

- Ability to successfully submit a new DDS to the central system.
- Ability to manage the successful response after the submission of the DDS.

The management of errors when submitting a DDS falls under the scope of an ulterior Conformance test 4 (CF4).  

# Documentation

The SOAP web services are described through WSDL files and a schema for each message. Refer to the document “**EUDR – API for EO Specifications**” to retrieve the definition of the services contract and the structure of the data to be exchanged.

# Prerequisites

Technological expertise: Very good understanding and capability to develop SOAP web service calls.  

## Previous CF Tests

It is assumed that Conformance test 1 (CF1) has been successfully completed. The definition of the connection attributes contained in the Request Header should continue to be used.

## Data Visibility

Participants are requested not to use sensitive or confidential data in the generation of Tests, e.g., the information provided in the DDS should not be sourced from real information.  

# Objectives

Primary objectives:

- Successfully Call of the Submit DDS Web service.

Secondary objectives:

- Be able to call the Submit DDS Web service on behalf of many Economic Operators in case of an “Authorised Representative” role.

At the completion of this CF test, it is expected that the participants will have developed a high-level strategy for the integration of call of the Submit DDS Webservice into its system.

# Tasks

## High level specification of the Web Service call

As stated above, the objective of this task is to test the capability to “submit” DDS.

“Submit” DDS operation:

The operation has the following parameters:

- DDS data
  - Basic data,
  - geolocation data,
  - referenced DDS data,
  - confidentiality flag,
  - Company Internal Reference number.

The geolocation data is a geojson file containing several properties specific for the EUDR regulation. The properties organization about that file can be found in section 6.1

- Operator Activity Type claimed by the operator.

The different EUDR activity types (roles) are Operator, Trader, Authorized Representative of an operator, and Authorized Representative of a trader. Companies having requested more than one role in TRACES NT need to specify which role they intend to have when submitting a DDS since different validations apply.

The operation returns the following parameters:

- The http return code 200 (successful)
- A generated UUID (Universally Unique Identifier)  

The UUID serves as identifier of the DDS in other web service calls referring to the same DDS. In particular, it will serve for later retrieval of the reference number in an ulterior Conformance test 3 (CF3).

## Web Service Endpoint

Refer to the document “**EUDR - API EO Specifications**”, chapter 4: **Documentation (Submission WS)** for the specific server URL of the environment you’re using. The operation to execute is {EUDRSubmissionService_URL}**#submitDds.**

After the call of the “Submit DDS” service, the participant shall test if the http return code is successful and store the returned UUID in its system.

If the status is not the one expected, the participant should contact the contact points to jointly identify the issue.

# Annex

Please note that the attached instructions or examples may be based on a specific environment (often Acceptance Alpha). Participants should adapt the request based on the environment they actually need to use (see also document “**EUDR – API for EO Specifications**”).

## Description of the geojson file to be used in the web service
 

## Submit DDS request example – import scenario by Operator with geolocation
 

## Submit DDS request example – domestic production scenario by Operator with geolocation

 

## Submit DDS request example – import scenario by Authorized Representative with geolocation
 

## Submit DDS request example – trade scenario without geolocation but with referenced DDS
 

## Submit DDS response example
 