import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import { MapPin, Star, X } from 'lucide-react';

// City → lat/lon lookup (300+ cities worldwide)
const CITY_COORDS = {
  // North America - USA
  'New York': [40.7128, -74.006], 'Los Angeles': [34.0522, -118.2437],
  'Chicago': [41.8781, -87.6298], 'Houston': [29.7604, -95.3698],
  'Phoenix': [33.4484, -112.074], 'Philadelphia': [39.9526, -75.1652],
  'San Antonio': [29.4241, -98.4936], 'San Diego': [32.7157, -117.1611],
  'Dallas': [32.7767, -96.797], 'San Jose': [37.3382, -121.8863],
  'Austin': [30.2672, -97.7431], 'Jacksonville': [30.3322, -81.6557],
  'San Francisco': [37.7749, -122.4194], 'Columbus': [39.9612, -82.9988],
  'Charlotte': [35.2271, -80.8431], 'Indianapolis': [39.7684, -86.1581],
  'Seattle': [47.6062, -122.3321], 'Denver': [39.7392, -104.9903],
  'Washington DC': [38.9072, -77.0369], 'Nashville': [36.1627, -86.7816],
  'Oklahoma City': [35.4676, -97.5164], 'El Paso': [31.7619, -106.485],
  'Boston': [42.3601, -71.0589], 'Las Vegas': [36.1699, -115.1398],
  'Miami': [25.7617, -80.1918], 'Atlanta': [33.749, -84.388],
  'Minneapolis': [44.9778, -93.265], 'Portland': [45.5051, -122.675],
  'New Orleans': [29.9511, -90.0715], 'Baltimore': [39.2904, -76.6122],
  'Salt Lake City': [40.7608, -111.891], 'Kansas City': [39.0997, -94.5786],
  'Tampa': [27.9506, -82.4572], 'Pittsburgh': [40.4406, -79.9959],
  'Sacramento': [38.5816, -121.4944], 'Cincinnati': [39.1031, -84.512],
  'Raleigh': [35.7796, -78.6382], 'Cleveland': [41.4993, -81.6944],
  'Detroit': [42.3314, -83.0458], 'Tucson': [32.2226, -110.9747],
  'Honolulu': [21.3069, -157.8583], 'Anchorage': [61.2181, -149.9003],
  // Canada
  'Toronto': [43.6532, -79.3832], 'Vancouver': [49.2827, -123.1207],
  'Montreal': [45.5017, -73.5673], 'Calgary': [51.0447, -114.0719],
  'Edmonton': [53.5461, -113.4938], 'Ottawa': [45.4215, -75.6972],
  'Winnipeg': [49.8951, -97.1384], 'Quebec City': [46.8139, -71.2082],
  // Mexico & Central America
  'Mexico City': [19.4326, -99.1332], 'Guadalajara': [20.6597, -103.3496],
  'Monterrey': [25.6866, -100.3161], 'Puebla': [19.0414, -98.2063],
  'Guatemala City': [14.6349, -90.5069], 'Panama City': [8.9936, -79.5197],
  'San Jose CR': [9.9281, -84.0907], 'Tegucigalda': [14.0723, -87.2068],
  // Caribbean
  'Havana': [23.1136, -82.3666], 'Santo Domingo': [18.4861, -69.9312],
  'San Juan': [18.4655, -66.1057], 'Kingston': [17.9970, -76.7936],
  // South America
  'São Paulo': [-23.5505, -46.6333], 'Buenos Aires': [-34.6037, -58.3816],
  'Rio de Janeiro': [-22.9068, -43.1729], 'Lima': [-12.0464, -77.0428],
  'Bogotá': [4.711, -74.0721], 'Santiago': [-33.4489, -70.6693],
  'Caracas': [10.4806, -66.9036], 'Quito': [-0.1807, -78.4678],
  'La Paz': [-16.5000, -68.1193], 'Montevideo': [-34.9011, -56.1645],
  'Asunción': [-25.2867, -57.647], 'Guayaquil': [-2.1710, -79.9224],
  'Medellín': [6.2442, -75.5812], 'Cali': [3.4516, -76.532],
  'Recife': [-8.0476, -34.877], 'Porto Alegre': [-30.0346, -51.2177],
  'Fortaleza': [-3.7172, -38.5433], 'Manaus': [-3.119, -60.0217],
  // Western Europe
  'London': [51.5074, -0.1278], 'Paris': [48.8566, 2.3522],
  'Berlin': [52.52, 13.405], 'Madrid': [40.4168, -3.7038],
  'Rome': [41.9028, 12.4964], 'Amsterdam': [52.3676, 4.9041],
  'Barcelona': [41.3851, 2.1734], 'Vienna': [48.2082, 16.3738],
  'Brussels': [50.8503, 4.3517], 'Zurich': [47.3769, 8.5417],
  'Lisbon': [38.7223, -9.1393], 'Stockholm': [59.3293, 18.0686],
  'Copenhagen': [55.6761, 12.5683], 'Oslo': [59.9139, 10.7522],
  'Helsinki': [60.1699, 24.9384], 'Dublin': [53.3498, -6.2603],
  'Geneva': [46.2044, 6.1432], 'Munich': [48.1351, 11.582],
  'Hamburg': [53.5753, 10.0153], 'Frankfurt': [50.1109, 8.6821],
  'Milan': [45.4654, 9.1859], 'Naples': [40.8518, 14.2681],
  'Turin': [45.0703, 7.6869], 'Valencia': [39.4699, -0.3763],
  'Seville': [37.3891, -5.9845], 'Bilbao': [43.263, -2.935],
  'Porto': [41.1579, -8.6291], 'Lyon': [45.7640, 4.8357],
  'Marseille': [43.2965, 5.3698], 'Toulouse': [43.6047, 1.4442],
  'Antwerp': [51.2194, 4.4025], 'Ghent': [51.0543, 3.7174],
  'Rotterdam': [51.9225, 4.4792], 'The Hague': [52.0705, 4.3007],
  'Gothenburg': [57.7089, 11.9746], 'Malmo': [55.604, 13.003],
  'Reykjavik': [64.1265, -21.8174], 'Luxembourg': [49.6117, 6.13],
  // Eastern Europe
  'Moscow': [55.7558, 37.6173], 'Saint Petersburg': [59.9311, 30.3609],
  'Warsaw': [52.2297, 21.0122], 'Prague': [50.0755, 14.4378],
  'Budapest': [47.4979, 19.0402], 'Bucharest': [44.4268, 26.1025],
  'Sofia': [42.6977, 23.3219], 'Zagreb': [45.815, 15.9819],
  'Belgrade': [44.8176, 20.4633], 'Kyiv': [50.4501, 30.5234],
  'Minsk': [53.9045, 27.5615], 'Vilnius': [54.6872, 25.2797],
  'Riga': [56.9496, 24.1052], 'Tallinn': [59.437, 24.7536],
  'Bratislava': [48.1486, 17.1077], 'Ljubljana': [46.0569, 14.5058],
  'Sarajevo': [43.8563, 18.4131], 'Skopje': [41.9981, 21.4254],
  'Tirana': [41.3275, 19.8187], 'Chisinau': [47.0105, 28.8638],
  'Yerevan': [40.1792, 44.4991], 'Tbilisi': [41.6938, 44.8015],
  'Baku': [40.4093, 49.8671], 'Almaty': [43.222, 76.8512],
  // Middle East
  'Dubai': [25.2048, 55.2708], 'Istanbul': [41.0082, 28.9784],
  'Riyadh': [24.7136, 46.6753], 'Abu Dhabi': [24.4539, 54.3773],
  'Tehran': [35.6892, 51.389], 'Baghdad': [33.3152, 44.3661],
  'Beirut': [33.8938, 35.5018], 'Amman': [31.9454, 35.9284],
  'Jerusalem': [31.7683, 35.2137], 'Tel Aviv': [32.0853, 34.7818],
  'Kuwait City': [29.3759, 47.9774], 'Doha': [25.2854, 51.531],
  'Muscat': [23.5880, 58.3829], 'Sanaa': [15.3694, 44.191],
  'Damascus': [33.5138, 36.2765], 'Aleppo': [36.2021, 37.1343],
  'Ankara': [39.9334, 32.8597], 'Izmir': [38.4237, 27.1428],
  // Africa
  'Cairo': [30.0444, 31.2357], 'Lagos': [6.5244, 3.3792],
  'Nairobi': [-1.2921, 36.8219], 'Johannesburg': [-26.2041, 28.0473],
  'Cape Town': [-33.9249, 18.4241], 'Addis Ababa': [9.145, 40.4897],
  'Accra': [5.6037, -0.187], 'Dakar': [14.7167, -17.4677],
  'Casablanca': [33.5731, -7.5898], 'Tunis': [36.8065, 10.1815],
  'Algiers': [36.7372, 3.0863], 'Tripoli': [32.8872, 13.1913],
  'Khartoum': [15.5007, 32.5599], 'Kampala': [0.3476, 32.5825],
  'Dar es Salaam': [-6.7924, 39.2083], 'Lusaka': [-15.3875, 28.3228],
  'Harare': [-17.8252, 31.0335], 'Maputo': [-25.9692, 32.5732],
  'Luanda': [-8.8368, 13.2343], 'Kinshasa': [-4.4419, 15.2663],
  'Abidjan': [5.3599, -4.0083], 'Douala': [4.0511, 9.7679],
  'Antananarivo': [-18.8792, 47.5079], 'Kigali': [-1.9706, 30.1044],
  'Mogadishu': [2.0469, 45.3182], 'Conakry': [9.6412, -13.5784],
  'Bamako': [12.6392, -8.0029], 'Niamey': [13.5137, 2.1098],
  // South Asia
  'Mumbai': [19.076, 72.8777], 'Delhi': [28.6139, 77.209],
  'Kolkata': [22.5726, 88.3639], 'Chennai': [13.0827, 80.2707],
  'Bangalore': [12.9716, 77.5946], 'Hyderabad': [17.385, 78.4867],
  'Ahmedabad': [23.0225, 72.5714], 'Pune': [18.5204, 73.8567],
  'Surat': [21.1702, 72.8311], 'Jaipur': [26.9124, 75.7873],
  'Dhaka': [23.8103, 90.4125], 'Karachi': [24.8607, 67.0011],
  'Lahore': [31.5204, 74.3587], 'Islamabad': [33.6844, 73.0479],
  'Colombo': [6.9271, 79.8612], 'Kathmandu': [27.7172, 85.324],
  // East & Southeast Asia
  'Tokyo': [35.6762, 139.6503], 'Beijing': [39.9042, 116.4074],
  'Shanghai': [31.2304, 121.4737], 'Seoul': [37.5665, 126.978],
  'Singapore': [1.3521, 103.8198], 'Bangkok': [13.7563, 100.5018],
  'Jakarta': [-6.2088, 106.8456], 'Manila': [14.5995, 120.9842],
  'Kuala Lumpur': [3.139, 101.6869], 'Osaka': [34.6937, 135.5023],
  'Guangzhou': [23.1291, 113.2644], 'Shenzhen': [22.5431, 114.0579],
  'Chengdu': [30.5728, 104.0668], 'Chongqing': [29.4316, 106.9123],
  'Wuhan': [30.5928, 114.3055], 'Xi\'an': [34.3416, 108.9398],
  'Hangzhou': [30.2741, 120.1551], 'Nanjing': [32.0603, 118.7969],
  'Tianjin': [39.3434, 117.3616], 'Hong Kong': [22.3193, 114.1694],
  'Taipei': [25.0330, 121.5654], 'Ho Chi Minh City': [10.8231, 106.6297],
  'Hanoi': [21.0285, 105.8542], 'Phnom Penh': [11.5564, 104.9282],
  'Vientiane': [17.9757, 102.6331], 'Yangon': [16.8661, 96.1951],
  'Naypyidaw': [19.7633, 96.0785], 'Ulaanbaatar': [47.8864, 106.9057],
  'Pyongyang': [39.0194, 125.7381], 'Busan': [35.1796, 129.0756],
  'Fukuoka': [33.5904, 130.4017], 'Sapporo': [43.0618, 141.3545],
  'Nagoya': [35.1815, 136.9066], 'Kyoto': [35.0116, 135.7681],
  'Surabaya': [-7.2504, 112.7688], 'Bandung': [-6.9175, 107.6191],
  'Cebu': [10.3157, 123.8854], 'Davao': [7.0707, 125.6087],
  // Central Asia
  'Tashkent': [41.2995, 69.2401], 'Astana': [51.1801, 71.446],
  'Bishkek': [42.8746, 74.5698], 'Dushanbe': [38.5598, 68.7733],
  'Ashgabat': [37.9601, 58.3261],
  // Oceania
  'Sydney': [-33.8688, 151.2093], 'Melbourne': [-37.8136, 144.9631],
  'Brisbane': [-27.4698, 153.0251], 'Perth': [-31.9505, 115.8605],
  'Adelaide': [-34.9285, 138.6007], 'Auckland': [-36.8509, 174.7645],
  'Wellington': [-41.2865, 174.7762], 'Christchurch': [-43.5321, 172.6362],
  'Suva': [-18.1416, 178.4419], 'Port Moresby': [-9.4438, 147.1803],
  'Noumea': [-22.2758, 166.458], 'Papeete': [-17.5516, 149.5585],
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

export default function GlobeMap({ avatars = [], focusCity = '' }) {
  const mountRef = useRef(null);
  const sceneRef = useRef({});
  const autoRotateRef = useRef(true);
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  const handleMarkerClick = useCallback((avatar) => {
    setSelectedAvatar(avatar);
  }, []);

  // Animate globe to focusCity
  useEffect(() => {
    if (!focusCity) return;
    const coords = getCityCoords(focusCity);
    if (!coords) return;
    const { globe, markerObjects } = sceneRef.current;
    if (!globe) return;

    // Stop auto-rotation
    autoRotateRef.current = false;

    const [lat, lon] = coords;
    // In Three.js with our latLonToVec3 setup:
    // Y rotation corresponds to longitude: targetY = lon * π/180 (negated due to cos(theta) sign)
    // X rotation corresponds to latitude: targetX = -lat * π/180
    const targetY = (-lon * Math.PI) / 180;
    const targetX = (-lat * Math.PI) / 180 * 0.5; // mild tilt for latitude

    const startY = globe.rotation.y;
    const startX = globe.rotation.x;

    // Shortest path for Y
    let dy = targetY - startY;
    while (dy > Math.PI) dy -= 2 * Math.PI;
    while (dy < -Math.PI) dy += 2 * Math.PI;
    const dx = targetX - startX;

    const duration = 1400;
    const start = performance.now();
    let animId;

    const animateTo = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      globe.rotation.y = startY + dy * ease;
      globe.rotation.x = startX + dx * ease;
      if (markerObjects) {
        markerObjects.forEach(m => {
          m.rotation.y = globe.rotation.y;
          m.rotation.x = globe.rotation.x;
        });
      }
      if (t < 1) animId = requestAnimationFrame(animateTo);
    };
    animId = requestAnimationFrame(animateTo);

    // Show first matching avatar popup
    const match = avatars.find(a => a.city?.toLowerCase().includes(focusCity.toLowerCase()));
    if (match) setSelectedAvatar(match);

    return () => cancelAnimationFrame(animId);
  }, [focusCity, avatars]);

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