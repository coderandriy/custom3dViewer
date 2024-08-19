jQuery(document).ready(function ($) {
    /**
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
    var encodedfileUrl = '', Gurlarray = [];
    // loadedMeshes = {}, cameras = {};
});

var loadedMeshes = {}, meshPlay, cameras = {}, teethInfo = {}, transInfo={}, maxStep = {}, minStep = {}, centerPoint = {};

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
    if(url.slice(-3) == "pac") {
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
    }
    if(url.slice(-3) == "zip") {
        let transInfo4this = transInfo[url];
        let meshes4this = loadedMeshes[url], upperTissues = {}, lowerTissues = {};
        for(let key in meshes4this) {
            let slicedname = key.slice(-17);
            if(slicedname.includes("UpperTissue")){
                upperTissues[`step${slicedname.replace(/\D/g, "")}`] = meshes4this[key]
            }
            if(slicedname.includes("LowerTissue")){
                lowerTissues[`step${slicedname.replace(/\D/g, "")}`] = meshes4this[key]
            }
            meshes4this[key].visible = false;
        }

        let upperteeth = teethInfo[url].filter(item => item.number < 17);
        let lowerteeth = teethInfo[url].filter(item => item.number > 16);
        let upperMesh = (upperTissues[`step${meshnumber}`] != undefined) ? upperTissues[`step${meshnumber}`] : upperTissues[`step${minStep[url] - 1}`];
        let lowerMesh = (lowerTissues[`step${meshnumber}`] != undefined) ? lowerTissues[`step${meshnumber}`] : lowerTissues[`step${minStep[url] - 1}`];

        for(let stepn = 0; stepn < Number(meshnumber); stepn++) {
            let initTransform = transInfo4this[`step${stepn}`];
            // let initTransform = transInfo4this[`step${meshnumber}`];
            for(let stepsub = 0 ; stepsub < initTransform.length; stepsub++) {
                let toothNumber2Transform = initTransform[stepsub].toothNumber;
                let tooth2Transform = teethInfo[url].filter(item => item.number == toothNumber2Transform)[0];
                let transMatrixArray, transMatrix4;
                if(initTransform[stepsub].ToothTransform != undefined) {
                    transMatrixArray = initTransform[stepsub].ToothTransform;
                    let mesh2Transform = loadedMeshes[url][tooth2Transform.toothName];
                    mesh2Transform.position.set(0, 0, 0);
                    mesh2Transform.rotation.set(0, 0, 0);
                    mesh2Transform.scale.set(1, 1, 1);
                    transMatrix4 = new Matrix4().fromArray(transMatrixArray);
                    transMatrix4.transpose();
                    mesh2Transform.applyMatrix4(transMatrix4);
                }
                if(initTransform[stepsub].AttachmentTransform1 != undefined) {
                    transMatrixArray = initTransform[stepsub].AttachmentTransform1;
                    let mesh2Transform = loadedMeshes[url][tooth2Transform.att1];
                    mesh2Transform.position.set(0, 0, 0);
                    mesh2Transform.rotation.set(0, 0, 0);
                    mesh2Transform.scale.set(1, 1, 1);
                    transMatrix4 = new Matrix4().fromArray(transMatrixArray);
                    transMatrix4.transpose();
                    mesh2Transform.applyMatrix4(transMatrix4);
                    mesh2Transform.updateMatrixWorld(true);
                }
                if(initTransform[stepsub].AttachmentTransform2 != undefined) {
                    transMatrixArray = initTransform[stepsub].AttachmentTransform2;
                    let mesh2Transform = loadedMeshes[url][tooth2Transform.att2];
                    mesh2Transform.position.set(0, 0, 0);
                    mesh2Transform.rotation.set(0, 0, 0);
                    mesh2Transform.scale.set(1, 1, 1);
                    transMatrix4 = new Matrix4().fromArray(transMatrixArray);
                    transMatrix4.transpose();
                    mesh2Transform.applyMatrix4(transMatrix4);
                    mesh2Transform.updateMatrixWorld(true);
                }

            }
        }
        if(buttonCheck == 3) {
            changeDisplayMode(upperteeth, true, url);
            changeDisplayMode(lowerteeth, true, url);
            upperMesh.visible = true;
            lowerMesh.visible = true;
        } else if (buttonCheck == 2) {
            changeDisplayMode(upperteeth, true, url);
            changeDisplayMode(lowerteeth, false, url);
            upperMesh.visible = true;
            lowerMesh.visible = false;
        } else if(buttonCheck == 1) {
            changeDisplayMode(upperteeth, false, url);
            changeDisplayMode(lowerteeth, true, url);
            upperMesh.visible = false;
            lowerMesh.visible = true;
        }
    }
    
    document.querySelector('div[data-url="'+ url +'"] .animationController .currentStep').innerHTML = Number(meshnumber) + 1;
}

function changeDisplayMode(teeth, visible, url) {
    for( let ccd = 0; ccd < teeth.length; ccd++) {
        loadedMeshes[url][teeth[ccd].toothName].visible = visible;
        if(teeth[ccd].att1 != null) {
            loadedMeshes[url][teeth[ccd].att1].visible = visible;
        }
        if(teeth[ccd].att2 != null) {
            loadedMeshes[url][teeth[ccd].att2].visible = visible;
        }
    }

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
    let camera, scene, renderer, controls, Gloader, transformControl;
    
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
    // camera = new PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    scene = new Scene();
    scene.background = new Color(0xffffff);

    // Lights
    if (extension == "stl") {
        const keyLight = new DirectionalLight(0xffffff, 2.5);
        keyLight.position.set(-10, 10, 35);
        scene.add(keyLight);

        const fillLight = new DirectionalLight(0xffffff, 2.5);
        fillLight.position.set(20, 10, 25);
        scene.add(fillLight);

        const backLight = new DirectionalLight(0xffffff, 3.5);
        backLight.position.set(2, -65, 30);
        scene.add(backLight);

        const ambientLight = new AmbientLight(0x85E5FF, 0.2);
        scene.add(ambientLight);

        const dbackLight12 = new DirectionalLight(0xffffff, 2.5);
        dbackLight12.position.set(-30, 10, -35);
        scene.add(dbackLight12);

        const dbackLight2 = new DirectionalLight(0xffffff, 2.5);
        dbackLight2.position.set(30, 10, -35);
        scene.add(dbackLight2);

    } else {

        const keyLight = new DirectionalLight(0xffffff, 1.5);
        keyLight.position.set(0, 0, 70);
        scene.add(keyLight);
    
        const backLight3 = new DirectionalLight(0xffffff, 1.5);
        backLight3.position.set(0, -100, 30);
        scene.add(backLight3);
    
        const backLight4 = new DirectionalLight(0xffffff, 1.5);
        backLight4.position.set(200, -100, 30);
        scene.add(backLight4);
    
        const backLight = new DirectionalLight(0xffffff, 1.5);
        backLight.position.set(-200, -100, 30);
        scene.add(backLight);
    
        const backLight2 = new DirectionalLight(0xffffff, 1.5);
        backLight2.position.set(0, 100, -30);
        scene.add(backLight2);
    
        const dbackLight12 = new DirectionalLight(0xffffff, 1.5);
        dbackLight12.position.set(0, 0, -30);
        scene.add(dbackLight12);
        
        const ambientLight = new AmbientLight(0x85E5FF, 0.2);
        scene.add(ambientLight);
    }

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

    renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth-4, container.clientHeight);		//Indicate parent div width and height
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    controls = new ArcballControls(camera, renderer.domElement, scene);
    controls.setGizmosVisible(false); // Optional: Show control gizmos

    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.minZoom = 0.5;
    controls.maxZoom = 5;

    // controls = new OrbitControls(camera, renderer.domElement)
    // controls.enableDamping = true;

    // transformControl = new TransformControls(camera, renderer.domElement);
    // scene.add(transformControl);
    // renderer.domElement.addEventListener('click', onMouseClick, false);
    
    let tempModels = []
    // let tempGroup = new Group();
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
    } else if(extension == "zip") {
        document.querySelector('div[data-url="'+ url +'"] .loadingScreen').style.display = "flex";
        
        fetchAndUnzip(url)
		.then((result) => {
            loadedMeshes[url] = {}
            maxStep[url] = 0;
            centerPoint[url] = [0, 0, 0];
            const entries = Object.entries(fileBuffers);
            // Load mainfest XML file
            let manifestFileName = Object.keys(fileBuffers).filter(key => key.toLowerCase().includes('xml'));
			let textDecorder = new TextDecoder('utf-8');
			let textContent = textDecorder.decode(fileBuffers[manifestFileName]);
			textContent = textContent.replace('/>', '>');
			textContent += '</RootNode>';
			var parser = new DOMParser();
			xmlDoc = parser.parseFromString(textContent, 'text/xml');
			XMLobject = xmlDoc.documentElement.children;

			console.log("XML output", xmlDoc, XMLobject)
			let collectionArray = Array.from(XMLobject);
			let upperSteps = collectionArray.filter(item => item.nodeName.toLowerCase() === 'upperstep');
			let lowerSteps = collectionArray.filter(item => item.nodeName.toLowerCase() === 'lowerstep');

            maxStep[url] = upperSteps.length > lowerSteps.length ? upperSteps.length : lowerSteps.length;
            minStep[url] = upperSteps.length < lowerSteps.length ? upperSteps.length : lowerSteps.length;

            teethInfo[url] = [];
            transInfo[url] = {};

            let upperinit = upperSteps[0].children;
			for(i = 0; i < upperinit.length; i++) {
				let tooth_stlfilename = upperinit[i].getAttribute('Tooth_STLFile');
				let attr1_stlfilename = upperinit[i].getAttribute('Attachment_STLFile1');
				let attr2_stlfilename = upperinit[i].getAttribute('Attachment_STLFile2');
				let temp = {
					number : upperinit[i].getAttribute('ToothNumber'),
					toothName : tooth_stlfilename.replace(/\\/g, "/"),
					att1 : attr1_stlfilename == null ? null : attr1_stlfilename.replace(/\\/g, "/"),
					att2 : attr2_stlfilename == null ? null : attr2_stlfilename.replace(/\\/g, "/")
				}
				teethInfo[url].push(temp);
			}
			let lowerinit = lowerSteps[0].children;
			for(i = 0; i < lowerinit.length; i++) {
				let tooth_stlfilename = lowerinit[i].getAttribute('Tooth_STLFile');
				let attr1_stlfilename = lowerinit[i].getAttribute('Attachment_STLFile1');
				let attr2_stlfilename = lowerinit[i].getAttribute('Attachment_STLFile2');
				let temp = {
					number : lowerinit[i].getAttribute('ToothNumber'),
					toothName : tooth_stlfilename.replace(/\\/g, "/"),
					att1 : attr1_stlfilename == null ? null : attr1_stlfilename.replace(/\\/g, "/"),
					att2 : attr2_stlfilename == null ? null : attr2_stlfilename.replace(/\\/g, "/")
				}
				teethInfo[url].push(temp);
			}

            for(i = 0; i < maxStep[url]; i++) {
				transInfo[url][`step${i}`] = [];
			}
			for(i = 0; i < collectionArray.length; i++) {
				let istep = collectionArray[i].children;
				for(j = 0; j < istep.length; j++) {
					if(istep[j].children.length > 0) {
						let temp = {};
						temp.toothNumber = istep[j].getAttribute('ToothNumber');
						let transfromChildren = istep[j].children;
						for( k = 0; k < transfromChildren.length; k++) {
							temp[transfromChildren[k].nodeName] = [];
							for(matrixcounter = 0; matrixcounter < 16; matrixcounter++) {
								temp[transfromChildren[k].nodeName].push(parseFloat(transfromChildren[k].getAttribute(`m${matrixcounter}`)))
							}
						}
						transInfo[url][`step${istep[j].getAttribute('StepNumber')}`].push(temp);
					}
				}
			}

            
            for (const [index, [filename, buffer]] of entries.entries()) {
                if(!filename.includes('.xml')) {
                        try {
                            let slicedname = filename.split("/").slice(-1)[0];
                            if(filename.slice(-3) == "stl");
                                Gloader = stlLoader;
                            const geometry = Gloader.parse(buffer);

                            let transMatrixArray, transMatrix4;
                            let initTransform = transInfo[url].step0;
                            if(!slicedname.includes('erTissue')) {
                                let toothobj = teethInfo[url].find(item => item.toothName == filename)
                                let attr1obj =  teethInfo[url].find(item => item.att1 == filename)
                                let attr2obj =  teethInfo[url].find(item => item.att2 == filename)
                                if(toothobj != undefined) {
                                    transMatrixArray = (initTransform.find(item => item.toothNumber == toothobj.number)).ToothTransform;
                                }
                                if(attr1obj != undefined) {
                                    transMatrixArray = (initTransform.find(item => item.toothNumber == attr1obj.number)).AttachmentTransform1;
                                }
                                if(attr2obj != undefined) {
                                    transMatrixArray = (initTransform.find(item => item.toothNumber == attr2obj.number)).AttachmentTransform2;
                                }
                                transMatrix4 = new Matrix4().fromArray(transMatrixArray);
                                transMatrix4.transpose();
                            }
                            
                            let material;
                            if (geometry.attributes.color) {
                                material = new MeshPhongMaterial({ vertexColors: true, side: DoubleSide });
                            } else {
                                if(slicedname.includes("attachment")) {
                                    material = new MeshPhysicalMaterial({
                                        color: 0xF95E5E,
                                        side: DoubleSide,
                                        flatShading: false,
                                        roughness: 0.,
                                        reflectivity: 1,
                                        metalness: 0.3,
                                    })
                                } else if(slicedname.includes("erTissue")) {
                                    material = new MeshPhysicalMaterial({
                                        color: 0xff5555,
                                        side: DoubleSide,
                                        roughness: 0.4,
                                        reflectivity: 0.1,
                                        metalness: 0.4,
                                    });
                                } else {
                                    material = new MeshPhysicalMaterial({
                                        color: 0xffffff,
                                        side: DoubleSide,
                                        reflectivity: 8,
                                        //  transmission:4,
                                        clearcoat: 1,
                                        //   shininess: 30,
                                        roughness: 0.0,
                                        metalness: 0.2,
                                        //  emissive: 0x999999,
                                    });
                                }
                            }
                
                            material.reflectivity = 0.7; // Example value for reflectivity
    
                            // Adding specular highlights
                            material.shininess = 10; // value for shininess
                            material.flatShading = false;
                            material.needsUpdate = true;
    
                            const mesh = new Mesh(geometry, material);

                            if(!slicedname.includes('erTissue')) {
                                mesh.applyMatrix4(transMatrix4);
                            }
                
                            geometry.computeBoundingBox();
                            const bbox = geometry.boundingBox;
                            mesh.castShadow = true;
                
                            tempModels.push(mesh);
                            // tempGroup.add(mesh);
                            scene.add(mesh);
                            
                            if((slicedname.replace(/\D/g, "") != 0) && slicedname.includes('Tissue')) {
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
                }
            }
            const box = new Box3();
            const tempBox = new Box3();

            tempModels.forEach(model => {
                tempBox.setFromObject(model);
                box.union(tempBox);
                // model.addEventListener('click', () => {
                //     transformControl.attach(model);
                // });
                // transformControl.addEventListener('objectChange', () => {
                //     console.log('Object transformed:', model.position, model.rotation, model.scale);
                // })
            });

            // let tempBBox = new Box3().setFromObject(tempGroup);
            // let tempCenter = tempBBox.getCenter(new Vector3());
            // tempGroup.position.sub(tempCenter);

            let tempCenter = box.getCenter(new Vector3());
            camera.lookAt(tempCenter);
            controls.target.copy(tempCenter);
            controls.update();

            centerPoint[url] = [tempCenter.x, tempCenter.y, tempCenter.z]

            document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider').max = maxStep[url] - 1;
            document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider').value = 0;
            document.querySelector('div[data-url="'+ url +'"] .animationController .maxStep').innerHTML = maxStep[url];
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
                material = new MeshPhongMaterial({ color: 0x2E75B6, side: DoubleSide});
                material.specular = new Color(0x2E75B6);
            }else if (geometry.attributes.color) {
                material = new MeshPhongMaterial({ vertexColors: true, side: DoubleSide });
            } else {
                material = new MeshPhongMaterial({ color: 0x2E75B6, side: DoubleSide });
            }

            // Adjusting environment light
            if(extension == "stl"){
                material.specular = new Color(0x3382C9);
                material.shininess = 5;
            }
			material.reflectivity = 0.1;
			material.metalness = 0;
			material.roughness = 0;
            // material.IOR = 1.2;
            material.flatShading = false;
            // material.needsUpdate = true;
    
            const mesh = new Mesh(geometry, material);
            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox;
            const center = bbox.getCenter(new Vector3());
            mesh.position.sub(center);
            if( extension == 'ply') {
                const box = new Box3().setFromObject(mesh);
                mesh.rotation.z += Math.PI;
                const center = box.getCenter(new Vector3());
                mesh.position.sub(center);
            }
			mesh.castShadow = true;
            scene.add(mesh);
        });
    }


    let initialDistance = null;
    let initialZoom = camera.zoom;

    // transformControl.addEventListener('dragging-changed', function (event) {
    //     controls.enabled = !event.value;
    // });

    window.addEventListener('touchmove', function(event) {
        if (event.touches.length === 2) {
            const dx = event.touches[0].pageX - event.touches[1].pageX;
            const dy = event.touches[0].pageY - event.touches[1].pageY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (initialDistance) {
                const zoomFactor = distance / initialDistance;
                camera.zoom = Math.min(Math.max(initialZoom * zoomFactor, controls.minZoom), controls.maxZoom);
                camera.updateProjectionMatrix();
            } else {
                initialDistance = distance;
                initialZoom = camera.zoom;
            }
        }
    }, false);
    
    window.addEventListener('touchend', function(event) {
        if (event.touches.length < 2) {
            initialDistance = null;
            initialZoom = camera.zoom;
        }
    }, false);


    cameras[url] = camera


    window.addEventListener('resize', onWindowResize);

    // container.addEventListener('keydown', function (event) {
    //     switch (event.key) {
    //         case 'w': // Translate mode
    //             transformControl.setMode('translate');
    //             break;
    //         case 'e': // Rotate mode
    //             transformControl.setMode('rotate');
    //             break;
    //     }
    // });

    function onWindowResize() {

        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(container.clientWidth, container.clientHeight);

    }

    function animate() {
        const timer = Date.now() * 0.0003;
        renderer.render(scene, camera);

    }

    function onMouseClick(event) {
        const mouse = new Vector2();
        mouse.x = (event.clientX / container.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / container.clientHeight) * 2 + 1;

        const raycaster = new Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(tempModels);

        if (intersects.length > 0) {
            selectedObject = intersects[0].object;
            transformControl.attach(selectedObject);
        } else {
            transformControl.detach();
        }

    }
}

function setCameraPosition(event) {
    var target = event.target;
    var tagetUrl = target.parentElement.parentElement.getAttribute('data-url');
    var cameraController = cameras[tagetUrl];
    var cameralookAt = [0, 0, 0];
    if(tagetUrl.slice(-3) == "zip") {
        cameralookAt = centerPoint[tagetUrl];
    }
    switch (target.classList[0]) {
        case 'rightbtn':
            cameraController.position.set(cameralookAt[0] - 70, cameralookAt[1], cameralookAt[2]);
            cameraController.up.set(0, 0, 1);
            break;
        case 'leftbtn':
            cameraController.position.set(cameralookAt[0] + 70, cameralookAt[1], cameralookAt[2]);
            cameraController.up.set(0, 0, 1);
            break;
        case 'frbtn':
            cameraController.position.set(cameralookAt[0], cameralookAt[1] - 70, cameralookAt[2]);
            cameraController.up.set(0, 0, 1);
            break;
        case 'upbtn':
            cameraController.position.set(cameralookAt[0], cameralookAt[1], cameralookAt[2] - 70);
            cameraController.up.set(0, -1, 0);
            break;
        case 'downbtn':
            cameraController.position.set(cameralookAt[0], cameralookAt[1], cameralookAt[2] + 70);
            cameraController.up.set(0, 1, 0);
            break;
        default:
            break;
    }
    cameraController.lookAt(cameralookAt[0], cameralookAt[1], cameralookAt[2]);


}