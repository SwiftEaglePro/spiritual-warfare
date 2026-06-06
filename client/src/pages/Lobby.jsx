import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import '../styles/lobby.css';

export default function Lobby({ socket, gameState, onStart }) {
  const mountRef = useRef(null);
  const keysRef = useRef({});
  const avatarRef = useRef({ x: 900, y: 500 });
  const [selectedTeam, setSelectedTeam] = useState(null);

  const TEAMS = [
    { name: 'red', label: 'RED TEAM', zone: { x: 100, y: 100, w: 300, h: 300 }, color: 0xff3333 },
    { name: 'blue', label: 'BLUE TEAM', zone: { x: 1400, y: 100, w: 300, h: 300 }, color: 0x3333ff },
    { name: 'free-for-all', label: 'FREE-FOR-ALL', zone: { x: 750, y: 650, w: 300, h: 250 }, color: 0xffff33 }
  ];

  useEffect(() => {
    const down = (e) => { keysRef.current[e.key.toLowerCase()] = true; };
    const up = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useEffect(() => {
    const tick = () => {
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
    const id = setInterval(tick, 1000 / 30);
    return () => clearInterval(id);
  }, [socket]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a2e);

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 1, 5000);
    camera.position.set(900, 500, 1000);
    camera.lookAt(900, 0, 500);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(1, 1, 1);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // Ground
    const geoGround = new THREE.PlaneGeometry(1800, 1000);
    const matGround = new THREE.MeshStandardMaterial({ color: 0x1a1a3a });
    const ground = new THREE.Mesh(geoGround, matGround);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // Team zones
    TEAMS.forEach(t => {
      const geo = new THREE.BoxGeometry(t.zone.w, 5, t.zone.h);
      const mat = new THREE.MeshStandardMaterial({ color: t.color, transparent: true, opacity: 0.3 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(t.zone.x + t.zone.w / 2, 2.5, t.zone.y + t.zone.h / 2);
      scene.add(mesh);
    });

    // Avatar
    const geoAvatar = new THREE.SphereGeometry(12, 16, 16);
    const matAvatar = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const avatar = new THREE.Mesh(geoAvatar, matAvatar);
    avatar.position.set(900, 12, 500);
    scene.add(avatar);

    // Other players
    const otherPlayersGroup = new THREE.Group();
    scene.add(otherPlayersGroup);

    const animate = () => {
      // Client-side avatar movement
      const speed = 5;
      let x = avatarRef.current.x;
      let y = avatarRef.current.y;
      if (keysRef.current['w'] || keysRef.current['arrowup']) y -= speed;
      if (keysRef.current['s'] || keysRef.current['arrowdown']) y += speed;
      if (keysRef.current['a'] || keysRef.current['arrowleft']) x -= speed;
      if (keysRef.current['d'] || keysRef.current['arrowright']) x += speed;
      x = Math.max(15, Math.min(1800 - 15, x));
      y = Math.max(15, Math.min(1000 - 15, y));
      avatarRef.current.x = x;
      avatarRef.current.y = y;

      // Smooth avatar move
      avatar.position.x += (x - avatar.position.x) * 0.15;
      avatar.position.z += (y - avatar.position.z) * 0.15;

      // Check zone
      const inZone = TEAMS.find(t => x > t.zone.x && x < t.zone.x + t.zone.w && y > t.zone.y && y < t.zone.y + t.zone.h);
      if (inZone && inZone.name !== selectedTeam) {
        setSelectedTeam(inZone.name);
        socket.send({ type: 'assign-team', team: inZone.name });
      }

      // Render other players
      otherPlayersGroup.clear();
      if (gameState?.players) {
        gameState.players.forEach(p => {
          if (p.id !== socket.playerId) {
            const geo = new THREE.SphereGeometry(12, 16, 16);
            const mat = new THREE.MeshStandardMaterial({ color: p.color || 0xffff00 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(p.position.x, 12, p.position.y);
            otherPlayersGroup.add(mesh);
          }
        });
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      mount.removeChild(renderer.domElement);
    };
  }, [mountRef, gameState, socket, socket.playerId]);

  const teamCounts = gameState?.players
    ? { red: gameState.players.filter(p => p.team === 'red').length,
        blue: gameState.players.filter(p => p.team === 'blue').length,
        'free-for-all': gameState.players.filter(p => p.team === 'free-for-all').length }
    : { red: 0, blue: 0, 'free-for-all': 0 };

  return (
    <div className="lobby-container">
      <div className="lobby-render" ref={mountRef} />
      <div className="lobby-overlay">
        <div className="team-indicator">
          {selectedTeam ? <span className="selected">✓ {selectedTeam.toUpperCase()}</span> : <span className="unselected">Select a team</span>}
        </div>
        <div className="team-counts">
          {TEAMS.map(t => (
            <div key={t.name} className="count-badge">{t.label}: {teamCounts[t.name]}</div>
          ))}
        </div>
        <button onClick={onStart} disabled={!selectedTeam} className="start-btn">START GAME</button>
      </div>
    </div>
  );
}
