<!-- This file declares an INFRA repository's passes by estate type and states no rule. -->
# Passes of an INFRA repository

Read by table header, never by position. The estate types are the four the push check owes tiers for: SUPPORT, MODULE, ORGANIZATION and PLATFORM, in the order the types name each other.

| Pass | World | Holds | Proof | After | Runs with | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| book | INFRA | book | read back | — | — | — |
| pins | INFRA | pins | the pins resolve | book | — | — |
| support | INFRA | SUPPORT | type-check of every node touched | pins | — | — |
| module | INFRA | MODULE | type-check of every node touched | support | — | — |
| organization | INFRA | ORGANIZATION | type-check of every node touched | module | — | — |
| platform | INFRA | PLATFORM | type-check of every node touched | organization | — | — |
| tests | INFRA | SUPPORT · MODULE · ORGANIZATION · PLATFORM | the types' cases are written, none run | platform | — | — |
| commit | INFRA | SUPPORT · MODULE · ORGANIZATION · PLATFORM | the commit by path | tests | — | — |
| validate-and-tiers | INFRA | SUPPORT · MODULE · ORGANIZATION · PLATFORM | `spnutils infra validate` and the test tiers, once | commit | — | — |
| release | INFRA | SUPPORT · MODULE · ORGANIZATION · PLATFORM | the release lands | validate-and-tiers | — | — |
| cloud apply | INFRA | cloud apply | never planned without approval | release | — | the developer's approval |
