// 最简单的 3D 初始化（绝对能跑出来！）
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xf0f0f0); // 浅灰背景
document.body.appendChild(renderer.domElement);

// 灯光
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// 【关键】直接生成一个测试平面 + 测试建筑，不依赖外部文件
const planeGeo = new THREE.PlaneGeometry(50, 50);
const planeMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
const ground = new THREE.Mesh(planeGeo, planeMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// 生成 5 个 3D 建筑（绝对能看到！）
const buildings3D = {};
const coords = [
    [[1, 1], [2, 1], [2, 2], [1, 2]],
    [[3, 1], [4, 1], [4, 2], [3, 2]],
    [[1, 3], [2, 3], [2, 4], [1, 4]],
    [[3, 3], [4, 3], [4, 4], [3, 4]],
    [[2, 2], [3, 2], [3, 3], [2, 3]]
];

coords.forEach((points, idx) => {
    const shape = new THREE.Shape(points.map(p => [p[0] - 2.5, p[1] - 2.5]));
    const geometry = new THREE.ShapeGeometry(shape);
    const height = 5 + idx; // 高度递增
    
    const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    mesh.position.y = height / 2;
    mesh.userData = { id: idx, s: 0, d: 0 };
    
    scene.add(mesh);
    buildings3D[idx] = mesh;
});

// 相机位置 —— 能看到 3D 效果
camera.position.set(5, 10, 15);
camera.lookAt(0, 0, 0);

// 简单动画
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// 窗口自适应
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
