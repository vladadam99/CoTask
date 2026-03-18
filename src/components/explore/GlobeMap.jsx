import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import { MapPin, Star, X } from 'lucide-react';

// City → lat/lon lookup
const CITY_COORDS = {
  'New York': [40.7128, -74.006],
  'Los Angeles': [34.0522, -118.2437],
  'Chicago': [41.8781, -87.6298],
  'Houston': [29.7604, -95.3698],
  'London': [51.5074, -0.1278],
  'Paris': [48.8566, 2.3522],
  'Berlin': [52.52, 13.405],
  'Madrid': [40.4168, -3.7038],
  'Rome': [41.9028, 12.4964],
  'Amsterdam': [52.3676, 4.9041],
  'Tokyo': [35.6762, 139.6503],
  'Beijing': [39.9042, 116.4074],
  'Shanghai': [31.2304, 121.4737],
  'Seoul': [37.5665, 126.978],
  'Singapore': [1.3521, 103.8198],
  'Mumbai': [19.076, 72.8777],
  'Delhi': [28.6139, 77.209],
  'Dubai': [25.2048, 55.2708],
  'Sydney': [-33.8688, 151.2093],
  'Melbourne': [-37.8136, 144.9631],
  'Toronto': [43.6532, -79.3832],
  'Vancouver': [49.2827, -123.1207],
  'Mexico City': [19.4326, -99.1332],
  'São Paulo': [-23.5505, -46.6333],
  'Buenos Aires': [-34.6037, -58.3816],
  'Cairo': [30.0444, 31.2357],
  'Lagos': [6.5244, 3.3792],
  'Nairobi': [-1.2921, 36.8219],
  'Istanbul': [41.0082, 28.9784],
  'Moscow': [55.7558, 37.6173],
  'Bangkok': [13.7563, 100.5018],
  'Jakarta': [-6.2088, 106.8456],
  'Manila': [14.5995, 120.9842],
  'Kuala Lumpur': [3.1390, 101.6869],
};

function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function getCityCoords(city) {
  if (!city) return null;
  const key = Object.keys(CITY_COORDS).find(k => city.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(city.toLowerCase()));
  return key ? CITY_COORDS[key] : null;
}

export default function GlobeMap({ avatars = [] }) {
  const mountRef = useRef(null);
  const sceneRef = useRef({});
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [tooltip, setTooltip] = useState(null); // {x, y, avatar}

  const handleMarkerClick = useCallback((avatar) => {
    setSelectedAvatar(avatar);
  }, []);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const width = el.clientWidth;
    const height = el.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    el.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.5;

    // Stars background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) starPositions[i] = (Math.random() - 0.5) * 100;
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.7 });
    scene.add(new THREE.Points(starGeo, starMat));

    // Globe
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    const loader = new THREE.TextureLoader();

    // Use a free Earth texture
    const earthTexture = loader.load(
      'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg',
      () => renderer.render(scene, camera)
    );
    const bumpTexture = loader.load('https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png');
    const specTexture = loader.load('https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png');

    const globeMat = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.05,
      specularMap: specTexture,
      specular: new THREE.Color(0x333333),
      shininess: 15,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Atmosphere glow
    const atmoGeo = new THREE.SphereGeometry(1.02, 64, 64);
    const atmoMat = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.FrontSide,
    });
    scene.add(new THREE.Mesh(atmoGeo, atmoMat));

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // Markers
    const markerObjects = [];
    const avatarsWithCoords = avatars.filter(a => getCityCoords(a.city));

    avatarsWithCoords.forEach(avatar => {
      const coords = getCityCoords(avatar.city);
      if (!coords) return;
      const [lat, lon] = coords;
      const pos = latLonToVec3(lat, lon, 1.02);

      // Marker dot
      const markerGeo = new THREE.SphereGeometry(0.018, 12, 12);
      const markerMat = new THREE.MeshBasicMaterial({ color: 0xe53935 });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.copy(pos);
      marker.userData = { avatar };
      scene.add(marker);
      markerObjects.push(marker);

      // Pulse ring
      const ringGeo = new THREE.RingGeometry(0.022, 0.03, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xff5252, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(pos.clone().multiplyScalar(2));
      scene.add(ring);
    });

    sceneRef.current = { scene, camera, renderer, globe, markerObjects };

    // Mouse interaction
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0 };
    let autoRotate = true;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e) => {
      isDragging = true;
      autoRotate = false;
      prevMouse = { x: e.clientX, y: e.clientY };
      rotationVelocity = { x: 0, y: 0 };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      rotationVelocity.x = dy * 0.005;
      rotationVelocity.y = dx * 0.005;
      globe.rotation.x += rotationVelocity.x;
      globe.rotation.y += rotationVelocity.y;
      markerObjects.forEach(m => { m.rotation.x = globe.rotation.x; m.rotation.y = globe.rotation.y; });
      // Also rotate rings and atmosphere
      scene.children.forEach(obj => {
        if (obj !== globe && obj.geometry instanceof THREE.RingGeometry) {
          obj.rotation.x = globe.rotation.x;
          obj.rotation.y = globe.rotation.y;
        }
      });
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e) => {
      if (!isDragging) return;
      isDragging = false;

      // Check click on marker
      const rect = el.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(markerObjects);
      if (hits.length > 0) {
        handleMarkerClick(hits[0].object.userData.avatar);
      }
    };

    // Touch support
    let lastTouch = null;
    const onTouchStart = (e) => {
      isDragging = true;
      autoRotate = false;
      lastTouch = e.touches[0];
      rotationVelocity = { x: 0, y: 0 };
    };
    const onTouchMove = (e) => {
      if (!isDragging || !lastTouch) return;
      const dx = e.touches[0].clientX - lastTouch.clientX;
      const dy = e.touches[0].clientY - lastTouch.clientY;
      rotationVelocity.y = dx * 0.005;
      rotationVelocity.x = dy * 0.005;
      globe.rotation.x += rotationVelocity.x;
      globe.rotation.y += rotationVelocity.y;
      markerObjects.forEach(m => { m.rotation.x = globe.rotation.x; m.rotation.y = globe.rotation.y; });
      lastTouch = e.touches[0];
    };
    const onTouchEnd = () => { isDragging = false; };

    // Zoom
    const onWheel = (e) => {
      camera.position.z = Math.min(5, Math.max(1.4, camera.position.z + e.deltaY * 0.005));
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);

    // Animation loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoRotate) {
        globe.rotation.y += 0.002;
        markerObjects.forEach(m => { m.rotation.y = globe.rotation.y; });
      } else if (!isDragging) {
        // Inertia
        rotationVelocity.x *= 0.95;
        rotationVelocity.y *= 0.95;
        globe.rotation.x += rotationVelocity.x;
        globe.rotation.y += rotationVelocity.y;
        markerObjects.forEach(m => {
          m.rotation.x = globe.rotation.x;
          m.rotation.y = globe.rotation.y;
        });
        if (Math.abs(rotationVelocity.x) < 0.0001 && Math.abs(rotationVelocity.y) < 0.0001) {
          autoRotate = true;
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [avatars, handleMarkerClick]);

  const avatarsWithCoords = avatars.filter(a => getCityCoords(a.city));

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '600px', background: 'radial-gradient(ellipse at center, #0a0e1a 0%, #020408 100%)' }}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Legend */}
      <div className="absolute top-4 left-4 glass rounded-lg px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Avatar location
        </div>
        <div className="text-muted-foreground/60">Drag to rotate · Scroll to zoom · Click marker</div>
      </div>

      {/* City list sidebar */}
      <div className="absolute top-4 right-4 glass rounded-lg p-3 max-h-72 overflow-y-auto w-48">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Avatars on map</p>
        {avatarsWithCoords.length === 0 ? (
          <p className="text-xs text-muted-foreground">No avatars with known cities</p>
        ) : (
          avatarsWithCoords.map(a => (
            <button key={a.id} onClick={() => setSelectedAvatar(a)}
              className="w-full text-left flex items-center gap-2 py-1.5 hover:bg-white/5 rounded px-1 transition-colors">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {a.display_name?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{a.display_name}</p>
                <p className="text-xs text-muted-foreground truncate">{a.city}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Avatar popup */}
      {selectedAvatar && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-strong rounded-xl p-4 w-72 shadow-xl border border-white/10 animate-fade-in">
          <button onClick={() => setSelectedAvatar(null)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
              {selectedAvatar.display_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{selectedAvatar.display_name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3" /> {selectedAvatar.city}
                {selectedAvatar.rating > 0 && (
                  <span className="ml-1 flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-yellow-400" /> {selectedAvatar.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{selectedAvatar.bio || 'Available for bookings'}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-semibold text-primary">${selectedAvatar.hourly_rate || 30}/hr</span>
                <Link to={`/AvatarView?id=${selectedAvatar.id}`}
                  className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded-md transition-colors">
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}