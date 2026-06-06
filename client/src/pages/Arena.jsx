import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Shop from '../components/Shop';
import '../styles/arena.css';

export default function Arena({ socket, gameState, chatMessages, playerId, onReturnToMenu }) {
  const mountRef = useRef(null);
  const [localPlayer, setLocalPlayer] = useState(null);
  const [chat, setChat] = useState('');
  const [showShop, setShowShop] = useState(false);
  const keysPressed = useRef({});
  const playersRef = useRef(new Map());
  const obstaclesRef = useRef([]);
  const raycaster = useRef(new THREE.Raycaster());

  useEffect(() => {
    if (gameState?.players) {
      const player = gameState.players.find(p => p.id === playerId);
      setLocalPlayer(player);
    }
  }, [gameState, playerId]);

  useEffect(() => {
    const handleKeyDown = (e) => { keysPressed.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e) => { keysPressed.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
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

    // Keep simple obstacle boxes
    const OBSTACLES = [
      { x: 800, y: 400, width: 200, height: 50 },
      { x: 800, y: 550, width: 200, height: 50 },
      { x: 50, y: 50, width: 150, height: 150 },
      { x: 1600, y: 50, width: 150, height: 150 },
      { x: 50, y: 800, width: 150, height: 150 },
      { x: 1600, y: 800, width: 150, height: 150 },
      { x: 400, y: 300, width: 100, height: 300 },
      { x: 1300, y: 400, width: 100, height: 300 },
      { x: 600, y: 700, width: 300, height: 100 },
      { x: 900, y: 200, width: 100, height: 150 }
    ];

    OBSTACLES.forEach(obs => {
      const geo = new THREE.BoxGeometry(obs.width, 60, obs.height);
      const mat = new THREE.MeshStandardMaterial({ color: 0x444444 });
      const box = new THREE.Mesh(geo, mat);
      // convert 2D y (0..1000) to z coordinate in 3D
      box.position.set(obs.x + obs.width / 2, 30, obs.y + obs.height / 2);
      scene.add(box);
      obstaclesRef.current.push(box);
    });

    const playerGroup = new THREE.Group();
    scene.add(playerGroup);

    // Helper: create or update a player mesh
    const createPlayerMesh = (p) => {
      const color = p.team === 'red' ? 0xff4444 : p.team === 'blue' ? 0x4444ff : 0xffff44;
      const geo = new THREE.SphereGeometry(15, 16, 16);
      const mat = new THREE.MeshStandardMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.position.x, 15, p.position.y);

      // Name label using canvas texture
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(255,255,255,0.0)'; ctx.fillRect(0,0,256,64);
      ctx.fillStyle = '#ffffff'; ctx.font = '24px Arial'; ctx.textAlign = 'center';
      ctx.fillText(p.username, 128, 34);
      const tex = new THREE.CanvasTexture(canvas);
      const labelMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(labelMat);
      sprite.scale.set(150, 40, 1);
      sprite.position.set(p.position.x, 45, p.position.y);

      const group = new THREE.Group();
      group.add(mesh);
      group.add(sprite);
      group.userData = { id: p.id };
      playerGroup.add(group);
      playersRef.current.set(p.id, group);
    };

    // Initial populate
    (gameState?.players || []).forEach(p => createPlayerMesh(p));

    // Raycast and handle clicks
    const onClick = (ev) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.current.setFromCamera(mouse, camera);
      const intersects = raycaster.current.intersectObjects(playerGroup.children, true);
      if (intersects.length > 0) {
        // find parent group with id
        let obj = intersects[0].object;
        while (obj && !obj.userData?.id) obj = obj.parent;
        if (obj && obj.userData && obj.userData.id && obj.userData.id !== playerId) {
          socket.send({ type: 'player-attack', targetId: obj.userData.id });
        }
      }
    };

    renderer.domElement.addEventListener('click', onClick);

    let frameId;
    const animate = () => {
      const serverPlayers = (gameState?.players || []);

      // apply local client-side prediction first so player feels responsive
      const localGroup = playersRef.current.get(playerId);
      if (localGroup) {
        const dx = (keysPressed.current['d'] || keysPressed.current['arrowright']) ? 1 : (keysPressed.current['a'] || keysPressed.current['arrowleft']) ? -1 : 0;
        const dz = (keysPressed.current['s'] || keysPressed.current['arrowdown']) ? 1 : (keysPressed.current['w'] || keysPressed.current['arrowup']) ? -1 : 0;
        // scale prediction to be noticeable but not outrun server
        localGroup.position.x += dx * 6 * 0.6;
        localGroup.position.z += dz * 6 * 0.6;
      }

      // sync players (server-authoritative), but correct local player slowly
      serverPlayers.forEach(p => {
        const g = playersRef.current.get(p.id);
        if (g) {
          if (p.id === playerId) {
            // weaker correction for local player to preserve prediction
            g.position.x += (p.position.x - g.position.x) * 0.08;
            g.position.z += (p.position.y - g.position.z) * 0.08;
          } else {
            g.position.x += (p.position.x - g.position.x) * 0.4;
            g.position.z += (p.position.y - g.position.z) * 0.4;
          }

          const sprite = g.children[1];
          if (sprite) sprite.position.set(p.position.x, 45, p.position.y);
          const mat = g.children[0].material;
          mat.color.set(p.team === 'red' ? 0xff4444 : p.team === 'blue' ? 0x4444ff : 0xffff44);
          g.visible = p.isAlive;
        } else {
          createPlayerMesh(p);
        }
      });

      // remove players that left
      playersRef.current.forEach((group, id) => {
        if (!serverPlayers.find(p => p.id === id)) {
          playerGroup.remove(group);
          playersRef.current.delete(id);
        }
      });

      // camera follow local player (smooth)
      let focusX = 900, focusZ = 500;
      if (serverPlayers.find(p => p.id === playerId)) {
        const sp = serverPlayers.find(p => p.id === playerId);
        focusX = sp.position.x; focusZ = sp.position.y;
      } else if (localGroup) {
        focusX = localGroup.position.x; focusZ = localGroup.position.z;
      }
      const desiredCamX = focusX;
      const desiredCamZ = focusZ + 600; // offset behind
      const desiredCamY = 450;
      camera.position.x += (desiredCamX - camera.position.x) * 0.12;
      camera.position.z += (desiredCamZ - camera.position.z) * 0.12;
      camera.position.y += (desiredCamY - camera.position.y) * 0.12;
      camera.lookAt(focusX, 0, focusZ);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    // Resize handling
    const onResize = () => {
      const w = mount.clientWidth; const h = mount.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      renderer.domElement.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      mount.removeChild(renderer.domElement);
      playersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountRef, gameState]);

  // movement tick
  useEffect(() => {
    const tick = () => {
      socket.send({
        type: 'player-move',
        direction: {
          up: keysPressed.current['w'] || keysPressed.current['arrowup'],
          down: keysPressed.current['s'] || keysPressed.current['arrowdown'],
          left: keysPressed.current['a'] || keysPressed.current['arrowleft'],
          right: keysPressed.current['d'] || keysPressed.current['arrowright']
        }
      });
    };
    const id = setInterval(tick, 1000 / 60);
    return () => clearInterval(id);
  }, [socket]);

  const handleSendChat = () => {
    if (chat.trim()) {
      socket.send({ type: 'send-chat', message: chat });
      setChat('');
    }
  };

  return (
    <div className="arena-container">
      <div className="arena-wrapper" ref={mountRef} style={{ width: '100%', height: '700px', position: 'relative' }} />

      <div className="hud">
        <div className="radar">
          <div className="radar-title">RADAR</div>
          {(gameState?.players || []).map(player => {
            const scale = 100 / 1800;
            const x = (player.position.x * scale).toFixed(2);
            const y = (player.position.y * scale).toFixed(2);
            const color = player.team === 'red' ? 'red' : player.team === 'blue' ? 'blue' : 'yellow';
            return (
              <div
                key={player.id}
                className="radar-dot"
                style={{ left: `${x}%`, top: `${y}%`, backgroundColor: color, opacity: player.isAlive ? 1 : 0.5 }}
              />
            );
          })}
        </div>

        <div className="player-stats">
          {localPlayer && (
            <>
              <h3>{localPlayer.username}</h3>
              <div className="stat-row"><span>Health:</span>
                <div className="health-bar"><div className="health-fill" style={{ width: `${(localPlayer.health / localPlayer.maxHealth) * 100}%` }} /></div>
              </div>
              <div className="stat-row"><span>Coins: {localPlayer.coins}</span></div>
              <div className="stat-row"><span>K/D: {localPlayer.kills}/{localPlayer.deaths}</span></div>
              <div className="stat-row"><span>Status: {localPlayer.isAlive ? '🟢 ALIVE' : '🔴 DEAD'}</span></div>
            </>
          )}
        </div>

        <div className="chat-box">
          <div className="chat-messages">
            {chatMessages.slice(-8).map((msg, i) => (
              <div key={i} className="chat-message"><strong>{msg.playerName}:</strong> {msg.message}</div>
            ))}
          </div>
          <div className="chat-input">
            <input type="text" value={chat} onChange={(e) => setChat(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendChat()} placeholder="Type message..." />
            <button onClick={handleSendChat}>Send</button>
          </div>
        </div>

        <div className="controls-hint"><div>WASD / Arrows: Move</div><div>Click: Attack</div></div>
      </div>

      <button className="menu-button" onClick={onReturnToMenu}>← Menu</button>
      <button className="shop-button" onClick={() => setShowShop(true)}>⚔️ SHOP</button>

      {showShop && (
        <Shop socket={socket} playerCoins={localPlayer?.coins || 0} equipment={localPlayer?.equipment} onClose={() => setShowShop(false)} />
      )}
    </div>
  );
}
