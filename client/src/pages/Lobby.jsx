import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import '../styles/lobby.css';

export default function Lobby({ socket, gameState, onStartGame, username }) {
  const mountRef = useRef(null);
  const avatarRef = useRef({ x: 300, y: 300 });
  const keysPressed = useRef({});
  const [selectedTeam, setSelectedTeam] = useState(null);

  const TEAM_ZONES = [
    { x: 50, y: 50, width: 300, height: 300, team: 'red', color: 0xff4444, label: 'RED TEAM' },
    { x: 1450, y: 50, width: 300, height: 300, team: 'blue', color: 0x4444ff, label: 'BLUE TEAM' },
    { x: 700, y: 650, width: 400, height: 300, team: 'free-for-all', color: 0xffff44, label: 'FREE-FOR-ALL' }
  ];

  useEffect(() => {
    const handleKeyDown = (e) => { keysPressed.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e) => { keysPressed.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x16213e);

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 1, 5000);
    camera.position.set(900, 600, 1200);
    camera.lookAt(900, 500, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0.5, 1, 0.5);
    scene.add(light);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(1800, 1000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x21304a });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(900, 0, 500);
    scene.add(ground);

    // Zones
    const zoneGroup = new THREE.Group();
    TEAM_ZONES.forEach(zone => {
      const geo = new THREE.BoxGeometry(zone.width, 10, zone.height);
      const mat = new THREE.MeshStandardMaterial({ color: zone.color, transparent: true, opacity: 0.35 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(zone.x + zone.width / 2, 5, zone.y + zone.height / 2);
      zoneGroup.add(mesh);
    });
    scene.add(zoneGroup);

    // Avatar
    const avatarGeo = new THREE.SphereGeometry(15, 16, 16);
    const avatarMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const avatar = new THREE.Mesh(avatarGeo, avatarMat);
    avatar.position.set(avatarRef.current.x, 15, avatarRef.current.y);
    scene.add(avatar);

    const animate = () => {
      // movement
      const moveSpeed = 5;
      let { x, y } = avatarRef.current;
      if (keysPressed.current['w'] || keysPressed.current['arrowup']) y -= moveSpeed;
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) y += moveSpeed;
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) x -= moveSpeed;
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) x += moveSpeed;
      x = Math.max(15, Math.min(1800 - 15, x));
      y = Math.max(15, Math.min(1000 - 15, y));
      avatarRef.current.x = x; avatarRef.current.y = y;

      // update avatar position
      avatar.position.x += (x - avatar.position.x) * 0.4;
      avatar.position.z += (y - avatar.position.z) * 0.4;

      // detect zone
      const foundZone = TEAM_ZONES.find(zone => x > zone.x && x < zone.x + zone.width && y > zone.y && y < zone.y + zone.height);
      if (foundZone && foundZone.team !== selectedTeam) {
        setSelectedTeam(foundZone.team);
        socket.send({ type: 'assign-team', team: foundZone.team });
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => { const w = mount.clientWidth; const h = mount.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountRef]);

  // send movement tick to server
  useEffect(() => {
    const tick = () => {
      socket.send({ type: 'player-move', direction: {
        up: keysPressed.current['w'] || keysPressed.current['arrowup'],
        down: keysPressed.current['s'] || keysPressed.current['arrowdown'],
        left: keysPressed.current['a'] || keysPressed.current['arrowleft'],
        right: keysPressed.current['d'] || keysPressed.current['arrowright']
      }});
    };
    const id = setInterval(tick, 1000 / 30);
    return () => clearInterval(id);
  }, [socket]);

  const counts = {
    red: (gameState?.players || []).filter(p => p.team === 'red').length,
    blue: (gameState?.players || []).filter(p => p.team === 'blue').length,
    'free-for-all': (gameState?.players || []).filter(p => p.team === 'free-for-all').length
  };

  return (
    <div className="lobby">
      <div className="lobby-wrapper" ref={mountRef} style={{ width: '100%', height: '700px', position: 'relative' }} />

      {/* Overlay counts for each zone */}
      {TEAM_ZONES.map(zone => (
        <div key={zone.team}
          style={{
            position: 'absolute', left: (zone.x / 18) + '%', top: (zone.y / 10) + '%',
            width: (zone.width / 18) + '%', height: (zone.height / 10) + '%', pointerEvents: 'none'
          }}>
          <div style={{ position: 'absolute', right: 6, bottom: 6, background: 'rgba(0,0,0,0.6)', padding: '6px 8px', borderRadius: 6, pointerEvents: 'auto' }}>{counts[zone.team]}</div>
        </div>
      ))}

      <div className="lobby-info">
        <div className="team-status">
          {selectedTeam ? (<span className="selected-team">Team: {selectedTeam.toUpperCase()}</span>) : (<span className="no-team">No team selected</span>)}
        </div>
        <button onClick={onStartGame} disabled={!selectedTeam} className="start-button">START GAME</button>
      </div>
    </div>
  );
}
