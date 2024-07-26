jQuery(document).ready(function ($) {
    /**
     * 
     * Hide Modal
     */
    $(".close", "#View3DModal").click(function () {
        document.getElementById('View3DModal').classList.add("hide");
        /**
         * 
         * remove Modal Content
         */
        const modalBody = document.getElementById('modelContainer');
        modalBody.innerHTML = "";
        document.querySelector("#View3DModal .loadingScreen").style.display = "none";
        document.querySelector("#View3DModal .animationController").style.display = "none";
    });
    document.getElementById("confirmDecodeYes").addEventListener('click', downloadDecodeFile);
    document.getElementById("confirmDecodeNo").addEventListener('click', downloadOriginalFile);
    // document.querySelectorAll(".animationController .up-btn").forEach(element => {
    //     element.addEventListener('click', function() {
    //         this.classList.toggle('active');
    //         // changeMesh();
    //     });
    // })
    // document.querySelectorAll(".animationController .lo-btn").forEach(element => {
    //     element.addEventListener('click', function() {
    //         this.classList.toggle('active');
    //         // changeMesh();
    //     });
    // })
    // document.querySelector(".animationController #animateSlider").addEventListener('input', function() {
    //     changeMesh();
    //   });
    var encodedfileUrl = '', Gurlarray = [];
    loadedMeshes = {};
});

var loadedMeshes = {}, meshPlay;

function playMesh(url) {
    var playButtonStatus = document.querySelector('div[data-url="'+ url +'"] .animationController .meshPlayBtn');
    let slider = document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider');
    playButtonStatus.classList.toggle('active');
    clearInterval(meshPlay);
    meshPlay = null;
    if(playButtonStatus.classList.contains('active')) {
        if(slider.value == slider.max) {
            slider.value = 0;
        }
        meshPlay = setInterval(function() {
            slider.value++;
            if(Number(slider.value) >= Number(slider.max)){
                playButtonStatus.classList.remove('active');
                clearInterval(meshPlay);
                meshPlay = null;
            }
            changeMesh(url)
        }, 400)
    }
}

function open3DModelDialog(url) {
    document.getElementById('View3DModal').classList.remove("hide");
    const baseUrl = `${window.location.protocol}//${window.location.host}/`;
    const modalBody = document.getElementById('modelContainer');
    modalBody.parentElement.setAttribute("data-url", url);
    // Check for the existence of necessary elements
    if (!modalBody) {
        return;
    }
    modalBody.style.height = modalBody.clientWidth / 16 * 9 + "px";
    // Clear any previous content
    modalBody.innerHTML = "";
    /**
     * 
     * @param {*} imageUrl 
     * @returns 3D Model Viewer
     */

    view3DModelR(url, modalBody)
    document.querySelector("#View3DModal .up-btn").setAttribute('onclick', 'changeMesh("'+url+'", event)')
    document.querySelector("#View3DModal .lo-btn").setAttribute('onclick', 'changeMesh("'+url+'", event)')
    document.querySelector("#View3DModal .meshPlayBtn").setAttribute('onclick', 'playMesh("'+url+'", event)')
    document.querySelector("#View3DModal .animateSlider").setAttribute('oninput', 'changeMesh("'+url+'")')
}

function changeMesh(url, event) {
    if(event != undefined)
        event.target.classList.toggle('active');
    const meshToChange = loadedMeshes[url]
    let buttonCheck = 0;
    if(document.querySelector('div[data-url="'+ url +'"] .animationController .up-btn').classList.contains('active')) {
        buttonCheck += 2;
    }
    if(document.querySelector('div[data-url="'+ url +'"] .animationController .lo-btn').classList.contains('active')) {
        buttonCheck += 1;
    }
    let meshnumber = document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider').value;
    for (const [filename, mesh] of Object.entries(meshToChange)) {
        mesh.visible = false;
        if(Number(filename.replace(/\D/g, "")) == meshnumber){
            if(buttonCheck == 3) {
                mesh.visible = true;
            } else if (buttonCheck == 2 && filename.includes("upper")) {
                mesh.visible = true;
            } else if(buttonCheck == 1 && filename.includes("lower")) {
                mesh.visible = true;
            }
        }
            
    }
    document.querySelector('div[data-url="'+ url +'"] .animationController .currentStep').innerHTML = Number(meshnumber) + 1;
}

function downloadModel(url) {
    Gurlarray = url.split("/")
    if(url.slice(-1) == "x") {
        document.getElementById('rDecodeconfirmModal').classList.remove("hide");
        document.getElementById('rDecodeconfirmModal').classList.add("show");
        encodedfileUrl = url;
    } else {
        const aElem = document.createElement('a');
        aElem.href = url;
        aElem.download = Gurlarray[Gurlarray.length - 1];
        aElem.click();
    }
}

function downloadDecodeFile() {
    const dracoLoaderForDownload = new DRACOLoader();
    dracoLoaderForDownload.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    dracoLoaderForDownload.setDecoderConfig({ type: 'js' });

    dracoLoaderForDownload.load(encodedfileUrl, function(geometry) {
        let material
        if (geometry.attributes.color) {
            material = new MeshStandardMaterial({ vertexColors: true });
        } else {
            material = new MeshStandardMaterial({ color: 0xdddddd });
        }
        const mesh = new Mesh(geometry, material);
        let exporter;
        if(encodedfileUrl.slice(-4, -1) == 'ply') {
            exporter = new PLYExporter();
        } else {
            exporter = new STLExporter();
        }
        const objData = exporter.parse(mesh, {binary: false});
        
        const blob = new Blob([objData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const aEl = document.createElement('a');
        aEl.href = url;
        aEl.download = (Gurlarray[Gurlarray.length - 1]).slice(0, -1);
        aEl.click();
        document.getElementById('rDecodeconfirmModal').classList.remove("show");
        document.getElementById('rDecodeconfirmModal').classList.add("hide");
    })
}

function downloadOriginalFile() {
    const aElem = document.createElement('a');
    aElem.href = encodedfileUrl;
    aElem.download = Gurlarray[Gurlarray.length - 1];
    aElem.click();
    document.getElementById('rDecodeconfirmModal').classList.remove("show");
    document.getElementById('rDecodeconfirmModal').classList.add("hide");
}

function view3DModelR(url, container) {
    const fileBuffers = {};
    let camera, scene, renderer, controls, Gloader;
    
    const stlLoader = new STLLoader();
    const plyLoader = new PLYLoader();
    // Configure and create Draco decoder.
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    dracoLoader.setDecoderConfig({ type: 'js' });

    let extension = url.slice(-3);
    if(extension == "ply") {
        Gloader = plyLoader;
    } else if (extension == "stl"){
        Gloader = stlLoader;
    } else {
        Gloader = dracoLoader;
    }

    camera = new OrthographicCamera( container.clientWidth / -10, container.clientWidth / 10, container.clientHeight / 10, container.clientHeight / -10, -500, 1000);

    scene = new Scene();
    scene.background = new Color(0xffffff);

    // Lights
    // const ambientLight = new AmbientLight(0xffffff, 1.3); // Soft ambient light
    // scene.add(ambientLight);

    // const hemisphereLight = new HemisphereLight(0xffffff, 0xaaaaaa, 1.3); // Sky to ground light
    // hemisphereLight.position.set(-50, -200, -50);
    // scene.add(hemisphereLight);

    // const directionalLight = new DirectionalLight(0xffffff, 1);
    // directionalLight.position.set(0, -70, 70);
    // scene.add(directionalLight);
    // const directionalLight2 = new DirectionalLight(0xffffff, 1);
    // directionalLight2.position.set(0, 90, 20);
    // scene.add(directionalLight2);

    // const keyLight = new DirectionalLight(0xffffff, 1);
    // keyLight.position.set(-10, 10, 35);
    // scene.add(keyLight);
    // const kLhelper = new DirectionalLightHelper(keyLight, 2);
    // scene.add(kLhelper);

    // const fillLight = new DirectionalLight(0xffffff, 0.5);
    // fillLight.position.set(20, 10, 25);
    // scene.add(fillLight);
    // const fLhelper = new DirectionalLightHelper(fillLight, 2);
    // scene.add(fLhelper);

    // const backLight = new DirectionalLight(0xffffff, 1.5);
    // backLight.position.set(2, -65, 30);
    // scene.add(backLight);
    // const bLhelper = new DirectionalLightHelper(backLight, 2);
    // scene.add(bLhelper);

    const ambientLight = new AmbientLight(0xffffff, 1);
    scene.add(ambientLight);



    async function fetchAndUnzip(url) {
        try {
            // Fetch the ZIP file from the server
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            }

            // Get the array buffer from the response
            const arrayBuffer = await response.arrayBuffer();

            // Initialize JSZip
            const zip = new JSZip();

            // Load the array buffer into JSZip
            const contents = await zip.loadAsync(arrayBuffer);

            // Loop through the files in the ZIP
            for (const filename of Object.keys(contents.files)) {
                const file = contents.files[filename];

                // If it's not a directory, get its buffer
                if (!file.dir) {
                    const buffer = await file.async("arraybuffer");
                    fileBuffers[filename] = buffer;
                }

            }

        } catch (error) {
            console.error("An error occurred:", error);
        }
    }

    if(extension == "pac") {
        document.querySelector('div[data-url="'+ url +'"] .loadingScreen').style.display = "flex";
        
        fetchAndUnzip(url)
		.then((result) => {
            loadedMeshes[url] = {}
            const entries = Object.entries(fileBuffers);
            for (const [index, [filename, buffer]] of entries.entries()) {
                (async () => {
                    try {
                        const geometry = await new Promise((resolve, reject) => {
                            Gloader.parse(buffer, (parsedGeometry) => {
                                parsedGeometry.computeVertexNormals();
                                resolve(parsedGeometry);
                            });
                        });
            
                        let material;
                        if (geometry.attributes.color) {
                            material = new MeshPhongMaterial({ vertexColors: true, side: DoubleSide });
                        } else {
                            material = new MeshPhongMaterial({ color: 0x7DCBFA, side: DoubleSide });
                        }
            
                        material.reflectivity = 0.7; // Example value for reflectivity

                        // Adding specular highlights
                        material.shininess = 10; // value for shininess
                        material.flatShading = false;
                        material.needsUpdate = true;

                        const mesh = new Mesh(geometry, material);
            
                        geometry.computeBoundingBox();
                        const bbox = geometry.boundingBox;
                        const center = bbox.getCenter(new Vector3());
                        mesh.position.sub(center);
                        mesh.castShadow = true;
                        const height = bbox.max.z - bbox.min.z;
                        
                        let spacing = 2;
                        if (filename.includes("upper")) {
                            mesh.position.z = mesh.position.z + height / 2 - spacing;
                        } else {
                            mesh.position.z = mesh.position.z - height / 2 + spacing;
                        }
            
                        scene.add(mesh);
                        if(filename.replace(/\D/g, "") == 0) {
                            mesh.visible = true;
                        } else {
                            mesh.visible = false;
                        }
                        loadedMeshes[url][filename] = mesh;
                        if (index === entries.length - 1) {
                            //Load Complete Action
                            document.querySelector('div[data-url="'+ url +'"] .animationController').style.display = "block";
                            document.querySelector('div[data-url="'+ url +'"] .loadingScreen').style.display = "none";
                        }
                    } catch (error) {
                        console.error("Error parsing geometry for file:", filename, "Error:", error);
                        return;
                    }
                })();
            }
            
            const mesheslength = Object.keys(fileBuffers).length;
            document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider').max = Math.floor(mesheslength / 2 - 1);
            document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider').value = 0;
            document.querySelector('div[data-url="'+ url +'"] .animationController .maxStep').innerHTML = Math.floor(mesheslength / 2 );
            document.querySelector('div[data-url="'+ url +'"] .animationController .currentStep').innerHTML = 1;

		})
        .catch (error => {

            return;
        })
    } else {
        Gloader.load(url, function (geometry) {
            geometry.computeVertexNormals();
            let material
            if(extension == "stl") {
                material = new MeshPhysicalMaterial({ color: 0x85E5FF, side: DoubleSide});
                material.specular = new Color(0x85E5FF);
            }else if (geometry.attributes.color) {
                material = new MeshPhongMaterial({ vertexColors: true, side: DoubleSide });
            } else {
                material = new MeshPhongMaterial({ color: 0x85E5FF, side: DoubleSide });
                material.specular = new Color(0x85E5FF);
            }

            // Adjusting environment light
			material.reflectivity = 0.7; // Example value for reflectivity

            // Adding specular highlights
            material.flatShading = false;
            material.reflectivity = 0.1;
            material.roughness = 0;
            material.roughness = 0;
            material.IOR = 1.2;
            material.needsUpdate = true;
    
            const mesh = new Mesh(geometry, material);
            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox;
            const center = bbox.getCenter(new Vector3());
            mesh.position.sub(center);
			mesh.castShadow = true;
            scene.add(mesh);
        });
    }

    // renderer
    renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth-4, container.clientHeight);		//Indicate parent div width and height
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Add Arcball controls
    controls = new ArcballControls(camera, renderer.domElement, scene);
    controls.setGizmosVisible(false); // Optional: Show control gizmos

    controls.target.set( 0, 0, 0 );
    camera.position.set(40, 40, 40);
    controls.update();






    window.addEventListener('resize', onWindowResize);

    function onWindowResize() {

        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(container.clientWidth, container.clientHeight);

    }

    function animate() {
        const timer = Date.now() * 0.0003;
        renderer.render(scene, camera);

    }
}