// ==UserScript==
 // @name         ANYI
 // @namespace    http://tampermonkey.net/
 // @version      4.0
 // @description  ANYI
 // @author       stolen from r/teslamotors
 // @match        https://hot-potato.reddit.com/embed*
 // @updateURL    https://gist.github.com/xsorifc28/e6529558e4b41a9712bac70220b3c2de/raw/placetesla.user.js
 // @downloadURL  https://gist.github.com/xsorifc28/e6529558e4b41a9712bac70220b3c2de/raw/placetesla.user.js
 // @grant        GM_xmlhttpRequest
 // @connect      raw.githubusercontent.com
 // ==/UserScript==

 (function () {
     "use strict";

     async function runScript(theCanvas) {
         setTimeout(function(){ location.reload(); }, 10 * 60 * 1000 + 12000);
         const placeApi = getPlaceApi(theCanvas);

         setTimeout(async () => {
             console.log('Running v4.0 (modified)');
             var newDiv = document.createElement('div');
             document.body.prepend(newDiv);
             newDiv.style.position = "absolute";
             newDiv.style.backgroundColor = "red";
             newDiv.style.width = "10%";
             newDiv.style.color = "white";
             newDiv.style["z-index"] = "9999";
             newDiv.innerHTML = `Place ANYI bot v${GM_info.script.version}`;
             var scriptInfo = await GM_fetch("https://raw.githubusercontent.com/zaptrem/AutoPlace/main/plots.json?" + Date.now()).then((d) => d.json());
             console.log(`Retrieved latest script info, latest version: v${scriptInfo.version}, installed version: ${GM_info.script.version}`);

             while(true) {

                 const imageData =  scriptInfo.imageData;

                 var xStart = scriptInfo.startCoords.x;
                 var yStart = scriptInfo.startCoords.y;
                 var xEnd = xStart + imageData[0].length - 1;
                 var yEnd = yStart + imageData.length - 1;

                 // console.log('Coordinates: ', xStart, yStart, 'to', xEnd, yEnd);

                 var x = getRandomNumber(xStart, xEnd);
                 var y = getRandomNumber(yStart, yEnd);
                 var selectedPixel = placeApi.getPixel(x, y);

                 // console.log('Prioritize Red', scriptInfo.redPriority);

                // console.log(`Checking x: ${x}, y: ${y}`)

                 var colorToPaint = imageData[y-yStart][x-xStart];

                 if(scriptInfo.redPriority === true) {
                     while(colorToPaint !== 2) {
                         x = getRandomNumber(xStart, xEnd);
                         y = getRandomNumber(yStart, yEnd);
                         colorToPaint = imageData[y-yStart][x-xStart];
                         await sleep(100);
                     }
                 }

                 if (colorMap[selectedPixel] !== colorToPaint) {
                     console.log(`Incorrect color - setting x: ${x}, y: ${y} to ${colorToPaint}`);
                     await placeApi.setPixel(x, y, colorToPaint);
                     scriptInfo = await GM_fetch("https://raw.githubusercontent.com/zaptrem/AutoPlace/main/plots.json?" + Date.now()).then((d) => d.json());
                     console.log(`Retrieved latest script info, latest version: v${scriptInfo.version}, installed version: ${GM_info.script.version}`);
                     await sleep(5 * 60 * 1000 + 2000); // 5 minutes and 2 seconds
                 } else {
                     // console.log(`Correct color - skipping x: ${x}, y: ${y}`)
                     await sleep(100);
                 }
             }
         }, 5000);
     }

     const colorMap = {
         "#FF450": 2,
         "#FFA80": 3,
         "#FFD635": 4,
         "#0A368": 6,
         "#7EED56": 8,
         "#2450A4": 12,
         "#3690EA": 13,
         "#51E9F4": 14,
         "#811E9F": 18,
         "#B44AC0": 19,
         "#FF99AA": 23,
         "#9C6926": 25,
         "#000": 27,
         "#898D90": 29,
         "#D4D7D9": 30,
         "#FFFFFF": 31,
     };

     const isReadyInterval = setInterval(() => {
         const theCanvas = document
             .querySelector("mona-lisa-embed")
             ?.shadowRoot?.querySelector("mona-lisa-camera")
             ?.querySelector("mona-lisa-canvas")
             ?.shadowRoot?.querySelector("canvas");

         if (theCanvas && document.querySelector("mona-lisa-embed")?.shadowRoot?.querySelector("mona-lisa-overlay")?.shadowRoot.children.length === 0) {
             clearInterval(isReadyInterval);
             runScript(theCanvas);
         }
     }, 500);

     function getPlaceApi(theCanvas) {
         const context = theCanvas.getContext("2d");

         return {
             getPixel: (x, y) => {
                 const data = context.getImageData(x, y, 1, 1).data;
                 return rgbToHex(data[0], data[1], data[2]);
             },
             setPixel: async (x, y, color) => {
                 theCanvas.dispatchEvent(createEvent("click-canvas", { x, y }));
                 await sleep(1000);
                 theCanvas.dispatchEvent(
                     createEvent("select-color", { color: color })
                 );
                 await sleep(1000);
                 theCanvas.dispatchEvent(createEvent("confirm-pixel"));
             },
         };
     }

     function createEvent(e, t) {
         return new CustomEvent(e, {
             composed: !0,
             bubbles: !0,
             cancelable: !0,
             detail: t,
         });
     }

     function sleep(ms) {
         return new Promise((response) => setTimeout(response, ms));
     }

     function rgbToHex(r, g, b) {
         return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`.toUpperCase();
     }

     function getRandomNumber(min, max) {
         return Math.floor(Math.random() * (max - min + 1) + min)
     }

     function GM_fetch(url, opt){
         function blobTo(to, blob) {
             if (to == "arrayBuffer" && blob.arrayBuffer) return blob.arrayBuffer()
             return new Promise((resolve, reject) => {
                 var fileReader = new FileReader()
                 fileReader.onload = function (event) { if (to == "base64") resolve(event.target.result); else resolve(event.target.result) }
                 if (to == "arrayBuffer") fileReader.readAsArrayBuffer(blob)
                 else if (to == "base64") fileReader.readAsDataURL(blob) // "data:*/*;base64,......"
                 else if (to == "text") fileReader.readAsText(blob, "utf-8")
                 else reject("unknown to")
             })
         }
         return new Promise((resolve, reject)=>{
             // https://www.tampermonkey.net/documentation.php?ext=dhdg#GM_xmlhttpRequest
             opt = opt || {}
             opt.url = url
             opt.data = opt.body
             opt.responseType = "blob"
             opt.onload = (resp)=>{
                 var blob = resp.response
                 resp.blob = ()=>Promise.resolve(blob)
                 resp.arrayBuffer = ()=>blobTo("arrayBuffer", blob)
                 resp.text = ()=>blobTo("text", blob)
                 resp.json = async ()=>JSON.parse(await blobTo("text", blob))
                 resolve(resp)
             }
             opt.ontimeout = ()=>reject("fetch timeout")
             opt.onerror   = ()=>reject("fetch error")
             opt.onabort   = ()=>reject("fetch abort")
             GM_xmlhttpRequest(opt)
         })
     }
 })();
