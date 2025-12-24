import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface IconProps {
  color: string;
  size?: number;
}

export const HomeIcon: React.FC<IconProps> = ({ color, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ProjectsIcon: React.FC<IconProps> = ({ color, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M3 7h5l2 2h11v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const TrackerIcon: React.FC<IconProps> = ({ color, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M10 2h4" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="8" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 9v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const GalleryIcon: React.FC<IconProps> = ({ color, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MenuIcon: React.FC<IconProps> = ({ color, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 12h18" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
