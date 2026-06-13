# Ubiquitous Language

## Core domain

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Catchment area** (*spádová oblast*) | A set of **address points** assigned to one **school**, such that anyone living at one of those addresses has a legal right to a place in that school's first grade. Represented in geodata as an **Area**. | school zone, area (when ambiguous with "Area" type) |
| **Ordinance** (*vyhláška*) | The binding legal document, published by a **founder**, that defines the **catchment areas** of its **schools**. Stored as the `Ordinance` entity with the original text used for processing. | regulation, decree |
| **Ordinance metadata** | A row mirroring an entry from the public registry (*sbírka právních předpisů*), used to detect new or updated **ordinances** available for import. Distinct from `Ordinance` itself — it may exist before any `Ordinance` is created. | ordinance (don't conflate with the `Ordinance` entity) |
| **Street-markdown** | The intermediate, human-readable text format with a defined grammar (parsed via chevrotain) that encodes **catchment area** boundaries — streets, address-number ranges, and **municipality parts** — and is transformed into geodata. | smd (ok as a code abbreviation, not in domain discussion) |
| **Street-markdown record** | A stored, versioned instance of **street-markdown** text (the `StreetMarkdown` entity), linked to a **user**, **ordinance**, and **founder**, with a lifecycle **state**. | draft, smd entity |
| **Map data** | Precomputed geodata (`json_data` as `Municipality[]`, plus `polygons`) generated from an **ordinance**'s **street-markdown**, cached for fast rendering on the public map. | geodata cache |

## Geography & administration

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Region** (*kraj*) | The top-level administrative division of the Czech Republic; a **city** belongs to exactly one **region**. | — |
| **City** (*obec/město*) | The basic Czech administrative unit (identified by its `code`), belonging to a **region**. Tracks aggregate counts and per-**school-type** **catchment status**. | municipality (reserve for the text-to-map `Municipality` type), town |
| **City district** (*městská část*) | A self-governing district of a larger **city** (e.g. one of Prague's districts). May itself act as a **founder**. | borough |
| **Municipality** | The text-to-map library's representation of a **city** or **city district** as a geodata unit, holding its **areas** (catchment areas) and `municipalityType` (`"city"` \| `"district"`). | city (when discussing the library/geodata layer specifically) |
| **Municipality part** (*část obce* / cadastral area) | A named sub-area of a **city**, used in **street-markdown** to scope rules where street names alone are insufficient (typically villages absorbed into a larger city). | district (don't conflate with **City district**) |
| **Street** | A named street belonging to a **city**, identified by its official `code`. | — |
| **Address point** | A single geocoded address (a house/orientation number on a **street**, or within a **municipality part**) — the smallest unit assignable to a **catchment area**. | address |

## Schools & founders

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **School** | A kindergarten or elementary school, identified by its `izo`/`redizo` registry codes, with a `capacity` and a **school type**. | — |
| **School type** | Distinguishes **Kindergarten** (*mateřská škola*, MŠ) from **Elementary** (*základní škola*, ZŠ) schools; many entities (ordinances, statuses, routes) are scoped per school type. | — |
| **Founder** (*zřizovatel*) | The legal entity — a **city** or a **city district** (`FounderType.City` \| `FounderType.District`) — responsible for establishing and operating one or more **schools**, and for publishing the **ordinance** defining their **catchment areas**. | establisher, operator |
| **School founder** | A join record linking a **school** to its **founder**. | — |

## Workflow & lifecycle states

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Catchment status** (`CityStatus`) | Per-**city**, per-**school-type** progress of catchment-area definition: `NoOrdinance`, `NoExistingOrdinance` (city confirmed it has none), `InProgress`, or `Published`. Stored as `statusElementary`/`statusKindergarten` on `City`. | status (when ambiguous with street-markdown state) |
| **Street-markdown state** (`StreetMarkdownState`) | The lifecycle of one **street-markdown record**: `Initial`, `AutoSave`, `Draft`, `Active`, or `Superseded`. | status (when ambiguous with catchment status) |

## People & roles

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **User** | An authentication identity (Microsoft/Azure AD login), with a **role**. | — |
| **Role** | One of `User` (shown to UI as "Expert"), `Editor` (can edit all data), or `Admin` (also manages users). Roles are cumulative — `Editor` includes `User`, `Admin` includes both. | expert (UI label only; use **Role: User** in domain discussion) |

## Relationships

- A **Region** has many **Cities**.
- A **City** has zero or one **City district** children, and either may be a **Founder**.
- A **Founder** has many **Schools** (via **School founder** records) and publishes **Ordinances** for them.
- An **Ordinance** is transcribed into one or more **Street-markdown records** (one active at a time, plus drafts/auto-saves/superseded history).
- A **Street-markdown record**'s text, once active, is parsed into a **Municipality** containing one or more **Areas** (= **Catchment areas**), each linking **Schools** to **Address points**.
- **Map data** is the rendered/cached output of that parse, tied back to its **Ordinance** and **City**.
- **Ordinance metadata** exists independently to track what's available in the public registry, prior to/separate from an **Ordinance** being created.

## Example dialogue

> **Dev:** "When an editor finishes editing the **street-markdown** for an **ordinance**, does that immediately update the public map?"
>
> **Domain expert:** "No. Saving creates a new **street-markdown record** in `Draft` state. Only when it's marked `Active` does it get parsed into a **Municipality** with its **areas**, and the **map data** gets regenerated from that."
>
> **Dev:** "And the previous active one?"
>
> **Domain expert:** "Moves to `Superseded`. We keep the history per **founder** and **ordinance**."
>
> **Dev:** "What if a **city** has no schools of its own — like a small village that's actually part of a bigger city's catchment areas?"
>
> **Domain expert:** "Then it shows up as a **municipality part** inside the bigger city's **street-markdown**, not as its own **city** with a **founder**. Only cities with 2+ schools (or city districts) are tracked as **founders**."
>
> **Dev:** "So 'status' on a city — is that the same as the street-markdown state?"
>
> **Domain expert:** "Different things. **Catchment status** (`Published`, `InProgress`, etc.) is about the city's overall progress, per school type. **Street-markdown state** is about one document's lifecycle. A city can be `Published` while its latest street-markdown record is `Active` and an editor is working on a new `Draft` for next year."

## Flagged ambiguities

- **"Municipality" vs "City"**: the app's database entity is `City` (Czech *obec*), while the text-to-map library uses `Municipality` for the same real-world concept (plus `CityDistrict` as `municipalityType: "district"`). When discussing the app/DB layer, say **City** / **City district**; when discussing parsed geodata, **Municipality** is the library's term for either.
- **"Area" vs "Catchment area"**: the README and UI use **catchment area** (*spádová oblast*) as the domain term; the text-to-map library's `Area` interface is its in-code representation of exactly that concept. Prefer **catchment area** in domain conversation, reserve **Area** for code/type discussion.
- **"Ordinance" vs "Ordinance metadata"**: these are two distinct entities. `Ordinance` is the canonical, processed record used for **street-markdown**. `OrdinanceMetadata` mirrors the public registry and may exist for ordinances not yet imported. Don't use "ordinance" loosely to mean either.
- **"Municipality part" vs "City district"**: both are sub-divisions of a city but at different levels — a **City district** (*městská část*) is a self-governing entity that can be a **Founder** in its own right; a **Municipality part** (*část obce*) is just a named area used for address scoping in **street-markdown** and has no governance role.
- **"Status" is overloaded**: `CityStatus` (catchment-area publishing progress) vs `StreetMarkdownState` (document lifecycle) vs `OrdinanceMetadata` flags (`isValid`, `isNewOrdinance`, `isRejected`, describing the registry entry itself). Always qualify which "status" is meant.
- **"Expert" vs `Role.User`**: the UI label for the base role is "Expert", but the code/enum name is `User`. In domain discussion about permissions, say **Role: User** (or "base role") rather than "expert user" to avoid confusion with the generic word "user".
