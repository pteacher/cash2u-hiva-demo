import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let mouseX = 0, mouseY = 0;
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(windowWidth, windowHeight);
document.body.appendChild(renderer.domElement);

let mixer;
const clock = new THREE.Clock();
const roughnessMipmapper = new RoughnessMipmapper(renderer);

const camera = new THREE.PerspectiveCamera(70, windowWidth / windowHeight, 1, 10000);
camera.position.z = 5;

const controls = new OrbitControls(camera, renderer.domElement);
const pointLight = new THREE.PointLight(0xffffff, 100);
camera.add(pointLight);
controls.update();

const light = new THREE.DirectionalLight(0xffffff);
light.position.set(0, 0, 1);
scene.add(light);

const light2 = new THREE.DirectionalLight(0xffffff);
light2.position.set(-10, -10, 0);
scene.add(light2);

const light3 = new THREE.DirectionalLight(0xffffff);
light3.position.set(10, 10, 0);
scene.add(light3);

const ambient = new THREE.AmbientLight(0x222222, 0.7);
scene.add(ambient);

const loader = new GLTFLoader();
loader.load('./public/model.glb', function (gltf) {
    const model = gltf.scene;

    gltf.scene.traverse(function (child) {
        if (child.isMesh) {
            roughnessMipmapper.generateMipmaps(child.material);
        }
    });

    mixer = new THREE.AnimationMixer(model);
    initAnimations(gltf);
    console.log(actions);

    actions["Speaking"].setEffectiveWeight(1);
    actions["Speaking"].play();
    prepareCrossFade(actions["Greeting"], actions["Speaking"]);

    // setInterval(() => {
    //     actions["Greeting"].weight = 0.7;
    //     setTimeout(() => {
    //         actions["Speaking"].weight = 0;
    //     }, 5000)
    // }, 5000)

    // setInterval(() => {
    //     prepareCrossFade(actions["Speaking"], actions["Greeting"])
    //     setTimeout(() => {
    //         prepareCrossFade(actions["Greeting"], actions["Speaking"])
    //     }, 5000);
    // }, 10000)

    model.position.set(0, -3, 0);
    model.scale.set(3, 3, 3);
    model.rotation.set(0, 0, 0);
    scene.add(model);
}, undefined, function (error) {
    console.error(error);
});

document.addEventListener('mousemove', onDocumentMouseMove);

function onDocumentMouseMove(event) {
    mouseX = event.clientX - windowWidth / 2;
    mouseY = event.clientY - windowHeight / 2;
}

const actions = {};

function initAnimations(gltf) {
    gltf.animations.forEach(animation => {
        const action = mixer.clipAction(animation);
        actions[animation.name] = action;
        if (animation.name == "Greeting") {
            action.setEffectiveWeight(0.2);
        }
        else {
            action.setEffectiveWeight(0);
        }
        action.setEffectiveTimeScale(1);
        action.play();
    });
}

function prepareCrossFade(startAction, endAction) {
    const duration = 1;

    if (startAction === actions["Idle"]) {
        executeCrossFade(startAction, endAction, duration);
    } else {
        synchronizeCrossFade(startAction, endAction, duration);
    }
}

function synchronizeCrossFade(startAction, endAction, duration) {
    mixer.addEventListener('loop', onLoopFinished);

    function onLoopFinished(event) {
        if (event.action === startAction) {
            mixer.removeEventListener('loop', onLoopFinished);
            executeCrossFade(startAction, endAction, duration);
        }
    }
}

function executeCrossFade(startAction, endAction, duration) {
    setWeight(endAction, 1);
    endAction.time = 0;
    startAction.crossFadeTo(endAction, duration, true);
}

function setWeight(action, weight) {
    action.enabled = true;
    action.setEffectiveWeight(weight);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    controls.update();
    renderer.render(scene, camera);
}

animate();
