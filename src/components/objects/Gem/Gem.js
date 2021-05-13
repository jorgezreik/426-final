import { Mesh, MeshPhongMaterial, Vector3, Quaternion, DoubleSide } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';


const _gems = ['./src/components/objects/Gem/gem1.obj',
                './src/components/objects/Gem/gem2.obj',
                './src/components/objects/Gem/gem3.obj',
                './src/components/objects/Gem/gem4.obj',
                './src/components/objects/Gem/gem5.obj'];

// Color palette from:
// https://www.color-hex.com/color-palette/25406
const _colors = ['#8cd9ff',
                 '#6caddf',
                 '#3a55b4',
                 '#b5e7ee',
                 '#2190e3'];

const _objUp = new Vector3();
const _up = new Vector3();
const _quaternion= new Quaternion();

class Gem {
    constructor(scene, position) {

        const loader = new OBJLoader();
        this.name = 'Gem';
        this.scene = scene;
        this.position = position;
        const rand = Math.floor(Math.random() * 5);

        const mat = new MeshPhongMaterial({
            color: _colors[rand],
            shininess: 10,
            reflectivity: 10,
            specular: 10,
            side: DoubleSide
        });
        mat.flatShading = true;

        loader.load(_gems[rand], (obj) => {
            this.obj = obj;
            this.obj.traverse( function( child ) {
                if ( child instanceof Mesh ) {
                    child.material = mat;  
                }
            } );
            _up.copy(position).normalize();
            this.obj.quaternion.setFromUnitVectors(this.obj.up, _up.multiplyScalar(-1));
            this.obj.up.copy(_up);
            this.obj.position.copy(this.position);
            this.scene.add(this.obj);
            this.scene.addToUpdateList(this);
        });
        
        this.remove = function() {
            this.scene.remove(obj);
        }
    }

    update(timeStamp) {
        if (this.lastTime === undefined) {
            this.lastTime = timeStamp;
            return;
        }
        // In seconds
        const timeElapsed = (timeStamp - this.lastTime) / 1000;

        this.obj.rotateY(2 * timeElapsed);

        this.lastTime = timeStamp;
    }
}


class GemGenerator {
    constructor(scene) {

        this.scene = scene;
        this.maxGemCount = 10;
        
        this.gemLifeSpan = 60; // 60 seconds
        this.gems = [];

        for (let i = 0; i < this.maxGemCount; i++) {
            const position = new Vector3();
            if (i != 0) position.set((Math.random()-0.5)*50, (Math.random()-0.5)*50, (Math.random()-0.5)*50)
            this.gems.push(new Gem(this.scene, position));
        }

        this.pickup = function() {

        }

    }

    update(timeStamp) {


    }
}

export default GemGenerator;
