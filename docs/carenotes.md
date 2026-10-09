This is a private care-coordination workflow between the student and authorized Student Care staff.

### What happens now

`Explore this path → set a goal and urgency → consent → request created → staff accepts it → private check-ins → completion`

1. **Explore this path**

   Opens the pathway details. The student enters:

   - What they want help with
   - How soon they want contact
   - Consent for a named, private follow-up

   This is private, but not anonymous: the named coordinator can see the student’s identity and goal. See [WellbeingPage.jsx](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl.com/src/pages/WellbeingPage.jsx:399).

2. **Request the pathway**

   The backend creates:

   - A program enrollment with status `requested`
   - A linked support case for the Student Care queue
   - The student’s goal, urgency and consent record

   That is why the first card currently says **Requested**. It is waiting for Student Affairs to accept it. See [studentCare.repository.ts](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/repositories/support/studentCare.repository.ts:36).

3. **Student Care receives it**

   Authorized support staff see the student, campus, pathway, stated goal and urgency in the restricted Student Care workspace. They can accept, pause or complete the plan and leave a student-visible update. See [StudentCareOperationsPage.jsx](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl.com/src/pages/StudentCareOperationsPage.jsx:71).

4. **The student checks in**

   After requesting, the button becomes **Private check-in**. The student can report:

   - I’m steady
   - I completed a step
   - I need more support
   - I had a setback
   - An optional private note
   - Whether they want human follow-up

   Selecting “completed a step” advances the progress bar. “Need support” or “setback” can reopen the staff case; setbacks are treated as higher urgency. See [studentCare.repository.ts](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/repositories/support/studentCare.repository.ts:65).

5. **Staff updates appear privately**

   Staff can change the pathway to `active`, `paused` or `completed`. A visible note is shown on the card and the student receives an in-app notification.

### What the screenshot means

- **Requested**: the request was submitted but has not been accepted yet.
- **Step 1 of 5**: no step has been completed yet.
- **Private check-in**: the student can send a progress update or request follow-up.
- **Never shown on your profile or score**: it does not enter the public profile, feed, portfolio or student scoring.
- **Coordinated by Zetech Student Affairs**: authorized support staff can see and manage it.

### Current limitations

The wording currently promises a more complete service than the interface provides:

- **“1 active plans” is inaccurate.** A merely requested pathway is counted as active, and the grammar is wrong.
- There is no visible “waiting for Student Affairs” explanation.
- Staff cannot assign a coordinator, schedule the next check-in or advance individual steps through the current interface, even though some of those fields exist in the backend.
- Sessions and attendance are not managed inside the pathway.
- Students cannot pause or withdraw directly.
- The student sees only the latest staff note, not a full private timeline.

So today this is primarily a **request, staff-status and self-check-in system**, rather than a complete care-plan management journey. The next useful improvement would be a clear lifecycle:

`Request sent → Coordinator assigned → Plan active → Current step and next action → Follow-up scheduled → Completed/paused`