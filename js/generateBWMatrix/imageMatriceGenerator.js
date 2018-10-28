/*
* This is a little kludgey as the purpose changed halfway in
*/

function dump(obj) {
    /*
    * output the matrix by hand
    * 
    */
    var out = '';
    for (var i in obj) {
        out += obj[i] + "]\n[";
    }
    out = out.substring(0, out.length - 3);
    var pre = document.createElement('div');
    pre.innerHTML = "[[" + out + "]]";
    document.getElementById('test-output').appendChild(pre)
}

class targetImage {
    constructor(imageNode){
        this.height = imageNode.offsetHeight;
        this.width = imageNode.offsetWidth;
        this.node = imageNode;
        this.node.crossOrigin = "anonymous";
        this.data = null; 
    }

    setData(data){  
        /*
        * Sets data equal to a binary matrix of the image
        */
        const luminosity = [0.2126, 0.7152, 0.0722];
        var newData = []
        var cumulativeLuminosity = 0; // For RGB
        var cn = 0; // For tracking whether we're RGB or A
        for ( let [key,value] of data.entries() ) {
            var newValue = value;
            if (typeof(key) == "number") {
                if (cn % 4 !== 0) { // Ignore alpha ( 4th int )
                    cumulativeLuminosity = cumulativeLuminosity + value;
                } else {
                    cn = 0; // reset
                    if (cumulativeLuminosity > 0) {
                        newData.push(1);
                    } else {
                        newData.push(0);
                    } 
                    cumulativeLuminosity = 0;
                } 
            }
            cn++;
        };
        this.data = this.convertToMatrix(newData);
    }

    convertToMatrix(flatArray){
        var matrixArray = flatArray.reduce((rows, key, index) => (index % this.width == 0 ? rows.push([key]) 
            : rows[rows.length-1].push(key)) && rows, []);
        return matrixArray
    }


}

class matrixCanvas{
    /* A bit of extra kludge in here incase it's extended to handle multiple images */
    constructor(){
        var image = document.querySelectorAll('*[data-image-target]')[0];
        this.image = new targetImage(image);
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext("2d");

        this.getCanvas(); // build a canvas
        this.drawImage(); // Put an image on it
        this.setImageData(); // Process image data
    }

    getMatrix(){
        return this.image.data;
    }

    demo(){
        /* code specifically for running the demo page */
        this.testCanvas = document.getElementById('demo-canvas');
        this.testCanvas.appendChild(this.canvas); // append our internal canvas to the document
        this.canvas.style.display = "block";
        const body = document.getElementById("demo-canvas");
        body.appendChild(this.canvas);
        dump(this.image.data);
    }

    getCanvas(){
        /* Creates a canvas element and adds it to the DOM */
        this.canvas.id="matrix-canvas";
        this.canvas.width = this.image.width;
        this.canvas.height = this.image.height;
        this.canvas.style.display = "none";
    }

    clear(){
        /* clear the canvas */
        this.context.fillStyle = "#ffffff";
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawImage(){
        this.context.drawImage(this.image.node, 0, 0);
    }

    setImageData(){
        var imgData = this.context.getImageData(0,0,this.image.width, this.image.height);
        this.image.setData(imgData.data);
    }

}

