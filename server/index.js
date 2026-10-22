const { app, env } = require('./app')

app.listen(env.PORT, () => {
  console.log(`Souqna API listening on port ${env.PORT}`)
})
