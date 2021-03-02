import { MachineConfig, actions, Action, assign } from "xstate";
const { send, cancel } = actions;
// SRGS parser and example (logs the results to console on page load)
import { loadGrammar } from './runparser'
import { parse } from './chartparser'
import { grammar as grmr } from './grammars/appointmentGrammar'

const gram = loadGrammar(grmr)

function getGrammarResult(recResult: string) {
    let res = parse(recResult.split(/\s+/), gram);
    return res.resultsForRule(gram.$root)[0];
}

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}

function resolveYes(recResult: string): boolean {
    return recResult === 'yes' || (yesNoGrammar[recResult] && yesNoGrammar[recResult].affirmation == "yes")
}

function resolveNo(recResult: string): boolean {
    return recResult === 'no' || (yesNoGrammar[recResult] && yesNoGrammar[recResult].affirmation == "no")
}

function getDefaultRecogEvents(help_msg: string) {
    return [
        {
            cond: (context: SDSContext) => !!getGrammarResult(context.recResult),
            actions: assign((context: SDSContext) => {
                console.log(getGrammarResult(context.recResult))
                let meeting_obj = getGrammarResult(context.recResult).meeting;
                // don't overwrite existing results (eg. user says create meeting on friday -> go to state who -> go to state time)
                return {
                    person: context.person ? context.person : meeting_obj.person,
                    day: context.day ? context.day : meeting_obj.day,
                    time: context.time ? context.time : meeting_obj.time
                }
            }),
            target: "redirect"
        },
        { target: '#main.stop', cond: (context: SDSContext) => context.recResult === 'stop' },
        {
            cond: (context: SDSContext) => context.recResult === 'help',
            actions: getHelpAction(help_msg),
            target: '#main.help'
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

function getDefaultStates(prompt: Action<SDSContext, SDSEvent>, reprompt: Action<SDSContext, SDSEvent>,
    nomatch: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: {
            prompt: {
                entry: prompt,
                on: { ENDSPEECH: "ask" }
            },
            reprompt: {
                entry: reprompt,
                on: { ENDSPEECH: "ask" }
            },
            ask: {
                entry: [send('LISTEN'), /*send('MAXSPEECH', { delay: 3000, id: 'maxsp' })*/]
            },
            nomatch: {
                entry: say(nomatch),
                on: { ENDSPEECH: "ask" }
            }
        }
    })
}

const yesNoGrammar: { [index: string]: { person?: string, day?: string, time?: string, affirmation?: string } } = {
    // "Anna": { person: "Anna Appleseed" },
    // "John": { person: "John Appleseed" },
    // "Patricia": { person: "Patricia G" },
    // "Mary": { person: "Mary" },
    // "Mike": { person: "Michael" },
    // "on Friday": { day: "Friday" },
    // "tomorrow": { day: "tomorrow" },
    // "Monday": { day: "Monday" },
    // "at ten": { time: "10:00" },
    // "at 10": { time: "10:00" },
    // "eleven": { time: "11:00" },
    // "at noon": { time: "12:00" },
    // "at 3": { time: "15:00" },
    "of course": { affirmation: "yes" },
    "absolutely": { affirmation: "yes" },
    "no way": { affirmation: "no" },
    "not really": { affirmation: "no" }
}

// NOTE I did not find the use of orthogonal states necessary, I did however implemeted them by adding two
// parallel states where one states asks the user an open ended question and the other "listens" to what
// the user might say, ready to take on an action such as creating an appointment
// This is not the best solution.
// I would extract the appointment-machine into its own file
export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    // initial: 'act',
    type: 'parallel',
    states: {
        start: {
            initial: 'init',
            states: {
                init: {
                    on: {
                        CLICK: 'welcome'
                    }
                },
                welcome: {
                    initial: "prompt",
                    on: {
                        RECOGNISED: [
                            { cond: (context) => context.recResult == "set timer", target: "#main.timer" },
                            { target: ".idle" }
                            // NOTE in this block we could add other actions (eg timer, to do list from lab2) and redirect accordingly
                        ]
                    },
                    states: {
                        prompt: {
                            entry: say("What would you like to do?"),
                            on: { ENDSPEECH: "ask" }
                        },
                        ask: {
                            entry: listen
                        },
                        idle: {
                            // TODO/NOTE here I guess can be implemented a listener for stop/help/whatever
                        },
                    }
                },
            }
        },
        watch: {
            id: "main",
            initial: "appointment",
            states: {
                appointment: {
                    // initial: 'listen',
                    initial: 'init',
                    states: {
                        hist: { type: 'history', history: 'deep' },
                        init: {
                            on: {
                                ENDSPEECH: 'listen'
                            }
                        },
                        welcome: {
                            initial: "prompt",
                            on: { ENDSPEECH: "who" },
                            states: {
                                prompt: { entry: say("Let's create an appointment") }
                            }
                        },
                        listen: {
                            on: {
                                RECOGNISED: [{
                                    cond: (context) => !!getGrammarResult(context.recResult),
                                    actions: assign((context) => {
                                        console.log(getGrammarResult(context.recResult))
                                        let meeting_obj = getGrammarResult(context.recResult).meeting;
                                        return { person: meeting_obj.person, day: meeting_obj.day, time: meeting_obj.time }
                                    }),
                                    target: "redirect"
                                },
                                    // { target: "welcome" }
                                ]
                            },
                            entry: listen()
                        },
                        who: {
                            on: {
                                RECOGNISED: [...getDefaultRecogEvents("Tell me the name of the person.")],
                                MAXSPEECH: [...getDefaultMaxSpeechEvents()]
                            },
                            ...getDefaultStates(say("Who are you meeting with?"),
                                say("Can you tell me who you are meeting with?"),
                                "Sorry, I don't know them.")
                        },
                        redirect: {
                            always: [
                                { target: 'confirmTime', cond: (context) => !!context.person && !!context.day && !!context.time },
                                { target: 'time', cond: (context) => !!context.person && !!context.day },
                                { target: 'day', cond: (context) => !!context.person },
                                { target: 'who', cond: (context) => !context.person && (!!context.day || !!context.time) },
                                { target: 'welcome' },
                            ]
                        },
                        day: {
                            on: {
                                RECOGNISED: [...getDefaultRecogEvents("Tell me the day of the meeting.")],
                                MAXSPEECH: [...getDefaultMaxSpeechEvents()]
                            },
                            ...getDefaultStates(send((context) => ({
                                type: "SPEAK",
                                value: `OK. ${context.person}. On which day is your meeting?`
                            })),
                                say("What day do you have your meeting?"),
                                "Can you repeat that?")
                        },
                        duration: {
                            on: {
                                RECOGNISED: [
                                    { target: 'confirmDay', cond: (context) => resolveYes(context.recResult) },
                                    { target: 'time', cond: (context) => resolveNo(context.recResult) },
                                    ...getDefaultRecogEvents("Tell me yes or no."),
                                ],
                                MAXSPEECH: [...getDefaultMaxSpeechEvents()]
                            },
                            ...getDefaultStates(say("Will it take the whole day?"),
                                say("Is your meeting going to last the entire day?"),
                                "I did not catch that.")
                        },
                        time: {
                            on: {
                                RECOGNISED: [...getDefaultRecogEvents("Tell me the time of your meeting.")],
                                MAXSPEECH: [...getDefaultMaxSpeechEvents()]
                            },
                            ...getDefaultStates(say("What time is your meeting?"),
                                say("When does your meeting start?"),
                                "Can you repeat that?")
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
                            ...getDefaultStates(
                                send((context) => ({
                                    type: "SPEAK",
                                    value: `Do you want me to create an appointment with ${context.person} on ${context.day} for the whole day?`
                                })),
                                send((context) => ({
                                    type: "SPEAK",
                                    value: `You are meeting with ${context.person} on ${context.day} for the whole day. Is that correct?`
                                })),
                                "Yes or no?")
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
                            ...getDefaultStates(
                                send((context) => ({
                                    type: "SPEAK",
                                    value: `Do you want me to create an appointment with ${context.person} on ${context.day} at ${context.time}?`
                                })),
                                send((context) => ({
                                    type: "SPEAK",
                                    value: `You are meeting with ${context.person} on ${context.day} at ${context.time}. Is that correct?`
                                })),
                                "Yes or a no?")
                        },
                        final: {
                            initial: "prompt",
                            on: { ENDSPEECH: "#root.dm.start.init" },
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
                    always: 'appointment'
                },
                help: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `${context.help_msg}`
                    })),
                    on: { ENDSPEECH: "appointment.hist" }
                },
                timer: {
                    entry: say("I will set a timer for you."),
                    always: ['appointment']
                }
            }
        }
    }
})
