import { Group, PointLight, AmbientLight, HemisphereLight } from 'three';

class BasicLights extends Group {
    constructor(...args) {
        // Invoke parent Group() constructor with our args
        super(...args);

        const point = new PointLight(0xaaaaaa, 0.3, 0);
        const hemi = new HemisphereLight(0xaa99cc, 0x7a6699, 0.5);


        this.add(hemi, point);
    }
}

export default BasicLights;
