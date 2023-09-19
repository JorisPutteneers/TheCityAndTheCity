import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js'
import {    OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js'


var scene = new THREE.Scene();
scene.rotation.x = 0.6;
scene.position.z = -10;

var threeDiv = document.getElementById('three')

var screenDiv = document.getElementById('screen')
var headerDiv = document.getElementById("header");

// Create an orthographic camera with adjusted frustum size
const aspectRatio = threeDiv.offsetWidth / threeDiv.offsetHeight;
const zoomFactor = 3; // Adjust this value to control the zoom level
const frustumSize = 30 / zoomFactor;
const camera = new THREE.OrthographicCamera(
    frustumSize * aspectRatio / -2,
    frustumSize * aspectRatio / 2,
    frustumSize / 2,
    frustumSize / -2,
    0.1,
    1000
);


var planeHeight = 0.032;
// Create a renderer
const renderer = new THREE.WebGLRenderer({
    alpha: true
});
renderer.setSize(threeDiv.offsetWidth, threeDiv.offsetHeight);
threeDiv.appendChild(renderer.domElement);



// Create OrbitControls

const controls = new OrbitControls(camera, renderer.domElement);

// Enable zoom
// controls.enableZoom = true;
// controls.enableZoom = false;
controls.enablePan = true;
controls.enableRotate = true;

const projectName = "theCityAndtheCity"  // name of the project ansd also the name of the html file that is loaded up

let zoomLevel = 1.0; // Initial zoom level
const zoomIncrement = 0.2;

function handleMouseWheel(event) {
    event.preventDefault();
    // Calculate the direction of the scroll
    const delta = Math.sign(event.deltaY);
    // Update the zoom level based on the scroll direction
    zoomLevel -= delta * zoomIncrement;
    // Clamp the zoom level within the desired range
    zoomLevel = Math.max(0.5, Math.min(4, zoomLevel));
    camera.zoom = zoomLevel;
    camera.updateProjectionMatrix();
}
// Add the mouse wheel event listener
document.addEventListener("wheel", handleMouseWheel, {
    passive: false
});



// threeDiv.style.display = "none"   
var planesByStack = []

function createStacksOfPlanes(students) {

    
// make a loader div


var imageWidth = 100


const verses = ['bricks layed', 'stacks stacked','images rendered','blocks build','cities build','images curated']
const randomVerses = verses[Math.floor(Math.random() * verses.length)]
// make a loading screen function


function loadImagesAsync(imageUrls) {
    return new Promise((resolve) => {
        const loader = new THREE.TextureLoader();
        const loadedTextures = [];

        let loadedCount = 0;
        let screenDivContent = '.'
        const allImageUrls = Math.floor(imageUrls.length)
        const rootAllImageUrls = Math.ceil(Math.sqrt(allImageUrls)+1)

        for (const url of imageUrls) {
            loader.load(url, (texture) => {
                loadedTextures.push(texture);
                
                loadedCount++;
                screenDivContent += '.'
                if(screenDivContent.length%(rootAllImageUrls)==0){
                    screenDivContent +='<br>'
                }
                
                // let loadingAnimationContent =  '<img id="loading" src="loading.gif"></img>' 
                screenDiv.innerHTML ='building city <br>' + (loadedCount-1) + '/' + (allImageUrls-1)  + '<br>' +screenDivContent + '<br>' + ((loadedCount-1)/(allImageUrls-1)*100) + '%'

                if (loadedCount === allImageUrls) {
                    resolve(loadedTextures);

                }   
            });
        }
    });
}



// Get an array of all image URLs used in the stacks
const imageUrls = [];


for (const student of Object.values(students)) {
    for (const content of student) {
        imageUrls.push(content);

    }
}


// Call the loader to load all the images
loadImagesAsync(imageUrls)
    .then(() => {

        // var loadingDiv = document.getElementById("loading")
        // loadingDiv.style.display = "none"
    });





    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }

    
    var activeStack = -1;
    var activePlanes = [];


    // Clear existing span elements
    var existingSpans = document.getElementsByTagName("span");
    for (var i = existingSpans.length - 1; i >= 0; i--) {
        existingSpans[i].remove();
    }

    var stackCount = Object.keys(students).length;
    var stackDistance = 1.0;
    var gridWidth = Math.floor(Math.sqrt(stackCount)); // Number of stacks per row

    var offsetX = (gridWidth - 1) * stackDistance * 0.5;
    var offsetZ = (Math.ceil(stackCount / gridWidth) - 1) * stackDistance * 0.5;

    for (var i = 0; i < stackCount; i++) {
        // scene.add(new THREE.GridHelper(4, 4));// Create a grid helper

        var x = i % gridWidth;
        var z = Math.floor(i / gridWidth);

        var student = Object.keys(students)[i];
        var content = students[student];
        var itemCount = content.length;

        var boundingboxOffset = 0.1
        var boundingBoxGeometry = new THREE.BoxGeometry(1 + boundingboxOffset, itemCount * planeHeight, 1 + boundingboxOffset); // Adjust the size as needed
        var boundingBoxMaterial = new THREE.MeshBasicMaterial({ color: "white", opacity: 0.5, transparent: true, wireframe:true });
        var boundingBox = new THREE.Mesh(boundingBoxGeometry, boundingBoxMaterial);
        boundingBox.visible = false; 
        scene.add(boundingBox);

        for (var j = 0; j < itemCount; j++) {

            var isGif = content[j].includes("gif");
            // console.log(isGif);
            var textureLoader = new THREE.TextureLoader();
            var texture;

            if (isGif) {
                // Load the image as a vertical animation
                texture = textureLoader.load(content[j], function(texture) {

                    var totalFrames = 10;

                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(1, 1 / totalFrames);

                    var frameDuration = 200; // Adjust as needed
                    var currentFrame = 0;
                    var frameTimer = setInterval(function() {
                        currentFrame = (currentFrame + 1) % totalFrames;
                        texture.offset.y = 1 - (currentFrame / totalFrames);
                    }, frameDuration);
                });
            } else {
                // Load regular image
                texture = textureLoader.load(content[j]);
            }
            //   texture = textureLoader.load(content[j]);
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;

            

            var geometry = new THREE.PlaneGeometry(1, 1);
            var material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide,
                transparent: true,
                opacity:1,
            });


        

            var plane = new THREE.Mesh(geometry, material);

            var posX = (x * stackDistance) - offsetX;
            var posZ = (z * stackDistance) - offsetZ;

            plane.position.set(posX, j * planeHeight, posZ);
            plane.rotation.x = Math.PI / 2;
            plane.rotation.y = Math.PI; // Turn 180 so facing top
            plane.rotation.z = Math.PI ;
            scene.add(plane);
            
            

            boundingBox.position.set(posX, j/2 * planeHeight, posZ);
            boundingBox.name = student;
            // console.log(boundingBox.name);


            if (!planesByStack[i]) {
                planesByStack[i] = [];
            }
            planesByStack[i].push(plane);

            
            
            if (j === itemCount - 1) {
                // console.log(i);
                var planeWorldPosition = new THREE.Vector3();
                plane.getWorldPosition(planeWorldPosition);

                var planeScreenPosition = planeWorldPosition.clone();
                planeScreenPosition.project(camera);

                var span = document.createElement('span');
                span.style.position = 'absolute';
                span.style.display = "block"
                // span.style.color = 'white';
                
                span.style.left = ((planeScreenPosition.x + 1) / 2) * window.innerWidth + 'px';
                span.style.top = ((-planeScreenPosition.y + 1) / 2) * window.innerHeight + 'px';
                


                const countSpan = document.createElement("code");


                span.textContent = student;


                countSpan.textContent = " ";
                countSpan.textContent += itemCount - 1;
                
                const emojis = ['😢', '😞', '🤢', '🙁', '😐', '😌', '😊', '🙂', '😄', '😃', '😍', '😀', '🌧️', '⛅️', '🌦️', '🌞', '🌺', '🌸', '🌼', '🌈', '🎵', '🎶', '💔', '💩', '🚫', '🔥', '🤕', '🤮', '👎', '👿', '🧟', '😎', '😇', '🥰', '🥳', '🎉', '🎈', '🎁', '🍔', '🍕', '🍦', '🍩', '🍓', '🥗', '🏖️', '🌴', '🏞️', '🚀', '⭐️', '💖', '💯', '✨'];
                countSpan.textContent += " " + emojis[Math.min(itemCount, emojis.length-1)];
                // console.log(Math.min(itemCount, emojis.length))

 
                countSpan.style.fontSize = "9px";
                span.appendChild(countSpan);
                span.style.cursor = 'pointer';

                span.addEventListener('click', (function (stackIndex) {
                    return function () {
                        // Check if the clicked stack is already active
                        if (stackIndex === activeStack) {
                            // Reset opacity for the clicked stack
                            var planes = planesByStack[stackIndex];
                            for (var p = 0; p < planes.length; p++) {
                                planes[p].material.opacity = 1;
                            }
                            // Reset opacity for all other stacks
                            for (var s = 0; s < planesByStack.length; s++) {
                                if (s !== stackIndex) {
                                    var otherPlanes = planesByStack[s];
                                    for (var p = 0; p < otherPlanes.length; p++) {
                                        otherPlanes[p].material.opacity = 1;
                                    }
                                }
                            }
                            // Reset the active stack and its planes
                            activeStack = -1;
                            activePlanes = [];
                        } else {
                            // Reset opacity of previously altered planes
                            for (var p = 0; p < activePlanes.length; p++) {
                                activePlanes[p].material.opacity = 1;
                            }
                            // Set opacity for the clicked stack
                            var planes = planesByStack[stackIndex];
                            for (var p = 0; p < planes.length; p++) {
                                planes[p].material.opacity = 1;
                            }
                            // Set opacity to 0.5 for all other stacks
                            for (var s = 0; s < planesByStack.length; s++) {
                                if (s !== stackIndex) {
                                    var otherPlanes = planesByStack[s];
                                    for (var p = 0; p < otherPlanes.length; p++) {
                                        otherPlanes[p].material.opacity = 0.15;
                                    }
                                }
                            }
                            // Update the active stack and its planes
                            activeStack = stackIndex;
                            activePlanes = planes;
                        }
                    };
                })(i));




                var spanColor = 'rgb(100,100,100)'

                var boundingBoxVisibility = {};
                span.addEventListener('click', (function(student) {
                    return function() {

                        var isBoundingBoxVisible = false;

                        const infoDiv = document.getElementById('info');
                        const spans = document.getElementsByTagName('span'); 
                        // document.querySelectorAll("#test");
                        
                        // Check if the clicked span is already active
                        if (this.classList.contains('active')) {
                            // Revert back to the original content
                            infoDiv.innerHTML = infoDiv.originalContent;

                            // Remove the active class and set text decoration to none for all spans
                            for (let k = 0; k < spans.length; k++) {
                                spans[k].classList.remove('active');
                                spans[k].style.textDecoration = 'none';
                                spans[k].style.color = 'white';

                                

                                
                           
    

                            }


                        } else {
                            // Store the original content if it hasn't been stored yet
                            if (!infoDiv.originalContent) {
                                infoDiv.originalContent = infoDiv.innerHTML;
                            }


                            // Set the new content and add the active class to the clicked span
                            const iframe = document.createElement('iframe');
                            iframe.src = `info/${student.replace(/ /g, "_")}.html`; //replace space by underscore so it matches the html files

                            infoDiv.innerHTML = '';
                            infoDiv.appendChild(iframe);


                            // Remove the active class and set text decoration to none for all spans
                            for (let i = 0; i < spans.length; i++) {
                                spans[i].classList.remove('active');
                                spans[i].style.textDecoration = 'none';
                                spans[i].style.color = spanColor
                                // spans[i].style.color = 'white';
                                // spans[i].style.backgroundColor = "rgba(255,255,255,0.01)"
                                // spans[i].style.backdropFilter = "unset"

                            }

                            // Add the active class and set text decoration to underline for the clicked span
                            this.classList.add('active');
                            this.style.textDecoration = 'underline';
                            this.style.color = 'white';
                            this.style.padding = '5px'
                            this.style.borderRadius = '5px '
                            // this.style.backgroundColor = "rgba(255,255,255,0.01)"
                            // this.style.backdropFilter = "blur(20px)"
                            


                            
                        }

                        for (const [studentKey, visibility] of Object.entries(boundingBoxVisibility)) {
                if (studentKey !== student) {
                    var otherBoundingBox = scene.getObjectByName(studentKey);
                    if (otherBoundingBox) {
                        otherBoundingBox.visible = false;
                        boundingBoxVisibility[studentKey] = false;
                    }
                }
            }
                            
                        // Hide the bounding box for the corresponding student (if it exists)
                        var boundingBox = scene.getObjectByName(student);
                        if (boundingBox) {
                            boundingBox.visible = !boundingBoxVisibility[student];
                            // Update the visibility status for the student's bounding box
                            boundingBoxVisibility[student] = boundingBox.visible;
                        }
                            
                    };
                })(student));

                document.getElementById("span").appendChild(span);
                plane.userData.tag = span;
            }
      
        }
    }
    


    // Calculate the maximum and minimum heights
    var boundingBox = new THREE.Box3();
    boundingBox.setFromObject(scene);
    var minHeight = boundingBox.min.y;
    var maxHeight = boundingBox.max.y;

    // Calculate the center height
    var centerHeight = (minHeight + maxHeight) / 2;

    // Adjust the position of the object to center it vertically
    scene.position.y -= centerHeight + 0.5;


}



function animate() {
    requestAnimationFrame(animate);
    scene.rotation.y += 0.001;



    // Update controls
    // controls.update();

    // Update the positions of the tags
    for (var i = 0; i < scene.children.length; i++) {
        var object = scene.children[i];
        if (object instanceof THREE.Mesh) {
            var plane = object;
            var tag = plane.userData.tag;
            if (tag) {
                var planeWorldPosition = new THREE.Vector3();
                plane.getWorldPosition(planeWorldPosition);

                var planeScreenPosition = planeWorldPosition.clone();
                planeScreenPosition.project(camera);

                tag.style.left = (planeScreenPosition.x * (renderer.domElement.clientWidth / 2)) + (renderer.domElement.clientWidth / 2) + "px";
                tag.style.top = -(planeScreenPosition.y * (renderer.domElement.clientHeight / 2)) + (renderer.domElement.clientHeight / 2) + "px";

                // console.log(((-planeScreenPosition.y + 1) / 2)   + "and this is screencoordinated  " + window.innerHeight);



                // delete if over border
                // if(    ((planeScreenPosition.x + 1) / 2) * window.innerWidth < 0 || ((-planeScreenPosition.y + 1) / 2) > 1.0){
                //     // console.log("over the border");
                //     tag.style.display = "none"

                // }


                // if tags are outside of window, delete
                if((((planeScreenPosition.x + 1) / 2) * window.innerWidth) > window.innerWidth-100 || (((-planeScreenPosition.y + 1) / 2) * window.innerHeight) < window.innerHeight* 0.01 || ((planeScreenPosition.x + 1) / 2) * window.innerWidth < 0 || ((-planeScreenPosition.y + 1) / 2) > 0.95){
                    tag.style.display = "none"

                    // if spanes go outside bottom and left, also deletre
               
                    
                }
                else{
                    tag.style.display = "block"
                    tag.style.visibility = "visible"
                }
            }
        }
    }

    renderer.render(scene, camera);
}

const info = document.getElementById("info");
for (var group in groups) {
    var groupButton = document.createElement("button");
    groupButton.innerHTML = group ;
    groupButton.classList.add("group-button");
    groupButton.style.backgroundColor = "rgba(0,0,0,0)"

    groupButton.style.fontSize = '12px';
    // groupButton.style.backdropFilter = "blur(5px)";
    // groupButton.style.backgroundColor = "blur(5px)";

    // groupButton.style.backgroundColor = 'rgba(01,200,50,0.5)';
    // groupButton.style.margin = '1px';
    // groupButton.style.border = 'border 1px; red, solid'
    // backdrop-filter: blur(5px);
    
    var newLine = document.createElement("br");

    groupButton.addEventListener("click", function() {
        var buttons = document.getElementsByClassName("group-button");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].style.textDecoration = "none";
        }

        // Add underline to the clicked button
        this.style.textDecoration = "underline";
        
        // this.style.fontWeight = 'bold';

        var selectedGroup = this.innerHTML;
        var students = groups[selectedGroup];

        if(selectedGroup === projectName){ info.innerHTML = "<iframe src='" + selectedGroup + ".html'></iframe>";}
        else{info.innerHTML = "<iframe src='./info/" + selectedGroup + ".html'></iframe>";}
        info.originalContent = info.innerHTML; // Update original content
        
        console.log(info.innerHTML);


        createStacksOfPlanes(students);
    });

    // Check if the current button is "theCityAndtheCity" and underline it on startup
    if (group === projectName) {
        groupButton.style.textDecoration = "underline";
        // groupButton.style.fontWeight = "bold";
        // groupButton.style.fontSize = '2em';
        // groupButton.style.color = 'red';
    }

    
    headerDiv.appendChild(groupButton);
    headerDiv.appendChild(newLine);
}


function onWindowResize() {
    const aspectRatio = threeDiv.offsetWidth / threeDiv.offsetHeight;
    const frustumSize = 30 / zoomFactor;
    camera.left = frustumSize * aspectRatio / -2;
    camera.right = frustumSize * aspectRatio / 2;
    camera.top = frustumSize / 2;
    camera.bottom = frustumSize / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(threeDiv.offsetWidth, threeDiv.offsetHeight);

    // Update the positions of the tags when the window is resized
    for (var i = 0; i < scene.children.length; i++) {
        var object = scene.children[i];
        if (object instanceof THREE.Mesh) {
            var plane = object;
            var tag = plane.userData.tag;
            if (tag) {
                var planeWorldPosition = new THREE.Vector3();
                plane.getWorldPosition(planeWorldPosition);

                var planeScreenPosition = planeWorldPosition.clone();
                planeScreenPosition.project(camera);

                tag.style.left = ((planeScreenPosition.x + 1) / 2) * window.innerWidth + 'px';
                tag.style.top = ((-planeScreenPosition.y + 1) / 2) * window.innerHeight + 'px';
            }
        }
    }
}
//execute on startup, pick a group and related info
// console.log(groups["city"]);
var groupArray = Object.values(groups);
// console.log(groupArray);
var randomGroup = groups[projectName]
// const info = document.getElementById("info");
// info.innerHTML = "<iframe src='test.html' seamless></iframe>"
createStacksOfPlanes(randomGroup);


animate();
window.addEventListener('resize', onWindowResize);