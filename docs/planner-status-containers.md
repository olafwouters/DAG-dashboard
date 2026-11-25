# Afspraken: Planner en Status-containers

Status: ontwerpcontract; nog geen implementatie.
Basis: main op commit 229c26e2b272d5c2778d1911b818b184981b822c.
Ontwikkelbranch: feature/planner-status-containers.

## Een gedeelde activiteitregistratie

Activiteiten blijven de bestaande Planner-records in `state.cells[opleidingId][bucketId]`. Het opleiding/team-ID en het bucket-ID bepalen de identiteit. Er komen geen onafhankelijke kopieen van activiteiten of activiteitstatussen.

Status groepeert die activiteiten in containers per opleiding/team en kolom. Dezelfde opleiding kan daardoor in meerdere kolommen een container hebben. De kolom wordt uitsluitend afgeleid van de Planner-status en de follow-upmarkering van de activiteit, niet van een aparte trajectfase.

## Kolomvertaling

| Planner-status | Follow-up van de activiteit | Kolom in Status |
| --- | --- | --- |
| 0 - Nog niet gestart | Niet van toepassing | Hulpvraag |
| 1 - Gepland | Niet van toepassing | Afstemming |
| 2 - Bezig | Niet van toepassing | Uitvoering |
| 3 - Afgerond | Open of markering ontbreekt | Follow-up |
| 3 - Afgerond | Expliciet klaar | Afgesloten |
| 4 - Niet van toepassing | Niet van toepassing | Standaard verborgen; afzonderlijk zichtbaar via een filter |

Een ontbrekend activiteitrecord wordt niet automatisch aangemaakt. Een bestaande afgeronde activiteit zonder follow-upmarkering gaat standaard naar Follow-up. De technische opslagvorm van de nieuwe follow-upmarkering wordt in de implementatiestap vastgesteld.

## Trajectgegevens blijven behouden

Hulpvraag, trajecteigenaar, volgende actie, wachtstatus en overige trajectvelden blijven bij de opleiding/het team. Bestaande trajectvelden en de formele afsluituitkomst blijven behouden. Een oude trajectfase bepaalt niet langer de kolom van de activiteiten.

Een activiteit in Afgesloten betekent uitsluitend dat die activiteit is afgerond en haar follow-up expliciet klaar is. Dit sluit nooit automatisch het hele traject af. De formele trajectafsluiting blijft een afzonderlijke bewuste handeling, met de uitkomsten Traject uitgevoerd of Niet doorgezet.

## Afbakening van deze stap

Deze commit bevat uitsluitend dit afsprakenbestand. Er veranderen geen interface, programmacode, configuratie, workflow, database of bestaande gegevens. Implementatie en tests volgen in afzonderlijke kleine stappen op de ontwikkelbranch; publicatie naar main volgt pas na de uiteindelijke controle en vereiste bevestiging.
