# Private Check-ins and Guided Next Steps

## SC-WB-01 — Save a private daily check-in

1. Sign in as the student and open `/campus/wellbeing`.
2. Select **Low**.
3. Open optional context and select **School**, **Peer pressure**, and **Health**.
4. Add a synthetic note and save.

Expected:

- the check-in appears as completed today;
- the selected context is readable on return;
- the activity does not create a Connect post, notification to peers, public profile item or score event;
- the note is not returned through another student's session.

## SC-WB-02 — Record substance-use context without stigma

1. Add another check-in with **Substance use** selected.
2. Inspect the resulting wording and suggested options.

Expected:

- the input is accepted by both frontend and API;
- wording uses recovery/support language rather than blame;
- the student can reach the Recovery Navigation pathway and human support;
- selecting this context does not automatically expose it to peers or employers.

## SC-WB-03 — Use the reset without uploading the brain dump

1. Start **I’m overwhelmed**.
2. Complete breathing and grounding.
3. Type unique synthetic text into the brain dump.
4. Close before finishing, reopen, and then complete a reset.

Expected:

- brain-dump text clears and does not appear in network requests or stored reset records;
- only completion metrics and the chosen next step are stored;
- the tool remains optional at every stage.

## SC-WB-04 — Pattern suggestions remain voluntary

1. Create several disposable check-ins over controlled timestamps.
2. Verify a relevant gentle suggestion appears.
3. Turn pattern insights off.

Expected:

- patterns use only the student's private check-ins;
- disabling insights removes the analysis without deleting history;
- no diagnosis or certainty claim is shown.
