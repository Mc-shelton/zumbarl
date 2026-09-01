import { normalizeRoomUrl } from './getCallMeetingUrl'

const scriptPromises = new Map()
const LOCAL_JITSI_HOST = /^(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/

function loadScript(src) {
  if (scriptPromises.has(src)) return scriptPromises.get(src)

  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-zumbarl-jitsi-src="${CSS.escape(src)}"]`)
    if (existing?.dataset.loaded === 'true') return resolve()
    // A script element that already emitted an error will not retry merely by
    // receiving new listeners. Replace it so a restored Jitsi service can be
    // reached without requiring a full browser restart.
    existing?.remove()

    const script = document.createElement('script')
    script.src = src
    script.async = false
    script.dataset.zumbarlJitsiSrc = src
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true'
      resolve()
    }, { once: true })
    script.addEventListener('error', () => {
      script.remove()
      scriptPromises.delete(src)
      reject(new Error('The audio-room service could not be loaded.'))
    }, { once: true })
    document.head.appendChild(script)
  })
  scriptPromises.set(src, promise)
  return promise
}

export async function loadJitsiMeetLibrary(roomUrl) {
  const normalizedUrl = new URL(normalizeRoomUrl(roomUrl))
  const origin = normalizedUrl.origin
  const useDevelopmentProxy = import.meta.env.DEV && LOCAL_JITSI_HOST.test(normalizedUrl.hostname)
  const assetBaseUrl = useDevelopmentProxy ? `${window.location.origin}/jitsi` : origin
  const roomName = decodeURIComponent(normalizedUrl.pathname.split('/').filter(Boolean).pop() || '')
  if (!roomName) throw new Error('This audio room does not have a valid room name.')

  await loadScript(`${assetBaseUrl}/config.js`)
  const jitsiConfig = window.config || {}
  const hosts = jitsiConfig.hosts ? { ...jitsiConfig.hosts } : undefined
  const configuredServiceUrl = useDevelopmentProxy
    ? (jitsiConfig.bosh || jitsiConfig.websocket)
    : (jitsiConfig.websocket || jitsiConfig.bosh)
  await loadScript(`${assetBaseUrl}/libs/lib-jitsi-meet.min.js`)

  const JitsiMeetJS = window.JitsiMeetJS
  if (!JitsiMeetJS) throw new Error('The secure audio-room client did not start.')

  if (!configuredServiceUrl) throw new Error('The audio-room service is missing its connection address.')
  const servicePath = useDevelopmentProxy && configuredServiceUrl.startsWith('/')
    ? `/jitsi${configuredServiceUrl}`
    : configuredServiceUrl
  const serviceUrl = new URL(servicePath, useDevelopmentProxy ? window.location.origin : origin).toString()

  return {
    JitsiMeetJS,
    roomName,
    connectionOptions: {
      hosts,
      serviceUrl,
      websocketKeepAliveUrl: jitsiConfig.websocketKeepAliveUrl,
      clientNode: 'http://jitsi.org/jitsimeet',
      enableAnalyticsLogging: false,
    },
  }
}
