import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import { MapPin, Star, X } from 'lucide-react';

// City coordinate lookup
const CITY_COORDS = {
  'new york': [40.7128, -74.006],
  'london': [51.5074, -0.1278],
  'paris': [48.8566, 2.3522],
  'tokyo': [35.6762, 139.6503],
  'sydney': [-33.8688, 151.2093],
  'dubai': [25.2048, 55.2708],
  'berlin': [52.52, 13.405],
  'toronto': [43.6532, -79.3832],
  'singapore': [1.3521, 103.8198],
  'mumbai': [19.076, 72.8777],
  'beijing': [39.9042, 116.4074],
  'los angeles': [34.0522, -118.2437],
  'chicago': [41.8781, -87.6298],
  'amsterdam': [52.3676, 4.9041],
  'madrid': [40.4168, -3.7038],
  'rome': [41.9028, 12.4964],
  'bangkok': [13.7563, 100.5018],
  'istanbul': [41.0082, 28.9784],
  'mexico city': [19.4326, -99.1332],
  'cairo': [30.0444, 31.2357],
  'nairobi': [-1.2921, 36.8219],
  'buenos aires': [-34.6037, -58.3816],
  'moscow': [55.7558, 37.6173],
  'seoul': [37.5665, 126.978],
  'jakarta': [-6.2088, 106.8456],
  'lagos': [6.5244, 3.3792],
  'karachi': [24.8607, 67.0011],
  'sao paulo': [-23.5505, -46.6333],
  'miami': [25.7617, -80.1918],
  'san francisco': [37.7749, -122.4194],
  'seattle': [47.6062, -122.3321],
  'barcelona': [41.3851, 2.1734],
  'zurich': [47.3769, 8.5417],
  'vienna': [48.2082, 16.3738],
  'stockholm': [59.3293, 18.0686],
  'oslo': [59.9139, 10.7522],
  'copenhagen': [55.6761, 12.5683],
  'athens': [37.9838, 23.7275],
  'lisbon': [38.7223, -9.1393],
  'brussels': [50.8503, 4.3517],
  'helsinki': [60.1699, 24.9384],
  'prague': [50.0755, 14.4378],
  'budapest': [47.4979, 19.0402],
  'warsaw': [52.2297, 21.0122],
  'bucharest': [44.4268, 26.1025],
  'sofia': [42.6977, 23.3219],
  'zagreb': [45.815, 15.9819],
  'riyadh': [24.7136, 46.6753],
  'tehran': [35.6892, 51.389],
  'lahore': [31.5204, 74.3587],
  'dhaka': [23.8103, 90.4125],
  'kathmandu': [27.7172, 85.3240],
  'colombo': [6.9271, 79.8612],
  'kuala lumpur': [3.1390, 101.6869],
  'manila': [14.5995, 120.9842],
  'ho chi minh': [10.8231, 106.6297],
  'hanoi': [21.0285, 105.8542],
  'hong kong': [22.3193, 114.1694],
  'taipei': [25.0330, 121.5654],
  'osaka': [34.6937, 135.5023],
  'auckland': [-36.8485, 174.7633],
  'johannesburg': [-26.2041, 28.0473],
  'casablanca': [33.5731, -7.5898],
  'accra': [5.6037, -0.1870],
  'addis ababa': [8.9806, 38.7578],
  'montreal': [45.5017, -73.5673],
  'vancouver': [49.2827, -123.1207],
  'lima': [-12.0464, -77.0428],
  'bogota': [4.7110, -74.0721],
  'santiago': [-33.4489, -70.6693],
};

function latLngToVec3(lat, lng, r = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function getCoords(city) {
  if (!city) return null;
  return CITY_COORDS[city.toLowerCase()] || null;
}

export default function GlobeMap({ avatars = [] }) {
  const mountRef = useRef(null);
  const sceneRef = useRef({});
  const [selected, setSelected] = useState(null);
  const [tooltip, setTooltip] = useState(null); // {x, y, avatar}
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0.3, y: 0 });
  const targetRotation = useRef({ x: 0.3, y: 0 });
  const autoSpin = useRef(true);
  const animFrameRef = useRef();

  // Build avatar data with coords
  const avatarPoints = avatars
    .map(a => ({ avatar: a, coords: getCoords(a.city) }))
    .filter(p => p.coords);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth;
    const H = el.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.z = 2.5;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);
    const sunLight = new THREE.DirectionalLight(0xffd8a0, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
    const rimLight = new THREE.DirectionalLight(0x4488ff, 0.4);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // Stars background
    const starGeo = new THREE.BufferGeometry();
    const starVerts = [];
    for (let i = 0; i < 3000; i++) {
      const v = new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80
      );
      if (v.length() > 5) starVerts.push(v.x, v.y, v.z);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, sizeAttenuation: true });
    scene.add(new THREE.Points(starGeo, starMat));

    // Globe sphere
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    
    // Load earth texture from NASA
    const textureLoader = new THREE.TextureLoader();
    const earthTex = textureLoader.load(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/1280px-Blue_Marble_2002.png'
    );
    const globeMat = new THREE.MeshPhongMaterial({
      map: earthTex,
      specular: new THREE.Color(0x333333),
      shininess: 15,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Atmosphere glow
    const atmGeo = new THREE.SphereGeometry(1.03, 64, 64);
    const atmMat = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.FrontSide,
    });
    scene.add(new THREE.Mesh(atmGeo, atmMat));

    // Avatar markers
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);
    const markerMeshes = [];

    avatarPoints.forEach(({ avatar, coords }) => {
      const [lat, lng] = coords;
      const pos = latLngToVec3(lat, lng, 1.02);

      // Glowing dot
      const dotGeo = new THREE.SphereGeometry(0.018, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({
        color: avatar.is_available ? 0x00ff88 : 0xff3366,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.userData = { avatar, coords };
      markerGroup.add(dot);
      markerMeshes.push(dot);

      // Pulse ring
      const ringGeo = new THREE.RingGeometry(0.022, 0.032, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: avatar.is_available ? 0x00ff88 : 0xff3366,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      ring.userData = { isPulse: true, baseScale: 1 };
      markerGroup.add(ring);
    });

    sceneRef.current = { renderer, scene, camera, globe, markerGroup, markerMeshes };

    // Raycaster for clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getMousePos = (e) => {
      const rect = el.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
        clientX: e.clientX,
        clientY: e.clientY,
      };
    };

    const onMouseDown = (e) => {
      isDragging.current = false;
      prevMouse.current = { x: e.clientX, y: e.clientY };
      autoSpin.current = false;
    };

    const onMouseMove = (e) => {
      if (e.buttons === 1) {
        isDragging.current = true;
        const dx = e.clientX - prevMouse.current.x;
        const dy = e.clientY - prevMouse.current.y;
        targetRotation.current.y += dx * 0.005;
        targetRotation.current.x += dy * 0.005;
        targetRotation.current.x = Math.max(-1.2, Math.min(1.2, targetRotation.current.x));
        prevMouse.current = { x: e.clientX, y: e.clientY };
      }

      // Hover tooltip
      const m = getMousePos(e);
      mouse.x = m.x; mouse.y = m.y;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(markerMeshes);
      if (hits.length > 0) {
        const av = hits[0].object.userData.avatar;
        el.style.cursor = 'pointer';
        setTooltip({ x: e.clientX, y: e.clientY, avatar: av });
      } else {
        el.style.cursor = 'grab';
        setTooltip(null);
      }
    };

    const onMouseUp = (e) => {
      if (!isDragging.current) {
        const m = getMousePos(e);
        mouse.x = m.x; mouse.y = m.y;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(markerMeshes);
        if (hits.length > 0) {
          setSelected(hits[0].object.userData.avatar);
        } else {
          setSelected(null);
        }
      }
    };

    const onWheel = (e) => {
      camera.position.z = Math.max(1.6, Math.min(5, camera.position.z + e.deltaY * 0.002));
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('wheel', onWheel);

    // Touch support
    let lastTouchX = 0, lastTouchY = 0;
    const onTouchStart = (e) => {
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      autoSpin.current = false;
    };
    const onTouchMove = (e) => {
      const dx = e.touches[0].clientX - lastTouchX;
      const dy = e.touches[0].clientY - lastTouchY;
      targetRotation.current.y += dx * 0.005;
      targetRotation.current.x += dy * 0.005;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    };
    el.addEventListener('touchstart', onTouchStart);
    el.addEventListener('touchmove', onTouchMove);

    // Animation loop
    let t = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      t += 0.016;

      if (autoSpin.current) targetRotation.current.y += 0.002;

      rotation.current.x += (targetRotation.current.x - rotation.current.x) * 0.08;
      rotation.current.y += (targetRotation.current.y - rotation.current.y) * 0.08;

      globe.rotation.x = rotation.current.x;
      globe.rotation.y = rotation.current.y;
      markerGroup.rotation.x = rotation.current.x;
      markerGroup.rotation.y = rotation.current.y;

      // Pulse rings
      markerGroup.children.forEach(child => {
        if (child.userData.isPulse) {
          const s = 1 + 0.4 * Math.sin(t * 2);
          child.scale.set(s, s, s);
          child.material.opacity = 0.5 - 0.3 * Math.abs(Math.sin(t * 2));
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [avatarPoints.length]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: '600px', background: 'radial-gradient(ellipse at center, #0a0f1e 0%, #000510 100%)' }}>
      {/* Globe canvas */}
      <div ref={mountRef} className="w-full h-full" style={{ cursor: 'grab' }} />

      {/* Legend */}
      <div className="absolute top-4 left-4 glass rounded-lg px-3 py-2 text-xs space-y-1">
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> Available</div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Busy</div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 glass rounded-lg px-3 py-2 text-xs text-muted-foreground">
        <span className="text-foreground font-semibold">{avatarPoints.length}</span> avatars on globe
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-1.5 text-xs text-muted-foreground">
        Drag to rotate · Scroll to zoom · Click a dot to view avatar
      </div>

      {/* Hover Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 glass rounded-lg px-3 py-2 text-sm pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-semibold">{tooltip.avatar.display_name}</p>
          <p className="text-xs text-muted-foreground">{tooltip.avatar.city}</p>
        </div>
      )}

      {/* Selected Avatar Panel */}
      {selected && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 glass-strong rounded-2xl p-4 w-72 animate-fade-in">
          <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
              {selected.display_name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{selected.display_name}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3" /> {selected.city}
                {selected.rating > 0 && (
                  <><Star className="w-3 h-3 text-yellow-400 ml-1" /> {selected.rating.toFixed(1)}</>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{selected.bio || 'Available for bookings'}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-primary">${selected.hourly_rate || 30}/hr</span>
                <Link
                  to={`/AvatarView?id=${selected.id}`}
                  className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90 transition-colors"
                >
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