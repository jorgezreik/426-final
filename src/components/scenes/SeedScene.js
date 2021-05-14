import * as Dat from 'dat.gui';
import { Scene, Color, Fog } from 'three';
import { Planet } from 'objects';
import { GemGenerator } from 'objects';
import { BasicLights } from 'lights';

class SeedScene extends Scene {
    constructor() {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            updateList: [],
            fogColor: 0x333355,
            nearPlane: 25,
            farPlane: 125,
        };

        // Set background to a nice color
        this.background = new Color(0x120e14);

        // Add meshes to scene
        const planet = new Planet(this);
        const lights = new BasicLights();
        this.add(planet, lights);

        this.fog = new Fog(
            this.state.fogColor,
            this.state.nearPlane,
            this.state.farPlane
        );

        this.state.gui
            .addColor(this.state, 'fogColor')
            .onChange(this.updateFog.bind(this));
        this.state.gui
            .add(this.state, 'nearPlane', 0, 150)
            .onChange(this.updateFog.bind(this));
        this.state.gui
            .add(this.state, 'farPlane', 0, 150)
            .onChange(this.updateFog.bind(this));
    }

    updateFog() {
        this.fog = new Fog(
            this.state.fogColor,
            this.state.nearPlane,
            this.state.farPlane
        );
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        const { fogColor, nearPlane, farPlane, updateList } = this.state;

        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }
    }
}

export default SeedScene;
