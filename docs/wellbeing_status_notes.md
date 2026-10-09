The wellbeing data is separated from the public side of Zumbarl, but it is not all handled the same way. “Private” currently means “not published or used for scoring,” not “nothing is stored.”
Interaction	What happens to the data	Who can access it
Hero feeling slider	Browser state only. Moving the slider does not save anything.	Nobody until the student explicitly saves a check-in.
Daily check-in	Mood, stressors, sleep and optional note are stored against the student account.	Returned only through that authenticated student’s wellbeing endpoint.
Pattern insights	Calculated from recent check-ins, primarily the last 14 days.	Student-facing. Turning insights off stops displaying/calculating the pattern but does not delete check-ins.
Reset exercise	Completion time, grounding count and chosen next step are stored.	Student account.
Reset brain dump	Remains in React/browser memory and is cleared when the modal closes. It is not uploaded.	Browser session only.
Talk It Out	Messages and generated responses are stored against the student account.	Student through the application; infrastructure/database operators technically retain access.
Human support request	Creates a support case. It may be named or stored without the student ID.	Authorized support staff—and currently some moderator roles.
Counselor request	Stores student ID, preferred time and optional reason.	Support staff.
Structured care	Stores identity, goal, consent, progress and support notes.	Student and support operations staff.
Support circles	Other members see the alias, but authorized safety staff can resolve it to the account.	Circle members by alias; safety staff by identity where required.


Daily check-ins
Saving a check-in writes the mood, stressors, sleep and optional note to WellbeingCheckIn, linked to the student. The dashboard only queries records belonging to the authenticated student. See [WellbeingPage.jsx (line 145)](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl.com/src/pages/WellbeingPage.jsx:145), [wellbeing.repository.ts (line 42)](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/repositories/support/wellbeing.repository.ts:42), and [schema.prisma (line 1176)](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/prisma/schema.prisma:1176).
The pattern engine uses the check-ins to detect direction, repeated stressors, difficult sleep and repeated overwhelmed entries, then suggests an appropriate next step. It does not diagnose anything. See [manageWellbeingService.ts (line 39)](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/services/support/manageWellbeingService.ts:39).
A low or overwhelmed daily check-in does not alert Student Affairs automatically.
Talk It Out
This needs a clearer disclosure in the UI.
For non-urgent messages, the current message, the student’s first name and up to 12 recent messages are sent to Anthropic to generate the response. See [anthropicAssistant.ts (line 115)](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/services/ai/anthropicAssistant.ts:115).
Messages are also stored in the Zumbarl database. See [wellbeing.repository.ts (line 108)](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/repositories/support/wellbeing.repository.ts:108).
Urgent phrases are classified on the server. An urgent message bypasses the AI provider and receives a fixed safety response, but nobody is automatically contacted. A named support case is created only after the student gives explicit handoff consent. See [manageWellbeingService.ts (line 120)](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/services/support/manageWellbeingService.ts:120) and [manageWellbeingService.ts (line 253)](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/services/support/manageWellbeingService.ts:253).
What does not happen
I found no connection from this wellbeing data to:
- Zumbarl Score
- opportunities or recommendations
- the public profile
- the portfolio
- the Connect feed
- employers or clients
That separation is good and should remain an architectural rule.
What is still incomplete
Before describing this as strongly protected wellbeing data, I would address these:
1. Correct the “only you” language.
   It should say: “Not shown publicly or shared with campus support unless you choose.” Database operators and the configured AI processor make “only you” too absolute.
2. Disclose AI processing before the first Talk It Out message.
   The current interface says only “stored privately” at [WellbeingPage.jsx (line 433)](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl.com/src/pages/WellbeingPage.jsx:433).
3. Narrow staff permissions.
   The general cases endpoint currently permits both support and moderator role groups to read wellness reports and counselor bookings. Content moderators should not automatically see these records. See [registerSupportRoutes.ts (line 19)](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/entrypoint/api/routes/support/registerSupportRoutes.ts:19).
4. Add a retention and deletion policy.
   There is currently no student endpoint for deleting a check-in, reset, conversation, or support history, and no automatic retention window.
5. Add sensitive-read auditing.
   Staff updates are recorded in the data, but reading a wellbeing case is not placed in the central audit log.
6. Add stronger storage protection.
   Sensitive notes and messages are ordinary database text fields. The application does not currently apply field-level encryption.
7. Default pattern insights off.
   Insights currently default to enabled. For sensitive profiling, explicit opt-in would be safer.
8. Strengthen anonymous support.
   Anonymous reports have no student ID in the record, which is good, but that is record-level anonymity—not a guarantee that infrastructure metadata can never be correlated.
So the foundation is sensible: self-reflection remains separate from public and commercial systems, and human sharing generally requires an explicit action. But it still needs a proper sensitive-data lifecycle and tighter access controls before the privacy promise is fully accurate.

| Interaction | What happens to the data | Who can access it |
|---|---|---|
| Hero feeling slider | Browser state only. Moving the slider does not save anything. | Nobody until the student explicitly saves a check-in. |
| Daily check-in | Mood, stressors, sleep and optional note are stored against the student account. | Returned only through that authenticated student’s wellbeing endpoint. |
| Pattern insights | Calculated from recent check-ins, primarily the last 14 days. | Student-facing. Turning insights off stops displaying/calculating the pattern but does not delete check-ins. |
| Reset exercise | Completion time, grounding count and chosen next step are stored. | Student account. |
| Reset brain dump | Remains in React/browser memory and is cleared when the modal closes. It is not uploaded. | Browser session only. |
| Talk It Out | Messages and generated responses are stored against the student account. | Student through the application; infrastructure/database operators technically retain access. |
| Human support request | Creates a support case. It may be named or stored without the student ID. | Authorized support staff—and currently some moderator roles. |
| Counselor request | Stores student ID, preferred time and optional reason. | Support staff. |
| Structured care | Stores identity, goal, consent, progress and support notes. | Student and support operations staff. |
| Support circles | Other members see the alias, but authorized safety staff can resolve it to the account. | Circle members by alias; safety staff by identity where required. |