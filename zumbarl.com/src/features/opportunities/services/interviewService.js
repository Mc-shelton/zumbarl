import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function readStudentInterview(interviewId) {
  return sendZumbarlApiRequest(`/earn/interviews/${interviewId}`)
}

function respondToStudentInterview(interviewId, response) {
  return sendZumbarlApiRequest(`/earn/interviews/${interviewId}/respond`, {
    method: 'POST',
    body: JSON.stringify(response),
  })
}

export {
  readStudentInterview,
  respondToStudentInterview,
}
