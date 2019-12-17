// Constants
const BASE_SIZE = 1;
const SHAPES = Object.freeze({
    box: new THREE.BoxGeometry(BASE_SIZE, BASE_SIZE, BASE_SIZE),
    cone: new THREE.ConeGeometry(BASE_SIZE, BASE_SIZE * 1.5, 32),
    pyramid: new THREE.ConeGeometry(BASE_SIZE, BASE_SIZE * 1.5, 3),
    dodecahedron: new THREE.DodecahedronGeometry(BASE_SIZE),
    knot: new THREE.TorusKnotGeometry(BASE_SIZE / 2, BASE_SIZE / 5, 100, 32)
});
const TRANSLATION_TYPES = Object.freeze({
    none: 'none',
    vertical: 'vertical',
    horizontal: 'horizontal',
    all: 'all'
});
const ROTATION_TYPES = Object.freeze({
    none: 'none',
    constant: 'constant',
    oscillate: 'oscillate'
});
const SCALE_TYPES = ['pulsating', 'none'];
const TRANSLATION_BOUND = 1;
const SCALE_BOUND = 0.25;

/*
Gets an option object to shape the animation
param info: an object of position, viewport size, etc. to shape the options
*/
function getOptions(info) {
    const options = { ...info };

    // latitude -> shape geometry
    if (!info.position) {
        options.primaryShape = 'knot'; // no position data
    } else if (info.position.latitude > 30) {
        options.primaryShape = 'dodecahedron'; // north of Mexico
    } else if (info.position.latitude > -30) {
        options.primaryShape = 'box'; // betw. Brazil and Mexico
    } else {
        options.primaryShape = 'pyramid'; // South America, parts of Oceania, and Antarctica
    }

    // color -> hue saturation lightness w/ hue being ms % 255
    options.primaryColor = `hsl(${info.datetime.getMilliseconds() %
        255}, 50%, 50%)`;

    // by viewport width -> translation type (vert. on mobile, horiz. on desktop)
    options.primaryTranslation =
        info.width < info.height
            ? TRANSLATION_TYPES.vertical
            : TRANSLATION_TYPES.horizontal;

    // current hour -> rotation type
    const hour = info.datetime.getHours();
    if (hour < 10) {
        options.primaryRotation = ROTATION_TYPES.none; // no rotation early morning, too much fuss
    } else if (hour < 17) {
        options.primaryRotation = ROTATION_TYPES.constant; // afternoon
    } else {
        options.primaryRotation = ROTATION_TYPES.oscillate; // evening
    }

    // longitude -> rotation axis
    if (!info.position) {
        options.primaryAxis = 'x'; // no position data
    } else if (info.position.longitude < 0) {
        options.primaryAxis = 'y'; // west of prime meridian
    } else {
        options.primaryAxis = 'z'; // east of prime meridian
    }

    // browser name -> translation speed
    options.browser = info.useragent[0].ua.family;
    if (options.browser.includes('Chrome')) {
        options.primaryTranslationSpeed = 0.05;
    } else if (options.browser.includes('Safari')) {
        options.primaryTranslationSpeed = 0.07;
    } else if (options.browser.includes('IE')) {
        options.primaryTranslationSpeed = 0.01;
    } else {
        options.primaryTranslationSpeed = 0.03;
    }

    // os name -> rotation speed
    options.os = info.useragent[0].os.family;
    options.primaryRotationSpeed = options.os.length / 150; // Fedora => 0.04, Mac OS X => 0.053

    return options;
}

/*
Creates human readable sentences to detail the various options derived
param options: returned object from getOptions() function
*/
function displayDetails(options) {
    const details = $('#details');
    let primaryName =
        options.primaryShape.charAt(0).toUpperCase() +
        options.primaryShape.slice(1);
    let rotationStr = 'not rotate';
    switch (options.primaryRotation) {
        case 'oscillate':
            rotationStr = `<strong>oscillate</strong>`;
            break;
        case 'constant':
            rotationStr = `<strong>rotate</strong>`;
            break;
    }
    details.append(
        `Your latitude (${
            options.position
                ? options.position.latitude.toFixed(2) + '°'
                : 'none'
        })
        gave you a <strong>${primaryName}</strong>.<br />
        The time (${options.datetime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })})
        chose its <strong style="color: ${
            options.primaryColor
        }">color</strong> and made it ${rotationStr}.<br />
        ${
            options.primaryRotation != 'none'
                ? `Your longitude (${
                      options.position
                          ? options.position.longitude.toFixed(2) + '°'
                          : 'none'
                  }) set its rotation to the <strong>${options.primaryAxis.toUpperCase()}-axis</strong>.<br />`
                : ''
        }
        Your viewport width (${options.width}px) made it
        <strong>translate ${options.primaryTranslation}ly</strong>. <br />
        Using <strong>${
            options.browser
        }</strong> translates it at <strong>${options.primaryTranslationSpeed.toFixed(
            2
        )} units/frame</strong>.<br/>
        Using <strong>${
            options.os
        }</strong> rotates it at <strong>${options.primaryRotationSpeed.toFixed(
            2
        )} radians/frame</strong>.`
    );
}

/*
Returns a Promise that returns either an empty object or a user's position
Uses the navigator.geolocation API, whose permission can be approved/declined by a user
*/
function getUserLocation() {
    if (navigator.geolocation) {
        return new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject)
        );
    } else {
        return new Promise(resolve => resolve({}));
    }
}

/*
Initializes the various Three.js classes needed for the main animation
param options: object returned by getOptions() method
*/
function animate(options) {
    const width = document.body.clientWidth;
    const height = document.body.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(
        new THREE.Color(options.primaryColor).multiplyScalar(0.2)
    );
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const primaryGeometry = SHAPES[options.primaryShape];
    const primaryMaterial = new THREE.MeshLambertMaterial({
        color: options.primaryColor
    });

    const primary = new THREE.Mesh(primaryGeometry, primaryMaterial);
    scene.add(primary);

    const camera = new THREE.PerspectiveCamera(45, width / height);
    camera.position.y = 2;
    camera.position.z = 6;
    camera.lookAt(primary.position);

    scene.add(camera);

    const pointLight = new THREE.PointLight(0xffffff, 0.75);
    pointLight.position.set(0, 2, 6);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const translationAxis =
        options.primaryTranslation == TRANSLATION_TYPES.vertical ? 'y' : 'x';

    let translationCoeff = 1;
    let rotationCoeff = 1;
    let scaleCoeff = 1;

    displayDetails(options);

    /*
    Main animation loop, using the initialized classes in outter scope
    */
    function render() {
        // primary translation
        primary.position[translationAxis] +=
            translationCoeff * options.primaryTranslationSpeed;
        if (Math.abs(primary.position[translationAxis]) >= TRANSLATION_BOUND) {
            translationCoeff *= -1;

            if (options.primaryRotation == ROTATION_TYPES.oscillate) {
                rotationCoeff *= -1;
            }
        }

        // primary rotation
        if (options.primaryRotation !== ROTATION_TYPES.none) {
            primary.rotation[options.primaryAxis] +=
                rotationCoeff * options.primaryRotationSpeed;
        }

        // primary scale
        primary.scale.addScalar(scaleCoeff * 0.01);
        if (Math.abs(1 - primary.scale.x) >= SCALE_BOUND) {
            scaleCoeff *= -1;
        }

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    render();
}

/*
Called on document load to get user info object and call animation functions with derived options
*/
function init() {
    let data = {
        width: $(window).width(),
        height: $(window).height(),
        datetime: new Date()
    };
    fetch('https://whatsmyua.info/api/v1/ua')
        .then(response => response.json())
        .then(useragent => {
            getUserLocation()
                .then(position => {
                    const options = getOptions({
                        ...data,
                        useragent,
                        position: position.coords
                    });
                    animate(options);
                    console.log(options);
                })
                .catch(error => {
                    const options = getOptions({ ...data, useragent });
                    animate(options);
                    console.log(options);
                });
        });
}

$(document).ready(init);
