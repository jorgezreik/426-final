import { PerspectiveCamera, Vector3, Quaternion, Euler } from 'three';

const _zero = new Vector3(0, 0, 0);
const _vector = new Vector3(0, 0, 0);
const _quaternion = new Quaternion();

class CameraController {
    constructor() {
        this.camera = new PerspectiveCamera(90);
        this.up = this.camera.up;
    }

    handleResize(innerWidth, innerHeight) {
        this.camera.aspect = innerWidth / innerHeight;
        this.camera.updateProjectionMatrix();
    }

    update(position) {
        _vector.subVectors(_zero, position).normalize();

        this.camera.position.set(0, 0, 0);
    
        this.camera.applyQuaternion(
            _quaternion.setFromUnitVectors(this.up, _vector)
        );
    
        this.up.copy(_vector);

        this.camera.position.set(position.x, position.y, position.z);
    }
}

export default CameraController;
