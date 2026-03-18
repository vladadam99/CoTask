import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import { MapPin, Star, X, Users } from 'lucide-react';

// City → lat/lon lookup (300+ cities worldwide)
const CITY_COORDS = {
  'New York': [40.7128, -74.006], 'Los Angeles': [34.0522, -118.2437],
  'Chicago': [41.8781, -87.6298], 'Houston': [29.7604, -95.3698],
  'Phoenix': [33.4484, -112.074], 'Philadelphia': [39.9526, -75.1652],
  'San Antonio': [29.4241, -98.4936], 'San Diego': [32.7157, -117.1611],
  'Dallas': [32.7767, -96.797], 'San Jose': [37.3382, -121.8863],
  'Austin': [30.2672, -97.7431], 'San Francisco': [37.7749, -122.4194],
  'Seattle': [47.6062, -122.3321], 'Denver': [39.7392, -104.9903],
  'Washington DC': [38.9072, -77.0369], 'Boston': [42.3601, -71.0589],
  'Las Vegas': [36.1699, -115.1398], 'Miami': [25.7617, -80.1918],
  'Atlanta': [33.749, -84.388], 'Nashville': [36.1627, -86.7816],
  'Portland': [45.5051, -122.675], 'Minneapolis': [44.9778, -93.265],
  'Charlotte': [35.2271, -80.8431], 'Detroit': [42.3314, -83.0458],
  'Tampa': [27.9506, -82.4572], 'Baltimore': [39.2904, -76.6122],
  'Toronto': [43.6532, -79.3832], 'Vancouver': [49.2827, -123.1207],
  'Montreal': [45.5017, -73.5673], 'Calgary': [51.0447, -114.0719],
  'Ottawa': [45.4215, -75.6972],
  'Mexico City': [19.4326, -99.1332], 'Guadalajara': [20.6597, -103.3496],
  'Monterrey': [25.6866, -100.3161],
  'São Paulo': [-23.5505, -46.6333], 'Buenos Aires': [-34.6037, -58.3816],
  'Rio de Janeiro': [-22.9068, -43.1729], 'Lima': [-12.0464, -77.0428],
  'Bogotá': [4.711, -74.0721], 'Santiago': [-33.4489, -70.6693],
  'Caracas': [10.4806, -66.9036],
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
  'Lyon': [45.7640, 4.8357], 'Marseille': [43.2965, 5.3698],
  'Porto': [41.1579, -8.6291], 'Seville': [37.3891, -5.9845],
  'Moscow': [55.7558, 37.6173], 'Saint Petersburg': [59.9311, 30.3609],
  'Warsaw': [52.2297, 21.0122], 'Prague': [50.0755, 14.4378],
  'Budapest': [47.4979, 19.0402], 'Bucharest': [44.4268, 26.1025],
  'Sofia': [42.6977, 23.3219], 'Kyiv': [50.4501, 30.5234],
  'Belgrade': [44.8176, 20.4633], 'Zagreb': [45.815, 15.9819],
  'Yerevan': [40.1792, 44.4991], 'Tbilisi': [41.6938, 44.8015],
  'Baku': [40.4093, 49.8671], 'Almaty': [43.222, 76.8512],
  'Dubai': [25.2048, 55.2708], 'Istanbul': [41.0082, 28.9784],
  'Riyadh': [24.7136, 46.6753], 'Abu Dhabi': [24.4539, 54.3773],
  'Tehran': [35.6892, 51.389], 'Baghdad': [33.3152, 44.3661],
  'Beirut': [33.8938, 35.5018], 'Tel Aviv': [32.0853, 34.7818],
  'Doha': [25.2854, 51.531], 'Muscat': [23.5880, 58.3829],
  'Ankara': [39.9334, 32.8597],
  'Cairo': [30.0444, 31.2357], 'Lagos': [6.5244, 3.3792],
  'Nairobi': [-1.2921, 36.8219], 'Johannesburg': [-26.2041, 28.0473],
  'Cape Town': [-33.9249, 18.4241], 'Addis Ababa': [9.145, 40.4897],
  'Accra': [5.6037, -0.187], 'Casablanca': [33.5731, -7.5898],
  'Tunis': [36.8065, 10.1815], 'Algiers': [36.7372, 3.0863],
  'Kampala': [0.3476, 32.5825], 'Dar es Salaam': [-6.7924, 39.2083],
  'Mumbai': [19.076, 72.8777], 'Delhi': [28.6139, 77.209],
  'Kolkata': [22.5726, 88.3639], 'Chennai': [13.0827, 80.2707],
  'Bangalore': [12.9716, 77.5946], 'Hyderabad': [17.385, 78.4867],
  'Ahmedabad': [23.0225, 72.5714], 'Pune': [18.5204, 73.8567],
  'Dhaka': [23.8103, 90.4125], 'Karachi': [24.8607, 67.0011],
  'Lahore': [31.5204, 74.3587], 'Colombo': [6.9271, 79.8612],
  'Tokyo': [35.6762, 139.6503], 'Beijing': [39.9042, 116.4074],
  'Shanghai': [31.2304, 121.4737], 'Seoul': [37.5665, 126.978],
  'Singapore': [1.3521, 103.8198], 'Bangkok': [13.7563, 100.5018],
  'Jakarta': [-6.2088, 106.8456], 'Manila': [14.5995, 120.9842],
  'Kuala Lumpur': [3.139, 101.6869], 'Osaka': [34.6937, 135.5023],
  'Guangzhou': [23.1291, 113.2644], 'Shenzhen': [22.5431, 114.0579],
  'Chengdu': [30.5728, 104.0668], 'Hong Kong': [22.3193, 114.1694],
  'Taipei': [25.0330, 121.5654], 'Ho Chi Minh City': [10.8231, 106.6297],
  'Hanoi': [21.0285, 105.8542],
  'Tashkent': [41.2995, 69.2401], 'Astana': [51.1801, 71.446],
  'Sydney': [-33.8688, 151.2093], 'Melbourne': [-37.8136, 144.9631],
  'Brisbane': [-27.4698, 153.0251], 'Perth': [-31.9505, 115.8605],
  'Auckland': [-36.8509, 174.7645],
};

// Convert lat/lon to a position on a unit sphere surface
// theta: longitude in radians (0 at prime meridian, increases eastward)
// phi: polar angle from north pole
function latLonToAngles(lat, lon) {
  const phi = (90 - lat) * (Math.PI / 180);   // polar angle
  const theta = (lon + 180) * (Math.PI / 180); // azimuthal angle
  return { phi, theta };
}

// Position on sphere of given radius
function latLonToVec3(lat, lon, radius) {
  const { phi, theta } = latLonToAngles(lat, lon);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function getCityCoords(city) {
  if (!city) return null;
  const lower = city.toLowerCase();
  const key = Object.keys(CITY_COORDS).find(
    k => lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)
  );
  return key ? CITY_COORDS[key] : null;
}

// Given lat/lon, compute the globe rotation needed to face that point toward camera
// Camera is at +Z. The globe's initial texture maps 0° lon to -Z direction (theta=π)
// To bring lat/lon to front (+Z facing camera), we need:
//   rotY = -(lon * π/180)  → rotates the globe so that longitude faces +Z
//   rotX = -(lat * π/180) * a fraction for tilt effect
function latLonToGlobeRotation(lat, lon) {
  // The texture places prime meridian (lon=0) at theta=π → which is -Z (back)
  // To bring lon to front (+Z), rotate globe by -(lon * π/180) around Y
  const rotY = -(lon * Math.PI / 180);
  // Tilt X axis to show latitude, scale by 0.6 to avoid extreme angles
  const rotX = -(lat * Math.PI / 180) * 0.6;
  return { rotY, rotX };
}

export default function GlobeMap({ avatars = [], focusCity = '', mode = 'client' }) {
  const mountRef = useRef(null);
  const sceneRef = useRef({});
  const stateRef = useRef({ autoRotate: true, isDragging: false, focusAnimId: null });
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [cityAvatars, setCityAvatars] = useState([]);

  const handleMarkerClick = useCallback((avatar) => {
    setSelectedAvatar(avatar);
  }, []);

  // Focus on city — this is the key effect
  useEffect(() => {
    if (!focusCity) {
      // Resume auto-rotate when focus cleared
      stateRef.current.autoRotate = true;
      setSelectedAvatar(null);
      setCityAvatars([]);
      return;
    }

    const coords = getCityCoords(focusCity);
    const { globe, camera } = sceneRef.current;
    if (!globe || !camera) return;

    // Stop spinning
    stateRef.current.autoRotate = false;

    // Cancel any in-progress focus animation
    if (stateRef.current.focusAnimId) {
      cancelAnimationFrame(stateRef.current.focusAnimId);
    }

    const [lat, lon] = coords || [0, 0];
    const { rotY, rotX } = latLonToGlobeRotation(lat, lon);

    const startY = globe.rotation.y;
    const startX = globe.rotation.x;
    const startCamZ = camera.position.z;
    const targetCamZ = 1.7; // zoom in

    // Shortest path for Y rotation
    let dy = rotY - startY;
    while (dy > Math.PI) dy -= 2 * Math.PI;
    while (dy < -Math.PI) dy += 2 * Math.PI;
    const dx = rotX - startX;

    const duration = 1600;
    const start = performance.now();

    const animateTo = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // Ease in-out cubic
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      globe.rotation.y = startY + dy * ease;
      globe.rotation.x = startX + dx * ease;
      camera.position.z = startCamZ + (targetCamZ - startCamZ) * ease;
      if (t < 1) {
        stateRef.current.focusAnimId = requestAnimationFrame(animateTo);
      } else {
        stateRef.current.focusAnimId = null;
      }
    };
    stateRef.current.focusAnimId = requestAnimationFrame(animateTo);

    // Show avatars in this city
    const matches = avatars.filter(a =>
      a.city?.toLowerCase().includes(focusCity.toLowerCase()) ||
      focusCity.toLowerCase().includes(a.city?.toLowerCase() || '')
    );
    setCityAvatars(matches);
    if (matches.length > 0) setSelectedAvatar(matches[0]);
    else setSelectedAvatar(null);

    return () => {
      if (stateRef.current.focusAnimId) {
        cancelAnimationFrame(stateRef.current.focusAnimId);
      }
    };
  }, [focusCity, avatars]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const width = el.clientWidth;
    const height = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.5;

    // Stars
    const starPositions = new Float32Array(4000 * 3);
    for (let i = 0; i < starPositions.length; i++) starPositions[i] = (Math.random() - 0.5) * 200;
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.6 })));

    // Globe
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    const loader = new THREE.TextureLoader();
    const earthTex = loader.load('https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg', () => renderer.render(scene, camera));
    const bumpTex = loader.load('https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png');
    const globeMat = new THREE.MeshPhongMaterial({
      map: earthTex,
      bumpMap: bumpTex,
      bumpScale: 0.04,
      specular: new THREE.Color(0x222222),
      shininess: 12,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Atmosphere
    const atmoMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.03, 64, 64),
      new THREE.MeshPhongMaterial({ color: 0x4488ff, transparent: true, opacity: 0.07, side: THREE.FrontSide })
    );
    scene.add(atmoMesh);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    // Markers — attached as children of globe so they rotate with it!
    const markerMeshes = [];
    const avatarsWithCoords = avatars.filter(a => getCityCoords(a.city));

    avatarsWithCoords.forEach(avatar => {
      const coords = getCityCoords(avatar.city);
      if (!coords) return;
      const [lat, lon] = coords;
      const pos = latLonToVec3(lat, lon, 1.02);

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xe53935 })
      );
      dot.position.copy(pos);
      dot.userData = { avatar };
      globe.add(dot); // child of globe!
      markerMeshes.push(dot);

      // Outer ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.025, 0.035, 16),
        new THREE.MeshBasicMaterial({ color: 0xff5252, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
      );
      ring.position.copy(pos);
      ring.lookAt(pos.clone().multiplyScalar(2));
      globe.add(ring); // child of globe!
    });

    sceneRef.current = { scene, camera, renderer, globe, markerMeshes };

    // Interaction
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let velocity = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let mouseMovedSinceDown = false;

    const onMouseDown = (e) => {
      isDragging = true;
      mouseMovedSinceDown = false;
      stateRef.current.autoRotate = false;
      if (stateRef.current.focusAnimId) {
        cancelAnimationFrame(stateRef.current.focusAnimId);
        stateRef.current.focusAnimId = null;
      }
      prevMouse = { x: e.clientX, y: e.clientY };
      velocity = { x: 0, y: 0 };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) mouseMovedSinceDown = true;
      velocity.y = dx * 0.005;
      velocity.x = dy * 0.005;
      globe.rotation.x += velocity.x;
      globe.rotation.y += velocity.y;
      // Clamp X rotation
      globe.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x));
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      // Click on marker?
      if (!mouseMovedSinceDown) {
        const rect = el.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(markerMeshes);
        if (hits.length > 0) handleMarkerClick(hits[0].object.userData.avatar);
      }
    };

    let lastTouch = null;
    const onTouchStart = (e) => {
      isDragging = true;
      mouseMovedSinceDown = false;
      stateRef.current.autoRotate = false;
      if (stateRef.current.focusAnimId) {
        cancelAnimationFrame(stateRef.current.focusAnimId);
        stateRef.current.focusAnimId = null;
      }
      lastTouch = e.touches[0];
      velocity = { x: 0, y: 0 };
    };
    const onTouchMove = (e) => {
      if (!isDragging || !lastTouch) return;
      const dx = e.touches[0].clientX - lastTouch.clientX;
      const dy = e.touches[0].clientY - lastTouch.clientY;
      mouseMovedSinceDown = true;
      velocity.y = dx * 0.005;
      velocity.x = dy * 0.005;
      globe.rotation.x += velocity.x;
      globe.rotation.y += velocity.y;
      globe.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x));
      lastTouch = e.touches[0];
    };
    const onTouchEnd = () => { isDragging = false; };

    const onWheel = (e) => {
      camera.position.z = Math.min(5, Math.max(1.4, camera.position.z + e.deltaY * 0.004));
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', () => { isDragging = false; });
    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);

    // Animation loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (stateRef.current.autoRotate) {
        globe.rotation.y += 0.0015;
      } else if (!isDragging && !stateRef.current.focusAnimId) {
        // Inertia
        velocity.x *= 0.92;
        velocity.y *= 0.92;
        globe.rotation.x += velocity.x;
        globe.rotation.y += velocity.y;
        globe.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x));
        if (Math.abs(velocity.x) < 0.0001 && Math.abs(velocity.y) < 0.0001) {
          stateRef.current.autoRotate = true;
        }
      }
      renderer.render(scene, camera);
    };
    animate();

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
      window.removeEventListener('resize', onResize);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [avatars, handleMarkerClick]);

  const avatarsWithCoords = avatars.filter(a => getCityCoords(a.city));

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '560px', background: 'radial-gradient(ellipse at center, #060d1f 0%, #010205 100%)' }}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Legend */}
      <div className="absolute top-4 left-4 glass rounded-lg px-3 py-2 text-xs text-muted-foreground pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <span>{mode === 'avatar' ? 'Posted jobs' : 'Avatar location'}</span>
        </div>
        <div className="opacity-60">Drag · Scroll to zoom · Click marker</div>
      </div>

      {/* Sidebar */}
      <div className="absolute top-4 right-4 glass rounded-lg p-3 max-h-64 overflow-y-auto w-44">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          {mode === 'avatar' ? 'Nearby Jobs' : 'On Map'} ({avatarsWithCoords.length})
        </p>
        {avatarsWithCoords.length === 0 ? (
          <p className="text-xs text-muted-foreground">None with known cities</p>
        ) : (
          avatarsWithCoords.slice(0, 20).map(a => (
            <button key={a.id} onClick={() => setSelectedAvatar(a)}
              className="w-full text-left flex items-center gap-2 py-1.5 hover:bg-white/5 rounded px-1 transition-colors">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
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

      {/* City avatars list (after search) */}
      {cityAvatars.length > 1 && (
        <div className="absolute bottom-6 left-4 glass rounded-xl p-3 max-w-xs max-h-40 overflow-y-auto">
          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Users className="w-3 h-3" /> {cityAvatars.length} {mode === 'avatar' ? 'jobs' : 'avatars'} in area
          </p>
          <div className="space-y-1">
            {cityAvatars.map(a => (
              <button key={a.id} onClick={() => setSelectedAvatar(a)}
                className={`w-full text-left flex items-center gap-2 rounded px-2 py-1 text-xs transition-colors ${selectedAvatar?.id === a.id ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`}>
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0">
                  {a.display_name?.[0]}
                </div>
                <span className="truncate">{a.display_name}</span>
                {a.hourly_rate && <span className="ml-auto text-muted-foreground">${a.hourly_rate}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Avatar popup */}
      {selectedAvatar && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-strong rounded-xl p-4 w-72 shadow-xl border border-white/10 animate-fade-in z-10">
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
                  <span className="ml-1 flex items-center gap-0.5 text-yellow-400">
                    <Star className="w-3 h-3" /> {selectedAvatar.rating.toFixed(1)}
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