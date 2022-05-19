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
    }
}

const notes = [
    [ 'C', 60 ],
    [ 'C#', 61 ],
    [ 'D', 62 ],
    [ 'Eb', 63 ],
    [ 'E', 64 ],
]

class Keyboard {
    constructor(output) {
        this.output = output
    }

    render() {
        const container = document.createElement('div')
        notes.forEach((note) => {        
            const key = document.createElement('button')
            key.innerHTML = note[0]
            key.onclick = this.sendNote.bind(this, 1, note[1])
            container.appendChild(key)
        })

        return container
    }

    sendNote(channel, note) {
        console.log('sending note', note, 'to', this.output.name, 'channel', channel)
        const noteOnMessage = [0x90 + channel - 1, note, 0x7f]
        const noteOffMessage = [0x80 + channel - 1, note, 0x40]
        this.output.send(noteOnMessage)
        this.output.send(noteOffMessage, window.performance.now() + 1000.0)
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
                for (const b of act['message']) {
                    console.log(b, parseInt(b))
                }
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
