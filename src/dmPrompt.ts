import { MachineConfig, send, Action, assign } from "xstate";
import { dmMachine as dmAppointmentMachine } from "./dmAppointment";
import { nluRequest } from "./index"


const sayColour: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `Repainting to ${context.recResult}`
}))

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    id: "main",
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
                RECOGNISED: { target: 'query' }
            },
            states: {
                prompt: {
                    entry: say("What would you like to do?"),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: send('LISTEN')
                }
            }
        },
        query: {
            invoke: {
                id: 'nlu',
                src: (context, event) => nluRequest(context.recResult),
                onDone: {
                    target: 'answer',
                    actions: assign((context, event) => { return { nluData: event.data } })
                },
                onError: {
                    target: 'unknown',
                    actions: (context, event) => console.log(event.data),
                }
            }
        },
        answer: {
            initial: "prompt",
            on: {
                ENDSPEECH: [
                    { target: 'appointment', cond: (context) => context.nluData.intent.name.toLowerCase() == "appointment" },
                    { target: 'todoitem', cond: (context) => context.nluData.intent.name.toLowerCase() == "todo_item" },
                    { target: 'timer', cond: (context) => context.nluData.intent.name.toLowerCase() == "timer" },
                    { target: 'unknown' }
                ]
            },
            //TODO get rid of this
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `intent is ${context.nluData.intent.name}`
                    }))
                }
            }
        },
        unknown: {
            initial: "prompt",
            on: {
                ENDSPEECH: { target: 'welcome' }
            },
            states: {
                prompt: {
                    entry: say("I did not understand that.")
                }
            }
        },
        appointment: {
            ...dmAppointmentMachine
        },
        todoitem: {
            initial: "welcome",
            on: { ENDSPEECH: "init" },
            states: {
                welcome: {
                    entry: say("Let's create an item for your to-do list")
                }
            }
        },
        timer: {
            initial: "welcome",
            on: { ENDSPEECH: "init" },
            states: {
                welcome: {
                    entry: say("Let's set a timer")
                }
            }
        },
    }
})
