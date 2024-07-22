jQuery(document).ready(function ($) {
    /**
     * 
     * Hide Modal
     */
    $(".close", "#3DViewModal").click(function () {
        document.getElementById('3DViewModal').classList.add("hide");
        /**
         * 
         * remove Modal Content
         */
        const modalBody = document.getElementById('modelContainer');
        modalBody.innerHTML = "";
        document.querySelector(".modal-custom-3d .loadingScreen").style.display = "none";
        document.querySelector(".animationController").style.display = "none";
    });
    document.getElementById("confirmDecodeYes").addEventListener('click', downloadDecodeFile);
    document.getElementById("confirmDecodeNo").addEventListener('click', downloadOriginalFile);
    document.querySelectorAll(".animationController").forEach(element => {
        element.style.display = "none";
    });
    document.querySelector(".animationController #up-btn").addEventListener('click', function() {
        this.classList.toggle('active');
        changeMesh();
    });
    document.querySelector(".animationController #lo-btn").addEventListener('click', function() {
        this.classList.toggle('active');
        changeMesh();
    });
    document.querySelector(".animationController #animateSlider").addEventListener('input', function() {
        changeMesh();
      });
    document.querySelector(".animationController #meshPlayBtn").addEventListener('click', function() {
        this.classList.toggle('active');
        if(meshPlay == null) {
            meshPlay = setInterval(function() {
                document.querySelector(".animationController #animateSlider").value++;
                if(Number(document.querySelector(".animationController #animateSlider").value) >= Number(document.querySelector(".animationController #animateSlider").max)){
                    document.querySelector(".animationController #meshPlayBtn").classList.remove('active');
                    clearInterval(meshPlay);
                    meshPlay = null;
                }
                changeMesh()
            }, 400)
        } else {
            clearInterval(meshPlay);
            meshPlay = null;
            changeMesh();
        }
    });
    var encodedfileUrl = '', Gurlarray = [], loadedMeshes = {}, meshPlay;
});


function open3DModelDialog(url) {
    document.getElementById('3DViewModal').classList.remove("hide");
    const baseUrl = `${window.location.protocol}//${window.location.host}/`;
    const modalBody = document.getElementById('modelContainer');

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
    
}

function changeMesh() {
    let buttonCheck = 0;
    if(document.querySelector(".animationController #up-btn").classList.contains('active')) {
        buttonCheck += 2;
    }
    if(document.querySelector(".animationController #lo-btn").classList.contains('active')) {
        buttonCheck += 1;
    }
    let meshnumber = document.querySelector(".animationController #animateSlider").value;
    for (const [filename, mesh] of Object.entries(loadedMeshes)) {
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
    document.querySelector(".animationController #currentStep").innerHTML = Number(meshnumber) + 1;
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
    loadedMeshes = {};
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
    const ambientLight = new AmbientLight(0xffffff, 0.7); // Soft ambient light
    scene.add(ambientLight);

    const hemisphereLight = new HemisphereLight(0xffffff, 0xaaaaaa, 1); // Sky to ground light
    hemisphereLight.position.set(-50, -200, -50);
    scene.add(hemisphereLight);

    const directionalLight = new DirectionalLight(0xffffff, 3);
    directionalLight.position.set(0, -70, 30);
    scene.add(directionalLight);
    const directionalLight2 = new DirectionalLight(0xffffff, 3);
    directionalLight2.position.set(0, 70, 0);
    scene.add(directionalLight2);

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
        document.querySelector(".modal-custom-3d .loadingScreen").style.display = "flex";
        
        fetchAndUnzip(url)
		.then((result) => {
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
                            material = new MeshPhongMaterial({ vertexColors: true, emissive: 5, shininess: 5, side: DoubleSide });
                        } else {
                            material = new MeshPhongMaterial({ color: 0xdddddd, emissive: 5, shininess: 5, side: DoubleSide });
                        }
            
                        const mesh = new Mesh(geometry, material);
            
                        geometry.computeBoundingBox();
                        const bbox = geometry.boundingBox;
                        const center = bbox.getCenter(new Vector3());
                        mesh.position.sub(center);
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
                        loadedMeshes[filename] = mesh;
                        if (index === entries.length - 1) {
                            //Load Complete Action
                            document.querySelector(".animationController").style.display = "block";
                            document.querySelector(".modal-custom-3d .loadingScreen").style.display = "none";
                        }
                    } catch (error) {
                        console.error("Error parsing geometry for file:", filename, "Error:", error);
                        return;
                    }
                })();
            }
            
            const mesheslength = Object.keys(fileBuffers).length;
            document.querySelector(".animationController #animateSlider").max = Math.floor(mesheslength / 2 - 1);
            document.querySelector(".animationController #animateSlider").value = 0;
            document.querySelector(".animationController #maxStep").innerHTML = Math.floor(mesheslength / 2 );
            document.querySelector(".animationController #currentStep").innerHTML = 1;

		})
        .catch (error => {

            return;
        })
    } else {
        Gloader.load(url, function (geometry) {
            geometry.computeVertexNormals();
            let material
            if(extension == "stl") {
                material = new MeshPhongMaterial({ color: 0x33ccff, emissive: 5, shininess : 5, side: DoubleSide});
            }else if (geometry.attributes.color) {
                material = new MeshPhongMaterial({ vertexColors: true, emissive: 5, shininess : 5, side: DoubleSide });
            } else {
                material = new MeshPhongMaterial({ color: 0xdddddd, emissive: 5, shininess : 5, side: DoubleSide });
            }
    
            const mesh = new Mesh(geometry, material);
            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox;
            const center = bbox.getCenter(new Vector3());
            mesh.position.sub(center);
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