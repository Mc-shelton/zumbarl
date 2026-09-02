import { useEffect, useState } from 'react'
import { HiOutlineAcademicCap, HiOutlineCheck, HiOutlineMagnifyingGlass } from 'react-icons/hi2'
import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'
import './CoursePicker.css'

const CATEGORIES = [['STEM', 'Science, technology, engineering or mathematics'], ['COMMERCE', 'Business or commerce'], ['ARTS', 'Arts or humanities'], ['OTHER', 'Other']]

function CoursePicker({ value = null, onChange, required = false }) {
  const [query, setQuery] = useState(value?.name || '')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchedQuery, setSearchedQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [category, setCategory] = useState('STEM')
  const [duration, setDuration] = useState(4)

  useEffect(() => {
    if (!isOpen || selected || isCreating) return undefined
    let active = true
    const normalized = query.trim()
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      sendZumbarlApiRequest(`/auth/courses?q=${encodeURIComponent(normalized)}`)
        .then((response) => { if (active) { setResults(response?.courses || []); setSearchedQuery(normalized) } })
        .catch(() => { if (active) { setResults([]); setSearchedQuery(normalized) } })
        .finally(() => { if (active) setIsLoading(false) })
    }, 180)
    return () => { active = false; window.clearTimeout(timer) }
  }, [isCreating, isOpen, query, selected])

  function selectCourse(course) { setSelected(course); setQuery(course.name); setResults([]); setIsOpen(false); onChange(course) }
  function changeQuery(nextQuery) { setQuery(nextQuery); setSelected(null); setIsCreating(false); setIsOpen(true); onChange(null) }
  function confirmNewCourse() { const course = { name: query.trim(), category, duration: Number(duration) }; setSelected(course); setIsCreating(false); setIsOpen(false); onChange(course) }
  const canCreate = query.trim().length >= 2 && searchedQuery === query.trim() && !isLoading && !results.length

  return <div className="course-picker">
    <label><span>Course</span><div className="course-picker-input"><HiOutlineAcademicCap /><input required={required} role="combobox" aria-autocomplete="list" aria-expanded={isOpen} value={query} onFocus={() => { if (!selected) setIsOpen(true) }} onChange={(event) => changeQuery(event.target.value)} placeholder="Search your course" />{selected ? <HiOutlineCheck className="is-selected" /> : <HiOutlineMagnifyingGlass />}</div></label>
    {isOpen ? <div className="course-picker-results" role="listbox">{isLoading ? <p>Searching courses…</p> : null}{results.map((course) => <button type="button" role="option" key={course.id} onClick={() => selectCourse(course)}><strong>{course.name}</strong><small>{course.category} · {course.duration} year{course.duration === 1 ? '' : 's'}</small></button>)}{canCreate ? <button type="button" className="course-picker-create" onClick={() => setIsCreating(true)}>Can’t find it? Create “{query.trim()}”</button> : null}</div> : null}
    {isCreating ? <div className="course-picker-new"><p>Create “{query.trim()}” only if it is not already listed.</p><label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{CATEGORIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>Course duration<select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>{Array.from({ length: 10 }, (_, index) => index + 1).map((years) => <option key={years} value={years}>{years} year{years === 1 ? '' : 's'}</option>)}</select></label><div><button type="button" onClick={() => setIsCreating(false)}>Back to search</button><button type="button" onClick={confirmNewCourse}>Use new course</button></div></div> : null}
  </div>
}

export default CoursePicker
