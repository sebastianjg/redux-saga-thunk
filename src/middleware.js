import { PENDING, SUCCESS, FAILURE } from './selectors'

const createAction = ({ action, name, key, status, done = action.meta.async.done }) => ({
  ...action,
  meta: {
    ...action.meta,
    async: {
      key,
      ...typeof action.meta.async === 'object' ? action.meta.async : {},
      name,
      status,
      done,
    },
  },
})

const middleware = () => next => (action) => {
  const { type, meta, error, success } = action
  if (meta && meta.async) {
    const name = typeof meta.async === 'string' ? meta.async : meta.async.name

    if (!name) {
      throw new Error(`[redux-saga-async-action] ${type} was dispatched with meta.async, but no name was provided.`)
    }

    if (!meta.async.key && !success && !meta.success) {
      const key = Math.random().toFixed(16).substring(2)
      const status = PENDING

      if (typeof meta.async.done !== 'function') {
        return new Promise((resolve, reject) => {
          // istanbul ignore next
          const done = (err, response) => (err ? reject(err) : resolve(response))
          next(createAction({ action, name, key, status, done }))
        })
      }
      return next(createAction({ action, name, key, status }))
    } else if (error || meta.error || meta.failure) {
      return next(createAction({ action, name, status: FAILURE }))
    }
    return next(createAction({ action, name, status: SUCCESS }))
  }
  return next(action)
}

export default middleware
