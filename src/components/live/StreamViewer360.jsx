import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

/**
 * Renders a video stream onto a Three.js sphere for 360° equirectangular viewing.
 * The user can drag to rotate the view in all directions.
 */
export default function StreamViewer360({ videoRef }) {
  const mountRef = useRef(null);
  const sceneRef = useRef({});

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const w = el.clientWidth;
    const h = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
    camera.position.set(0, 0, 0.01);

    // Sphere with inside-out geometry for 360 equirectangular
    const geo = new THREE.SphereGeometry(50, 64, 32);
    geo.scale(-1, 1, 1); // flip normals inward

    // Use the video element as texture source
    let texture = null;
    let sphere = null;

    const buildSphere = (video) => {
      texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
      const mat = new THREE.MeshBasicMaterial({ map: texture });
      sphere = new THREE.Mesh(geo, mat);
      scene.add(sphere);
    };

    // Try to attach immediately if video already has srcObject
    const video = videoRef?.current;
    if (video) buildSphere(video);

    // Drag state
    let isDragging = false;
    let lastX = 0, lastY = 0;
    let rotX = 0, rotY = 0; // camera euler angles

    const updateCamera = () => {
      camera.rotation.order = 'YXZ';
      camera.rotation.y = rotY;
      camera.rotation.x = rotX;
    };

    const onMouseDown = (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      rotY += (e.clientX - lastX) * 0.004;
      rotX += (e.clientY - lastY) * 0.004;
      rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
      lastX = e.clientX; lastY = e.clientY;
      updateCamera();
    };
    const onMouseUp = () => { isDragging = false; };

    let lastTouch = null;
    const onTouchStart = (e) => { lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onTouchMove = (e) => {
      if (!lastTouch) return;
      rotY += (e.touches[0].clientX - lastTouch.x) * 0.004;
      rotX += (e.touches[0].clientY - lastTouch.y) * 0.004;
      rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
      lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      updateCamera();
    };
    const onTouchEnd = () => { lastTouch = null; };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (texture) texture.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nw = el.clientWidth, nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    sceneRef.current = { renderer, buildSphere };

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  // When videoRef changes (new stream), rebuild the texture
  useEffect(() => {
    const video = videoRef?.current;
    if (video && sceneRef.current.buildSphere) {
      sceneRef.current.buildSphere(video);
    }
  }, [videoRef?.current?.srcObject]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full cursor-grab active:cursor-grabbing rounded-xl overflow-hidden"
      style={{ background: '#000' }}
    />
  );
}