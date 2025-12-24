
import { CONFIG } from './constants';

export const getRandomInSphere = (radius: number): [number, number, number] => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(Math.random());
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  return [x, y, z];
};

export const getTreePosition = (height: number, maxRadius: number): [number, number, number] => {
  const y = Math.random() * height;
  const currentMaxRadius = maxRadius * (1 - y / height);
  const r = Math.sqrt(Math.random()) * currentMaxRadius;
  const theta = Math.random() * 2 * Math.PI;
  const x = r * Math.cos(theta);
  const z = r * Math.sin(theta);
  return [x, y - height / 2, z];
};
