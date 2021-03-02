(this["webpackJsonpxstate-react-typescript-template"]=this["webpackJsonpxstate-react-typescript-template"]||[]).push([[0],{31:function(t,e,n){},40:function(t,e,n){"use strict";n.r(e),n.d(e,"nluRequest",(function(){return k}));var o=n(26),a=n(13),r=n(8),c=(n(31),n(7),n(23)),s=n(11),i=n(20),l=n(2),p=n(44),m=n(43);const u=s.a.send;s.a.cancel;function y(t){return u((e=>({type:"SPEAK",value:t})))}function d(t){return"yes"===t||O[t]&&"yes"==O[t].affirmation}function h(t){return"no"===t||O[t]&&"no"==O[t].affirmation}function g(t){return[{target:"#appointment.stop",cond:t=>"stop"===t.recResult},{cond:t=>"help"===t.recResult,actions:S(t),target:"#appointment.help"},{target:".nomatch"}]}function E(){return[{actions:Object(l.b)((t=>({prompts:t.prompts?t.prompts+1:1}))),cond:t=>!t.prompts||t.prompts<3,target:".reprompt"},{actions:Object(l.b)((t=>({prompts:0}))),cond:t=>t.prompts>=3,target:"init"}]}function b(t,e,n){return{initial:"prompt",states:{prompt:{entry:t,on:{ENDSPEECH:"ask"}},reprompt:{entry:e,on:{ENDSPEECH:"ask"}},ask:{entry:[u("LISTEN"),u("MAXSPEECH",{delay:3e3,id:"maxsp"})]},nomatch:{entry:y(n),on:{ENDSPEECH:"reprompt"}}}}}function S(t){return Object(l.b)((e=>({help_msg:t})))}const O={Anna:{person:"Anna Appleseed"},John:{person:"John Appleseed"},Patricia:{person:"Patricia G"},Mary:{person:"Mary"},Bob:{person:"Bob the Builder"},Mike:{person:"Michael"},"on Friday":{day:"Friday"},tomorrow:{day:"tomorrow"},Monday:{day:"Monday"},10:{time:"10:00"},"at ten":{time:"10:00"},"at 10":{time:"10:00"},eleven:{time:"11:00"},"at noon":{time:"12:00"},"at 3":{time:"15:00"},"of course":{affirmation:"yes"},absolutely:{affirmation:"yes"},"no way":{affirmation:"no"},"not really":{affirmation:"no"}},j={id:"appointment",initial:"act",states:{act:{initial:"init",states:{hist:{type:"history",history:"deep"},init:{on:{CLICK:"welcome"}},welcome:{initial:"prompt",on:{ENDSPEECH:"who"},states:{prompt:{entry:y("Let's create an appointment")}}},who:Object(r.a)({on:{RECOGNISED:[{cond:t=>"person"in(O[t.recResult]||{}),actions:Object(l.b)((t=>({person:O[t.recResult].person}))),target:"day"},...g("Tell me the name of the person.")],MAXSPEECH:[...E()]}},b(y("Who are you meeting with?"),y("Can you tell me who you are meeting with?"),"Sorry, I don't know them.")),day:Object(r.a)({on:{RECOGNISED:[{cond:t=>"day"in(O[t.recResult]||{}),actions:Object(l.b)((t=>({day:O[t.recResult].day}))),target:"duration"},...g("Tell me the day of the meeting.")],MAXSPEECH:[...E()]}},b(u((t=>({type:"SPEAK",value:"OK. ".concat(t.person,". On which day is your meeting?")}))),y("What day do you have your meeting?"),"Can you repeat that?")),duration:Object(r.a)({on:{RECOGNISED:[{target:"confirmDay",cond:t=>d(t.recResult)},{target:"time",cond:t=>h(t.recResult)},...g("Tell me yes or no.")],MAXSPEECH:[...E()]}},b(y("Will it take the whole day?"),y("Is your meeting going to last the entire day?"),"I did not catch that.")),time:Object(r.a)({on:{RECOGNISED:[{cond:t=>"time"in(O[t.recResult]||{}),actions:Object(l.b)((t=>({time:O[t.recResult].time}))),target:"confirmTime"},...g("Tell me the time of your meeting.")],MAXSPEECH:[...E()]}},b(y("What time is your meeting?"),y("When does your meeting start?"),"Can you repeat that?")),confirmDay:Object(r.a)({on:{RECOGNISED:[{target:"final",cond:t=>d(t.recResult)},{target:"welcome",cond:t=>h(t.recResult)},...g("Tell me yes or no.")],MAXSPEECH:[...E()]}},b(u((t=>({type:"SPEAK",value:"Do you want me to create an appointment with ".concat(t.person," on ").concat(t.day," for the whole day?")}))),u((t=>({type:"SPEAK",value:"You are meeting with ".concat(t.person," on ").concat(t.day," for the whole day. Is that correct?")}))),"Yes or no?")),confirmTime:Object(r.a)({on:{RECOGNISED:[{target:"final",cond:t=>d(t.recResult)},{target:"welcome",cond:t=>h(t.recResult)},...g("Tell me yes or no.")],MAXSPEECH:[...E()]}},b(u((t=>({type:"SPEAK",value:"Do you want me to create an appointment with ".concat(t.person," on ").concat(t.day," at ").concat(t.time,"?")}))),u((t=>({type:"SPEAK",value:"You are meeting with ".concat(t.person," on ").concat(t.day," at ").concat(t.time,". Is that correct?")}))),"Yes or no?")),final:{initial:"prompt",on:{ENDSPEECH:"init"},states:{prompt:{entry:y("Your appointment has been created!")}}}}},stop:{entry:y("Ok"),always:"act"},help:{entry:u((t=>({type:"SPEAK",value:"".concat(t.help_msg)}))),on:{ENDSPEECH:"act.hist"}}}};var f=n(22);const R=s.a.send,C=s.a.cancel;Object(m.a)({url:"https://statecharts.io/inspect",iframe:!1});const w=Object(i.a)({id:"root",type:"parallel",states:{dm:Object(r.a)({},j),asrtts:{initial:"idle",states:{idle:{on:{LISTEN:"recognising",SPEAK:{target:"speaking",actions:Object(l.b)(((t,e)=>({ttsAgenda:e.value})))}}},recognising:{initial:"progress",entry:"recStart",exit:"recStop",on:{ASRRESULT:{actions:["recLogResult",Object(l.b)(((t,e)=>({recResult:e.value})))],target:".match"},RECOGNISED:{actions:[C("maxsp"),Object(l.b)((t=>({prompts:0})))],target:"idle"},MAXSPEECH:"idle"},states:{progress:{},match:{entry:R("RECOGNISED")}}},speaking:{entry:"ttsStart",on:{ENDSPEECH:"idle"}}}}}},{actions:{recLogResult:t=>{console.log("<< ASR: "+t.recResult)},test:()=>{console.log("test")},logIntent:t=>{console.log("<< NLU intent: "+t.nluData.intent.name)}}}),P=t=>{switch(!0){case t.state.matches({asrtts:"recognising"}):return Object(a.jsx)("button",Object(r.a)(Object(r.a)({type:"button",className:"glow-on-hover",style:{animation:"glowing 20s linear"}},t),{},{children:"Listening..."}));case t.state.matches({asrtts:"speaking"}):return Object(a.jsx)("button",Object(r.a)(Object(r.a)({type:"button",className:"glow-on-hover",style:{animation:"bordering 1s infinite"}},t),{},{children:"Speaking..."}));default:return Object(a.jsx)("button",Object(r.a)(Object(r.a)({type:"button",className:"glow-on-hover"},t),{},{children:"Click to start"}))}};function A(){const t=Object(f.useSpeechSynthesis)({onEnd:()=>{u("ENDSPEECH")}}),e=t.speak,n=t.cancel,r=(t.speaking,Object(f.useSpeechRecognition)({onResult:t=>{u({type:"ASRRESULT",value:t})}})),c=r.listen,s=(r.listening,r.stop),i=Object(p.b)(w,{devTools:!0,actions:{recStart:Object(p.a)((()=>{console.log("Ready to receive a command."),c({interimResults:!1,continuous:!0})})),recStop:Object(p.a)((()=>{console.log("Recognition stopped."),s()})),changeColour:Object(p.a)((t=>{console.log("Repainting..."),document.body.style.background=t.recResult})),ttsStart:Object(p.a)(((t,n)=>{console.log("Speaking..."),e({text:t.ttsAgenda})})),ttsCancel:Object(p.a)(((t,e)=>{console.log("TTS STOP..."),n()}))}}),l=Object(o.a)(i,3),m=l[0],u=l[1];l[2];return Object(a.jsx)("div",{className:"App",children:Object(a.jsx)(P,{state:m,onClick:()=>u("CLICK")})})}const N=location.origin,k=t=>fetch(new Request("https://cors-anywhere.herokuapp.com/https://gussuvmi-rasa-nlu.herokuapp.com/model/parse",{method:"POST",headers:{Origin:N},body:'{"text": "'.concat(t,'"}')})).then((t=>t.json())),v=document.getElementById("root");c.render(Object(a.jsx)(A,{}),v)}},[[40,1,2]]]);
//# sourceMappingURL=main.df8fca62.chunk.js.map