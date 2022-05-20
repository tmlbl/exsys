class Editor {
    constructor(access, spec) {
        this.access = access
        this.outputs = access.outputs
        this.keyboard = new Keyboard()
        this.spec = spec
    }

    render() {
        const root = document.getElementsByTagName('body')[0]

        // Output selector
        this.outputSelector = document.createElement('select')
        for (let output of this.access.outputs.values()) {
            let option = document.createElement('option')
            option.innerHTML = output.name
            option.id = output.id
            this.outputSelector.appendChild(option)
        }
        this.setSelectedOutput()
        this.outputSelector.onchange = this.setSelectedOutput.bind(this)
        root.appendChild(this.outputSelector)

        root.appendChild(this.renderControls())

        Object.keys(params).forEach(name => {
            root.appendChild(new Slider(name, val => {
                this.selectedOutput.send(setParamMessage(0, params[name], val))
            }).render())
        })

        root.appendChild(new Slider('Osc 1 Sound', val => {
            const msg = sysex(0, sysexFunctions.PARAMETER_CHANGE, )
        }))

        // Keyboard
        root.appendChild(this.keyboard.render())
    }

    renderControls() {
        const container = document.createElement('div')
        const children = this.spec['controls'].map(ctrl => {
            if (ctrl['type'] == 'button') {
                return new Button(ctrl)
            }
        })
        for (let child of children) {
            console.log(child)
            container.appendChild(child.render())
        }
        return container
    }

    setSelectedOutput(e) {
        const id = this.outputSelector.selectedOptions[0].id
        this.selectedOutput = this.access.outputs.get(id)
        this.keyboard.output = this.selectedOutput
        console.log('selected ouput', this.selectedOutput)
        window.selectedOutput = this.selectedOutput
    }
}

const notes = [
    [ 'C', 60 ],
    [ 'C#', 61 ],
    [ 'D', 62 ],
    [ 'Eb', 63 ],
    [ 'E', 64 ],
]

const params = {
    'Cutoff Mod Depth': 0x02,
    'Release Time': 0x48,
    'Attack Time': 0x49,
    'Brightness': 0x4A,
}

function setParamMessage(channel, param, value) {
    return [ 0xB0 + channel, param, value ]
}

const sysexFunctions = {
    PARAMETER_CHANGE: 0x41
}

const programParameters = {
    'Osc 1 Sound': 12,
}

const SYSEX_BEGIN = 0xF0
const KORG_ID = 0x42
const FORMAT_ID = (globalChannel) => 0x30 + globalChannel
const DEVICE_ID = 0x36
const SYSEX_END = 0xF7

// Generate sysex message
function sysexHeader(channel) {
    return [ SYSEX_BEGIN, KORG_ID, FORMAT_ID(channel), DEVICE_ID ]
}

// function parameterChange(channel, param, )

class Slider {
    constructor(name, apply) {
        this.name = name
        this.apply = apply
    }

    render() {
        const label = document.createElement('p')
        label.innerHTML = this.name
        const slider = document.createElement('input')
        slider.type = 'range'
        slider.min = '0'
        slider.max = '127'
        slider.value = '0'

        slider.onchange = this.onChange.bind(this)

        const container = document.createElement('div')
        container.appendChild(label)
        container.appendChild(slider)
        return container
    }

    onChange(e) {
        console.log(e.target.value)
        this.apply(e.target.value)
    }
}

class Keyboard {
    constructor(output) {
        this.output = output
    }

    render() {
        const container = document.createElement('div')
        notes.forEach((note) => {        
            const key = document.createElement('button')
            key.innerHTML = note[0]
            key.onmousedown = this.sendNoteOn.bind(this, 1, note[1])
            key.onmouseup = this.sendNoteOff.bind(this, 1, note[1])
            container.appendChild(key)
        })

        return container
    }

    sendNoteOn(channel, note) {
        console.log('sending note', note, 'to', this.output.name, 'channel', channel)
        const noteOnMessage = [0x90 + channel - 1, note, 0x7f]
        this.output.send(noteOnMessage)
    }

    sendNoteOff(channel, note) {
        const noteOffMessage = [0x80 + channel - 1, note, 0x40]
        this.output.send(noteOffMessage)
    }
}

class Button {
    constructor(spec) {
        this.spec = spec
    }

    render() {
        const button = document.createElement('button')
        button.innerHTML = this.spec['label']
        button.onclick = this.executeActions.bind(this)
        return button
    }

    executeActions() {
        const actions = this.spec['actions']
        actions.forEach(act => {
            if (act['type'] == 'send_message') {
                console.log(act['message'])
                // const msg = act['message'].map(parseInt)
                // console.log(msg)
                const bytes = []
                for (const b of act['message']) {
                    bytes.push(parseInt(b))
                }
                console.log(bytes)
                window.selectedOutput.send(bytes)
            }
        })
    }
}

async function start() {
    const access = await navigator.requestMIDIAccess({ sysex: true })
    console.log(access)
    const spec = await fetch('05r_w.json').then(data => data.json())
    const editor = new Editor(access, spec)
    editor.render()
}

start()
