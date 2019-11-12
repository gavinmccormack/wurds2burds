window.addEventListener('load', function() {
    document.querySelector('input[type="file"]').addEventListener('change', function() {
        if (this.files && this.files[0]) {
            var img = document.querySelector('[data-image-target]');
            img.src = URL.createObjectURL(this.files[0]);
            img.onload = birds_main;
        }
    });
});


var birdSize, imageMatrix, speedTimeMod, birdSize;

function birds_main() {
    const mxCanvas = new matrixCanvas();
    imageMatrix = mxCanvas.getMatrix();
    speedTimeMod = 0.5;
    startAnim = false;
    birdSize = 0.4;

    var Bird = function() {

        var scope = this;

        THREE.Geometry.call(this);

        v(5, 0, 0);
        v(-5, -2, 1);
        v(-5, 0, 0);
        v(-5, -2, -1);

        v(0, 2, -6);
        v(0, 2, 6);
        v(2, 0, 0);
        v(-3, 0, 0);

        f3(0, 2, 1);

        f3(4, 7, 6);
        f3(5, 6, 7);

        this.computeFaceNormals();

        function v(x, y, z) {
            var newVector = new THREE.Vector3(x, y, z).multiplyScalar(birdSize);
            scope.vertices.push(newVector);

        }

        function f3(a, b, c) {

            scope.faces.push(new THREE.Face3(a, b, c));

        }

    }

    Bird.prototype = Object.create(THREE.Geometry.prototype);
    Bird.prototype.constructor = Bird;


    var Boid = function() {
        var speed
        var vector = new THREE.Vector3(),
            _acceleration, _width = 100,
            _height = 100,
            _depth = 100,
            _goal, _neighborhoodRadius = 50,
            _maxSpeed = 0.001,
            _maxSteerForce = 0.1,
            _avoidWalls = false;

        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        _acceleration = new THREE.Vector3();

        this.setGoal = function(target) {

            _goal = target;

        };

        this.setAvoidWalls = function(value) {

            _avoidWalls = value;

        };

        this.setWorldSize = function(width, height, depth) {

            _width = width;
            _height = height;
            _depth = depth;

        };

        this.run = function(boids) {

            if (speedTimeMod < 80000) {
                speedTimeMod = speedTimeMod + 2;
            } else {
                startAnim = true;
            }
            if (startAnim && _maxSpeed < 3) {
                _maxSpeed = _maxSpeed + 3;
            }
            if (_avoidWalls) {

                vector.set(-_width, this.position.y, this.position.z);
                vector = this.avoid(vector);
                vector.multiplyScalar(5);
                _acceleration.add(vector);

                vector.set(_width, this.position.y, this.position.z);
                vector = this.avoid(vector);
                vector.multiplyScalar(5);
                _acceleration.add(vector);

                vector.set(this.position.x, -_height, this.position.z);
                vector = this.avoid(vector);
                vector.multiplyScalar(5);
                _acceleration.add(vector);

                vector.set(this.position.x, _height, this.position.z);
                vector = this.avoid(vector);
                vector.multiplyScalar(5);
                _acceleration.add(vector);

                vector.set(this.position.x, this.position.y, -_depth);
                vector = this.avoid(vector);
                vector.multiplyScalar(5);
                _acceleration.add(vector);

                vector.set(this.position.x, this.position.y, _depth);
                vector = this.avoid(vector);
                vector.multiplyScalar(5);
                _acceleration.add(vector);

            }


            if (Math.random() > 0.8) {

                this.flock(boids);

            }

            this.move();

        };

        this.flock = function(boids) {

            if (_goal) {

                _acceleration.add(this.reach(_goal, 0.005));

            }

            _acceleration.add(this.alignment(boids));
            _acceleration.add(this.cohesion(boids));
            _acceleration.add(this.separation(boids));

        };

        this.move = function() {

            this.velocity.add(_acceleration);

            var l = this.velocity.length();

            if (l > _maxSpeed) {

                this.velocity.divideScalar(l / _maxSpeed);

            }

            this.position.add(this.velocity);
            _acceleration.set(0, 0, 0);

        };

        this.checkBounds = function() {

            if (this.position.x > _width) this.position.x = -_width;
            if (this.position.x < -_width) this.position.x = _width;
            if (this.position.y > _height) this.position.y = -_height;
            if (this.position.y < -_height) this.position.y = _height;
            if (this.position.z > _depth) this.position.z = -_depth;
            if (this.position.z < -_depth) this.position.z = _depth;

        };

        //

        this.avoid = function(target) {

            var steer = new THREE.Vector3();

            steer.copy(this.position);
            steer.sub(target);

            steer.multiplyScalar(1 / this.position.distanceToSquared(target));

            return steer;

        };

        this.repulse = function(target) {

            var distance = this.position.distanceTo(target);

            if (distance < 150) {

                var steer = new THREE.Vector3();

                steer.subVectors(this.position, target);
                steer.multiplyScalar(0.5 / distance);

                _acceleration.add(steer);

            }

        };

        this.reach = function(target, amount) {

            var steer = new THREE.Vector3();

            steer.subVectors(target, this.position);
            steer.multiplyScalar(amount);

            return steer;

        };

        this.alignment = function(boids) {

            var count = 0;
            var velSum = new THREE.Vector3();

            for (var i = 0, il = boids.length; i < il; i++) {

                if (Math.random() > 0.6) continue;

                var boid = boids[i];
                var distance = boid.position.distanceTo(this.position);

                if (distance > 0 && distance <= _neighborhoodRadius) {

                    velSum.add(boid.velocity);
                    count++;

                }

            }

            if (count > 0) {

                velSum.divideScalar(count);

                var l = velSum.length();

                if (l > _maxSteerForce) {

                    velSum.divideScalar(l / _maxSteerForce);

                }

            }

            return velSum;

        };

        this.cohesion = function(boids) {

            var count = 0;
            var posSum = new THREE.Vector3();
            var steer = new THREE.Vector3();

            for (var i = 0, il = boids.length; i < il; i++) {

                if (Math.random() > 0.6) continue;

                var boid = boids[i];
                var distance = boid.position.distanceTo(this.position);

                if (distance > 0 && distance <= _neighborhoodRadius) {

                    posSum.add(boid.position);
                    count++;

                }

            }

            if (count > 0) {

                posSum.divideScalar(count);

            }

            steer.subVectors(posSum, this.position);

            var l = steer.length();

            if (l > _maxSteerForce) {

                steer.divideScalar(l / _maxSteerForce);

            }

            return steer;

        };

        this.separation = function(boids) {

            var posSum = new THREE.Vector3();
            var repulse = new THREE.Vector3();

            for (var i = 0, il = boids.length; i < il; i++) {

                if (Math.random() > 0.6) continue;

                var boid = boids[i];
                var distance = boid.position.distanceTo(this.position);

                if (distance > 0 && distance <= _neighborhoodRadius) {

                    repulse.subVectors(this.position, boid.position);
                    repulse.normalize();
                    repulse.divideScalar(distance);
                    posSum.add(repulse);

                }

            }

            return posSum;

        };

    }

    var SCREEN_WIDTH = window.innerWidth,
        SCREEN_HEIGHT = window.innerHeight,
        SCREEN_WIDTH_HALF = SCREEN_WIDTH / 2,
        SCREEN_HEIGHT_HALF = SCREEN_HEIGHT / 2;

    var camera, scene, renderer,
        birds, bird;

    var boid, boids;

    var stats;
    var initial = true;
    init();

    animate();

    function init() {

        camera = new THREE.PerspectiveCamera(75, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 10000);
        camera.position.z = 450;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        birds = [];
        boids = [];

        /* Experiment */
        console.log("Image matrix: ", imageMatrix);
        var wordGuide = imageMatrix;
        var cn = 0;
        for (var i = wordGuide.length - 1; i > 0; i--) {
            for (var inner = wordGuide[i].length - 1; inner > 0; inner--) {
                if (wordGuide[i][inner] == 1) {
                    boid = boids[cn] = new Boid();
                    boid.position.x = inner * 2 - 200;
                    boid.position.y = wordGuide.length - (i * 2);
                    boid.position.z = 5 * Math.random();
                    boid.velocity.x = Math.random() * 2 - 1;
                    boid.velocity.y = Math.random() * 2 - 1;
                    boid.velocity.z = Math.random() * 2 - 1;
                    boid.setAvoidWalls(true);
                    boid.setWorldSize(100, 100, 200);

                    bird = birds[cn] = new THREE.Mesh(new Bird(), new THREE.MeshBasicMaterial({
                        color: Math.random() * 0xffffff,
                        side: THREE.DoubleSide
                    }));
                    bird.phase = Math.floor(Math.random() * 62.83);
                    scene.add(bird);
                    cn++;
                }
            }
        }

        renderer = new THREE.CanvasRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.body.appendChild(renderer.domElement);

        stats = new Stats();
        document.getElementById('container').appendChild(stats.dom);

        //

        window.addEventListener('resize', onWindowResize, false);

    }

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    }

    function onDocumentMouseMove(event) {

        var vector = new THREE.Vector3(event.clientX - SCREEN_WIDTH_HALF, -event.clientY + SCREEN_HEIGHT_HALF, 0);

        for (var i = 0, il = boids.length; i < il; i++) {

            boid = boids[i];

            vector.z = boid.position.z;

            boid.repulse(vector);

        }

    }

    //

    function animate() {

        
        requestAnimationFrame(animate);
        render();
        stats.end();

    }

    function render() {

      

        function boidUpdate() {
          for (var i = 0, il = birds.length; i < il; i++) {

              boid = boids[i];
              boid.run(boids);

              bird = birds[i];
              bird.position.copy(boids[i].position);

              var color = bird.material.color;
              color.r = color.g = color.b = (500 - bird.position.z) / 1000;

              bird.rotation.y = Math.atan2(-boid.velocity.z, boid.velocity.x);
              bird.rotation.z = Math.asin(boid.velocity.y / boid.velocity.length());

              bird.phase = (bird.phase + (Math.max(0, bird.rotation.z) + 0.1)) % 62.83;
              bird.geometry.vertices[5].y = bird.geometry.vertices[4].y = Math.sin(bird.phase) * 5;

          }
        };

        setTimeout(boidUpdate, 5);

        function timedRender() {
          renderer.render(scene, camera);
        }

        
        setTimeout(timedRender, 5);


    }
}