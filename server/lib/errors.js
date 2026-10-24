// An error whose message is safe to show to the client.
class HttpError extends Error {
  constructor(status, message, extra) {
    super(message)
    this.status = status
    this.extra = extra
  }
}

const notFound = (message = 'Not found') => new HttpError(404, message)
const forbidden = (message = 'Forbidden') => new HttpError(403, message)
const conflict = message => new HttpError(409, message)
const badRequest = message => new HttpError(400, message)

module.exports = { HttpError, notFound, forbidden, conflict, badRequest }
