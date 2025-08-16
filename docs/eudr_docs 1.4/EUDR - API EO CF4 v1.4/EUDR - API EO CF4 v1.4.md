EUDR API specifications for Operators

Conformance Test 4

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

  V1.4           Added new errors for services
  -----------------------------------------------------------------------

# Contents

[1 Contents [2](#_Toc204070457)](#_Toc204070457)

[2 Introduction [3](#introduction)](#introduction)

[3 Documentation [3](#documentation)](#documentation)

[4 Prerequisites [3](#prerequisites)](#prerequisites)

[4.1 Previous Sprints [3](#previous-sprints)](#previous-sprints)

[4.2 Data Visibility [3](#data-visibility)](#data-visibility)

[5 Objectives [4](#objectives)](#objectives)

[6 Tasks [5](#tasks)](#tasks)

[6.1 Identification of the Web Service call
[5](#identification-of-the-web-service-call)](#identification-of-the-web-service-call)

[6.2 Web Service Endpoint
[7](#web-service-endpoint)](#web-service-endpoint)

# Introduction

This is the fourth CF Test in the process of enabling the successful
interaction of the Participant's system with the central EUDR system.
Participants are required to have first read the document "EUDR -- API
for EO Specifications".

The scope of this test covers:

-   Ability to manage unsuccessful (error) responses after the
    submission of a DDS.

# Documentation

The SOAP web services are described through WSDL files and a schema for
each message. Refer to the document "**EUDR -- API for EO
Specifications**" to retrieve the definition of the contract's services
and the structure of the data to be exchanged.

The participants are requested to read the documentation concerning the
Submission Service.

# Prerequisites

Technological expertise: Very good understanding and capability to
develop SOAP web service calls.

## Previous Sprints

It is assumed that Conformance test 1 and 2 (CF1 & CF2) have been
successfully completed. The definition of the connection attributes
contained in the Request Header should continue to be used.

## Data Visibility

Participants are requested not to use sensitive or confidential data in
the generation of tests, e.g., the information provided in the DDS
should not be sourced from real information.

# Objectives

Primary objectives:

-   Successful Management of errors returned by a call of the "Submit
    DDS" Web service.

Secondary objectives:

-   Develop an error-management strategy required by the end-users of
    the participant's system.

# Tasks

## Identification of the Web Service call

As stated above, the objective of this sprint is to develop the
capability to manage errors when submitting DDS.

It is important to note that errors can be classified in 2 categories:

a)  Errors coming from authentication issues or from disrespect of the
    API schema definition,

b)  Business errors which reflect unallowed or illegal cases when
    submitting a DDS.

The participant will need to re-execute parts of CF2 by simulating
errors of those 2 types. For testing the possible errors, the
participant will elaborate scenarios that shall return the error and
verify if it is caught properly by its system.

The below table describe a list of errors of type (b).

The first column corresponds to the technical value of the error
returned by the EUDR system.

+------------------------+--------------------------------------+-----+
| **Error Code**         | **Error Description**                | **S |
|                        |                                      | erv |
|                        |                                      | ice |
|                        |                                      | ver |
|                        |                                      | sio |
|                        |                                      | n** |
+========================+======================================+=====+
| EUDR_WEBSERVICE_       | The user is not register in the EUDR | V1, |
| USER_NOT_EUDR_OPERATOR | domain as operator.                  | V2  |
|                        |                                      |     |
|                        | ([Not needed to test for             |     |
|                        | conformance]{.underline})            |     |
+------------------------+--------------------------------------+-----+
| EUDR_WEBSERVICE_U      | The user belongs to more than one    | V1, |
| SER_FROM_MANY_OPERATOR | operator.                            | V2  |
|                        |                                      |     |
|                        | ([Not needed to test for             |     |
|                        | conformance]{.underline})            |     |
+------------------------+--------------------------------------+-----+
| EUDR_WEBSERVICE_USE    | The user is requesting to use an     | V1, |
| R_ACTIVITY_NOT_ALLOWED | EUDR role that is not valid for the  | V2  |
|                        | operator profile.                    |     |
+------------------------+--------------------------------------+-----+
| EUDR_OPERATOR_EOR      | The operator must have an EU EORI if | V1, |
| I_FOR_ACTIVITY_MISSING | the activity is IMPORT or EXPORT     | V2  |
+------------------------+--------------------------------------+-----+
| EUDR_BEHALF            | For authorized representative role   | V1, |
| _OPERATOR_NOT_PROVIDED | only:\                               | V2  |
|                        | The on-behalf-of (*represented*)     |     |
|                        | operator must be provided.           |     |
+------------------------+--------------------------------------+-----+
| EUDR_BEHA              | For authorized representative role   | V2  |
| LF_OPERATOR_CITY_POSTA | only:\                               |     |
| LCODE_EMPTY_OR_INVALID | The city and postal code of the      |     |
|                        | on-behalf-of (*represented*)         |     |
|                        | operator must be provided and valid. |     |
+------------------------+--------------------------------------+-----+
| EUDR_ACTIVI            | The selected activity is not allowed | V1, |
| TY_TYPE_NOT_COMPATIBLE | for the operator.                    | V2  |
+------------------------+--------------------------------------+-----+
| EUDR_COMMO             | The HS-Code of a commodity is        | V1, |
| DITIES_HS_CODE_INVALID | invalid[^1]                          | V2  |
+------------------------+--------------------------------------+-----+
| EUDR_COMMODITIES_DES   | Net Mass is mandatory for IMPORT or  | V1, |
| CRIPTOR_NET_MASS_EMPTY | EXPORT activity.                     | V2  |
+------------------------+--------------------------------------+-----+
| EUDR_COMMODITIES_DESCR | At least one unit of measure         | V1, |
| IPTOR_QUANTITY_MISSING | quantity must be provided.           | V2  |
+------------------------+--------------------------------------+-----+
| EUDR_COMMODITI         | Supplementary Unit not allowed for   | V2  |
| ES_DESCRIPTOR_SUPPLEME | import and export where the          |     |
| NTARY_UNIT_NOT_ALLOWED | supplementary unit is not applicable |     |
+------------------------+--------------------------------------+-----+
| EUDR_COMMODITIES_DES   | Invalid Supplementary Unit type      | V1, |
| CRIPTOR_SUPPLEMENTARY_ |                                      | V2  |
| UNIT_QUALIFIER_INVALID |                                      |     |
+------------------------+--------------------------------------+-----+
| EUDR_                  | Supplementary Unit type not          | V2  |
| COMMODITIES_DESCRIPTOR | applicable                           |     |
| _SUPPLEMENTARY_UNIT_QU |                                      |     |
| ALIFIER_NOT_COMPATIBLE |                                      |     |
+------------------------+--------------------------------------+-----+
| EUDR_COMMODITI         | Invalid Unit of Measure combination  | V2  |
| ES_DESCRIPTOR_SUPPLEME |                                      |     |
| NTARY_UNIT_NOT_ALLOWED | Percentage estimate or deviation     |     |
|                        | cannot be used without a Net Mass    |     |
|                        | value                                |     |
+------------------------+--------------------------------------+-----+
| EUDR_COMMODIT          | Missing Percentage estimate or       | V2  |
| IES_DESCRIPTOR_PERCENT | deviation                            |     |
| AGE_ESTIMATION_MISSING |                                      |     |
|                        | Net Mass Percentage estimate or      |     |
|                        | deviation is mandatory for Domestic  |     |
|                        | or Trade activities                  |     |
+------------------------+--------------------------------------+-----+
| EUDR_COMMODITIES_      | Percentage estimate or deviation not | V2  |
| DESCRIPTOR_PERCENTAGE_ | allowed for Import/Export            |     |
| ESTIMATION_NOT_ALLOWED |                                      |     |
+------------------------+--------------------------------------+-----+
| EUDR_COMMO             | Missing Supplementary unit value     | V1, |
| DITIES_DESCRIPTOR_SUPP |                                      | V2  |
| LEMENTARY_UNIT_MISSING | Supplementary unit value required    |     |
|                        | for supplementary unit type          |     |
+------------------------+--------------------------------------+-----+
| EUDR_COMMODITIES_DES   | Missing supplementary unit type      | V1, |
| CRIPTOR_SUPPLEMENTARY_ |                                      | V2  |
| UNIT_QUALIFIER_MISSING | Supplementary unit type required for |     |
|                        | supplementary unit value             |     |
+------------------------+--------------------------------------+-----+
| EUDR_COMMODIT          | Percentage estimate or deviation     | V2  |
| IES_DESCRIPTOR_PERCENT | lower than 0 or higher than 50       |     |
| AGE_ESTIMATION_INVALID |                                      |     |
+------------------------+--------------------------------------+-----+
| EU                     | The ISO 2 country code provided for  | V1, |
| DR_COMMODITITY_PRODUCE | the producer is invalid.             | V2  |
| R_COUNTRY_CODE_INVALID |                                      |     |
+------------------------+--------------------------------------+-----+
| EUDR_COMMODIT          | No geolocation was provided and      | V1, |
| IES_PRODUCER_GEO_EMPTY | there is no referenced DDS.          | V2  |
+------------------------+--------------------------------------+-----+
| EUDR_COMMODITIE        | An invalid GEOjson file was provided | V1, |
| S_PRODUCER_GEO_INVALID | for geolocation.                     | V2  |
+------------------------+--------------------------------------+-----+
| EU                     | Latitude of points or vertices must  | V1, |
| DR_COMMODITIES_PRODUCE | be between -90 and +90.              | V2  |
| R_GEO_LATITUDE_INVALID |                                      |     |
+------------------------+--------------------------------------+-----+
| EUD                    | Longitude of points or vertices must | V1, |
| R_COMMODITIES_PRODUCER | be between -180 and +180.            | V2  |
| _GEO_LONGITUDE_INVALID |                                      |     |
+------------------------+--------------------------------------+-----+
| EU                     | Each polygon must have at least 4    | V1, |
| DR_COMMODITIES_PRODUCE | non-aligned points and cannot have   | V2  |
| R_GEO_INVALID_GEOMETRY | intersections between sides.         |     |
+------------------------+--------------------------------------+-----+
| EUDR_COMMODITIES_PRO   | An area for a point must be a number | V1, |
| DUCER_GEO_AREA_INVALID | and, for non-cattle commodities, it  | V2  |
|                        | should be between 0,0001 and 4       |     |
+------------------------+--------------------------------------+-----+
| EUDR_MA                | The maximum DDS file size has been   | V1, |
| XIMUM_GEO_SIZE_REACHED | exceeded\                            | V2  |
|                        | ([Not needed to test for             |     |
|                        | conformance]{.underline}).           |     |
+------------------------+--------------------------------------+-----+
| EUDR_REFERENC          | At least one referenced DDS is       | V1, |
| ED_STATEMENT_NOT_FOUND | invalid (Referenced Number or        | V2  |
|                        | Verification Number) or does not     |     |
|                        | exist.                               |     |
+------------------------+--------------------------------------+-----+
| EUDR_MAXIMUM_          | The maximum number of referenced DDS | V1, |
| REFERENCED_DDS_REACHED | is exceeded.                         | V2  |
|                        |                                      |     |
|                        | ([Not needed to test for             |     |
|                        | conformance]{.underline})            |     |
+------------------------+--------------------------------------+-----+
| EUDR_COMMO             | The common name is mandatory if the  | V1, |
| DITIES_SPECIES_INFORMA | commodity contains Annex I wood      | V2  |
| TION_COMMON_NAME_EMPTY | (timber) products.                   |     |
+------------------------+--------------------------------------+-----+
| EUDR_COMMODITI         | The scientific name is mandatory if  | V1, |
| ES_SPECIES_INFORMATION | the commodity contains Annex I wood  | V2  |
| _SCIENTIFIC_NAME_EMPTY | (timber) products.                   |     |
+------------------------+--------------------------------------+-----+
| EUDR_A                 | Non-EU operators must select Import  | V1, |
| CTIVITY_TYPE_NOT_ALLOW | activity.                            | V2  |
| ED_FOR_NON_EU_OPERATOR |                                      |     |
+------------------------+--------------------------------------+-----+

Some features in the current version of the Central EUDR system are not
yet developed or can be updated. Such that additional error codes may be
added to the list in the future.

## Web Service Endpoint

Refer to the document "**EUDR - API for EO specifications**", chapter 4
**Documentation (Submission WS)** for the specific server URL of the
environment you're using. The operation to execute is
{EUDRSubmissionService_URL}**#submitDds.**

[^1]:
