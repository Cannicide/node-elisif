module.exports = {

    name: "Bot",
    intents: [],
    presences: {
        cycles: [],
        DEFAULT_CYCLE: "{name} | /help",
        DEFAULT_DURATION: 10,
        DEFAULT_TYPE: 'STREAMING',
        DEFAULT_URL: 'https://www.twitch.tv/cannicide'
    },
    port: process.env.PORT || 3000,
    authors: [],
    description: null,
    expansions: [],
    database: null,
    debug: {
        logs: false,
        uncaughtErrors: false,
        simulation: false
    }
}