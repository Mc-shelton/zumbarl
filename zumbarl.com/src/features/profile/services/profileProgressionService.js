import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function updateMyProgressionMode(mode) {
  return sendZumbarlApiRequest('/campus/profile/me/progression-mode', {
    method: 'PATCH',
    body: JSON.stringify({ mode }),
  })
}

export { updateMyProgressionMode }
