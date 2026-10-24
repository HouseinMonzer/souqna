// Make Express 4 forward async route errors to the error handler (like Express 5).
// Express 4's own handle_request discards the handler's return value, so it has
// to be replaced rather than wrapped, otherwise a rejected promise leaves the
// request hanging.
const Layer = require('express/lib/router/layer')

Layer.prototype.handle_request = function handleRequest(req, res, next) {
  const fn = this.handle
  if (fn.length > 3) return next()
  try {
    const result = fn(req, res, next)
    if (result && typeof result.then === 'function') result.catch(next)
  } catch (err) {
    next(err)
  }
}
