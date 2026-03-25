(() => {
    if (!window.glMatrix) {
        console.error('gl-matrix is required for InfiniteMenu.');
        return;
    }

    const { mat4, quat, vec2, vec3 } = window.glMatrix;

    const discVertShaderSource = `#version 300 es

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec4 uRotationAxisVelocity;

in vec3 aModelPosition;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;

out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;

void main() {
    vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);

    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
    float radius = length(centerPos.xyz);

    if (gl_VertexID > 0) {
        vec3 rotationAxis = uRotationAxisVelocity.xyz;
        float rotationVelocity = min(.15, uRotationAxisVelocity.w * 15.);
        vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
        vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
        float strength = dot(stretchDir, relativeVertexPos);
        float invAbsStrength = min(.0, abs(strength) - 1.);
        strength = rotationVelocity * sign(strength) * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.);
        worldPosition.xyz += stretchDir * strength;
    }

    worldPosition.xyz = radius * normalize(worldPosition.xyz);

    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;

    vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
    vUvs = aModelUvs;
    vInstanceId = gl_InstanceID;
}
`;

    const discFragShaderSource = `#version 300 es
precision highp float;

uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;

out vec4 outColor;

in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;

void main() {
    int itemIndex = vInstanceId % uItemCount;
    int cellX = itemIndex % uAtlasSize;
    int cellY = itemIndex / uAtlasSize;
    vec2 cellSize = vec2(1.0) / vec2(float(uAtlasSize));
    vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;

    vec2 st = vec2(vUvs.x, 1.0 - vUvs.y);
    st = st * cellSize + cellOffset;

    outColor = texture(uTex, st);
    outColor.a *= vAlpha;
}
`;

    class Face {
        constructor(a, b, c) {
            this.a = a;
            this.b = b;
            this.c = c;
        }
    }

    class Vertex {
        constructor(x, y, z) {
            this.position = vec3.fromValues(x, y, z);
            this.normal = vec3.create();
            this.uv = vec2.create();
        }
    }

    class Geometry {
        constructor() {
            this.vertices = [];
            this.faces = [];
        }

        addVertex(...args) {
            for (let i = 0; i < args.length; i += 3) {
                this.vertices.push(new Vertex(args[i], args[i + 1], args[i + 2]));
            }
            return this;
        }

        addFace(...args) {
            for (let i = 0; i < args.length; i += 3) {
                this.faces.push(new Face(args[i], args[i + 1], args[i + 2]));
            }
            return this;
        }

        get lastVertex() {
            return this.vertices[this.vertices.length - 1];
        }

        subdivide(divisions = 1) {
            const midpointCache = {};
            let nextFaces = this.faces;

            for (let div = 0; div < divisions; div += 1) {
                const newFaces = new Array(nextFaces.length * 4);

                nextFaces.forEach((face, index) => {
                    const midAB = this.getMidPoint(face.a, face.b, midpointCache);
                    const midBC = this.getMidPoint(face.b, face.c, midpointCache);
                    const midCA = this.getMidPoint(face.c, face.a, midpointCache);
                    const targetIndex = index * 4;

                    newFaces[targetIndex + 0] = new Face(face.a, midAB, midCA);
                    newFaces[targetIndex + 1] = new Face(face.b, midBC, midAB);
                    newFaces[targetIndex + 2] = new Face(face.c, midCA, midBC);
                    newFaces[targetIndex + 3] = new Face(midAB, midBC, midCA);
                });

                nextFaces = newFaces;
            }

            this.faces = nextFaces;
            return this;
        }

        spherize(radius = 1) {
            this.vertices.forEach(vertex => {
                vec3.normalize(vertex.normal, vertex.position);
                vec3.scale(vertex.position, vertex.normal, radius);
            });
            return this;
        }

        get data() {
            return {
                vertices: new Float32Array(this.vertices.flatMap(vertex => Array.from(vertex.position))),
                indices: new Uint16Array(this.faces.flatMap(face => [face.a, face.b, face.c])),
                uvs: new Float32Array(this.vertices.flatMap(vertex => Array.from(vertex.uv)))
            };
        }

        getMidPoint(indexA, indexB, cache) {
            const cacheKey = indexA < indexB ? `k_${indexB}_${indexA}` : `k_${indexA}_${indexB}`;

            if (Object.prototype.hasOwnProperty.call(cache, cacheKey)) {
                return cache[cacheKey];
            }

            const a = this.vertices[indexA].position;
            const b = this.vertices[indexB].position;
            const nextIndex = this.vertices.length;

            cache[cacheKey] = nextIndex;
            this.addVertex((a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, (a[2] + b[2]) * 0.5);

            return nextIndex;
        }
    }

    class IcosahedronGeometry extends Geometry {
        constructor() {
            super();
            const t = Math.sqrt(5) * 0.5 + 0.5;

            this.addVertex(
                -1, t, 0,
                1, t, 0,
                -1, -t, 0,
                1, -t, 0,
                0, -1, t,
                0, 1, t,
                0, -1, -t,
                0, 1, -t,
                t, 0, -1,
                t, 0, 1,
                -t, 0, -1,
                -t, 0, 1
            ).addFace(
                0, 11, 5,
                0, 5, 1,
                0, 1, 7,
                0, 7, 10,
                0, 10, 11,
                1, 5, 9,
                5, 11, 4,
                11, 10, 2,
                10, 7, 6,
                7, 1, 8,
                3, 9, 4,
                3, 4, 2,
                3, 2, 6,
                3, 6, 8,
                3, 8, 9,
                4, 9, 5,
                2, 4, 11,
                6, 2, 10,
                8, 6, 7,
                9, 8, 1
            );
        }
    }

    class DiscGeometry extends Geometry {
        constructor(steps = 4, radius = 1) {
            super();
            const safeSteps = Math.max(4, steps);
            const alpha = (2 * Math.PI) / safeSteps;

            this.addVertex(0, 0, 0);
            this.lastVertex.uv[0] = 0.5;
            this.lastVertex.uv[1] = 0.5;

            for (let i = 0; i < safeSteps; i += 1) {
                const x = Math.cos(alpha * i);
                const y = Math.sin(alpha * i);

                this.addVertex(radius * x, radius * y, 0);
                this.lastVertex.uv[0] = x * 0.5 + 0.5;
                this.lastVertex.uv[1] = y * 0.5 + 0.5;

                if (i > 0) {
                    this.addFace(0, i, i + 1);
                }
            }

            this.addFace(0, safeSteps, 1);
        }
    }

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        }

        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    function createProgram(gl, shaderSources, attribLocations) {
        const program = gl.createProgram();

        [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, index) => {
            const shader = createShader(gl, type, shaderSources[index]);
            if (shader) {
                gl.attachShader(program, shader);
            }
        });

        if (attribLocations) {
            Object.keys(attribLocations).forEach(attrib => {
                gl.bindAttribLocation(program, attribLocations[attrib], attrib);
            });
        }

        gl.linkProgram(program);

        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            return program;
        }

        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    function makeVertexArray(gl, bufferLocationSizeTuples, indices) {
        const vertexArray = gl.createVertexArray();
        gl.bindVertexArray(vertexArray);

        bufferLocationSizeTuples.forEach(([buffer, location, size]) => {
            if (location === -1) {
                return;
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        });

        if (indices) {
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        }

        gl.bindVertexArray(null);
        return vertexArray;
    }

    function resizeCanvasToDisplaySize(canvas) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const displayWidth = Math.round(canvas.clientWidth * dpr);
        const displayHeight = Math.round(canvas.clientHeight * dpr);
        const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;

        if (needResize) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }

        return needResize;
    }

    function makeBuffer(gl, data, usage) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, usage);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return buffer;
    }

    function createAndSetupTexture(gl, minFilter, magFilter, wrapS, wrapT) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
        return texture;
    }

    function normalizeImageSource(source) {
        if (!source) {
            return '';
        }

        if (/^(https?:)?\/\//i.test(source) || source.startsWith('data:') || source.startsWith('blob:')) {
            return source;
        }

        return encodeURI(source.replace(/\\/g, '/'));
    }

    function drawCoverImage(context, image, x, y, width, height) {
        const sourceAspect = image.width / image.height;
        const targetAspect = width / height;
        let sourceWidth = image.width;
        let sourceHeight = image.height;
        let sourceX = 0;
        let sourceY = 0;

        if (sourceAspect > targetAspect) {
            sourceWidth = image.height * targetAspect;
            sourceX = (image.width - sourceWidth) * 0.5;
        } else {
            sourceHeight = image.width / targetAspect;
            sourceY = (image.height - sourceHeight) * 0.5;
        }

        context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
    }

    class ArcballControl {
        constructor(canvas, updateCallback) {
            this.canvas = canvas;
            this.updateCallback = updateCallback || (() => null);

            this.isPointerDown = false;
            this.orientation = quat.create();
            this.pointerRotation = quat.create();
            this.rotationVelocity = 0;
            this.rotationAxis = vec3.fromValues(1, 0, 0);
            this.snapDirection = vec3.fromValues(0, 0, -1);
            this.snapTargetDirection = null;
            this.EPSILON = 0.1;
            this.IDENTITY_QUAT = quat.create();

            this.pointerPos = vec2.create();
            this.previousPointerPos = vec2.create();
            this.combinedQuat = quat.create();
            this.internalRotationVelocity = 0;

            canvas.addEventListener('pointerdown', event => {
                vec2.set(this.pointerPos, event.clientX, event.clientY);
                vec2.copy(this.previousPointerPos, this.pointerPos);
                this.isPointerDown = true;
            });

            ['pointerup', 'pointerleave', 'pointercancel'].forEach(eventName => {
                canvas.addEventListener(eventName, () => {
                    this.isPointerDown = false;
                });
            });

            canvas.addEventListener('pointermove', event => {
                if (this.isPointerDown) {
                    vec2.set(this.pointerPos, event.clientX, event.clientY);
                }
            });

            canvas.style.touchAction = 'none';
        }

        update(deltaTime, targetFrameDuration = 16) {
            const timeScale = deltaTime / targetFrameDuration + 0.00001;
            let angleFactor = timeScale;
            const snapRotation = quat.create();

            if (this.isPointerDown) {
                const intensity = 0.3 * timeScale;
                const angleAmplification = 5 / timeScale;

                const delta = vec2.sub(vec2.create(), this.pointerPos, this.previousPointerPos);
                vec2.scale(delta, delta, intensity);

                if (vec2.sqrLen(delta) > this.EPSILON) {
                    vec2.add(delta, this.previousPointerPos, delta);

                    const projectedPointer = this.project(delta);
                    const projectedPrevious = this.project(this.previousPointerPos);
                    const a = vec3.normalize(vec3.create(), projectedPointer);
                    const b = vec3.normalize(vec3.create(), projectedPrevious);

                    vec2.copy(this.previousPointerPos, delta);
                    angleFactor *= angleAmplification;

                    this.quatFromVectors(a, b, this.pointerRotation, angleFactor);
                } else {
                    quat.slerp(this.pointerRotation, this.pointerRotation, this.IDENTITY_QUAT, intensity);
                }
            } else {
                const intensity = 0.1 * timeScale;
                quat.slerp(this.pointerRotation, this.pointerRotation, this.IDENTITY_QUAT, intensity);

                if (this.snapTargetDirection) {
                    const snappingIntensity = 0.2;
                    const a = this.snapTargetDirection;
                    const b = this.snapDirection;
                    const squaredDistance = vec3.squaredDistance(a, b);
                    const distanceFactor = Math.max(0.1, 1 - squaredDistance * 10);

                    angleFactor *= snappingIntensity * distanceFactor;
                    this.quatFromVectors(a, b, snapRotation, angleFactor);
                }
            }

            const combinedQuat = quat.multiply(quat.create(), snapRotation, this.pointerRotation);
            this.orientation = quat.multiply(quat.create(), combinedQuat, this.orientation);
            quat.normalize(this.orientation, this.orientation);

            const rotationAxisIntensity = 0.8 * timeScale;
            quat.slerp(this.combinedQuat, this.combinedQuat, combinedQuat, rotationAxisIntensity);
            quat.normalize(this.combinedQuat, this.combinedQuat);

            const radians = Math.acos(this.combinedQuat[3]) * 2.0;
            const s = Math.sin(radians / 2.0);
            let rotationVelocity = 0;

            if (s > 0.000001) {
                rotationVelocity = radians / (2 * Math.PI);
                this.rotationAxis[0] = this.combinedQuat[0] / s;
                this.rotationAxis[1] = this.combinedQuat[1] / s;
                this.rotationAxis[2] = this.combinedQuat[2] / s;
            }

            const rotationVelocityIntensity = 0.5 * timeScale;
            this.internalRotationVelocity += (rotationVelocity - this.internalRotationVelocity) * rotationVelocityIntensity;
            this.rotationVelocity = this.internalRotationVelocity / timeScale;

            this.updateCallback(deltaTime);
        }

        quatFromVectors(a, b, out, angleFactor = 1) {
            const axis = vec3.cross(vec3.create(), a, b);
            vec3.normalize(axis, axis);
            const dot = Math.max(-1, Math.min(1, vec3.dot(a, b)));
            const angle = Math.acos(dot) * angleFactor;
            quat.setAxisAngle(out, axis, angle);
            return { quaternion: out, axis, angle };
        }

        project(position) {
            const radius = 2;
            const width = this.canvas.clientWidth;
            const height = this.canvas.clientHeight;
            const scale = Math.max(width, height) - 1;
            const x = (2 * position[0] - width - 1) / scale;
            const y = (2 * position[1] - height - 1) / scale;
            const xySquared = x * x + y * y;
            const radiusSquared = radius * radius;
            let z = 0;

            if (xySquared <= radiusSquared / 2.0) {
                z = Math.sqrt(radiusSquared - xySquared);
            } else {
                z = radiusSquared / Math.sqrt(xySquared);
            }

            return vec3.fromValues(-x, y, z);
        }
    }

    class InfiniteGridMenu {
        constructor(canvas, items, onActiveItemChange, onMovementChange, onInit, scale = 1.0) {
            this.TARGET_FRAME_DURATION = 1000 / 60;
            this.SPHERE_RADIUS = 2;

            this.time = 0;
            this.deltaTime = 0;
            this.deltaFrames = 0;
            this.frames = 0;

            this.camera = {
                matrix: mat4.create(),
                near: 0.1,
                far: 40,
                fov: Math.PI / 4,
                aspect: 1,
                position: vec3.fromValues(0, 0, 3),
                up: vec3.fromValues(0, 1, 0),
                matrices: {
                    view: mat4.create(),
                    projection: mat4.create(),
                    inverseProjection: mat4.create()
                }
            };

            this.nearestVertexIndex = null;
            this.smoothRotationVelocity = 0;
            this.scaleFactor = scale;
            this.movementActive = false;
            this.canvas = canvas;
            this.items = items || [];
            this.onActiveItemChange = onActiveItemChange || (() => {});
            this.onMovementChange = onMovementChange || (() => {});
            this.camera.position[2] = 3 * scale;
            this.run = this.run.bind(this);

            this.init(onInit);
        }

        init(onInit) {
            this.gl = this.canvas.getContext('webgl2', { antialias: true, alpha: true });

            if (!this.gl) {
                throw new Error('WebGL2 is not available in this browser.');
            }

            const gl = this.gl;
            this.viewportSize = vec2.fromValues(this.canvas.clientWidth, this.canvas.clientHeight);
            this.drawBufferSize = vec2.clone(this.viewportSize);

            this.discProgram = createProgram(gl, [discVertShaderSource, discFragShaderSource], {
                aModelPosition: 0,
                aModelUvs: 1,
                aInstanceMatrix: 2
            });

            this.discLocations = {
                aModelPosition: gl.getAttribLocation(this.discProgram, 'aModelPosition'),
                aModelUvs: gl.getAttribLocation(this.discProgram, 'aModelUvs'),
                aInstanceMatrix: gl.getAttribLocation(this.discProgram, 'aInstanceMatrix'),
                uWorldMatrix: gl.getUniformLocation(this.discProgram, 'uWorldMatrix'),
                uViewMatrix: gl.getUniformLocation(this.discProgram, 'uViewMatrix'),
                uProjectionMatrix: gl.getUniformLocation(this.discProgram, 'uProjectionMatrix'),
                uRotationAxisVelocity: gl.getUniformLocation(this.discProgram, 'uRotationAxisVelocity'),
                uTex: gl.getUniformLocation(this.discProgram, 'uTex'),
                uFrames: gl.getUniformLocation(this.discProgram, 'uFrames'),
                uItemCount: gl.getUniformLocation(this.discProgram, 'uItemCount'),
                uAtlasSize: gl.getUniformLocation(this.discProgram, 'uAtlasSize')
            };

            this.discGeo = new DiscGeometry(56, 1);
            this.discBuffers = this.discGeo.data;
            this.discVAO = makeVertexArray(
                gl,
                [
                    [makeBuffer(gl, this.discBuffers.vertices, gl.STATIC_DRAW), this.discLocations.aModelPosition, 3],
                    [makeBuffer(gl, this.discBuffers.uvs, gl.STATIC_DRAW), this.discLocations.aModelUvs, 2]
                ],
                this.discBuffers.indices
            );

            this.icoGeo = new IcosahedronGeometry();
            this.icoGeo.subdivide(1).spherize(this.SPHERE_RADIUS);
            this.instancePositions = this.icoGeo.vertices.map(vertex => vertex.position);
            this.DISC_INSTANCE_COUNT = this.icoGeo.vertices.length;
            this.initDiscInstances(this.DISC_INSTANCE_COUNT);

            this.worldMatrix = mat4.create();
            this.initTexture();

            this.control = new ArcballControl(this.canvas, deltaTime => this.onControlUpdate(deltaTime));

            this.updateCameraMatrix();
            this.updateProjectionMatrix(gl);
            this.resize();

            if (onInit) {
                onInit(this);
            }
        }

        initTexture() {
            const gl = this.gl;
            this.tex = createAndSetupTexture(gl, gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                1,
                1,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                new Uint8Array([16, 33, 22, 255])
            );

            const itemCount = Math.max(1, this.items.length);
            this.atlasSize = Math.ceil(Math.sqrt(itemCount));
            const atlasCanvas = document.createElement('canvas');
            const context = atlasCanvas.getContext('2d');
            const cellSize = 512;

            atlasCanvas.width = this.atlasSize * cellSize;
            atlasCanvas.height = this.atlasSize * cellSize;

            Promise.all(
                this.items.map(item => new Promise(resolve => {
                    const image = new Image();

                    if (/^https?:\/\//i.test(item.image)) {
                        image.crossOrigin = 'anonymous';
                    }

                    image.onload = () => resolve(image);
                    image.onerror = () => resolve(null);
                    image.src = normalizeImageSource(item.image);
                }))
            ).then(images => {
                images.forEach((image, index) => {
                    const x = (index % this.atlasSize) * cellSize;
                    const y = Math.floor(index / this.atlasSize) * cellSize;

                    context.fillStyle = '#133322';
                    context.fillRect(x, y, cellSize, cellSize);

                    if (image) {
                        drawCoverImage(context, image, x, y, cellSize, cellSize);
                    } else {
                        context.fillStyle = 'rgba(255, 255, 255, 0.08)';
                        context.fillRect(x, y, cellSize, cellSize);
                    }
                });

                gl.bindTexture(gl.TEXTURE_2D, this.tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas);
                gl.generateMipmap(gl.TEXTURE_2D);
            });
        }

        initDiscInstances(count) {
            const gl = this.gl;
            this.discInstances = {
                matricesArray: new Float32Array(count * 16),
                matrices: [],
                buffer: gl.createBuffer()
            };

            for (let i = 0; i < count; i += 1) {
                const matrixArray = new Float32Array(this.discInstances.matricesArray.buffer, i * 16 * 4, 16);
                matrixArray.set(mat4.create());
                this.discInstances.matrices.push(matrixArray);
            }

            gl.bindVertexArray(this.discVAO);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.discInstances.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.discInstances.matricesArray.byteLength, gl.DYNAMIC_DRAW);

            const attributeSlotCount = 4;
            const bytesPerMatrix = 16 * 4;

            for (let index = 0; index < attributeSlotCount; index += 1) {
                const location = this.discLocations.aInstanceMatrix + index;
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, 4, gl.FLOAT, false, bytesPerMatrix, index * 4 * 4);
                gl.vertexAttribDivisor(location, 1);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindVertexArray(null);
        }

        resize() {
            const gl = this.gl;
            const needsResize = resizeCanvasToDisplaySize(gl.canvas);

            if (needsResize) {
                gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            }

            this.updateProjectionMatrix(gl);
        }

        run(time = 0) {
            this.deltaTime = Math.min(32, time - this.time);
            this.time = time;
            this.deltaFrames = this.deltaTime / this.TARGET_FRAME_DURATION;
            this.frames += this.deltaFrames;

            this.animate(this.deltaTime);
            this.render();

            requestAnimationFrame(this.run);
        }

        animate(deltaTime) {
            const gl = this.gl;
            this.control.update(deltaTime, this.TARGET_FRAME_DURATION);

            const positions = this.instancePositions.map(position => vec3.transformQuat(vec3.create(), position, this.control.orientation));
            const baseScale = 0.25;
            const scaleIntensity = 0.6;

            positions.forEach((position, index) => {
                const visibilityScale = (Math.abs(position[2]) / this.SPHERE_RADIUS) * scaleIntensity + (1 - scaleIntensity);
                const finalScale = visibilityScale * baseScale;
                const matrix = mat4.create();

                mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), vec3.negate(vec3.create(), position)));
                mat4.multiply(matrix, matrix, mat4.targetTo(mat4.create(), [0, 0, 0], position, [0, 1, 0]));
                mat4.multiply(matrix, matrix, mat4.fromScaling(mat4.create(), [finalScale, finalScale, finalScale]));
                mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), [0, 0, -this.SPHERE_RADIUS]));

                mat4.copy(this.discInstances.matrices[index], matrix);
            });

            gl.bindBuffer(gl.ARRAY_BUFFER, this.discInstances.buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.discInstances.matricesArray);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            this.smoothRotationVelocity = this.control.rotationVelocity;
        }

        render() {
            const gl = this.gl;
            gl.useProgram(this.discProgram);

            gl.enable(gl.CULL_FACE);
            gl.enable(gl.DEPTH_TEST);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.uniformMatrix4fv(this.discLocations.uWorldMatrix, false, this.worldMatrix);
            gl.uniformMatrix4fv(this.discLocations.uViewMatrix, false, this.camera.matrices.view);
            gl.uniformMatrix4fv(this.discLocations.uProjectionMatrix, false, this.camera.matrices.projection);
            gl.uniform4f(
                this.discLocations.uRotationAxisVelocity,
                this.control.rotationAxis[0],
                this.control.rotationAxis[1],
                this.control.rotationAxis[2],
                this.smoothRotationVelocity * 1.1
            );

            gl.uniform1i(this.discLocations.uItemCount, this.items.length);
            gl.uniform1i(this.discLocations.uAtlasSize, this.atlasSize);
            gl.uniform1f(this.discLocations.uFrames, this.frames);
            gl.uniform1i(this.discLocations.uTex, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.tex);
            gl.bindVertexArray(this.discVAO);
            gl.drawElementsInstanced(
                gl.TRIANGLES,
                this.discBuffers.indices.length,
                gl.UNSIGNED_SHORT,
                0,
                this.DISC_INSTANCE_COUNT
            );
        }

        updateCameraMatrix() {
            mat4.targetTo(this.camera.matrix, this.camera.position, [0, 0, 0], this.camera.up);
            mat4.invert(this.camera.matrices.view, this.camera.matrix);
        }

        updateProjectionMatrix(gl) {
            this.camera.aspect = gl.canvas.clientWidth / Math.max(1, gl.canvas.clientHeight);
            const height = this.SPHERE_RADIUS * 0.35;
            const distance = this.camera.position[2];

            if (this.camera.aspect > 1) {
                this.camera.fov = 2 * Math.atan(height / distance);
            } else {
                this.camera.fov = 2 * Math.atan(height / this.camera.aspect / distance);
            }

            mat4.perspective(
                this.camera.matrices.projection,
                this.camera.fov,
                this.camera.aspect,
                this.camera.near,
                this.camera.far
            );
            mat4.invert(this.camera.matrices.inverseProjection, this.camera.matrices.projection);
        }

        onControlUpdate(deltaTime) {
            const timeScale = deltaTime / this.TARGET_FRAME_DURATION + 0.0001;
            let damping = 5 / timeScale;
            let cameraTargetZ = 3 * this.scaleFactor;
            const isMoving = this.control.isPointerDown || Math.abs(this.smoothRotationVelocity) > 0.01;

            if (isMoving !== this.movementActive) {
                this.movementActive = isMoving;
                this.onMovementChange(isMoving);
            }

            if (!this.control.isPointerDown) {
                const nearestVertexIndex = this.findNearestVertexIndex();
                const itemIndex = nearestVertexIndex % Math.max(1, this.items.length);
                this.onActiveItemChange(itemIndex);

                const snapDirection = vec3.normalize(vec3.create(), this.getVertexWorldPosition(nearestVertexIndex));
                this.control.snapTargetDirection = snapDirection;
            } else {
                cameraTargetZ += this.control.rotationVelocity * 80 + 2.5;
                damping = 7 / timeScale;
            }

            this.camera.position[2] += (cameraTargetZ - this.camera.position[2]) / damping;
            this.updateCameraMatrix();
        }

        findNearestVertexIndex() {
            const direction = this.control.snapDirection;
            const inverseOrientation = quat.conjugate(quat.create(), this.control.orientation);
            const transformedDirection = vec3.transformQuat(vec3.create(), direction, inverseOrientation);

            let maxDot = -1;
            let nearestVertexIndex = 0;

            for (let i = 0; i < this.instancePositions.length; i += 1) {
                const dot = vec3.dot(transformedDirection, this.instancePositions[i]);
                if (dot > maxDot) {
                    maxDot = dot;
                    nearestVertexIndex = i;
                }
            }

            return nearestVertexIndex;
        }

        getVertexWorldPosition(index) {
            const vertexPosition = this.instancePositions[index];
            return vec3.transformQuat(vec3.create(), vertexPosition, this.control.orientation);
        }
    }

    const fallbackItems = [
        {
            image: 'assets/back.png',
            link: '#',
            title: 'Explore',
            description: 'Add your destination cards here.'
        }
    ];

    class InfiniteMenuScene {
        constructor({ canvas, items = [], scale = 1.0, onActiveItemChange = () => {}, onMovementChange = () => {} }) {
            this.canvas = canvas;
            this.items = items.length ? items : fallbackItems;
            this.onActiveItemChange = onActiveItemChange;
            this.onMovementChange = onMovementChange;

            this.grid = new InfiniteGridMenu(
                canvas,
                this.items,
                index => {
                    const item = this.items[index % this.items.length];
                    this.onActiveItemChange(item, index);
                },
                isMoving => this.onMovementChange(isMoving),
                grid => grid.run(),
                scale
            );

            this.handleResize = () => {
                if (this.grid) {
                    this.grid.resize();
                }
            };

            window.addEventListener('resize', this.handleResize);
            this.handleResize();
        }

        resize() {
            if (this.grid) {
                this.grid.resize();
            }
        }

        destroy() {
            window.removeEventListener('resize', this.handleResize);
        }
    }

    window.InfiniteMenuScene = InfiniteMenuScene;
})();
