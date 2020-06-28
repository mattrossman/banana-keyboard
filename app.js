const { Tone, AFRAME, THREE } = window;


let audioReady = false;
let synth = null

const btnStart = document.querySelector('#btnStart')
const blocker = document.querySelector('#blocker')
const scene = document.querySelector('a-scene')
// scene.pause();
const keyboard = document.querySelector('#keyboard')


btnStart.onclick = async () => {
  console.log("Starting")
  await Tone.start()
  synth = new Tone.Synth().toMaster();
  audioReady = true;
  document.querySelector('#intro').classList.add('hidden');
  keyboard.setAttribute('banana-keyboard', {
    width: 7,
    notes: 'C4, D4, E4, F4, G4, A4, B4, C5'
  })
  // scene.play();
}


AFRAME.registerSystem('synth', {
  init: function() {
    this.ready = false;
  },
  startNote(note) {
    if (audioReady) {
      synth.triggerAttack(note)
    }
  },
  stopNote() {
    if (audioReady) {
      synth.triggerRelease();
    }
  }
})

AFRAME.registerSystem('mouse', {
  init: function() {
    this.isClicked = false;
    
    this.el.canvas.addEventListener('mousedown', () => { console.log('click'); this.isClicked = true })
    this.el.canvas.addEventListener('mouseup', () => { this.isClicked = false })
    this.el.canvas.addEventListener('touchstart', () => { this.isClicked = true })
    this.el.canvas.addEventListener('touchend', () => { this.isClicked = false })
  }
})

AFRAME.registerComponent('synth-key', {
  schema: {
    note: { type: 'string'},
    growAmount: { type: 'number' },
    growSpeed: { type: 'number' },
  },
  init: function() {
    this.playing = false;
    this.el.addEventListener('mousedown', () => this.tryStart())
    this.el.addEventListener('mouseup', () => this.tryStop())
    this.el.addEventListener('mouseleave', () => this.tryStop())
    this.el.addEventListener('mouseenter', () => {
      if (this.el.sceneEl.systems.mouse.isClicked) {
        this.tryStart();
      }
    })
    this.scaleBase = new THREE.Vector3(1, 1, 1)
    this.scaleGrown = this.scaleBase.clone().multiplyScalar(this.data.growAmount);
    this.mesh = this.el.object3D.getObjectByProperty('isMesh', true)
    this.morphId = this.mesh.morphTargetDictionary['Open'];
  },
  tryStart() {
    if (!this.playing) {
      this.playing = true;
      this.el.sceneEl.systems.synth.startNote(this.data.note)
      // synth.triggerAttack(this.data.note)
    }
  },
  tryStop() {
    if (this.playing) {
      this.playing = false
      this.el.sceneEl.systems.synth.stopNote()
      // synth.triggerRelease();
    }
  },
  tick: function (time, timeDelta) {
    this.mesh.morphTargetInfluences[this.morphId] = this.playing ? (4 + Math.sin(time / 20)) / 5 : 0;
    this.el.object3D.scale.lerp(this.playing ? this.scaleGrown : this.scaleBase,
                                this.data.growSpeed * timeDelta / 1000);
  }
});

AFRAME.registerComponent('banana-keyboard', {
  schema: {
    width: { type: 'number', default: 1 },
    notes: { type: 'array' }
  },
  init: function() {
    const notes = this.data.notes;
    for (let i=0; i<notes.length; ++i) {
      const positionX = notes.length <= 1 ? 0 : (this.data.width / (notes.length - 1) * i) - (this.data.width / 2)
      const note = notes[i];
      const key = document.createElement('a-entity')
      key.setAttribute('gltf-model', '#a-banana');
      key.addEventListener('model-loaded', () => {
        key.setAttribute('synth-key', { note, growAmount: 1.2, growSpeed: 10 });
      })
      key.setAttribute('position', positionX + ' 0 0');
      this.el.appendChild(key);
    }
  }
})

