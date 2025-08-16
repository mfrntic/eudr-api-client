EUDR API specifications for Operators

Conformance Test 1

***Version 1.4 -- dated 22^nd^ July 2025***

**Technical & Policy contacts:**

Refer to the latest version of document "**EUDR - API for EO
specifications**".

**Release Note:**

  -----------------------------------------------------------------------
  Version        Description
  -------------- --------------------------------------------------------
  V1.2           Updated list of contacts

  V1.3           Updated list of contacts

  V1.4           Alignment of version number
  -----------------------------------------------------------------------

# Contents

[1 Contents [2](#_Toc204070156)](#_Toc204070156)

[2 Target audience [3](#target-audience)](#target-audience)

[3 Introduction [3](#introduction)](#introduction)

[4 Documentation [4](#documentation)](#documentation)

[5 Prerequisites [4](#prerequisites)](#prerequisites)

[6 Objectives [5](#objectives)](#objectives)

[7 Tasks [6](#tasks)](#tasks)

[7.1 Declaration of contact points in participating teams
[6](#declaration-of-contact-points-in-participating-teams)](#declaration-of-contact-points-in-participating-teams)

[7.2 Acquiring Credentials for a Web Service User
[6](#acquiring-credentials-for-a-web-service-user)](#acquiring-credentials-for-a-web-service-user)

[7.3 Test connection to a basic Web Service of the EUDR system.
[8](#test-connection-to-a-basic-web-service-of-the-eudr-system.)](#test-connection-to-a-basic-web-service-of-the-eudr-system.)

[7.4 Connection for more than one Economic Operator.
[9](#connection-for-more-than-one-economic-operator.)](#connection-for-more-than-one-economic-operator.)

[8 Annex [10](#annex)](#annex)

[8.1 Manual creation of an Operator and a User
[10](#manual-creation-of-an-operator-and-a-user)](#manual-creation-of-an-operator-and-a-user)

[8.2 EudrEchoService request example
[10](#eudrechoservice-request-example)](#eudrechoservice-request-example)

[8.3 EudrEchoService response example
[10](#eudrechoservice-response-example)](#eudrechoservice-response-example)

[8.4 Header and pre-Script example
[10](#header-and-pre-script-example)](#header-and-pre-script-example)

[8.5 Java Script example
[10](#java-script-example)](#java-script-example)

[8.6 Python example [11](#python-example)](#python-example)

# Target audience

This document is intended for Economic Operators, involved in the EU
deforestation Regulation, having an IT system which manages
electronically their DDS (Due Diligence Statement) and willing to
develop the interconnection with the central EUDR system to submit the
DDS in an automated manner. It is also intended for public institutions
or private companies willing to develop software to service Economic
Operators' needs in submitting DDS to the central EUDR system.

Organizations which shall take part in that development are called
"Participants" in the document.

Participants are required to read first the document "EUDR -- API for EO
Specifications".

# Introduction

*\
*Systems willing to interconnect with the central EUDR system will need
to pass a set of Conformance (CF) tests onto an EU hosted testing
environment to be allowed to connect later to the EUDR Production
environment once it is ready.

A minimum of 4 Conformance tests are required:

-   Capability of performing a basic connection with authentication,

-   Capability of submitting of a DDS,

-   Capability of retrieving the reference number of a previously
    submitted DDS,

-   Capability of managing errors occurring when submitting DDS.

Additional Conformance tests are also available:

-   Capability of amending a previously submitted DDS,

-   Capability of retracting a previously submitted DDS,

-   Capability of retrieving available DDS data from other Operators by
    providing the reference and verification numbers

Please refer to the document "**EUDR -- API for EO Specifications**" for
the URL of the testing environment available for your test campaigns.

# Documentation

The SOAP web services are described through WSDL files and a schema for
each message. Refer to the document "**EUDR -- API for EO
Specifications**" for the definition of the services contract and the
structure of the data to be exchanged.

The scope of this first CF test covers:

-   Communication between the development teams

-   Establishing an authenticated connection between systems

# Prerequisites

This section describes the necessary expertise which shall enable the
execution of this CF test. This can concern the understanding of
technical documentation and/or one or several previous tests
successfully completed.

Technological expertise: Very good understanding and capability to
develop SOAP web service calls.

Previous successful CF test: none.

# Objectives

This section describes the goals expected to be achieved at the end of
the CF test.

Primary objectives:

-   Determine and send the points of contact within the participant
    (tester names and emails),

-   Acquire access to the Web Service in TRACES NT,

-   Call a basic "Echo" Web Service to test that connection and
    authentication work.

Secondary objectives:

-   Be able to reuse the expertise acquired during this CF test in the
    Production environment,

-   Understand how a software could connect to the central EUDR system
    and act on behalf of several Economic Operators.

At the completion of the CF test, it is expected that the participants
will have acquired the skills for the authentication process, management
of the response to web services calls and reuse that for dealing with
later tests. This operation is provided only in testing environments and
is not intended to be used to check validity of credentials.

# Tasks

This section lists each unit of work to be performed during the CF test.
The description of each task includes:

-   A description of the activity to be performed for the CF test,

-   The nature of any dependencies between tasks

## Declaration of contact points in participating teams

Send an email to the EC technical contact points, listed in the document
**EUDR -- API for EO Specifications**, with the members of the
participating team of this test (and potentially for later tests).
Please provide their name, email, and role in the scope of the test.

## Acquiring Credentials for a Web Service User

-   Creation of an operator and a user in TRACES NT:

> The participant needs to manually create the "Operator" in TRACES NT
> (in the assigned testing environment) corresponding to the company
> involved in the CF test. Participants acting on behalf of other
> Operators should create at least 2 "operators".
>
> For every Operator, at least one user must also be created. That first
> user will be the reference (administrator) user which will be recorded
> as the "responsible person" in the. It cannot be an anonymous or
> fictional account.
>
> Instructions on how to create Operators and Users in TRACES NT (in the
> assigned testing environment) and get them validated are provided in
> Annex 8.1

**Please note that Web Service test users cannot belong to more than one
Operator company.**

-   Request and get authorization for one Web Service user:

Once the Operator is created and validated, proceed to acquire a "web
service user" and an authentication key:

1.  Get the **username** of the EU Login account.

To locate the **username,** follow the next steps:

-   Go to TRACES NT (the assigned testing environment) and log in (if
    necessary),

-   Click in the top-right corner of the screen,

-   In the Popup, click on "Edit Profile":

> ![](media/image1.png){width="5.8590277777777775in"
> height="1.5888888888888888in"}

-   In the right box "Personal Information" there is an attribute
    "username". This value can now be used within your system for later
    tasks.

> ![](media/image2.png){width="5.826388888888889in"
> height="2.7650404636920385in"}

2.  Get the "Authentication key" for the Participant's system:

-   Go back to the page "Edit your profile" (login if necessary, as in
    the previous step),

-   Scroll to the section "Web Services Access",

![](media/image3.png){width="5.743055555555555in"
height="1.4652777777777777in"}

-   If the previous steps have been completed successfully, the button
    "Active" should appear in this Section. Click on this Button. The
    section will contain a new field labeled "Authentication Key". Click
    the "eye" next to the field to see the value. This value can now be
    used within the procedure described in later tasks,

> ![](media/image4.png){width="2.5277777777777777in"
> height="2.763643919510061in"}

-   Note that the Authentication Key is Private and should only be used
    with your application. The person identified by the EU Login user
    that was created in the first step is responsible for the data that
    shall be submitted into Traces NT (this is of importance when the
    systems will exchange production data, not in the present situation
    with test data in Cloud Acceptance).

## Test connection to a basic Web Service of the EUDR system.

For this initial CF test, one basic "echo" type connection will be
executed. That test functionality does not exist in the production
environment.

Necessary info for the development of the connection:

1.  Endpoint:

Refer to the document "EUDR Application Programming Interface (API) for
Operators - Specifications", chapter 4 **Documentation (Echo WS)** for
the specific server URL of the environment you're using. The operation
to execute is {EUDREchoService_URL}**\# testEcho**

2.  Security:

-   TRACES NT has a policy that enforces confidentiality, non-Replay and
    username + digest password credentials, which is described in the
    Wssp1.2-2007-Https-UsernameToken-Digest.xml file (read
    [this](http://docs.oasis-open.org/wss/v1.1/wss-v1.1-spec-os-UsernameTokenProfile.pdf)
    for more details).

-   The security header is formed as follows:

    -   UserNameToken

        -   Username -- See previous sections.

        -   Nonce -- Random base64 number -- 16 bytes

        -   Created -- Creation date of the message.

        -   Password -- Is a digested value that is formed by the
            following:

            -   Base64 ( SHA-1 ( nonce + created + "Authentication Key"
                ) )

        -   Timestamp

            -   Created -- Creation date of the message.

-   Expires (Date) -- Based on creation date, for how long this message
    is valid. It can't be more than 1 minute.

-   WebServiceClientId.

    -   The following tag must be added in the header

        -   \<v4:WebServiceClientId\>eudr-test\</v4:WebServiceClientId\>

    -   Examples of Headers containing this tag can be found in 7.2 and
        7.3.

## Connection for more than one Economic Operator.

If the system of a participant intends to connect to the central EUDR
system on behalf of many Economic Operators, it will need to get one Web
Service user for each company it is acting on behalf. To do so, step 7.2
needs to be repeated for each company. The system will use the
appropriate credentials to identify the company when connecting to the
central system (to be used in later tests).

# Annex

Note that the attached instructions or examples may be based on a
specific environment (normally Acceptance Cloud). Participants should
adapt the request based on the environment they actually need to use
(see also document "EUDR -- API for EO Specifications").

## Manual creation of an Operator and a User

![](media/image5.emf)

## EudrEchoService request example

![](media/image6.emf)

## EudrEchoService response example

![](media/image7.emf)

## Header and pre-Script example

![](media/image8.emf)![](media/image9.emf)

## Java Script example

![](media/image10.emf)

## Python example

![](media/image11.emf)
