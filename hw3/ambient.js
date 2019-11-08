/*
 * CSCI-712 Assignment 3: Motion Capture
 * Ram Zallan
 */
const CANVAS_SIZE = 800;

let FRAME_NUM = null;
let FRAME_TIME = 0.012;

// Initialization
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(CANVAS_SIZE, CANVAS_SIZE);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(-1, 2, 4);
scene.add(light);

camera.position.z = 200;
camera.position.y = 150;
camera.position.x = 75;

camera.lookAt(new THREE.Vector3(0, 50, 0));

const clock = new THREE.Clock();

const bones = new THREE.Group();
const joints = new THREE.Group();
const jointMat = new THREE.MeshBasicMaterial({ color: 0x4eb0e3 });
const jointGeo = new THREE.SphereGeometry(2, 32, 32);
const boneMat = new THREE.LineBasicMaterial({ color: 0xffffff });
const floorMat = new THREE.MeshBasicMaterial({
    color: 0xaaaaaa,
    wireframe: true
});

const loader = new THREE.FileLoader();

function initFloor() {
    let minJoint = new THREE.Vector3(99999, 99999, 99999);

    for (const joint of joints.children) {
        if (joint.position.y < minJoint.y) {
            minJoint.copy(joint.position);
        }
    }

    const floorGeo = new THREE.BoxGeometry(200, 1, 200);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = minJoint.y - 1;
    floorMesh.position.x = minJoint.x - 10;
    floorMesh.position.z = minJoint.z;
    scene.add(floorMesh);
}

function initSkeleton(parsed) {
    // Create skeleton
    for (const joint of parsed.joints) {
        const jointMesh = new THREE.Mesh(jointGeo, jointMat);
        const jointPosition = new THREE.Vector3().fromArray(joint.offset);

        let parent = joint.parent;
        while (parent) {
            const parentOffset = new THREE.Vector3().fromArray(parent.offset);
            jointPosition.add(parentOffset);
            parent = parent.parent;
        }
        jointMesh.position.copy(jointPosition);
        joints.add(jointMesh);

        for (const child of joint.children) {
            const childPosition = jointPosition
                .clone()
                .add(new THREE.Vector3().fromArray(child.offset));
            const boneGeo = new THREE.Geometry();
            boneGeo.vertices.push(jointPosition);
            boneGeo.vertices.push(childPosition);
            const bone = new THREE.Line(boneGeo, boneMat);
            bone.name = `${joint.name}-${child.name}`;
            bones.add(bone);
        }
    }
    scene.add(joints);
    scene.add(bones);
}

function updatePosition(joint, frame) {
    const jointPosition = new THREE.Vector3().fromArray(joint.offset);

    if (joint.parent) {
        const parentPosition = joints.children[joint.parent.index].position;
        jointPosition.add(parentPosition);
    }

    const channelCount = joint.channels.length;
    const channelOffset = parseInt(joint.channelOffset);
    const theseChannels = joint.channels.slice(
        channelOffset,
        channelOffset + channelCount
    );

    for (const localIndex in theseChannels) {
        const channel = theseChannels[localIndex];
        const channelValue = parseFloat(
            frame[channelOffset + parseInt(localIndex)]
        );
        switch (channel) {
            case "Xposition":
                jointPosition.x = channelValue;
                break;
            case "Yposition":
                jointPosition.y = channelValue;
                break;
            case "Xposition":
                jointPosition.z = channelValue;
                break;
            case "Xrotation":
                joints.children[joint.index].rotateX(channelValue);
                //console.log(joints.children[joint.index].rotation);
                break;
        }
    }

    // apply new jointPosition
    joints.children[joint.index].position.copy(jointPosition);

    for (const childIndex in joint.children) {
        const child = joint.children[childIndex];
        updatePosition(child, frame);
        const childPosition = joints.children[child.index].position;

        const currBone = bones.getObjectByName(`${joint.name}-${child.name}`);
        currBone.geometry.vertices[0].copy(jointPosition);
        currBone.geometry.vertices[1].copy(childPosition);
        currBone.geometry.verticesNeedUpdate = true;
    }
}

loader.load("ambient.bvh", data => {
    const parsed = parseBVH(data);

    $("#frame").attr("max", parsed.frames.length - 1);
    $("#frame").on("input", () => {
        FRAME_NUM = parseInt($("#frame").val());
        $("#frameNum").text(FRAME_NUM);
    });

    $("#rate").attr("value", parsed.frameTime);
    $("#frameRate").text(parsed.frameTime);
    $("#rate").on("input", () => {
        FRAME_TIME = parseFloat($("#rate").val());
        $("#frameRate").text(FRAME_TIME);
    });

    console.log(parsed);

    initSkeleton(parsed);

    let hasFloor = false;

    function main() {
        function render() {
            const now = clock.getElapsedTime();
            //const frameIndex = ;
            const frameIndex = FRAME_NUM || Math.floor(now / FRAME_TIME);
            $("#frameNum").text(frameIndex);
            $("#frame").val(frameIndex);

            if (frameIndex < parsed.frames.length) {
                const frame = parsed.frames[frameIndex];

                updatePosition(parsed.joints[0], frame);

                if (!hasFloor) {
                    initFloor();
                    hasFloor = true;
                }

                requestAnimationFrame(render);
                renderer.render(scene, camera);
            }
        }

        // Fix shape stretching
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();

        requestAnimationFrame(render);
    }

    main();
});
