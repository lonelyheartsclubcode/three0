<!-- -->

# Advanced Three.js Techniques

This document covers advanced rendering techniques available in Three0 for creating realistic materials and efficient particle systems.

## Realistic Materials with meshPhysicalMaterial

The `meshPhysicalMaterial` in Three.js provides physically-based rendering capabilities that can create convincing glass, water, and other complex surfaces.

### Key Properties

| Property | Range | Description |
|----------|-------|-------------|
| `transmission` | 0-1 | Controls transparency through refractive materials (1 = fully transmissive) |
| `ior` | 1.0-2.333 | Index Of Refraction (water=1.33, glass=1.5-1.7, diamond=2.4) |
| `reflectivity` | 0-1 | Mirror-like reflections on the material's surface |
| `clearcoat` | 0-1 | Additional glossy layer on top of the material |
| `clearcoatRoughness` | 0-1 | Controls roughness of the clearcoat layer |
| `thickness` | 0-10 | Medium's thickness for computing volumetric effects |
| `attenuationDistance` | 0-Infinity | How far light travels through material before attenuating |
| `attenuationColor` | Color | Color that white light turns into when passing through material |

### Creating Realistic Water

For realistic water, combine these properties:

```jsx
<meshPhysicalMaterial 
  color="#40a0ff"             // Base water color (light blue)
  roughness={0.1}             // Low roughness for a smooth surface
  metalness={0.1}             // Slight metalness for reflections
  transmission={0.6}          // Partial transparency
  ior={1.33}                  // Water's index of refraction
  reflectivity={0.7}          // High reflectivity for water surface
  clearcoat={1}               // Maximum clearcoat for water surface shine
  clearcoatRoughness={0.1}    // Low roughness for the clearcoat
  thickness={1.5}             // Thickness of water for light passing through
  transparent={true}          // Enable transparency
  opacity={0.85}              // Partial opacity
/>
```

### Creating Realistic Glass

For realistic glass surfaces:

```jsx
<meshPhysicalMaterial 
  color="#ffffff"              // Clear/white color for glass
  roughness={0.05}             // Very low roughness - smooth glass
  transmission={1.0}           // Full transparency
  ior={1.5}                    // Glass index of refraction
  thickness={0.5}              // Thin glass
  clearcoat={1}                // Maximum clearcoat for shine
  clearcoatRoughness={0.1}     // Slight roughness on surface
  attenuationColor="#f9ffff"   // Slight blue tint when looking through thick portions
  attenuationDistance={0.2}    // How far light travels before attenuating
  transparent={true}           // Enable transparency
/>
```

### Animated Water Surface

To create realistic water movement, use vertex displacement:

```jsx
useFrame((state) => {
  if (!waterRef.current || !waterGeometryRef.current) return;
  
  const { geometry } = waterGeometryRef.current;
  const time = state.clock.getElapsedTime();
  
  // Get position attribute to modify
  const position = geometry.getAttribute('position');
  const { array } = position;
  
  // Animate each vertex for wave effect
  for (let i = 0; i < array.length; i += 3) {
    // Skip x and z coordinates (0 and 2), only modify y (1)
    const x = array[i];
    const z = array[i + 2];
    
    // Multiple sine waves at different frequencies and phases for realism
    array[i + 1] = 
      Math.sin(x / 2 + time) * 0.2 + 
      Math.sin(z / 3 + time * 0.7) * 0.3 + 
      Math.sin((x + z) / 4 + time * 0.5) * 0.1;
  }
  
  // Mark positions for update
  position.needsUpdate = true;
  geometry.computeVertexNormals(); // Important for correct lighting
});
```

## Particle Systems with instancedMesh

Using `instancedMesh` allows rendering thousands of similar objects with minimal performance impact.

### Basic Implementation

```jsx
const COUNT = 1000; // Number of particles
const meshRef = useRef();
const dummy = useMemo(() => new THREE.Object3D(), []);
const particles = useMemo(() => {
  // Initialize particle data
  return Array.from({ length: COUNT }, () => ({
    position: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10],
    scale: 0.1 + Math.random() * 0.9,
    velocity: [(Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02],
    // ... other properties
  }));
}, []);

// Update particles in animation frame
useFrame(() => {
  if (!meshRef.current) return;
  
  particles.forEach((particle, i) => {
    // Get current matrix
    meshRef.current.getMatrixAt(i, dummy.matrix);
    dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
    
    // Update position based on velocity
    dummy.position.x += particle.velocity[0];
    dummy.position.y += particle.velocity[1];
    dummy.position.z += particle.velocity[2];
    
    // Update the matrix for this instance
    dummy.updateMatrix();
    meshRef.current.setMatrixAt(i, dummy.matrix);
  });
  
  // Important: Mark instance matrices for update
  meshRef.current.instanceMatrix.needsUpdate = true;
});

// Render
return (
  <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
    <boxGeometry args={[1, 1, 1]} />
    <meshPhysicalMaterial color="#ff6000" />
  </instancedMesh>
);
```

### Best Practices

1. **Always use a dummy object**: Use a shared `THREE.Object3D()` to set positions, rotations, and scales
2. **Call dummy.updateMatrix()**: Update the matrix after changing any properties
3. **Set matrices using instancedMesh.setMatrixAt()**: Update individual instances
4. **Mark instanceMatrix.needsUpdate = true**: Always mark for update after making changes
5. **Store additional data separately**: Keep velocities, lifetimes, etc. in a separate array
6. **Consider instancing optimizations**: For very large particle counts (10,000+), consider using shaders and custom attribute-based instancing

## Performance Considerations

When combining advanced materials with particle systems, keep these tips in mind:

1. **Start with fewer particles**: Begin with a smaller count (100-500) and increase gradually
2. **Use simple geometries for particles**: Prefer boxes, spheres or custom low-poly shapes
3. **Simplify materials on particles**: Use basic materials for particles when possible
4. **Limit transparency**: Transparent materials are more expensive to render
5. **Use delta time for animation**: Ensure animations run at the same speed regardless of frame rate
6. **Implement culling**: Remove or skip updating particles that are off-screen
7. **Use level of detail**: Decrease particle detail with distance from camera 