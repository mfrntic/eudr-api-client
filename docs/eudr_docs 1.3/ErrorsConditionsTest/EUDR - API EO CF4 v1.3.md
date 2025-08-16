EUDR API specifications for Operators

Conformance Test 4

**_Version 1.3 – dated18<sup>th</sup> February 2025_**

**Technical & Policy contacts:**

Refer to the latest version of document “**EUDR - API for EO specifications**”.

**Release Note:**

| Version | Description |
| --- | --- |
| V1.2 | Updated list of contacts and system URLs |
| V1.3 | Updated list of contacts |

# Contents

[1 Contents 2](#_Toc188285806)

[2 Introduction 3](#_Toc188285807)

[3 Documentation 3](#_Toc188285808)

[4 Prerequisites 3](#_Toc188285809)

[4.1 Previous Sprints 3](#_Toc188285810)

[4.2 Data Visibility 3](#_Toc188285811)

[5 Objectives 4](#_Toc188285812)

[6 Tasks 5](#_Toc188285813)

[6.1 Identification of the Web Service call 5](#_Toc188285814)

[6.2 Web Service Endpoint 7](#_Toc188285815)

# Introduction

This is the fourth CF Test in the process of enabling the successful interaction of the Participant’s system with the central EUDR system. Participants are required to have first read the document “EUDR – API for EO Specifications”.

The scope of this test covers:

- Ability to manage unsuccessful (error) responses after the submission of a DDS.

# Documentation

The SOAP web services are described through WSDL files and a schema for each message. Refer to the document “**EUDR – API for EO Specifications**” to retrieve the definition of the contract’s services and the structure of the data to be exchanged.

The participants are requested to read the documentation concerning the Submission Service.  

# Prerequisites

Technological expertise: Very good understanding and capability to develop SOAP web service calls.  

## Previous Sprints

It is assumed that Conformance test 1 and 2 (CF1 & CF2) have been successfully completed. The definition of the connection attributes contained in the Request Header should continue to be used.

## Data Visibility

Participants are requested not to use sensitive or confidential data in the generation of tests, e.g., the information provided in the DDS should not be sourced from real information.  

# Objectives

Primary objectives:

- Successful Management of errors returned by a call of the “Submit DDS” Web service.

Secondary objectives:

- Develop an error-management strategy required by the end-users of the participant’s system.

# Tasks

## Identification of the Web Service call

As stated above, the objective of this sprint is to develop the capability to manage errors when submitting DDS.

It is important to note that errors can be classified in 2 categories:

1. Errors coming from authentication issues or from disrespect of the API schema definition,
2. Business errors which reflect unallowed or illegal cases when submitting a DDS.

The participant will need to re-execute parts of CF2 by simulating errors of those 2 types. For testing the possible errors, the participant will elaborate scenarios that shall return the error and verify if it is caught properly by its system.

The below table describe a list of errors of type (b).

The first column corresponds to the technical value of the error returned by the EUDR system.

| **Error Code** | **Error Description** |
| --- | --- |
| EUDR_WEBSERVICE_USER_NOT_EUDR_OPERATOR | The user is not register in the EUDR domain as operator.<br><br>(Not needed to test for conformance) |
| EUDR_WEBSERVICE_USER_FROM_MANY_OPERATOR | The user belongs to more than one operator.<br><br>(Not needed to test for conformance) |
| EUDR_WEBSERVICE_USER_ACTIVITY_NOT_ALLOWED | The user is requesting to use an EUDR role that is not valid for the operator profile. |
| EUDR_OPERATOR_EORI_FOR_ACTIVITY_MISSING | The operator must have an EU EORI if the activity is IMPORT or EXPORT |
| EUDR_BEHALF_OPERATOR_NOT_PROVIDED | For authorized representative role only:  <br>The on-behalf-of (_represented_) operator must be provided. |
| EUDR_ACTIVITY_TYPE_NOT_COMPATIBLE | The selected activity is not allowed for the operator. |
| EUDR_COMMODITIES_HS_CODE_INVALID | The HS-Code of a commodity is invalid<sup>[\[1\]](#footnote-2)</sup> |
| EUDR_COMMODITIES_DESCRIPTOR_NET_MASS_EMPTY | Net Mass is mandatory for IMPORT or EXPORT activity. |
| EUDR_COMMODITIES_DESCRIPTOR_QUANTITY_MISSING | At least one unit of measure quantity must be provided. |
| EUDR_COMMODITITY_PRODUCER_COUNTRY_CODE_INVALID | The ISO 2 country code provided for the producer is invalid. |
| EUDR_COMMODITIES_PRODUCER_GEO_EMPTY | No geolocation was provided and there is no referenced DDS. |
| EUDR_COMMODITIES_PRODUCER_GEO_INVALID | An invalid GEOjson file was provided for geolocation. |
| EUDR_COMMODITIES_PRODUCER_GEO_LATITUDE_INVALID | Latitude of points or vertices must be between -90 and +90. |
| EUDR_COMMODITIES_PRODUCER_GEO_LONGITUDE_INVALID | Longitude of points or vertices must be between -180 and +180. |
| EUDR_COMMODITIES_PRODUCER_GEO_POLYGON_INVALID | Each polygon must have at least 4 non-aligned points and cannot have intersections between sides. |
| EUDR_COMMODITIES_PRODUCER_GEO_AREA_INVALID | An area for a point must be a number and, for non-cattle commodities, it should be between 0,0001 and 4 |
| EUDR_MAXIMUM_GEO_SIZE_REACHED | The maximum DDS file size has been exceeded  <br>(Not needed to test for conformance). |
| EUDR_REFERENCED_STATEMENT_NOT_FOUND | At least one referenced DDS is invalid (Referenced Number or Verification Number) or does not exist. |
| EUDR_MAXIMUM_REFERENCED_DDS_REACHED | The maximum number of referenced DDS is exceeded.<br><br>(Not needed to test for conformance) |
| EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING | Supplementary units are provided but the supplementary unit qualifier is missing. |
| EUDR_COMMODITIES_DESCRIPTOR_NUMBER_OF_UNITS_MISSING | A supplementary unit qualifier is provided but the supplementary units are missing. |
| EUDR_COMMODITIES_SPECIES_INFORMATION_COMMON_NAME_EMPTY | The common name is mandatory if the commodity contains Annex I wood (timber) products. |
| EUDR_COMMODITIES_SPECIES_INFORMATION_SCIENTIFIC_NAME_EMPTY | The scientific name is mandatory if the commodity contains Annex I wood (timber) products. |
| EUDR_ACTIVITY_TYPE_NOT_ALLOWED_FOR_NON_EU_OPERATOR | Non-EU operators must select Import activity. |

Some features in the current version of the Central EUDR system are not yet developed. Such that additional error codes may be added to the list in the future.

## Web Service Endpoint

Refer to the document “**EUDR - API for EO specifications**”, chapter 4 **Documentation (Submission WS)** for the specific server URL of the environment you’re using. The operation to execute is {EUDRSubmissionService_URL}**#submitDds.**

1. Only a subset of the EUDR HS-codes is available in the ALPHA testing environment. [↑](#footnote-ref-2)