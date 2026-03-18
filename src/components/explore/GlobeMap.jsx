import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import { MapPin, Star, X } from 'lucide-react';

// City → lat/lon lookup (300+ cities worldwide)
const CITY_COORDS = {
  'New York': [40.7128, -74.006], 'Los Angeles': [34.0522, -118.2437],
  'Chicago': [41.8781, -87.6298], 'Houston': [29.7604, -95.3698],
  'Phoenix': [33.4484, -112.074], 'Philadelphia': [39.9526, -75.1652],
  'San Antonio': [29.4241, -98.4936], 'San Diego': [32.7157, -117.1611],
  'Dallas': [32.7767, -96.797], 'San Jose': [37.3382, -121.8863],
  'Austin': [30.2672, -97.7431], 'San Francisco': [37.7749, -122.4194],
  'Seattle': [47.6062, -122.3321], 'Denver': [39.7392, -104.9903],
  'Washington DC': [38.9072, -77.0369], 'Nashville': [36.1627, -86.7816],
  'Boston': [42.3601, -71.0589], 'Las Vegas': [36.1699, -115.1398],
  'Miami': [25.7617, -80.1918], 'Atlanta': [33.749, -84.388],
  'Minneapolis': [44.9778, -93.265], 'Portland': [45.5051, -122.675],
  'Toronto': [43.6532, -79.3832], 'Vancouver': [49.2827, -123.1207],
  'Montreal': [45.5017, -73.5673], 'Calgary': [51.0447, -114.0719],
  'Mexico City': [19.4326, -99.1332], 'Guadalajara': [20.6597, -103.3496],
  'São Paulo': [-23.5505, -46.6333], 'Buenos Aires': [-34.6037, -58.3816],
  'Rio de Janeiro': [-22.9068, -43.1729], 'Lima': [-12.0464, -77.0428],
  'Bogotá': [4.711, -74.0721], 'Santiago': [-33.4489, -70.6693],
  'London': [51.5074, -0.1278], 'Paris': [48.8566, 2.3522],
  'Berlin': [52.52, 13.405], 'Madrid': [40.4168, -3.7038],
  'Rome': [41.9028, 12.4964], 'Amsterdam': [52.3676, 4.9041],
  'Barcelona': [41.3851, 2.1734], 'Vienna': [48.2082, 16.3738],
  'Brussels': [50.8503, 4.3517], 'Zurich': [47.3769, 8.5417],
  'Lisbon': [38.7223, -9.1393], 'Stockholm': [59.3293, 18.0686],
  'Copenhagen': [55.6761, 12.5683], 'Oslo': [59.9139, 10.7522],
  'Helsinki': [60.1699, 24.9384], 'Dublin': [53.3498, -6.2603],
  'Munich': [48.1351, 11.582], 'Hamburg': [53.5753, 10.0153],
  'Frankfurt': [50.1109, 8.6821], 'Milan': [45.4654, 9.1859],
  'Moscow': [55.7558, 37.6173], 'Saint Petersburg': [59.9311, 30.3609],
  'Warsaw': [52.2297, 21.0122], 'Prague': [50.0755, 14.4378],
  'Budapest': [47.4979, 19.0402], 'Bucharest': [44.4268, 26.1025],
  'Kyiv': [50.4501, 30.5234], 'Istanbul': [41.0082, 28.9784],
  'Ankara': [39.9334, 32.8597], 'Cairo': [30.0444, 31.2357],
  'Lagos': [6.5244, 3.3792], 'Nairobi': [-1.2921, 36.8219],
  'Johannesburg': [-26.2041, 28.0473], 'Cape Town': [-33.9249, 18.4241],
  'Casablanca': [33.5731, -7.5898], 'Accra': [5.6037, -0.187],
  'Addis Ababa': [9.145, 40.4897], 'Dakar': [14.7167, -17.4677],
  'Dubai': [25.2048, 55.2708], 'Riyadh': [24.7136, 46.6753],
  'Tehran': [35.6892, 51.389], 'Tel Aviv': [32.0853, 34.7818],
  'Mumbai': [19.076, 72.8777], 'Delhi': [28.6139, 77.209],
  'Kolkata': [22.5726, 88.3639], 'Chennai': [13.0827, 80.2707],
  'Bangalore': [12.9716, 77.5946], 'Dhaka': [23.8103, 90.4125],
  'Karachi': [24.8607, 67.0011], 'Lahore': [31.5204, 74.3587],
  'Tokyo': [35.6762, 139.6503], 'Beijing': [39.9042, 116.4074],
  'Shanghai': [31.2304, 121.4737], 'Seoul': [37.5665, 126.978],
  'Singapore': [1.3521, 103.8198], 'Bangkok': [13.7563, 100.5018],
  'Jakarta': [-6.2088, 106.8456], 'Manila': [14.5995, 120.9842],
  'Kuala Lumpur': [3.139, 101.6869], 'Osaka': [34.6937, 135.5023],
  'Hong Kong': [22.3193, 114.1694], 'Taipei': [25.033, 121.5654],
  'Ho Chi Minh City': [10.8231, 106.6297], 'Hanoi': [21.0285, 105.8542],
  'Sydney': [-33.8688, 151.2093], 'Melbourne': [-37.8136, 144.9631],
  'Brisbane': [-27.4698, 153.0251], 'Perth': [-31.9505, 115.8605],
  'Auckland': [-36.8509, 174.7645], 'Tashkent': [41.2995, 69.2401],
  'Almaty': [43.222, 76.8512], 'Yerevan': [40.1792, 44.4991],
  'Tbilisi': [41.6938, 44.8015], 'Baku': [40.4093, 49.8671],
};

function getCityCoords(city) {
  if (!city) return null;
  const lower = city.toLowerCase().trim();
  const key = Object.keys(CITY_COORDS).find(
    k => lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)
  );
  return key ? CITY_COORDS[key] : null;
}

// Convert lat/lon to the globe rotation needed to face that point toward camera
// With our globe setup (no initial rotation offset), facing a lat/lon means:
//   rotY = lon in radians (east = positive)  → but THREE sphere has lon mapping via (lon+180)*PI/180 in theta
//   We need to rotate the globe so the point is at front (z+)
//   Facing point: rotY = -lon*DEG, rotX = lat*DEG (both in radians) but clamped
function cityToGlobeRotation(lat, lon) {
  const DEG = Math.PI / 180;
  // To bring lon to front: rotate globe -lon degrees around Y
  // To bring lat to center: rotate globe -lat*0.6 around X (partial tilt)
  return {
    y: -lon * DEG,
    x: -lat * DEG * 0.5,
  };
}

export default function GlobeMap({ avatars = [], focusCity = '', mode = 'explore' }) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    globe: null,
    camera: null,
    renderer: null,
    markerObjects: [],
    autoRotate: true,
    isDragging: false,
    rotVel: { x: 0, y: 0 },
    // Focus animation state
    focusing: false,
    focusStartTime: 0,
    focusDuration: 1600,
    fromRotY: 0,
    fromRotX: 0,
    toRotY: 0,
    toRotX: 0,
    fromZ: 2.5,
    toZ: 1.7,
  });
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [localAvatars, setLocalAvatars] = useState([]);

  // When focusCity changes, trigger focus animation
  useEffect(() => {
    if (!focusCity) return;
    const coords = getCityCoords(focusCity);
    if (!coords) return;

    const s = stateRef.current;
    if (!s.globe) return;

    const [lat, lon] = coords;
    const target = cityToGlobeRotation(lat, lon);

    // Shortest path
    let dy = target.y - s.globe.rotation.y;
    while (dy > Math.PI) dy -= 2 * Math.PI;
    while (dy < -Math.PI) dy += 2 * Math.PI;

    s.autoRotate = false;
    s.focusing = true;
    s.focusStartTime = performance.now();
    s.fromRotY = s.globe.rotation.y;
    s.fromRotX = s.globe.rotation.x;
    s.toRotY = s.globe.rotation.y + dy;
    s.toRotX = target.x;
    s.fromZ = s.camera.position.z;
    s.toZ = 1.7;

    // Show avatars in that city
    const cityAvatars = avatars.filter(a => a.city?.toLowerCase().includes(focusCity.toLowerCase()));
    setLocalAvatars(cityAvatars);
    if (cityAvatars.length > 0) setSelectedAvatar(cityAvatars[0]);
  }, [focusCity, avatars]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const w = el.clientWidth;
    const h = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.z = 2.5;

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(4000 * 3);
    for (let i = 0; i < starPos.length; i++) starPos[i] = (Math.random() - 0.5) * 100;
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.6 })));

    // Globe
    const loader = new THREE.TextureLoader();
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshPhongMaterial({
        map: loader.load('https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg', () => renderer.render(scene, camera)),
        bumpMap: loader.load('https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png'),
        bumpScale: 0.05,
        specularMap: loader.load('https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png'),
        specular: new THREE.Color(0x333333),
        shininess: 15,
      })
    );
    scene.add(globe);

    // Atmosphere
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 64, 64),
      new THREE.MeshPhongMaterial({ color: 0x4488ff, transparent: true, opacity: 0.08, side: THREE.FrontSide })
    ));

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    // Markers
    const markerObjects = [];
    avatars.filter(a => getCityCoords(a.city)).forEach(avatar => {
      const [lat, lon] = getCityCoords(avatar.city);
      // Place marker at surface position in WORLD space (no globe rotation yet)
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const pos = new THREE.Vector3(
        -Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      );
      pos.multiplyScalar(1.02);

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xe53935 })
      );
      dot.position.copy(pos);
      dot.userData = { avatar, basePhi: phi, baseTheta: theta };
      scene.add(dot);
      markerObjects.push(dot);

      // Pulse ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.025, 0.035, 16),
        new THREE.MeshBasicMaterial({ color: 0xff5252, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
      );
      ring.position.copy(pos);
      ring.lookAt(pos.clone().multiplyScalar(2));
      ring.userData = { isPulseRing: true, basePhi: phi, baseTheta: theta };
      scene.add(ring);
    });

    // Save refs
    const s = stateRef.current;
    s.globe = globe;
    s.camera = camera;
    s.renderer = renderer;
    s.markerObjects = markerObjects;
    s.autoRotate = true;

    // Helper to sync all markers to globe rotation
    const syncMarkers = () => {
      const ry = globe.rotation.y;
      const rx = globe.rotation.x;
      scene.children.forEach(obj => {
        if (!obj.userData?.basePhi) return;
        const phi = obj.userData.basePhi;
        const theta = obj.userData.baseTheta;
        // Rotate the base position by globe.rotation
        const basePos = new THREE.Vector3(
          -Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta)
        ).multiplyScalar(1.02);
        // Apply globe rotation matrix
        const euler = new THREE.Euler(rx, ry, 0, 'YXZ');
        basePos.applyEuler(euler);
        obj.position.copy(basePos);
        if (obj.userData.isPulseRing) {
          obj.lookAt(basePos.clone().multiplyScalar(2));
        }
      });
    };

    // Mouse / Touch
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let dragStartPos = { x: 0, y: 0 };
    let wasDragging = false;

    const onMouseDown = (e) => {
      s.isDragging = true;
      s.autoRotate = false;
      s.focusing = false;
      s.rotVel = { x: 0, y: 0 };
      dragStartPos = { x: e.clientX, y: e.clientY };
      wasDragging = false;
    };
    const onMouseMove = (e) => {
      if (!s.isDragging) return;
      const dx = e.clientX - dragStartPos.x;
      const dy = e.clientY - dragStartPos.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragging = true;
      s.rotVel.y = dx * 0.005;
      s.rotVel.x = dy * 0.005;
      globe.rotation.y += s.rotVel.y;
      globe.rotation.x += s.rotVel.x;
      globe.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x));
      syncMarkers();
      dragStartPos = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = (e) => {
      s.isDragging = false;
      if (!wasDragging) {
        // Raycasting for click
        const rect = el.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(markerObjects);
        if (hits.length > 0) setSelectedAvatar(hits[0].object.userData.avatar);
      }
    };

    let lastTouch = null;
    const onTouchStart = (e) => {
      s.isDragging = true;
      s.autoRotate = false;
      s.focusing = false;
      s.rotVel = { x: 0, y: 0 };
      lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e) => {
      if (!s.isDragging || !lastTouch) return;
      const dx = e.touches[0].clientX - lastTouch.x;
      const dy = e.touches[0].clientY - lastTouch.y;
      s.rotVel.y = dx * 0.005;
      s.rotVel.x = dy * 0.005;
      globe.rotation.y += s.rotVel.y;
      globe.rotation.x += s.rotVel.x;
      globe.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x));
      syncMarkers();
      lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { s.isDragging = false; };
    const onWheel = (e) => {
      camera.position.z = Math.max(1.4, Math.min(5, camera.position.z + e.deltaY * 0.005));
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);

    // Ease function
    const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    // Animation loop
    let animId;
    const animate = (now) => {
      animId = requestAnimationFrame(animate);

      if (s.focusing) {
        const elapsed = now - s.focusStartTime;
        const t = Math.min(elapsed / s.focusDuration, 1);
        const e = easeInOut(t);
        globe.rotation.y = s.fromRotY + (s.toRotY - s.fromRotY) * e;
        globe.rotation.x = s.fromRotX + (s.toRotX - s.fromRotX) * e;
        camera.position.z = s.fromZ + (s.toZ - s.fromZ) * e;
        syncMarkers();
        if (t >= 1) s.focusing = false;
      } else if (s.autoRotate) {
        globe.rotation.y += 0.002;
        syncMarkers();
      } else if (!s.isDragging) {
        s.rotVel.x *= 0.92;
        s.rotVel.y *= 0.92;
        globe.rotation.y += s.rotVel.y;
        globe.rotation.x += s.rotVel.x;
        globe.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x));
        syncMarkers();
        if (Math.abs(s.rotVel.x) < 0.0001 && Math.abs(s.rotVel.y) < 0.0001) {
          s.autoRotate = true;
        }
      }

      renderer.render(scene, camera);
    };
    animate(0);

    const onResize = () => {
      const nw = el.clientWidth, nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
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
      s.globe = null;
      s.camera = null;
    };
  }, [avatars]);

  const avatarsWithCoords = avatars.filter(a => getCityCoords(a.city));
  const displayAvatars = localAvatars.length > 0 ? localAvatars : avatarsWithCoords;

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '600px', background: 'radial-gradient(ellipse at center, #0a0e1a 0%, #020408 100%)' }}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Legend */}
      <div className="absolute top-4 left-4 glass rounded-lg px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          {mode === 'avatar' ? 'Job location' : 'Avatar location'}
        </div>
        <div className="text-muted-foreground/60">Drag · Scroll to zoom · Click marker</div>
      </div>

      {/* Sidebar list */}
      <div className="absolute top-4 right-4 glass rounded-lg p-3 max-h-72 overflow-y-auto w-52">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          {focusCity ? `Results near "${focusCity}"` : (mode === 'avatar' ? 'Jobs on map' : 'Avatars on map')}
        </p>
        {displayAvatars.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">None found in this area</p>
        ) : (
          displayAvatars.map(a => (
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