const { Prisma } = require('@prisma/client')

// Money is stored as DECIMAL(12,2). Arithmetic stays in Decimal; values are only
// converted to JS numbers at the API boundary, where 2dp precision is safe.
const decimal = value => new Prisma.Decimal(value ?? 0)
const toNumber = value => (value == null ? null : Number(value))
const sum = values => values.reduce((acc, value) => acc.plus(value ?? 0), decimal(0))

module.exports = { decimal, toNumber, sum }
