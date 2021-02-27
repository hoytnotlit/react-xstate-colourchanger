import { MachineConfig, send, Action, assign } from "xstate";


function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}

function resolveYes(recResult: string): boolean {
    return recResult === 'yes' || (grammar[recResult] && grammar[recResult].affirmation == "yes")
}

function resolveNo(recResult: string): boolean {
    return recResult === 'no' || (grammar[recResult] && grammar[recResult].affirmation == "no")
}

function getDefaultActions(help_msg: string) {
    return [
        { target: '#root.dm.stop', cond: (context: SDSContext) => context.recResult === 'stop' },
        {
            cond: (context: SDSContext) => context.recResult === 'help',
            actions: getAction(help_msg),
            target: '#root.dm.help'
        }
    ]
}

function getAction(help_msg: string): any {
    return assign((context) => { return { help_msg: help_msg } });
}

const grammar: { [index: string]: { person?: string, day?: string, time?: string, affirmation?: string } } = {
    "Anna": { person: "Anna Appleseed" },
    "John": { person: "John Appleseed" },
    "Patricia": { person: "Patricia G" },
    "Mary": { person: "Mary" },
    "Mike": { person: "Michael" },
    "on Friday": { day: "Friday" },
    "tomorrow": { day: "tomorrow" },
    "Monday": { day: "Monday" },
    "at ten": { time: "10:00" },
    "at 10": { time: "10:00" },
    "eleven": { time: "11:00" },
    "at noon": { time: "12:00" },
    "at 3": { time: "15:00" },
    "of course": { affirmation: "yes" },
    "absolutely": { affirmation: "yes" },
    "no way": { affirmation: "no" },
    "not really": { affirmation: "no" }
}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'act',
    states: {
        act: {
            initial: 'init',
            states: {
                hist: { type: 'history', history: 'deep' },
                init: {
                    on: {
                        CLICK: 'welcome'
                    }
                },
                welcome: {
                    initial: "prompt",
                    on: { ENDSPEECH: "who" },
                    states: {
                        prompt: { entry: say("Let's create an appointment") }
                    }
                },
                who: {
                    initial: "prompt",
                    on: {
                        RECOGNISED: [{
                            cond: (context) => "person" in (grammar[context.recResult] || {}),
                            actions: assign((context) => { return { person: grammar[context.recResult].person } }),
                            target: "day"
                        },
                        ...getDefaultActions("Tell me the name of the person."),
                        { target: ".nomatch" }],
                        MAXSPEECH: [{
                            actions: assign((context) => { return { prompts: context.prompts ? context.prompts + 1 : 1 } }),
                            cond: (context) => !context.prompts || context.prompts < 3,
                            target: ".reprompt"
                        },
                        {
                            cond: (context) => context.prompts >= 3,
                            target: "init"
                        }
                        ]
                    },
                    states: {
                        prompt: {
                            entry: say("Who are you meeting with?"),
                            on: { ENDSPEECH: "ask" }
                        },
                        reprompt: {
                            entry: say("Wake up"),
                            on: { ENDSPEECH: "ask" }
                        },
                        ask: {
                            entry: [send('LISTEN'), send('MAXSPEECH', { delay: 3000 })]
                            // entry: listen()
                        },
                        nomatch: {
                            entry: say("Sorry I don't know them"),
                            on: { ENDSPEECH: "prompt" }
                        }
                    }
                },
                day: {
                    initial: "prompt",
                    on: {
                        RECOGNISED: [{
                            cond: (context) => "day" in (grammar[context.recResult] || {}),
                            actions: assign((context) => { return { day: grammar[context.recResult].day } }),
                            target: "duration"
                        },
                        ...getDefaultActions("Tell me the day of the meeting."),
                        { target: ".nomatch" }]
                    },
                    states: {
                        prompt: {
                            entry: send((context) => ({
                                type: "SPEAK",
                                value: `OK. ${context.person}. On which day is your meeting?`
                            })),
                            on: { ENDSPEECH: "ask" }
                        },
                        ask: {
                            entry: listen()
                        },
                        nomatch: {
                            entry: say("Sorry can you repeat the day please?"),
                            on: { ENDSPEECH: "ask" }
                        }
                    }
                },
                duration: {
                    initial: "prompt",
                    on: {
                        RECOGNISED: [
                            { target: 'confirmDay', cond: (context) => resolveYes(context.recResult) },
                            { target: 'time', cond: (context) => resolveNo(context.recResult) },
                            ...getDefaultActions("Tell me yes or no."),
                            { target: '.prompt' }
                        ]
                    },
                    states: {
                        prompt: {
                            entry: say("Will it take the whole day?"),
                            on: { ENDSPEECH: "ask" }
                        },
                        ask: {
                            entry: listen()
                        }
                    }
                },
                time: {
                    initial: "prompt",
                    on: {
                        RECOGNISED: [{
                            cond: (context) => "time" in (grammar[context.recResult] || {}),
                            actions: assign((context) => { return { time: grammar[context.recResult].time } }),
                            target: "confirmTime",
                        },
                        ...getDefaultActions("Tell me the time of your meeting."),
                        { target: ".nomatch" }]
                    },
                    states: {
                        prompt: {
                            entry: say("What time is your meeting?"),
                            on: { ENDSPEECH: "ask" }
                        },
                        ask: {
                            entry: listen()
                        },
                        nomatch: {
                            entry: say("Sorry I did not understand that"),
                            on: { ENDSPEECH: "prompt" }
                        }
                    }
                },
                confirmDay: {
                    initial: "prompt",
                    on: {
                        RECOGNISED: [
                            { target: 'final', cond: (context) => resolveYes(context.recResult) },
                            { target: 'welcome', cond: (context) => resolveNo(context.recResult) },
                            ...getDefaultActions("Tell me yes or no.")
                        ]
                    },
                    states: {
                        prompt: {
                            entry: send((context) => ({
                                type: "SPEAK",
                                value: `Do you want me to create an appointment with ${context.person} on ${context.day} for the whole day?`
                            })),
                            on: { ENDSPEECH: "ask" }
                        },
                        ask: {
                            entry: listen()
                        }
                    }
                },
                confirmTime: {
                    initial: "prompt",
                    on: {
                        RECOGNISED: [
                            { target: 'final', cond: (context) => resolveYes(context.recResult) },
                            { target: 'welcome', cond: (context) => resolveNo(context.recResult) },
                            ...getDefaultActions("Tell me yes or no."),
                            { target: '.nomatch' }
                        ]
                    },
                    states: {
                        prompt: {
                            entry: send((context) => ({
                                type: "SPEAK",
                                value: `Do you want me to create an appointment with ${context.person} on ${context.day} at ${context.time}?`
                            })),
                            on: { ENDSPEECH: "ask" }
                        },
                        ask: {
                            entry: listen()
                        },
                        nomatch: {
                            entry: say("Was that a yes or a no?"),
                            on: { ENDSPEECH: "ask" }
                        }
                    }
                },
                final: {
                    initial: "prompt",
                    on: { ENDSPEECH: "init" },
                    states: {
                        prompt: {
                            entry: say("Your appointment has been created!")
                        }
                    }
                },
            }
        },
        maxspeech: {
            entry: say("Sorry"),
            on: { 'ENDSPEECH': 'act.hist' }
        },
        stop: {
            entry: say("Ok"),
            always: 'act'
        },
        help: {
            entry: send((context) => ({
                type: "SPEAK",
                value: `${context.help_msg}`
            })),
            on: { ENDSPEECH: "act.hist" }
        }
    }
})
