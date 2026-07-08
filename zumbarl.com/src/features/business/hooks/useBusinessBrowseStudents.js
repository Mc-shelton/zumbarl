import { useMemo, useState } from 'react'

const CATEGORY_TAG_KEYWORDS = {
  design: ['ui/ux', 'figma', 'design', 'prototyping'],
  development: ['react', 'web', 'development', 'javascript', 'frontend'],
  marketing: ['social media', 'instagram', 'tiktok', 'marketing', 'brand', 'analytics', 'activation', 'events'],
  writing: ['copywriting', 'content', 'reporting', 'education', 'brand voice', 'proof'],
  video: ['video editing', 'video', 'youtube', 'shorts', 'tiktok'],
}

const QUICK_FILTER_MATCHERS = {
  'Worked with us': (student) => ['Worked with you', 'Repeat'].includes(student.status),
  'Available this week': (student) => /available|this week/i.test(student.availability || ''),
  'Social media': (student) => matchesCategoryKeywords(student, CATEGORY_TAG_KEYWORDS.marketing),
  'UI/UX': (student) => matchesCategoryKeywords(student, CATEGORY_TAG_KEYWORDS.design),
  'Video editing': (student) => matchesCategoryKeywords(student, CATEGORY_TAG_KEYWORDS.video),
  'High score': (student) => Number(student.score) >= 75,
}

export const BROWSE_QUICK_FILTERS = Object.keys(QUICK_FILTER_MATCHERS)

export const BROWSE_AVAILABILITY_FILTERS = ['Available now', 'Available soon', 'Open to interviews']

export const BROWSE_RELATIONSHIP_FILTERS = ['Worked with you', 'Repeat clients', 'Has promoted services']

function getStudentText(student) {
  return [
    student.name,
    student.handle,
    student.headline,
    student.bio,
    student.location,
    (student.tags || []).join(' '),
    (student.services || []).join(' '),
  ].join(' ').toLowerCase()
}

function matchesCategoryKeywords(student, keywords) {
  const text = getStudentText(student)
  return keywords.some((keyword) => text.includes(keyword))
}

function matchesAvailabilityFilter(student, filter) {
  const availability = String(student.availability || '').toLowerCase()

  if (filter === 'Available now') return availability.includes('available') && !availability.includes('soon') && !availability.includes('in ')
  if (filter === 'Available soon') return availability.includes('soon') || availability.includes('in ')
  if (filter === 'Open to interviews') return availability.includes('interview')
  return true
}

function matchesRelationshipFilter(student, filter) {
  if (filter === 'Worked with you') return student.status === 'Worked with you'
  if (filter === 'Repeat clients') return student.status === 'Repeat'
  if (filter === 'Has promoted services') return (student.services || []).length > 0
  return true
}

export function useBusinessBrowseStudents(studentGroups) {
  const [query, setQuery] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState('all')
  const [activeQuickFilters, setActiveQuickFilters] = useState([])
  const [availabilityFilters, setAvailabilityFilters] = useState([])
  const [relationshipFilters, setRelationshipFilters] = useState([])
  const [sortBy, setSortBy] = useState('recommended')

  const allStudents = useMemo(() => (
    studentGroups.flatMap((group) => group.students)
  ), [studentGroups])

  const matchesAllFilters = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return (student) => {
      if (normalizedQuery && !getStudentText(student).includes(normalizedQuery)) return false
      if (activeCategoryId !== 'all' && !matchesCategoryKeywords(student, CATEGORY_TAG_KEYWORDS[activeCategoryId] || [])) return false
      if (activeQuickFilters.some((filter) => !QUICK_FILTER_MATCHERS[filter]?.(student))) return false
      if (availabilityFilters.length && !availabilityFilters.some((filter) => matchesAvailabilityFilter(student, filter))) return false
      if (relationshipFilters.length && !relationshipFilters.some((filter) => matchesRelationshipFilter(student, filter))) return false
      return true
    }
  }, [activeCategoryId, activeQuickFilters, availabilityFilters, relationshipFilters, query])

  const visibleGroups = useMemo(() => {
    const groups = studentGroups
      .map((group) => ({
        ...group,
        students: sortBy === 'score'
          ? [...group.students.filter(matchesAllFilters)].sort((a, b) => Number(b.score) - Number(a.score))
          : group.students.filter(matchesAllFilters),
      }))
      .filter((group) => group.students.length > 0)

    if (sortBy === 'relationship') {
      return [...groups].sort((a, b) => (a.id === 'worked-before' ? -1 : b.id === 'worked-before' ? 1 : 0))
    }

    return groups
  }, [matchesAllFilters, sortBy, studentGroups])

  const categoryCounts = useMemo(() => (
    Object.keys(CATEGORY_TAG_KEYWORDS).reduce((counts, categoryId) => ({
      ...counts,
      [categoryId]: allStudents.filter((student) => matchesCategoryKeywords(student, CATEGORY_TAG_KEYWORDS[categoryId])).length,
      all: allStudents.length,
    }), { all: allStudents.length })
  ), [allStudents])

  const summary = useMemo(() => {
    const matchedStudents = allStudents.filter(matchesAllFilters)

    return {
      availableThisWeek: matchedStudents.filter((student) => /available|this week/i.test(student.availability || '')).length,
      matchedStudents: matchedStudents.length,
      promotedServices: matchedStudents.reduce((total, student) => total + (student.services || []).length, 0),
      workedWithYou: matchedStudents.filter((student) => ['Worked with you', 'Repeat'].includes(student.status)).length,
    }
  }, [allStudents, matchesAllFilters])

  function toggleListFilter(setter) {
    return (value) => setter((current) => (
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    ))
  }

  function clearFilters() {
    setQuery('')
    setActiveCategoryId('all')
    setActiveQuickFilters([])
    setAvailabilityFilters([])
    setRelationshipFilters([])
    setSortBy('recommended')
  }

  return {
    activeCategoryId,
    activeQuickFilters,
    availabilityFilters,
    categoryCounts,
    onCategoryChange: setActiveCategoryId,
    onClearFilters: clearFilters,
    onQueryChange: setQuery,
    onToggleAvailability: toggleListFilter(setAvailabilityFilters),
    onToggleQuickFilter: toggleListFilter(setActiveQuickFilters),
    onToggleRelationship: toggleListFilter(setRelationshipFilters),
    onSortChange: setSortBy,
    query,
    relationshipFilters,
    sortBy,
    summary,
    visibleGroups,
  }
}
