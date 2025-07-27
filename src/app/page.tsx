// "use client"

// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import * as THREE from 'three';

// interface DataPoint {
//   lat: number;
//   lng: number;
//   value: number;
//   name: string;
// }

// interface PointMeshUserData {
//   originalScale: number;
//   glowMesh?: THREE.Mesh;
//   point: DataPoint;
// }

// interface Label {
//   id: string;
//   name: string;
//   value: number;
//   x: number;
//   y: number;
//   visible: boolean;
// }

// interface ExchangeServer {
//   lat: number;
//   lng: number;
//   exchange: string;
//   city: string;
//   provider: 'AWS' | 'GCP' | 'Azure';
// }

// const WorldMap3D: React.FC = () => {
//   const exchangeMarkerMeshesRef = useRef<THREE.Mesh[]>([]);
//   const [hoveredExchange, setHoveredExchange] = useState<ExchangeServer | null>(null);
//   const raycaster = useRef(new THREE.Raycaster());
//   const mouse = useRef(new THREE.Vector2());

//   const [latencyType, setLatencyType] = useState<'idle' | 'loaded'>('idle');
//   const [error, setError] = useState<string | null>(null);
//   const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
//   const [selectedCountry, setSelectedCountry] = useState<string>('US');
//   const [days, setDays] = useState<string>('7');
//   const [loading, setLoading] = useState<boolean>(true);
//   const [labels, setLabels] = useState<Label[]>([]);

//   const mountRef = useRef<HTMLDivElement | null>(null);
//   const sceneRef = useRef<THREE.Scene | null>(null);
//   const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
//   const globeRef = useRef<THREE.Group | null>(null);
//   const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
//   const pointMeshesRef = useRef<THREE.Mesh[]>([]);
//   const animationFrameRef = useRef<number | null>(null);

//   // Mouse interaction state
//   const mouseStateRef = useRef({
//     isMouseDown: false,
//     previousMouseX: 0,
//     previousMouseY: 0,
//     rotationVelocityX: 0,
//     rotationVelocityY: 0,
//     targetRotationX: 0,
//     targetRotationY: 0
//   });

//   const providerColors: Record<ExchangeServer['provider'], number> = {
//     AWS: 0xff9900,    // Orange
//     GCP: 0x4285f4,    // Blue
//     Azure: 0x0089d6   // Cyan
//   };

//   const exchangeServers: ExchangeServer[] = [
//     { lat: 37.7749, lng: -122.4194, exchange: 'Coinbase', city: 'San Francisco', provider: 'AWS' },
//     { lat: 1.3521, lng: 103.8198, exchange: 'Bybit', city: 'Singapore', provider: 'Azure' },
//     { lat: 35.6895, lng: 139.6917, exchange: 'BitFlyer', city: 'Tokyo', provider: 'AWS' },
//     { lat: 51.5074, lng: -0.1278, exchange: 'Binance', city: 'London', provider: 'GCP' },
//     { lat: 52.3667, lng: 4.8945, exchange: 'Deribit', city: 'Amsterdam', provider: 'AWS' },
//     { lat: 22.3193, lng: 114.1694, exchange: 'OKX', city: 'Hong Kong', provider: 'Azure' }
//   ];


//   const createExchangeMarkers = useCallback((globe: THREE.Group, servers: ExchangeServer[]) => {
//     // Remove old markers
//     exchangeMarkerMeshesRef.current.forEach(mesh => {
//       globe.remove(mesh);
//       mesh.geometry.dispose();
//       if (mesh.material instanceof THREE.Material) mesh.material.dispose();
//     });
//     exchangeMarkerMeshesRef.current = [];

//     servers.forEach((srv, idx) => {
//       // Convert lat/lng to 3D coordinates
//       const phi = (90 - srv.lat) * (Math.PI / 180);
//       const theta = (srv.lng + 180) * (Math.PI / 180);
//       const radius = 1.07;
//       const x = -(radius * Math.sin(phi) * Math.cos(theta));
//       const z = radius * Math.sin(phi) * Math.sin(theta);
//       const y = radius * Math.cos(phi);

//       // Use different geometry for each provider
//       let geometry: THREE.BufferGeometry;
//       if (srv.provider === 'AWS') geometry = new THREE.ConeGeometry(0.025, 0.08, 12);
//       else if (srv.provider === 'GCP') geometry = new THREE.BoxGeometry(0.04, 0.04, 0.04);
//       else geometry = new THREE.SphereGeometry(0.03, 12, 12);

//       const material = new THREE.MeshBasicMaterial({
//         color: providerColors[srv.provider],
//         transparent: true,
//         opacity: 0.95
//       });

//       const marker = new THREE.Mesh(geometry, material);
//       marker.position.set(x, y, z);
//       marker.lookAt(0, 0, 0);
//       marker.userData = { ...srv, markerType: srv.provider };
//       globe.add(marker);
//       exchangeMarkerMeshesRef.current.push(marker);
//     });
//   }, []);

//   useEffect(() => {
//     if (!rendererRef.current || !cameraRef.current) return;

//     const handlePointerMove = (event: MouseEvent) => {
//       if (!rendererRef.current || !cameraRef.current) return;
//       const rect = rendererRef.current.domElement.getBoundingClientRect();
//       mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
//       mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

//       raycaster.current.setFromCamera(mouse.current, cameraRef.current);
//       const intersects = raycaster.current.intersectObjects(exchangeMarkerMeshesRef.current, false);

//       if (intersects.length > 0) {
//         setHoveredExchange(intersects[0].object.userData as ExchangeServer);
//         rendererRef.current.domElement.style.cursor = 'pointer';
//       } else {
//         setHoveredExchange(null);
//         rendererRef.current.domElement.style.cursor = mouseStateRef.current.isMouseDown ? 'grabbing' : 'grab';
//       }
//     };

//     rendererRef.current.domElement.addEventListener('mousemove', handlePointerMove);
//     return () => {
//       rendererRef.current?.domElement.removeEventListener('mousemove', handlePointerMove);
//     };
//   }, []);

//   const getSampleLatencyData = useCallback((): DataPoint[] => {
//     return [
//       { lat: 40.7128, lng: -74.0060, value: 0.2, name: "New York" },
//       { lat: 51.5074, lng: -0.1278, value: 0.3, name: "London" },
//       { lat: 35.6762, lng: 139.6503, value: 0.8, name: "Tokyo" },
//       { lat: -33.8688, lng: 151.2093, value: 0.4, name: "Sydney" },
//       { lat: 55.7558, lng: 37.6173, value: 0.5, name: "Moscow" },
//       { lat: -22.9068, lng: -43.1729, value: 0.3, name: "Rio de Janeiro" },
//       { lat: 19.0760, lng: 72.8777, value: 0.7, name: "Mumbai" },
//       { lat: 1.3521, lng: 103.8198, value: 0.6, name: "Singapore" }
//     ];
//   }, []);

//   const getCountryCoordinates = useCallback((countryCode: string): { lat: number; lng: number } => {
//     const countryCoordinates: Record<string, { lat: number; lng: number }> = {
//       US: { lat: 39.8283, lng: -98.5795 },
//       GB: { lat: 54.7584, lng: -2.6953 },
//       JP: { lat: 36.5748, lng: 139.2394 },
//       DE: { lat: 51.1657, lng: 10.4515 },
//       FR: { lat: 46.2276, lng: 2.2137 }
//     };
//     return countryCoordinates[countryCode] || { lat: 0, lng: 0 };
//   }, []);

//   const normalizeLatency = useCallback((rtt: number): number => {
//     const normalized = Math.min(rtt / 500, 1);
//     return Math.max(normalized, 0.1);
//   }, []);


//   const updateLabels = useCallback(() => {
//     if (!cameraRef.current || !rendererRef.current || pointMeshesRef.current.length === 0) return;

//     const camera = cameraRef.current;
//     const renderer = rendererRef.current;
//     const canvas = renderer.domElement;
//     const rect = canvas.getBoundingClientRect();

//     const newLabels: Label[] = pointMeshesRef.current.map((mesh, index) => {
//       const userData = mesh.userData as PointMeshUserData;

//       // Get world position of the point
//       const worldPosition = new THREE.Vector3();
//       mesh.getWorldPosition(worldPosition);

//       // Project to screen coordinates
//       const screenPosition = worldPosition.clone().project(camera);

//       // Convert to pixel coordinates
//       const x = (screenPosition.x * 0.5 + 0.5) * rect.width;
//       const y = (screenPosition.y * -0.5 + 0.5) * rect.height;

//       // Check if point is visible (not on the back side)
//       const cameraDirection = new THREE.Vector3();
//       camera.getWorldDirection(cameraDirection);
//       const pointDirection = worldPosition.clone().normalize();
//       const dotProduct = pointDirection.dot(cameraDirection.negate());
//       const visible = dotProduct > 0 && screenPosition.z < 1;

//       return {
//         id: `label-${index}`,
//         name: userData.point.name,
//         value: userData.point.value,
//         x,
//         y,
//         visible
//       };
//     });

//     setLabels(newLabels);
//   }, []);

//   const createDataPoints = useCallback((globe: THREE.Group, points: DataPoint[]): void => {
//     // Clean up existing points
//     pointMeshesRef.current.forEach(mesh => {
//       globe.remove(mesh);
//       const userData = mesh.userData as PointMeshUserData;
//       if (userData.glowMesh) {
//         globe.remove(userData.glowMesh);
//       }
//       // Dispose geometries and materials
//       mesh.geometry.dispose();
//       if (mesh.material instanceof THREE.Material) {
//         mesh.material.dispose();
//       }
//       if (userData.glowMesh) {
//         userData.glowMesh.geometry.dispose();
//         if (userData.glowMesh.material instanceof THREE.Material) {
//           userData.glowMesh.material.dispose();
//         }
//       }
//     });
//     pointMeshesRef.current = [];

//     points.forEach((point: DataPoint) => {
//       // Convert lat/lng to 3D coordinates
//       const phi = (90 - point.lat) * (Math.PI / 180);
//       const theta = (point.lng + 180) * (Math.PI / 180);

//       const radius = 1.02;
//       const x = -(radius * Math.sin(phi) * Math.cos(theta));
//       const z = radius * Math.sin(phi) * Math.sin(theta);
//       const y = radius * Math.cos(phi);

//       // Create point marker
//       const pointGeometry = new THREE.SphereGeometry(0.02, 8, 8);
//       const hue = (1 - point.value) * 0.3; // Green to red spectrum
//       const pointMaterial = new THREE.MeshBasicMaterial({
//         color: new THREE.Color().setHSL(hue, 0.8, 0.6)
//       });
//       const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
//       pointMesh.position.set(x, y, z);

//       // Create glowing effect
//       const glowGeometry = new THREE.SphereGeometry(0.04, 8, 8);
//       const glowMaterial = new THREE.MeshBasicMaterial({
//         color: new THREE.Color().setHSL(hue, 0.8, 0.8),
//         transparent: true,
//         opacity: 0.3
//       });
//       const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
//       glowMesh.position.set(x, y, z);

//       globe.add(pointMesh);
//       globe.add(glowMesh);

//       // Store reference for animation with proper typing
//       const userData: PointMeshUserData = {
//         originalScale: 1,
//         glowMesh,
//         point
//       };
//       pointMesh.userData = userData;
//       pointMeshesRef.current.push(pointMesh);
//     });

//     setDataPoints(points);
//   }, []);

//   const fetchNetworkData = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       console.log(`Fetching network data for ${selectedCountry}, ${days} days...`);

//       // Call the Next.js API route
//       const response = await fetch(`/api/cloudflare?days=${days}&country=${selectedCountry}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(errorData.message || `Failed to fetch data: ${response.status} ${response.statusText}`);
//       }

//       const data = await response.json();

//       console.log('Cloudflare API response:', data);

//       // Check if the API call was successful
//       if (!data.success) {
//         console.error('Cloudflare API returned success: false', data.errors);
//         throw new Error(`Cloudflare API error: ${data.errors?.map((e: any) => e.message).join(', ') || 'Unknown error'}`);
//       }

//       // Check if we have the result
//       if (!data.result) {
//         console.error('Missing result in response:', data);
//         throw new Error('No result data from Cloudflare API');
//       }

//       // Extract data from summary_0
//       if (!data.result.summary_0) {
//         console.error('Missing summary_0 in result:', data.result);
//         throw new Error('Expected summary_0 data not found in API response');
//       }

//       const summaryData = data.result.summary_0;
//       console.log('Found summary_0 data:', summaryData);

//       // Parse all available metrics
//       const metrics = {
//         bandwidthDownload: parseFloat(summaryData.bandwidthDownload || '0'),
//         bandwidthUpload: parseFloat(summaryData.bandwidthUpload || '0'),
//         latencyIdle: parseFloat(summaryData.latencyIdle || '0'),
//         latencyLoaded: parseFloat(summaryData.latencyLoaded || '0'),
//         jitterIdle: parseFloat(summaryData.jitterIdle || '0'),
//         jitterLoaded: parseFloat(summaryData.jitterLoaded || '0'),
//         packetLoss: parseFloat(summaryData.packetLoss || '0')
//       };

//       console.log('Parsed metrics:', metrics);

//       // Choose latency based on user preference
//       const latencyValue = latencyType === 'idle' ? metrics.latencyIdle : metrics.latencyLoaded;

//       if (isNaN(latencyValue) || latencyValue <= 0) {
//         console.error('Invalid latency value:', latencyValue);
//         throw new Error(`Invalid ${latencyType} latency data: ${latencyValue}`);
//       }

//       // Extract location name
//       let locationName = selectedCountry;
//       if (data.result.meta?.location?.name) {
//         locationName = data.result.meta.location.name;
//       } else if (data.result.meta?.location?.countryName) {
//         locationName = data.result.meta.location.countryName;
//       }

//       console.log(`Using ${latencyType} latency:`, latencyValue, 'ms for', locationName);

//       const coords = getCountryCoordinates(selectedCountry);

//       // Convert the Cloudflare API data to our DataPoint format
//       const apiDataPoint: DataPoint = {
//         lat: coords.lat,
//         lng: coords.lng,
//         value: normalizeLatency(latencyValue),
//         name: `${locationName} (${latencyValue.toFixed(1)}ms ${latencyType})`
//       };

//       console.log('Created API data point:', apiDataPoint);

//       // Also log additional metrics for the user
//       const additionalInfo = [
//         `Download: ${metrics.bandwidthDownload.toFixed(1)} Mbps`,
//         `Upload: ${metrics.bandwidthUpload.toFixed(1)} Mbps`,
//         `Idle Latency: ${metrics.latencyIdle.toFixed(1)}ms`,
//         `Loaded Latency: ${metrics.latencyLoaded.toFixed(1)}ms`,
//         `Packet Loss: ${(metrics.packetLoss * 100).toFixed(2)}%`
//       ].join(' | ');

//       console.log('Network metrics:', additionalInfo);

//       // Combine API data with sample points
//       const combinedPoints = [
//         ...getSampleLatencyData(),
//         apiDataPoint
//       ];

//       // Create points on the globe
//       if (globeRef.current) {
//         createDataPoints(globeRef.current, combinedPoints);
//         createExchangeMarkers(globeRef.current, exchangeServers);
//       }

//       console.log('Successfully updated globe with network data');

//       // Show success message with metrics
//       // setError(`✅ Data loaded: ${additionalInfo}`);

//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
//       console.error('Error fetching network data:', {
//         error: errorMessage,
//         country: selectedCountry,
//         days: days
//       });

//       setError(`❌ Failed to load network data: ${errorMessage}`);

//       // Fallback to sample data
//       try {
//         if (globeRef.current) {
//           console.log('Falling back to sample data');
//           createDataPoints(globeRef.current, getSampleLatencyData());
//         }
//       } catch (fallbackErr) {
//         console.error('Error creating fallback data:', fallbackErr);
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [days, selectedCountry, latencyType, getCountryCoordinates, normalizeLatency, getSampleLatencyData, createDataPoints]);


//   const handleMouseDown = useCallback((event: MouseEvent): void => {
//     const mouseState = mouseStateRef.current;
//     mouseState.isMouseDown = true;
//     mouseState.previousMouseX = event.clientX;
//     mouseState.previousMouseY = event.clientY;
//     mouseState.rotationVelocityX = 0;
//     mouseState.rotationVelocityY = 0;

//     if (rendererRef.current) {
//       rendererRef.current.domElement.style.cursor = 'grabbing';
//     }
//   }, []);

//   const handleMouseMove = useCallback((event: MouseEvent): void => {
//     const mouseState = mouseStateRef.current;
//     if (mouseState.isMouseDown) {
//       const deltaX = event.clientX - mouseState.previousMouseX;
//       const deltaY = event.clientY - mouseState.previousMouseY;

//       // Calculate rotation based on mouse movement
//       const rotationSpeed = 0.005;
//       mouseState.targetRotationY += deltaX * rotationSpeed;
//       mouseState.targetRotationX += deltaY * rotationSpeed;

//       // Clamp vertical rotation to prevent flipping
//       mouseState.targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseState.targetRotationX));

//       // Store velocity for momentum
//       mouseState.rotationVelocityX = deltaY * rotationSpeed * 0.1;
//       mouseState.rotationVelocityY = deltaX * rotationSpeed * 0.1;

//       mouseState.previousMouseX = event.clientX;
//       mouseState.previousMouseY = event.clientY;
//     }
//   }, []);

//   const handleMouseUp = useCallback((): void => {
//     mouseStateRef.current.isMouseDown = false;
//     if (rendererRef.current) {
//       rendererRef.current.domElement.style.cursor = 'grab';
//     }
//   }, []);

//   const handleResize = useCallback((): void => {
//     if (!cameraRef.current || !rendererRef.current) return;

//     const camera = cameraRef.current;
//     const renderer = rendererRef.current;

//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
//   }, []);

//   useEffect(() => {
//     if (!mountRef.current) return;

//     // Scene setup
//     const scene = new THREE.Scene();
//     scene.background = new THREE.Color(0x000011);
//     sceneRef.current = scene;

//     // Camera setup
//     const camera = new THREE.PerspectiveCamera(
//       75,
//       window.innerWidth / window.innerHeight,
//       0.1,
//       1000
//     );
//     camera.position.z = 3;
//     cameraRef.current = camera;

//     // Renderer setup
//     const renderer = new THREE.WebGLRenderer({ antialias: true });
//     renderer.setSize(window.innerWidth, window.innerHeight);
//     renderer.shadowMap.enabled = true;
//     renderer.shadowMap.type = THREE.PCFSoftShadowMap;
//     rendererRef.current = renderer;
//     mountRef.current.appendChild(renderer.domElement);

//     // Create globe
//     const createGlobe = (): THREE.Group => {
//       const globeGroup = new THREE.Group();
//       globeRef.current = globeGroup;

//       // Earth sphere
//       const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
//       const earthMaterial = new THREE.MeshPhongMaterial({
//         color: 0x2233ff,
//         shininess: 0.8,
//         transparent: true,
//         opacity: 0.9
//       });

//       const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
//       earthMesh.castShadow = true;
//       earthMesh.receiveShadow = true;
//       globeGroup.add(earthMesh);

//       // Add continents as wireframe overlay
//       const continentGeometry = new THREE.SphereGeometry(1.001, 32, 32);
//       const continentMaterial = new THREE.MeshBasicMaterial({
//         color: 0x00ff00,
//         wireframe: true,
//         transparent: true,
//         opacity: 0.3
//       });
//       const continentMesh = new THREE.Mesh(continentGeometry, continentMaterial);
//       globeGroup.add(continentMesh);

//       // Add atmosphere glow
//       const atmosphereGeometry = new THREE.SphereGeometry(1.05, 64, 64);
//       const atmosphereMaterial = new THREE.MeshBasicMaterial({
//         color: 0x4488ff,
//         transparent: true,
//         opacity: 0.1,
//         side: THREE.BackSide
//       });
//       const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
//       globeGroup.add(atmosphereMesh);

//       scene.add(globeGroup);
//       return globeGroup;
//     };

//     // Lighting
//     const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
//     scene.add(ambientLight);

//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
//     directionalLight.position.set(5, 3, 5);
//     directionalLight.castShadow = true;
//     directionalLight.shadow.mapSize.width = 2048;
//     directionalLight.shadow.mapSize.height = 2048;
//     scene.add(directionalLight);

//     // Create the globe and add initial data points
//     const globe = createGlobe();
//     createDataPoints(globe, getSampleLatencyData());
//     createExchangeMarkers(globe, exchangeServers);

//     // Set initial cursor style
//     renderer.domElement.style.cursor = 'grab';

//     // Add event listeners
//     renderer.domElement.addEventListener('mousedown', handleMouseDown);
//     window.addEventListener('mousemove', handleMouseMove);
//     window.addEventListener('mouseup', handleMouseUp);
//     renderer.domElement.addEventListener('mouseleave', handleMouseUp);
//     window.addEventListener('resize', handleResize);

//     // Animation loop
//     const animate = (): void => {
//       animationFrameRef.current = requestAnimationFrame(animate);

//       const mouseState = mouseStateRef.current;

//       // Smooth rotation based on mouse
//       if (globe) {
//         globe.rotation.x += (mouseState.targetRotationX - globe.rotation.x) * 0.05;
//         globe.rotation.y += (mouseState.targetRotationY - globe.rotation.y) * 0.05;

//         // Auto rotation when not interacting
//         if (!mouseState.isMouseDown) {
//           globe.rotation.y += 0.002;
//           mouseState.targetRotationY += 0.002;
//         }
//       }

//       // Animate data points
//       pointMeshesRef.current.forEach((mesh) => {
//         const userData = mesh.userData as PointMeshUserData;
//         if (userData && userData.point) {
//           const time = Date.now() * 0.003;
//           const scale = 1 + Math.sin(time + userData.point.value * 10) * 0.3;
//           mesh.scale.setScalar(scale);

//           if (userData.glowMesh) {
//             userData.glowMesh.scale.setScalar(scale * 1.2);
//           }
//         }
//       });

//       // Update label positions
//       updateLabels();

//       renderer.render(scene, camera);
//     };

//     // Start animation
//     animate();
//     setLoading(false);

//     // Cleanup function
//     return (): void => {
//       // Cancel animation frame
//       if (animationFrameRef.current) {
//         cancelAnimationFrame(animationFrameRef.current);
//       }

//       // Remove event listeners
//       window.removeEventListener('mousemove', handleMouseMove);
//       window.removeEventListener('mouseup', handleMouseUp);
//       window.removeEventListener('resize', handleResize);

//       if (renderer.domElement) {
//         renderer.domElement.removeEventListener('mousedown', handleMouseDown);
//         renderer.domElement.removeEventListener('mouseleave', handleMouseUp);
//       }

//       if (mountRef.current && renderer.domElement) {
//         mountRef.current.removeChild(renderer.domElement);
//       }

//       // Dispose of Three.js objects
//       scene.traverse((child: THREE.Object3D) => {
//         if (child instanceof THREE.Mesh) {
//           if (child.geometry) {
//             child.geometry.dispose();
//           }
//           if (child.material) {
//             if (Array.isArray(child.material)) {
//               child.material.forEach((material: THREE.Material) => material.dispose());
//             } else {
//               child.material.dispose();
//             }
//           }
//         }
//       });

//       renderer.dispose();
//     };
//   }, [handleMouseDown, handleMouseMove, handleMouseUp, handleResize, updateLabels, createDataPoints, getSampleLatencyData]);

//   // Fetch network data when country or days change
//   useEffect(() => {
//     fetchNetworkData();
//   }, [fetchNetworkData]);

//   return (
//     <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
//       {loading && (
//         <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900 bg-opacity-75">
//           <div className="text-white text-xl">Loading 3D World Map...</div>
//         </div>
//       )}

//       {error && (
//         <div className="absolute top-4 right-4 bg-red-600 text-white p-3 rounded-lg z-10">
//           <p className="text-sm">{error}</p>
//         </div>
//       )}

//       <div ref={mountRef} className="w-full h-full" />

//       {/* Country Selection Controls */}
//       <div className="absolute top-4 right-4 bg-black bg-opacity-50 p-4 rounded-lg text-white">
//         <div className="mb-3">
//           <label className="block text-sm font-medium mb-1">Country:</label>
//           <select
//             value={selectedCountry}
//             onChange={(e) => setSelectedCountry(e.target.value)}
//             className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
//           >
//             <option value="US">United States</option>
//             <option value="GB">United Kingdom</option>
//             <option value="JP">Japan</option>
//             <option value="DE">Germany</option>
//             <option value="FR">France</option>
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium mb-1">Days:</label>
//           <select
//             value={days}
//             onChange={(e) => setDays(e.target.value)}
//             className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
//           >
//             <option value="7">7 days</option>
//             <option value="14">14 days</option>
//             <option value="30">30 days</option>
//           </select>
//         </div>
//       </div>

//       {/* Dynamic Labels */}
//       {labels.map((label) => (
//         <div
//           key={label.id}
//           className={`absolute pointer-events-none transition-opacity duration-300 ${label.visible ? 'opacity-100' : 'opacity-0'
//             }`}
//           style={{
//             left: `${label.x + 10}px`,
//             top: `${label.y - 10}px`,
//             transform: 'translate(0, -50%)'
//           }}
//         >
//           <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded-md text-sm whitespace-nowrap border border-white border-opacity-20">
//             <div className="font-semibold">{label.name}</div>
//             <div className="text-xs opacity-80">Value: {label.value.toFixed(2)}</div>
//           </div>
//         </div>
//       ))}

//       {/* Controls Info */}
//       {/* <div className="absolute top-4 left-4 text-white bg-black bg-opacity-50 p-4 rounded-lg">
//         <h3 className="text-lg font-bold mb-2">3D World Map</h3>
//         <p className="text-sm">• Drag to rotate globe</p>
//         <p className="text-sm">• Colored points show latency data</p>
//         <p className="text-sm">• Globe auto-rotates when idle</p>
//         <p className="text-sm">• Labels show location and values</p>
//       </div> */}

//       {hoveredExchange && (
//         <div className="absolute left-1/2 top-20 transform -translate-x-1/2 z-20 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg border border-white border-opacity-20">
//           <div className="font-bold text-lg">{hoveredExchange.exchange}</div>
//           <div className="text-sm">{hoveredExchange.city}</div>
//           <div className="text-xs mt-1">
//             Cloud: <span className="font-semibold">{hoveredExchange.provider}</span>
//           </div>
//         </div>
//       )}

//       {/* Exchange Server Legend */}
//       <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 p-4 rounded-lg">
//         <h4 className="font-bold mb-2">Exchange Server Markers</h4>
//         <div className="flex items-center mb-1">
//           <div className="w-4 h-4 mr-2" style={{ background: '#ff9900', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
//           <span className="text-sm">AWS (Cone)</span>
//         </div>
//         <div className="flex items-center mb-1">
//           <div className="w-4 h-4 mr-2 bg-[#4285f4]"></div>
//           <span className="text-sm">GCP (Cube)</span>
//         </div>
//         <div className="flex items-center">
//           <div className="w-4 h-4 mr-2 rounded-full bg-[#0089d6]"></div>
//           <span className="text-sm">Azure (Sphere)</span>
//         </div>
//       </div>

//       {/* Legend */}
//       <div className="absolute bottom-4 right-4 text-white bg-black bg-opacity-50 p-4 rounded-lg">
//         <h4 className="font-bold mb-2">Latency Values</h4>
//         <div className="flex items-center mb-1">
//           <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
//           <span className="text-sm">High Latency (&gt;0.7)</span>
//         </div>
//         <div className="flex items-center mb-1">
//           <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
//           <span className="text-sm">Medium Latency (0.4-0.7)</span>
//         </div>
//         <div className="flex items-center">
//           <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
//           <span className="text-sm">Low Latency (&lt;0.4)</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default WorldMap3D;







"use client"
import { Menu, X } from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface DataPoint {
  lat: number;
  lng: number;
  value: number;
  name: string;
}

interface ExchangeServer {
  lat: number;
  lng: number;
  exchange: string;
  location: string;
  cloudProvider: 'AWS' | 'GCP' | 'Azure' | 'Other';
  region?: string;
  services?: string[];
}

interface PointMeshUserData {
  originalScale: number;
  glowMesh?: THREE.Mesh;
  point: DataPoint;
}

interface ExchangeMeshUserData {
  originalScale: number;
  glowMesh?: THREE.Mesh;
  server: ExchangeServer;
}

interface Label {
  id: string;
  name: string;
  value: number;
  x: number;
  y: number;
  visible: boolean;
}

interface ExchangeLabel {
  id: string;
  exchange: string;
  location: string;
  cloudProvider: string;
  x: number;
  y: number;
  visible: boolean;
}

const WorldMap3D: React.FC = () => {
  const [isLatMenuOpen, setIsLatMenuOpen] = useState(false);
  const [isExMenuOpen, setIsExMenuOpen] = useState(false);
  const [isLegendMenuOpen, setIsLegendMenuOpen] = useState(false);

  const [latencyType, setLatencyType] = useState<'idle' | 'loaded'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  const [days, setDays] = useState<string>('7');
  const [loading, setLoading] = useState<boolean>(true);
  const [labels, setLabels] = useState<Label[]>([]);
  const [exchangeLabels, setExchangeLabels] = useState<ExchangeLabel[]>([]);
  const [showExchanges, setShowExchanges] = useState<boolean>(true);
  const [showLatencyData, setShowLatencyData] = useState<boolean>(true);
  const [selectedCloudProvider, setSelectedCloudProvider] = useState<string>('All');

  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const pointMeshesRef = useRef<THREE.Mesh[]>([]);
  const exchangeMeshesRef = useRef<THREE.Mesh[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const toggleLatMenu = () => {
    setIsLatMenuOpen(!isLatMenuOpen);
    setShowLatencyData(true)
  };

  const toggleExMenu = () => {
    setIsExMenuOpen(!isExMenuOpen);
    setShowExchanges(true);
  };

  const toggleLegMenu = () => {
    setIsLegendMenuOpen(!isLegendMenuOpen);
  };
  // Mouse interaction state
  const mouseStateRef = useRef({
    isMouseDown: false,
    previousMouseX: 0,
    previousMouseY: 0,
    rotationVelocityX: 0,
    rotationVelocityY: 0,
    targetRotationX: 0,
    targetRotationY: 0
  });

  const getExchangeServerData = useCallback((): ExchangeServer[] => {
    return [
      // Binance
      { lat: 40.7589, lng: -73.9851, exchange: "Binance", location: "New York, US", cloudProvider: "AWS", region: "us-east-1", services: ["Spot", "Futures", "API"] },
      { lat: 51.5074, lng: -0.1278, exchange: "Binance", location: "London, UK", cloudProvider: "AWS", region: "eu-west-2", services: ["Spot", "Futures"] },
      { lat: 35.6762, lng: 139.6503, exchange: "Binance", location: "Tokyo, Japan", cloudProvider: "AWS", region: "ap-northeast-1", services: ["Spot", "API"] },
      { lat: 1.3521, lng: 103.8198, exchange: "Binance", location: "Singapore", cloudProvider: "AWS", region: "ap-southeast-1", services: ["Spot", "Futures", "API"] },

      // OKX
      { lat: 22.3193, lng: 114.1694, exchange: "OKX", location: "Hong Kong", cloudProvider: "GCP", region: "asia-east2", services: ["Spot", "Derivatives", "API"] },
      { lat: 40.7589, lng: -73.9851, exchange: "OKX", location: "New York, US", cloudProvider: "GCP", region: "us-east1", services: ["Spot", "API"] },
      { lat: 51.5074, lng: -0.1278, exchange: "OKX", location: "London, UK", cloudProvider: "Azure", region: "uk-south", services: ["Spot", "Derivatives"] },

      // Bybit
      { lat: 1.3521, lng: 103.8198, exchange: "Bybit", location: "Singapore", cloudProvider: "AWS", region: "ap-southeast-1", services: ["Derivatives", "Spot", "API"] },
      { lat: 35.6762, lng: 139.6503, exchange: "Bybit", location: "Tokyo, Japan", cloudProvider: "AWS", region: "ap-northeast-1", services: ["Derivatives", "API"] },
      { lat: 37.7749, lng: -122.4194, exchange: "Bybit", location: "San Francisco, US", cloudProvider: "GCP", region: "us-west1", services: ["API", "Spot"] },

      // Deribit
      { lat: 52.3676, lng: 4.9041, exchange: "Deribit", location: "Amsterdam, Netherlands", cloudProvider: "Other", services: ["Options", "Futures", "API"] },
      { lat: 40.7589, lng: -73.9851, exchange: "Deribit", location: "New York, US", cloudProvider: "AWS", region: "us-east-1", services: ["API"] },

      // Coinbase
      { lat: 37.7749, lng: -122.4194, exchange: "Coinbase", location: "San Francisco, US", cloudProvider: "GCP", region: "us-west1", services: ["Spot", "Pro", "API"] },
      { lat: 53.4808, lng: -2.2426, exchange: "Coinbase", location: "Manchester, UK", cloudProvider: "GCP", region: "europe-west2", services: ["Spot", "API"] },
      { lat: 35.6762, lng: 139.6503, exchange: "Coinbase", location: "Tokyo, Japan", cloudProvider: "GCP", region: "asia-northeast1", services: ["API"] },

      // Kraken
      { lat: 37.7749, lng: -122.4194, exchange: "Kraken", location: "San Francisco, US", cloudProvider: "Other", services: ["Spot", "Futures", "API"] },
      { lat: 51.5074, lng: -0.1278, exchange: "Kraken", location: "London, UK", cloudProvider: "AWS", region: "eu-west-2", services: ["Spot", "API"] },

      // Huobi
      { lat: 1.3521, lng: 103.8198, exchange: "Huobi", location: "Singapore", cloudProvider: "AWS", region: "ap-southeast-1", services: ["Spot", "Derivatives"] },
      { lat: 35.6762, lng: 139.6503, exchange: "Huobi", location: "Tokyo, Japan", cloudProvider: "AWS", region: "ap-northeast-1", services: ["Spot", "API"] },

      // KuCoin
      { lat: 1.3521, lng: 103.8198, exchange: "KuCoin", location: "Singapore", cloudProvider: "Azure", region: "southeast-asia", services: ["Spot", "Futures", "API"] },
      { lat: 40.7589, lng: -73.9851, exchange: "KuCoin", location: "New York, US", cloudProvider: "Azure", region: "east-us", services: ["API"] },

      // Gate.io
      { lat: 22.3193, lng: 114.1694, exchange: "Gate.io", location: "Hong Kong", cloudProvider: "AWS", region: "ap-east-1", services: ["Spot", "Derivatives", "API"] },
      { lat: 40.7589, lng: -73.9851, exchange: "Gate.io", location: "New York, US", cloudProvider: "AWS", region: "us-east-1", services: ["API"] },

      // Bitfinex
      { lat: 22.3193, lng: 114.1694, exchange: "Bitfinex", location: "Hong Kong", cloudProvider: "Other", services: ["Spot", "Derivatives", "API"] },

      // FTX (Historical - for demonstration)
      { lat: 25.7617, lng: -80.1918, exchange: "FTX", location: "Miami, US", cloudProvider: "AWS", region: "us-east-1", services: ["Spot", "Derivatives"] },
    ];
  }, []);

  const getCloudProviderColor = useCallback((provider: string): number => {
    switch (provider) {
      case 'AWS': return 0xff9500; // Orange
      case 'GCP': return 0x4285f4; // Google Blue
      case 'Azure': return 0x0078d4; // Azure Blue
      default: return 0x888888; // Gray for Other
    }
  }, []);

  const getSampleLatencyData = useCallback((): DataPoint[] => {
    return [
      { lat: 40.7128, lng: -74.0060, value: 0.2, name: "New York" },
      { lat: 51.5074, lng: -0.1278, value: 0.3, name: "London" },
      { lat: 35.6762, lng: 139.6503, value: 0.8, name: "Tokyo" },
      { lat: -33.8688, lng: 151.2093, value: 0.4, name: "Sydney" },
      { lat: 55.7558, lng: 37.6173, value: 0.5, name: "Moscow" },
      { lat: -22.9068, lng: -43.1729, value: 0.3, name: "Rio de Janeiro" },
      { lat: 19.0760, lng: 72.8777, value: 0.7, name: "Mumbai" },
      { lat: 1.3521, lng: 103.8198, value: 0.6, name: "Singapore" }
    ];
  }, []);

  const getCountryCoordinates = useCallback((countryCode: string): { lat: number; lng: number } => {
    const countryCoordinates: Record<string, { lat: number; lng: number }> = {
      US: { lat: 39.8283, lng: -98.5795 },
      GB: { lat: 54.7584, lng: -2.6953 },
      JP: { lat: 36.5748, lng: 139.2394 },
      DE: { lat: 51.1657, lng: 10.4515 },
      FR: { lat: 46.2276, lng: 2.2137 }
    };
    return countryCoordinates[countryCode] || { lat: 0, lng: 0 };
  }, []);

  const normalizeLatency = useCallback((rtt: number): number => {
    const normalized = Math.min(rtt / 500, 1);
    return Math.max(normalized, 0.1);
  }, []);

  const createExchangeServers = useCallback((globe: THREE.Group, servers: ExchangeServer[]): void => {
    // Clean up existing exchange meshes
    exchangeMeshesRef.current.forEach(mesh => {
      globe.remove(mesh);
      const userData = mesh.userData as ExchangeMeshUserData;
      if (userData.glowMesh) {
        globe.remove(userData.glowMesh);
      }
      // Dispose geometries and materials
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
      if (userData.glowMesh) {
        userData.glowMesh.geometry.dispose();
        if (userData.glowMesh.material instanceof THREE.Material) {
          userData.glowMesh.material.dispose();
        }
      }
    });
    exchangeMeshesRef.current = [];

    const filteredServers = selectedCloudProvider === 'All'
      ? servers
      : servers.filter(server => server.cloudProvider === selectedCloudProvider);

    filteredServers.forEach((server: ExchangeServer) => {
      // Convert lat/lng to 3D coordinates
      const phi = (90 - server.lat) * (Math.PI / 180);
      const theta = (server.lng + 180) * (Math.PI / 180);
      const radius = 1.03;
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);

      // Create exchange marker with different shape (box for distinction)
      const exchangeGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.03);
      const exchangeColor = getCloudProviderColor(server.cloudProvider);
      const exchangeMaterial = new THREE.MeshBasicMaterial({
        color: exchangeColor
      });
      const exchangeMesh = new THREE.Mesh(exchangeGeometry, exchangeMaterial);
      exchangeMesh.position.set(x, y, z);

      // Create glowing effect
      const glowGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: exchangeColor,
        transparent: true,
        opacity: 0.2
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.set(x, y, z);

      globe.add(exchangeMesh);
      globe.add(glowMesh);

      // Store reference for animation with proper typing
      const userData: ExchangeMeshUserData = {
        originalScale: 1,
        glowMesh,
        server
      };
      exchangeMesh.userData = userData;
      exchangeMeshesRef.current.push(exchangeMesh);
    });
  }, [getCloudProviderColor, selectedCloudProvider]);

  const updateLabels = useCallback(() => {
    if (!cameraRef.current || !rendererRef.current) return;

    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();

    // Update latency data labels
    if (showLatencyData && pointMeshesRef.current.length > 0) {
      const newLabels: Label[] = pointMeshesRef.current.map((mesh, index) => {
        const userData = mesh.userData as PointMeshUserData;
        const worldPosition = new THREE.Vector3();
        mesh.getWorldPosition(worldPosition);
        const screenPosition = worldPosition.clone().project(camera);
        const x = (screenPosition.x * 0.5 + 0.5) * rect.width;
        const y = (screenPosition.y * -0.5 + 0.5) * rect.height;

        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        const pointDirection = worldPosition.clone().normalize();
        const dotProduct = pointDirection.dot(cameraDirection.negate());
        const visible = dotProduct > 0 && screenPosition.z < 1;

        return {
          id: `label-${index}`,
          name: userData.point.name,
          value: userData.point.value,
          x,
          y,
          visible
        };
      });
      setLabels(newLabels);
    } else {
      setLabels([]);
    }

    // Update exchange server labels
    if (showExchanges && exchangeMeshesRef.current.length > 0) {
      const newExchangeLabels: ExchangeLabel[] = exchangeMeshesRef.current.map((mesh, index) => {
        const userData = mesh.userData as ExchangeMeshUserData;
        const worldPosition = new THREE.Vector3();
        mesh.getWorldPosition(worldPosition);
        const screenPosition = worldPosition.clone().project(camera);
        const x = (screenPosition.x * 0.5 + 0.5) * rect.width;
        const y = (screenPosition.y * -0.5 + 0.5) * rect.height;

        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        const pointDirection = worldPosition.clone().normalize();
        const dotProduct = pointDirection.dot(cameraDirection.negate());
        const visible = dotProduct > 0 && screenPosition.z < 1;

        return {
          id: `exchange-label-${index}`,
          exchange: userData.server.exchange,
          location: userData.server.location,
          cloudProvider: userData.server.cloudProvider,
          x,
          y,
          visible
        };
      });
      setExchangeLabels(newExchangeLabels);
    } else {
      setExchangeLabels([]);
    }
  }, [showLatencyData, showExchanges]);

  const createDataPoints = useCallback((globe: THREE.Group, points: DataPoint[]): void => {
    // Clean up existing points
    pointMeshesRef.current.forEach(mesh => {
      globe.remove(mesh);
      const userData = mesh.userData as PointMeshUserData;
      if (userData.glowMesh) {
        globe.remove(userData.glowMesh);
      }
      // Dispose geometries and materials
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
      if (userData.glowMesh) {
        userData.glowMesh.geometry.dispose();
        if (userData.glowMesh.material instanceof THREE.Material) {
          userData.glowMesh.material.dispose();
        }
      }
    });
    pointMeshesRef.current = [];

    if (showLatencyData) {
      points.forEach((point: DataPoint) => {
        // Convert lat/lng to 3D coordinates
        const phi = (90 - point.lat) * (Math.PI / 180);
        const theta = (point.lng + 180) * (Math.PI / 180);
        const radius = 1.02;
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);

        // Create point marker
        const pointGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const hue = (1 - point.value) * 0.3; // Green to red spectrum
        const pointMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(hue, 0.8, 0.6)
        });
        const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
        pointMesh.position.set(x, y, z);

        // Create glowing effect
        const glowGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(hue, 0.8, 0.8),
          transparent: true,
          opacity: 0.3
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.position.set(x, y, z);

        globe.add(pointMesh);
        globe.add(glowMesh);

        // Store reference for animation with proper typing
        const userData: PointMeshUserData = {
          originalScale: 1,
          glowMesh,
          point
        };
        pointMesh.userData = userData;
        pointMeshesRef.current.push(pointMesh);
      });
    }

    setDataPoints(points);
  }, [showLatencyData]);

  const fetchNetworkData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching network data for ${selectedCountry}, ${days} days...`);

      // Call the Next.js API route
      const response = await fetch(`/api/cloudflare?days=${days}&country=${selectedCountry}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Cloudflare API response:', data);

      // Check if the API call was successful
      if (!data.success) {
        console.error('Cloudflare API returned success: false', data.errors);
        throw new Error(`Cloudflare API error: ${data.errors?.map((e: any) => e.message).join(', ') || 'Unknown error'}`);
      }

      // Check if we have the result
      if (!data.result) {
        console.error('Missing result in response:', data);
        throw new Error('No result data from Cloudflare API');
      }

      // Extract data from summary_0
      if (!data.result.summary_0) {
        console.error('Missing summary_0 in result:', data.result);
        throw new Error('Expected summary_0 data not found in API response');
      }

      const summaryData = data.result.summary_0;
      console.log('Found summary_0 data:', summaryData);

      // Parse all available metrics
      const metrics = {
        bandwidthDownload: parseFloat(summaryData.bandwidthDownload || '0'),
        bandwidthUpload: parseFloat(summaryData.bandwidthUpload || '0'),
        latencyIdle: parseFloat(summaryData.latencyIdle || '0'),
        latencyLoaded: parseFloat(summaryData.latencyLoaded || '0'),
        jitterIdle: parseFloat(summaryData.jitterIdle || '0'),
        jitterLoaded: parseFloat(summaryData.jitterLoaded || '0'),
        packetLoss: parseFloat(summaryData.packetLoss || '0')
      };

      console.log('Parsed metrics:', metrics);

      // Choose latency based on user preference
      const latencyValue = latencyType === 'idle' ? metrics.latencyIdle : metrics.latencyLoaded;
      if (isNaN(latencyValue) || latencyValue <= 0) {
        console.error('Invalid latency value:', latencyValue);
        throw new Error(`Invalid ${latencyType} latency data: ${latencyValue}`);
      }

      // Extract location name
      let locationName = selectedCountry;
      if (data.result.meta?.location?.name) {
        locationName = data.result.meta.location.name;
      } else if (data.result.meta?.location?.countryName) {
        locationName = data.result.meta.location.countryName;
      }

      console.log(`Using ${latencyType} latency:`, latencyValue, 'ms for', locationName);

      const coords = getCountryCoordinates(selectedCountry);
      // Convert the Cloudflare API data to our DataPoint format
      const apiDataPoint: DataPoint = {
        lat: coords.lat,
        lng: coords.lng,
        value: normalizeLatency(latencyValue),
        name: `${locationName} (${latencyValue.toFixed(1)}ms ${latencyType})`
      };

      console.log('Created API data point:', apiDataPoint);

      // Also log additional metrics for the user
      const additionalInfo = [
        `Download: ${metrics.bandwidthDownload.toFixed(1)} Mbps`,
        `Upload: ${metrics.bandwidthUpload.toFixed(1)} Mbps`,
        `Idle Latency: ${metrics.latencyIdle.toFixed(1)}ms`,
        `Loaded Latency: ${metrics.latencyLoaded.toFixed(1)}ms`,
        `Packet Loss: ${(metrics.packetLoss * 100).toFixed(2)}%`
      ].join(' | ');

      console.log('Network metrics:', additionalInfo);

      // Combine API data with sample points
      const combinedPoints = [
        ...getSampleLatencyData(),
        apiDataPoint
      ];

      // Create points on the globe
      if (globeRef.current) {
        createDataPoints(globeRef.current, combinedPoints);
      }

      console.log('Successfully updated globe with network data');
      // Show success message with metrics
      // setError(`✅ Data loaded: ${additionalInfo}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching network data:', {
        error: errorMessage,
        country: selectedCountry,
        days: days
      });
      setError(`❌ Failed to load network data: ${errorMessage}`);
      // Fallback to sample data
      try {
        if (globeRef.current) {
          console.log('Falling back to sample data');
          createDataPoints(globeRef.current, getSampleLatencyData());
        }
      } catch (fallbackErr) {
        console.error('Error creating fallback data:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, [days, selectedCountry, latencyType, getCountryCoordinates, normalizeLatency, getSampleLatencyData, createDataPoints]);

  const handleMouseDown = useCallback((event: MouseEvent): void => {
    const mouseState = mouseStateRef.current;
    mouseState.isMouseDown = true;
    mouseState.previousMouseX = event.clientX;
    mouseState.previousMouseY = event.clientY;
    mouseState.rotationVelocityX = 0;
    mouseState.rotationVelocityY = 0;
    if (rendererRef.current) {
      rendererRef.current.domElement.style.cursor = 'grabbing';
    }
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent): void => {
    const mouseState = mouseStateRef.current;
    if (mouseState.isMouseDown) {
      const deltaX = event.clientX - mouseState.previousMouseX;
      const deltaY = event.clientY - mouseState.previousMouseY;

      // Calculate rotation based on mouse movement
      const rotationSpeed = 0.005;
      mouseState.targetRotationY += deltaX * rotationSpeed;
      mouseState.targetRotationX += deltaY * rotationSpeed;

      // Clamp vertical rotation to prevent flipping
      mouseState.targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseState.targetRotationX));

      // Store velocity for momentum
      mouseState.rotationVelocityX = deltaY * rotationSpeed * 0.1;
      mouseState.rotationVelocityY = deltaX * rotationSpeed * 0.1;

      mouseState.previousMouseX = event.clientX;
      mouseState.previousMouseY = event.clientY;
    }
  }, []);

  const handleMouseUp = useCallback((): void => {
    mouseStateRef.current.isMouseDown = false;
    if (rendererRef.current) {
      rendererRef.current.domElement.style.cursor = 'grab';
    }
  }, []);

  const handleResize = useCallback((): void => {
    if (!cameraRef.current || !rendererRef.current) return;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 3;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Create globe
    const createGlobe = (): THREE.Group => {
      const globeGroup = new THREE.Group();
      globeRef.current = globeGroup;

      // Earth sphere
      const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
      const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x2233ff,
        shininess: 0.8,
        transparent: true,
        opacity: 0.9
      });
      const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
      earthMesh.castShadow = true;
      earthMesh.receiveShadow = true;
      globeGroup.add(earthMesh);

      // Add continents as wireframe overlay
      const continentGeometry = new THREE.SphereGeometry(1.001, 32, 32);
      const continentMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      const continentMesh = new THREE.Mesh(continentGeometry, continentMaterial);
      globeGroup.add(continentMesh);

      // Add atmosphere glow
      const atmosphereGeometry = new THREE.SphereGeometry(1.05, 64, 64);
      const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
      });
      const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      globeGroup.add(atmosphereMesh);

      scene.add(globeGroup);
      return globeGroup;
    };

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create the globe and add initial data points
    const globe = createGlobe();
    createDataPoints(globe, getSampleLatencyData());
    createExchangeServers(globe, getExchangeServerData());

    // Set initial cursor style
    renderer.domElement.style.cursor = 'grab';

    // Add event listeners
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mouseleave', handleMouseUp);
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = (): void => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const mouseState = mouseStateRef.current;

      // Smooth rotation based on mouse
      if (globe) {
        globe.rotation.x += (mouseState.targetRotationX - globe.rotation.x) * 0.05;
        globe.rotation.y += (mouseState.targetRotationY - globe.rotation.y) * 0.05;

        // Auto rotation when not interacting
        if (!mouseState.isMouseDown) {
          globe.rotation.y += 0.002;
          mouseState.targetRotationY += 0.002;
        }
      }

      // Animate data points
      pointMeshesRef.current.forEach((mesh) => {
        const userData = mesh.userData as PointMeshUserData;
        if (userData && userData.point) {
          const time = Date.now() * 0.003;
          const scale = 1 + Math.sin(time + userData.point.value * 10) * 0.3;
          mesh.scale.setScalar(scale);
          if (userData.glowMesh) {
            userData.glowMesh.scale.setScalar(scale * 1.2);
          }
        }
      });

      // Animate exchange servers
      exchangeMeshesRef.current.forEach((mesh, index) => {
        const userData = mesh.userData as ExchangeMeshUserData;
        if (userData && userData.server) {
          const time = Date.now() * 0.002;
          const scale = 1 + Math.sin(time + index * 0.5) * 0.2;
          mesh.scale.setScalar(scale);
          if (userData.glowMesh) {
            userData.glowMesh.scale.setScalar(scale * 1.3);
          }
        }
      });

      // Update label positions
      updateLabels();

      renderer.render(scene, camera);
    };

    // Start animation
    animate();
    setLoading(false);

    // Cleanup function
    return (): void => {
      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Remove event listeners
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('mousedown', handleMouseDown);
        renderer.domElement.removeEventListener('mouseleave', handleMouseUp);
      }

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }

      // Dispose of Three.js objects
      scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material: THREE.Material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      renderer.dispose();
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleResize, updateLabels, createDataPoints, getSampleLatencyData, createExchangeServers, getExchangeServerData]);

  // Fetch network data when country or days change
  useEffect(() => {
    fetchNetworkData();
  }, [fetchNetworkData]);

  // Update exchange servers when visibility or cloud provider filter changes
  useEffect(() => {
    if (globeRef.current) {
      createExchangeServers(globeRef.current, getExchangeServerData());
    }
  }, [showExchanges, selectedCloudProvider, createExchangeServers, getExchangeServerData]);

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden sm:h-50% md:h-screen">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900 bg-opacity-75">
          <div className="text-white text-xl">Loading 3D World Map...</div>
        </div>
      )}

      {error && (
        <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-red-600 text-white p-2 md:p-3 rounded-lg z-10 max-w-xs md:max-w-md text-xs md:text-sm">
          <p>{error}</p>
        </div>
      )}

      <div ref={mountRef} className="w-full h-full" />

      {/* Enhanced Controls Panel */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 md:top-4 md:left-4 md:translate-x-0 bg-black bg-opacity-80 p-2 md:p-4 rounded-lg text-white max-w-xs md:max-w-sm w-[95vw] md:w-auto z-20">
        <h3 className="text-base md:text-lg font-bold mb-2 md:mb-3">3D World Map Controls</h3>

        {/* Desktop View */}
        <div className="hidden md:block mb-2 md:mb-4 p-2 md:p-3 border border-gray-600 rounded bg-black bg-opacity-70 w-full max-w-full">
          <h4 className="font-semibold mb-2 text-xs md:text-sm">Network Data</h4>
          <div className="mb-2 flex items-center text-xs md:text-sm">
            <label className="flex items-center w-full">
              <input
                type="checkbox"
                checked={showLatencyData}
                onChange={(e) => setShowLatencyData(e.target.checked)}
                className="mr-2"
              />
              Show Latency Data
            </label>
          </div>

          {showLatencyData && (
            <div className="flex flex-col gap-2">
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Country:</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="bg-gray-700 text-white px-2 py-1 rounded text-xs md:text-sm w-full"
                >
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="JP">Japan</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                </select>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Days:</label>
                <select
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="bg-gray-700 text-white px-2 py-1 rounded text-xs md:text-sm w-full"
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Latency Type:</label>
                <select
                  value={latencyType}
                  onChange={(e) => setLatencyType(e.target.value as 'idle' | 'loaded')}
                  className="bg-gray-700 text-white px-2 py-1 rounded text-xs md:text-sm w-full"
                >
                  <option value="idle">Idle Latency</option>
                  <option value="loaded">Loaded Latency</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Mobile View - Burger Menu */}
        <div className="md:hidden relative mb-2 md:mb-4 ">
          {/* Burger Menu Button */}
          <button
            onClick={toggleLatMenu}
            className="flex items-center justify-between p-2 md:p-3 border border-gray-600 rounded bg-black bg-opacity-70 w-full"
            aria-label="Toggle network data menu"
          >
            <span className="font-semibold text-xs md:text-sm">Network Data</span>
            {isLatMenuOpen ? (
              <X className="h-4 w-4 text-white" />
            ) : (
              <Menu className="h-4 w-4 text-white" />
            )}
          </button>

          {/* Mobile Menu Dropdown */}
          {isLatMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 p-2 md:p-3 border border-gray-600 rounded bg-black bg-opacity-70 z-100">
              <div className="mb-2 flex items-center text-xs md:text-sm">
              </div>

              {showLatencyData && (
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1">Country:</label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="bg-gray-700 text-white px-2 py-1 rounded text-xs md:text-sm w-full"
                    >
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="JP">Japan</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1">Days:</label>
                    <select
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
                      className="bg-gray-700 text-white px-2 py-1 rounded text-xs md:text-sm w-full"
                    >
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1">Latency Type:</label>
                    <select
                      value={latencyType}
                      onChange={(e) => setLatencyType(e.target.value as 'idle' | 'loaded')}
                      className="bg-gray-700 text-white px-2 py-1 rounded text-xs md:text-sm w-full"
                    >
                      <option value="idle">Idle Latency</option>
                      <option value="loaded">Loaded Latency</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Overlay to close menu when clicking outside */}
          {isLatMenuOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsLatMenuOpen(false)}
            />
          )}
        </div>

        {/* Exchange Server Controls */}
        {/* Desktop View */}
        <div className="hidden md:block mb-4 p-3 border border-gray-600 rounded">
          <h4 className="font-semibold mb-2">Exchange Servers</h4>
          <div className="mb-2">
          </div>

          {showExchanges && (
            <div>
              <label className="block text-sm font-medium mb-1">Cloud Provider:</label>
              <select
                value={selectedCloudProvider}
                onChange={(e) => setSelectedCloudProvider(e.target.value)}
                className="bg-gray-700 text-white px-2 py-1 rounded text-sm w-full"
              >
                <option value="All">All Providers</option>
                <option value="AWS">AWS</option>
                <option value="GCP">Google Cloud</option>
                <option value="Azure">Microsoft Azure</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}
        </div>

        {/* Mobile View - Burger Menu */}
        <div className="md:hidden relative mb-4">
          {/* Burger Menu Button */}
          <button
            onClick={toggleExMenu}
            className="flex items-center justify-between p-3 border border-gray-600 rounded w-full"
            aria-label="Toggle exchange servers menu"
          >
            <span className="font-semibold">Exchange Servers</span>
            {isExMenuOpen ? (
              <X className="h-4 w-4 text-white" />
            ) : (
              <Menu className="h-4 w-4 text-white" />
            )}
          </button>

          {/* Mobile Menu Dropdown */}
          {isExMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 p-3 border border-gray-600 rounded bg-gray-800 z-50">
              <div className="mb-2">
              </div>

              {showExchanges && (
                <div>
                  <label className="block text-sm font-medium mb-1">Cloud Provider:</label>
                  <select
                    value={selectedCloudProvider}
                    onChange={(e) => setSelectedCloudProvider(e.target.value)}
                    className="bg-gray-700 text-white px-2 py-1 rounded text-sm w-full"
                  >
                    <option value="All">All Providers</option>
                    <option value="AWS">AWS</option>
                    <option value="GCP">Google Cloud</option>
                    <option value="Azure">Microsoft Azure</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Overlay to close menu when clicking outside */}
          {isExMenuOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsExMenuOpen(false)}
            />
          )}
        </div>

        {/* Usage Instructions */}
      </div>

      {/* Latency Data Labels */}
      {labels.map((label) => (
        <div
          key={label.id}
          className={`absolute pointer-events-none transition-opacity duration-300 ${label.visible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            left: `${label.x + 10}px`,
            top: `${label.y - 10}px`,
            transform: 'translate(0, -50%)',
            zIndex: 30
          }}
        >
          <div className="bg-green-900 bg-opacity-90 text-white px-2 py-1 rounded-md text-xs md:text-sm whitespace-nowrap border border-green-400">
            <div className="font-semibold">{label.name}</div>
            <div className="opacity-80">Latency: {label.value.toFixed(2)}</div>
          </div>
        </div>
      ))}

      {/* Exchange Server Labels */}
      {exchangeLabels.map((label) => (
        <div
          key={label.id}
          className={`absolute pointer-events-none transition-opacity duration-300 ${label.visible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            left: `${label.x + 10}px`,
            top: `${label.y - 10}px`,
            transform: 'translate(0, -50%)',
            zIndex: 30
          }}
        >
          <div className="bg-blue-900 bg-opacity-90 text-white px-2 py-1 rounded-md text-xs md:text-sm whitespace-nowrap border border-blue-400">
            <div className="font-semibold">{label.exchange}</div>
            <div className="opacity-80">{label.location}</div>
            <div className="opacity-80">{label.cloudProvider}</div>
          </div>
        </div>
      ))}

      {/* Enhanced Legend */}
      {/* Desktop View */}
      <div className="hidden md:block absolute bottom-2 right-1/2 transform translate-x-1/2 md:bottom-4 md:right-4 md:translate-x-0 text-white bg-black bg-opacity-80 p-2 md:p-4 rounded-lg max-w-xs w-[95vw] md:w-auto text-xs md:text-sm z-20">
        <h4 className="font-bold mb-3">Legend</h4>

        {showLatencyData && (
          <div className="mb-4">
            <h5 className="font-semibold mb-2 text-green-400">Latency Data (Spheres)</h5>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-xs">High Latency (&gt;0.7)</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-xs">Medium Latency (0.4-0.7)</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-xs">Low Latency (&lt;0.4)</span>
            </div>
          </div>
        )}

        {showExchanges && (
          <div>
            <h5 className="font-semibold mb-2 text-blue-400">Exchange Servers (Cubes)</h5>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-orange-500 mr-2" style={{ backgroundColor: '#ff9500' }}></div>
              <span className="text-xs">AWS</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-blue-500 mr-2" style={{ backgroundColor: '#4285f4' }}></div>
              <span className="text-xs">Google Cloud</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-blue-600 mr-2" style={{ backgroundColor: '#0078d4' }}></div>
              <span className="text-xs">Microsoft Azure</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 mr-2"></div>
              <span className="text-xs">Other Providers</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile View - Burger Menu (Footer) */}
      <div className="md:hidden fixed bottom-2 right-1/2 transform translate-x-1/2 z-20">
        {/* Mobile Menu Dropdown - Opens Upward */}
        {isLegendMenuOpen && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 text-white bg-black bg-opacity-80 p-3 rounded-lg w-[95vw] max-w-xs text-xs">
            {showLatencyData && (
              <div className="mb-4">
                <h5 className="font-semibold mb-2 text-green-400">Latency Data (Spheres)</h5>
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-xs">High Latency (&gt;0.7)</span>
                </div>
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="text-xs">Medium Latency (0.4-0.7)</span>
                </div>
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-xs">Low Latency (&lt;0.4)</span>
                </div>
              </div>
            )}

            {showExchanges && (
              <div>
                <h5 className="font-semibold mb-2 text-blue-400">Exchange Servers (Cubes)</h5>
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 bg-orange-500 mr-2" style={{ backgroundColor: '#ff9500' }}></div>
                  <span className="text-xs">AWS</span>
                </div>
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 bg-blue-500 mr-2" style={{ backgroundColor: '#4285f4' }}></div>
                  <span className="text-xs">Google Cloud</span>
                </div>
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 bg-blue-600 mr-2" style={{ backgroundColor: '#0078d4' }}></div>
                  <span className="text-xs">Microsoft Azure</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 mr-2"></div>
                  <span className="text-xs">Other Providers</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Burger Menu Button */}
        <button
          onClick={toggleLegMenu}
          className="flex items-center justify-center p-2 text-white bg-black bg-opacity-80 rounded-lg"
          aria-label="Toggle legend menu"
        >
          <span className="font-bold mr-2 text-xs">Legend</span>
          {isLegendMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </button>

        {/* Overlay to close menu when clicking outside */}
        {isLegendMenuOpen && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsLegendMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default WorldMap3D;