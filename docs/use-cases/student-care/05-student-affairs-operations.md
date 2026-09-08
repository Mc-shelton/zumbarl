# Student Affairs Operations

## SC-OP-01 — Review the unified queue

1. Create a normal wellness request, high-urgency request, counselor booking and care-program enrollment.
2. Open `/admin/student-care`.

Expected:

- metrics count open requests, requested bookings, active pathways and requested follow-ups;
- high-urgency support requests appear before normal and low urgency;
- bookings and program enrollments have separate, appropriate actions.

## SC-OP-02 — Keep record types separate

1. Confirm a counselor booking.
2. Take a wellness case.
3. Activate a care pathway.

Expected:

- the booking receives a booking status, not a wellness status;
- the wellness case does not acquire appointment fields;
- care updates create timeline entries and synchronize the linked program request.

## SC-OP-03 — Request follow-up after a difficult check-in

1. As the student, submit **I need more support** with follow-up enabled.
2. Refresh operations.

Expected:

- the enrollment remains active;
- its linked support case reopens;
- the follow-up metric increases;
- the note is available only in the restricted care context.

## SC-OP-04 — Enforce authorization

1. As a business user, request `GET /api/v1/support/operations`.
2. Attempt every operations write route.

Expected:

- every request returns 403;
- no report, booking, enrollment or progress data is returned;
- no record changes.

## SC-OP-05 — Preserve an operational audit trail

1. Move an enrollment requested → active → paused → active → completed.
2. Inspect its progress timeline in the database or authorized API.

Expected:

- every change records actor, timestamp, old status, new status and visibility;
- records are not destructively overwritten;
- student-visible notes appear on the student plan while internal-only notes do not.
