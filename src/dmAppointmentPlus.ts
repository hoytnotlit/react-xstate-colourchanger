import { MachineConfig, actions, Action, assign } from "xstate";
const { send, cancel } = actions;

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

function getDefaultRecogEvents(help_msg: string) {
    return [
        { target: '#root.dm.stop', cond: (context: SDSContext) => context.recResult === 'stop' },
        {
            cond: (context: SDSContext) => context.recResult === 'help',
            actions: getHelpAction(help_msg),
            target: '#root.dm.help'
        },
        { target: ".nomatch" }
    ]
}

function getDefaultMaxSpeechEvents() {
    return [
        {
            actions: getRepromptAction(),
            cond: (context: SDSContext) => !context.prompts || context.prompts < 3,
            target: ".reprompt"
        },
        {
            actions: getClearRepromptAction(),
            cond: (context: SDSContext) => context.prompts >= 3,
            target: "init"
        }
    ]
}

function getHelpAction(help_msg: string): any {
    return assign((context) => { return { help_msg: help_msg } });
}

function getRepromptAction(): any {
    return assign((context: SDSContext) => { return { prompts: context.prompts ? context.prompts + 1 : 1 } });
}

function getClearRepromptAction(): any {
    return assign((context: SDSContext) => { return { prompts: 0 } });
}

function getDefaultStates(prompt: Action<SDSContext, SDSEvent>, reprompt: string, nomatch: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: {
            prompt: {
                entry: prompt,
                on: { ENDSPEECH: "ask" }
            },
            reprompt: {
                entry: say(reprompt),
                on: { ENDSPEECH: "ask" }
            },
            ask: {
                entry: [send('LISTEN'), send('MAXSPEECH', { delay: 3000, id: 'maxsp' })]
            },
            nomatch: {
                entry: say(nomatch),
                on: { ENDSPEECH: "ask" }
            }
        }
    })
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

// TODO write proper reprompts
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
                    on: {
                        RECOGNISED: [{
                            cond: (context) => "person" in (grammar[context.recResult] || {}),
                            actions: assign((context) => { return { person: grammar[context.recResult].person } }),
                            target: "day"
                        },
                        ...getDefaultRecogEvents("Tell me the name of the person.")],
                        MAXSPEECH: [...getDefaultMaxSpeechEvents()]
                    },
                    ...getDefaultStates(say("Who are you meeting with?"), "Wake up", "Sorry I don't know them")
                },
                day: {
                    on: {
                        RECOGNISED: [{
                            cond: (context) => "day" in (grammar[context.recResult] || {}),
                            actions: assign((context) => { return { day: grammar[context.recResult].day } }),
                            target: "duration"
                        },
                        ...getDefaultRecogEvents("Tell me the day of the meeting.")],
                        MAXSPEECH: [...getDefaultMaxSpeechEvents()]
                    },
                    ...getDefaultStates(send((context) => ({
                        type: "SPEAK",
                        value: `OK. ${context.person}. On which day is your meeting?`
                    })),
                        "Halloo?", "Can you repeat the day please?")
                },
                duration: {
                    on: {
                        RECOGNISED: [
                            { target: 'confirmDay', cond: (context) => resolveYes(context.recResult) },
                            { target: 'time', cond: (context) => resolveNo(context.recResult) },
                            ...getDefaultRecogEvents("Tell me yes or no."),
                        ],
                        MAXSPEECH: [...getDefaultMaxSpeechEvents()]
                        // TODO why does the whole thing stop now when the maxsp event is missing??
                        // > because maxsp event is triggered the idle state (listen stops working)
                    },
                    ...getDefaultStates(say("Will it take the whole day?"), "Wake up", "Was that a yes or a no?")
                },
                time: {
                    on: {
                        RECOGNISED: [{
                            cond: (context) => "time" in (grammar[context.recResult] || {}),
                            actions: assign((context) => { return { time: grammar[context.recResult].time } }),
                            target: "confirmTime",
                        },
                        ...getDefaultRecogEvents("Tell me the time of your meeting.")]
                    },
                    ...getDefaultStates(say("What time is your meeting?"), "Wake up", "Sorry I did not understand that")
                },
                confirmDay: {
                    on: {
                        RECOGNISED: [
                            { target: 'final', cond: (context) => resolveYes(context.recResult) },
                            { target: 'welcome', cond: (context) => resolveNo(context.recResult) },
                            ...getDefaultRecogEvents("Tell me yes or no.")
                        ],
                        MAXSPEECH: [...getDefaultMaxSpeechEvents()]
                    },
                    ...getDefaultStates(send((context) => ({
                        type: "SPEAK",
                        value: `Do you want me to create an appointment with ${context.person} on ${context.day} for the whole day?`
                    })),
                        "Halloo?", "Was that a yes or a no?")
                },
                confirmTime: {
                    on: {
                        RECOGNISED: [
                            { target: 'final', cond: (context) => resolveYes(context.recResult) },
                            { target: 'welcome', cond: (context) => resolveNo(context.recResult) },
                            ...getDefaultRecogEvents("Tell me yes or no.")
                        ],
                        MAXSPEECH: [...getDefaultMaxSpeechEvents()]
                    },
                    ...getDefaultStates(send((context) => ({
                        type: "SPEAK",
                        value: `Do you want me to create an appointment with ${context.person} on ${context.day} at ${context.time}?`
                    })),
                        "Halloo?", "Was that a yes or a no?")
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
