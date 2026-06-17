import { BUSINESS_CREATE_TARGETING } from '../opportunityCreateData'
import {
  AgeRange,
  ChipPicker,
  CourseField,
  PlatformCard,
  SegmentGroup,
} from './BusinessOpportunityTargetingControls'

function toggleTargetingItem(items, item) {
  return items.includes(item)
    ? items.filter((current) => current !== item)
    : [...items, item]
}

export function BusinessOpportunityTargetingStep({ form, onUpdateField }) {
  return (
    <>
      <section className="business-create-target-card">
        <h3>Audience</h3>
        <p>Choose your student audience.</p>
        <div className="business-create-target-grid">
          <ChipPicker
            label="Location"
            name="targetLocations"
            options={BUSINESS_CREATE_TARGETING.locations}
            value={form.targetLocations}
            onUpdateField={onUpdateField}
          />
          <ChipPicker
            label="University / College"
            name="targetUniversities"
            options={BUSINESS_CREATE_TARGETING.universities}
            value={form.targetUniversities}
            onUpdateField={onUpdateField}
          />
          <CourseField form={form} onUpdateField={onUpdateField} />
          <SegmentGroup
            label="Year of Study"
            name="targetYear"
            options={BUSINESS_CREATE_TARGETING.years}
            value={form.targetYear}
            onUpdateField={onUpdateField}
          />
        </div>
      </section>

      <section className="business-create-target-card">
        <h3>Demographics</h3>
        <p>Refine your audience by demographics.</p>
        <div className="business-create-target-grid">
          <AgeRange form={form} onUpdateField={onUpdateField} />
          <SegmentGroup
            label="Gender"
            name="gender"
            options={BUSINESS_CREATE_TARGETING.genders}
            value={form.gender}
            onUpdateField={onUpdateField}
          />
          <ChipPicker
            label="Interests (Select up to 5)"
            name="targetInterests"
            options={BUSINESS_CREATE_TARGETING.interests}
            value={form.targetInterests}
            onUpdateField={onUpdateField}
          />
        </div>
      </section>

      <section className="business-create-target-card">
        <h3>Platforms</h3>
        <p>Select where this opportunity should be promoted.</p>
        <div className="business-create-platform-grid">
          {BUSINESS_CREATE_TARGETING.platforms.map((platform) => (
            <PlatformCard
              key={platform}
              isSelected={form.targetPlatforms.includes(platform)}
              platform={platform}
              onClick={() => onUpdateField(
                'targetPlatforms',
                toggleTargetingItem(form.targetPlatforms, platform),
              )}
            />
          ))}
        </div>
      </section>
    </>
  )
}
