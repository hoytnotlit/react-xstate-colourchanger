import { MachineConfig, send, Action } from "xstate";
import { dmMachine as dmAppointment } from "./dmAppointment";


const sayColour: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `Repainting to ${context.recResult}`
}))

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
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
                    { target: 'appointment', cond: (context) => context.recResult.toLowerCase() == "appointment" },
                    { target: 'todoitem', cond: (context) => context.recResult.toLowerCase() == "to-do item" },
                    { target: 'timer', cond: (context) => context.recResult.toLowerCase() == "timer" },
                    { target: 'init' }
                ]
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
        appointment: {
            ...dmAppointment
        },
        todoitem: {
            initial: "welcome",
            states: {
                welcome: {
                    entry: say("Let's create an item for your to-do list")
                }
            }
        },
        timer: {
            initial: "welcome",
            states: {
                welcome: {
                    entry: say("Let's set a timer")
                }
            }
        },
    }
})
