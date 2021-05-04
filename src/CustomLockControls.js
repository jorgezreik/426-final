import {
	Euler,
	EventDispatcher,
	Vector3
} from 'three';

const _euler = new Euler( 0, 0, 0, 'YXZ' );
const _vector = new Vector3();
const _changeEvent = { type: 'change' };
const _lockEvent = { type: 'lock' };
const _unlockEvent = { type: 'unlock' };
const _PI_2 = Math.PI / 2;
const _planetCenter = new Vector3();
const _gravRotate = false;


// https://gamedev.net/forums/topic/696415-clockwise-angle-between-two-vector3/5377110/
// https://stackoverflow.com/questions/14066933/direct-way-of-computing-clockwise-angle-between-2-vectors/16544330
// https://stackoverflow.com/questions/62358681/three-js-vector-angleto-how-to-also-get-the-bigger-value
// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/
// https://stackoverflow.com/questions/52413464/look-at-quaternion-using-up-vector

class CustomLockControls extends EventDispatcher {

	constructor( camera, domElement ) {

		super();

		if ( domElement === undefined ) {

			console.warn( 'THREE.CustomLockControls: The second parameter "domElement" is now mandatory.' );
			domElement = document.body;

		}
        console.log("success");

		this.domElement = domElement;
		this.isLocked = false;

		// Set to constrain the pitch of the camera
		// Range is 0 to Math.PI radians
		this.minPolarAngle = 0; // radians
		this.maxPolarAngle = Math.PI; // radians

		const scope = this;

		function onMouseMove( event ) {

			if ( scope.isLocked === false ) return;

			const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
			const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
            _euler.setFromQuaternion(camera.quaternion);
            _euler.y -= movementX * 0.002;
			_euler.x -= movementY * 0.002;
            _euler.x = Math.max(_PI_2 - scope.maxPolarAngle, Math.min(_PI_2 - scope.minPolarAngle, _euler.x));

            /////////////////////////////////////////////////////////////////
            // Code for rotating the camera so that down in the view port 
            // corresponds to downward gravity
            if (_gravRotate) {
                const currPos = camera.getWorldPosition(new Vector3()); // camera's position
                const gravUp = new Vector3().subVectors(currPos, _planetCenter).normalize(); // Direction away from gravity
                camera.up.copy(gravUp); // Adjusts the camera's up vector so that it corresponds to the gravity
        
                // const lookAt = new Vector3(); 
                // camera.getWorldDirection(lookAt);
    
                // Calculates the side axis for the unrotated camera
                const sideAxis = new Vector3().crossVectors(new Vector3(0, 1, 0), new Vector3(0,0,-1));
                // Calculates the target side axis for the rotated camera
                const targetAxis = new Vector3().crossVectors(gravUp, new Vector3(0,0,-1));
                // Finds the angle between the two axes to rotate the camera accordingly
                const angle = sideAxis.angleTo(targetAxis);
                _euler.z = angle;
            }
            ////////////////////////////////////////////////////////////////////////////////////

			camera.quaternion.setFromEuler( _euler );
			scope.dispatchEvent( _changeEvent );
		}

		function onPointerlockChange() {

			if ( scope.domElement.ownerDocument.pointerLockElement === scope.domElement ) {

				scope.dispatchEvent( _lockEvent );

				scope.isLocked = true;

			} else {

				scope.dispatchEvent( _unlockEvent );

				scope.isLocked = false;

			}

		}

		function onPointerlockError() {

			console.error( 'THREE.PointerLockControls: Unable to use Pointer Lock API' );

		}

		this.connect = function () {

			scope.domElement.ownerDocument.addEventListener( 'mousemove', onMouseMove );
			scope.domElement.ownerDocument.addEventListener( 'pointerlockchange', onPointerlockChange );
			scope.domElement.ownerDocument.addEventListener( 'pointerlockerror', onPointerlockError );

		};

		this.disconnect = function () {

			scope.domElement.ownerDocument.removeEventListener( 'mousemove', onMouseMove );
			scope.domElement.ownerDocument.removeEventListener( 'pointerlockchange', onPointerlockChange );
			scope.domElement.ownerDocument.removeEventListener( 'pointerlockerror', onPointerlockError );

		};

		this.dispose = function () {

			this.disconnect();

		};

		this.getObject = function () { // retaining this method for backward compatibility

			return camera;

		};

		this.getDirection = function () {

			const direction = new Vector3( 0, 0, - 1 );

			return function ( v ) {

				return v.copy( direction ).applyQuaternion( camera.quaternion );

			};

		}();

		this.moveForward = function ( distance ) {

            _vector.setFromMatrixColumn( camera.matrix, 0 );
            /////////////////////////////////////////////////////////////////
            // Code for rotating the camera so that down in the view port 
            // corresponds to downward gravity
            if (_gravRotate) {
                camera.quaternion.setFromEuler(_euler);
                const currPos = camera.getWorldPosition(new Vector3()); // camera's position
                const gravUp = new Vector3().subVectors(currPos, _planetCenter).normalize(); // Direction away from gravity
                camera.up.copy(gravUp); // Adjusts the camera's up vector so that it corresponds to the gravity
        
                // const lookAt = new Vector3(); 
                // camera.getWorldDirection(lookAt);
    
                // Calculates the side axis for the unrotated camera
                const sideAxis = new Vector3().crossVectors(new Vector3(0, 1, 0), new Vector3(0,0,-1));
                // Calculates the target side axis for the rotated camera
                const targetAxis = new Vector3().crossVectors(gravUp, new Vector3(0,0,-1));
                // Finds the angle between the two axes to rotate the camera accordingly
                const angle = sideAxis.angleTo(targetAxis);
                _euler.z = angle;
                camera.quaternion.setFromEuler( _euler );

                // Calculates the direction vector using the cross product with
                // the Forward vector and the gravity up vector
                if (angle > 0)
                    _vector.crossVectors(gravUp, _vector).normalize();
                else _vector.crossVectors(gravUp, _vector).normalize().multiplyScalar(-1);
            }
            ////////////////////////////////////////////////////////////////////////////////////
            // Default behavior
            else {
			    _vector.crossVectors( camera.up, _vector );
            }

			camera.position.addScaledVector( _vector, distance );
		};

		this.moveRight = function ( distance ) {
            if (_gravRotate) {
                camera.quaternion.setFromEuler(_euler);
                const currPos = camera.getWorldPosition(new Vector3()); // camera's position
                const gravUp = new Vector3().subVectors(currPos, _planetCenter).normalize(); // Direction away from gravity
                camera.up.copy(gravUp); // Adjusts the camera's up vector so that it corresponds to the gravity
        
                // const lookAt = new Vector3(); 
                // camera.getWorldDirection(lookAt);
    
                // Calculates the side axis for the unrotated camera
                const sideAxis = new Vector3().crossVectors(new Vector3(0, 1, 0), new Vector3(0,0,-1));
                // Calculates the target side axis for the rotated camera
                const targetAxis = new Vector3().crossVectors(gravUp, new Vector3(0,0,-1));
                // Finds the angle between the two axes to rotate the camera accordingly
                const angle = sideAxis.angleTo(targetAxis);
                _euler.z = angle;
                camera.quaternion.setFromEuler( _euler );
                
                // Generates movement based on the target side axis
                camera.position.addScaledVector(targetAxis, distance);
            }
            else {
                _vector.setFromMatrixColumn(camera.matrix, 0);
                camera.position.addScaledVector(_vector, distance);
            }

		};

		this.lock = function () {

			this.domElement.requestPointerLock();

		};

		this.unlock = function () {

			scope.domElement.ownerDocument.exitPointerLock();

		};

		this.connect();

	}

}

export { CustomLockControls };