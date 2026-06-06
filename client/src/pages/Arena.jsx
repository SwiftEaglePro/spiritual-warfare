import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import '../styles/arena.css';

export default function Arena({ socket, gameState, playerId, onBack }) {
  const mountRef = useRef(null);
  const keysRef = useRef({});
  const playersRef = useRef(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const [localPlayer, setLocalPlayer] = useState(null);

  useEffect(() => {
    if (gameState?.players && playerId) {
      const p = gameState.players.find(x => x.id === playerId);
      if (p) setLocalPlayer(p);
    }
  }, [gameState, playerId]);

  useEffect(() => {
    const down = (e) => { keysRef.current[e.key.toLowerCase()] = true; };
    const up = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useEffect(() => {
    const tick = () => {
      if (!playerId) return;
      socket.send({
        type: 'player-move',
        direction: {
          up: keysRef.current['w'] || keysRef.current['arrowup'],
          down: keysRef.current['s'] || keysRef.current['arrowdown'],
          left: keysRef.current['a'] || keysRef.current['arrowleft'],
          right: keysRef.current['d'] || keysRef.current['arrowright']
        }
      });
    };
    const id = setInterval(tick, 1000 / 60);
    return () => clearInterval(id);
  }, [socket, playerId]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a2e);

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 1, 5000);
    camera.position.set(900, 400, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(1, 1, 1);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Ground
    const geoGround = new THREE.PlaneGeometry(1800, 1000);
    const matGround = new THREE.MeshStandardMaterial({ color: 0x1a1a3a });
    const ground = new THREE.Mesh(geoGround, matGround);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Obstacles
    const OBSTACLES = [
      { x: 800, y: 400, w: 200, h: 50 },
      { x: 800, y: 550, w: 200, h: 50 },
      { x: 50, y: 50, w: 150, h: 150 },
      { x: 1600, y: 50, w: 150, h: 150 },
      { x: 50, y: 800, w: 150, h: 150 },
      { x: 1600, y: 800, w: 150, h: 150 }
    ];

    OBSTACLES.forEach(obs => {
      const geo = new THREE.BoxGeometry(obs.w, 40, obs.h);
      const mat = new THREE.MeshStandardMaterial({ color: 0x444444 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(obs.x + obs.w / 2, 20, obs.y + obs.h / 2);
      scene.add(mesh);
    });

    const playersGroup = new THREE.Group();
    scene.add(playersGroup);

    const createPlayerMesh = (p) => {
      const group = new THREE.Group();
      const geo = new THREE.SphereGeometry(12, 16, 16);
      const mat = new THREE.MeshStandardMaterial({ color: p.color || 0xffff00 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 12;
      group.add(mesh);

      // Name label
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(p.username, 128, 40);
      const tex = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: tex });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(100, 30, 1);
      sprite.position.y = 35;
      group.add(sprite);

      group.position.set(p.position.x, 0, p.position.y);
      group.userData = { id: p.id };
      playersGroup.add(group);
      playersRef.current.set(p.id, group);
      return group;
    };

    if (gameState?.players) {
      gameState.players.forEach(p => createPlayerMesh(p));
    }

    const onClick = (evt) => {
      if (!playerId) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((evt.clientX - rect.left) / rect.width) * 2 - 1,
        -((evt.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycasterRef.current.setFromCamera(mouse, camera);
      const hits = raycasterRef.current.intersectObjects(playersGroup.children, true);
      if (hits.length > 0) {
        let obj = hits[0].object;
        while (obj && !obj.parent?.userData?.id) obj = obj.parent;
        if (obj?.parent?.userData?.id && obj.parent.userData.id !== playerId) {
          socket.send({ type: 'player-attack', targetId: obj.parent.userData.id });
        }
      }
    };
    renderer.domElement.addEventListener('click', onClick);

    let frameId;
    const animate = () => {
      if (gameState?.players) {
        gameState.players.forEach(p => {
          let g = playersRef.current.get(p.id);
          if (!g) {
            g = createPlayerMesh(p);
          }
          const isLocal = p.id === playerId;
          const speed = isLocal ? 0.1 : 0.3;
          g.position.x += (p.position.x - g.position.x) * speed;
          g.position.z += (p.position.y - g.position.z) * speed;
          g.children[0].material.color.set(p.color || 0xffff00);
          g.visible = p.isAlive;
        });
      }

      playersRef.current.forEach((g, id) => {
        if (!gameState?.players?.find(p => p.id === id)) {
          playersGroup.remove(g);
          playersRef.current.delete(id);
        }
      });

      // Camera follow local player
      const localP = gameState?.players?.find(p => p.id === playerId);
      if (localP) {
        const targetX = localP.position.x;
        const targetZ = localP.position.y + 600;
        const targetY = 350;
        camera.position.x += (targetX - camera.position.x) * 0.1;
        camera.position.z += (targetZ - camera.position.z) * 0.1;
        camera.position.y += (targetY - camera.position.y) * 0.1;
        camera.lookAt(localP.position.x, 50, localP.position.y);
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', onClick);
      mount.removeChild(renderer.domElement);
    };
  }, [mountRef, gameState, playerId]);

  return (
    <div className="arena-container">
      <div className="arena-render" ref={mountRef} />
      <div className="arena-hud">
        <div className="player-stats">
          {localPlayer && (
            <>
              <div className="stat-name">{localPlayer.username}</div>
              <div className="stat-row"><span>Health:</span> {localPlayer.health} / {localPlayer.maxHealth}</div>
              <div className="stat-row"><span>Coins:</span> {localPlayer.coins}</div>
              <div className="stat-row"><span>Kills:</span> {localPlayer.kills}</div>
              <div className="stat-row"><span>Status:</span> {localPlayer.isAlive ? '🟢 ALIVE' : '🔴 DEAD'}</div>
            </>
          )}
        </div>
        <div className="controls">
          <div>WASD / Arrows: Move</div>
          <div>Click: Attack</div>
        </div>
        <button onClick={onBack} className="back-btn">← Menu</button>
      </div>
    </div>
  );
}
