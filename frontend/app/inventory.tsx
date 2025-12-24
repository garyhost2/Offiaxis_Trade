import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
  FlatList,
  Animated,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Calendar } from 'react-native-calendars';
import { useActivity } from '../contexts/ActivityContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============= TYPES =============
interface Location {
  id: string;
  name: string;
  type: string;
  address?: string;
  color: string;
}

interface LocationType {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface InventoryItem {
  id: string;
  barcode: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  totalQuantity: number;
  lowStockThreshold: number;
  unit: string;
  locationQuantities: { [locationId: string]: number };
  imageUrl?: string;
  productUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Tool {
  id: string;
  barcode: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  serialNumber?: string;
  currentLocationId: string;
  status: 'available' | 'checked-out' | 'maintenance' | 'lost';
  checkedOutBy?: string;
  checkedOutDate?: Date;
  expectedReturnDate?: Date;
  imageUrl?: string;
  createdAt: Date;
}

interface CheckoutRecord {
  id: string;
  toolId: string;
  toolName: string;
  userId: string;
  userName: string;
  checkoutDate: Date;
  expectedReturnDate: Date;
  actualReturnDate?: Date;
  notes?: string;
  status: 'active' | 'returned' | 'overdue';
}

interface ToolRequest {
  id: string;
  toolId: string;
  toolName: string;
  requestedBy: string;
  requestedByName: string;
  requestedDate: Date;
  neededFrom: Date;
  neededUntil: Date;
  status: 'pending' | 'approved' | 'denied';
  notes?: string;
}

interface LowStockAlert {
  id: string;
  itemId: string;
  itemName: string;
  currentQuantity: number;
  threshold: number;
  createdAt: Date;
  acknowledged: boolean;
}

// Inventory Transaction for pickup/restock history
interface InventoryTransaction {
  id: string;
  type: 'pickup' | 'restock';
  itemId: string;
  itemName: string;
  itemImageUrl?: string;
  itemCategory: string;
  itemUnit: string;
  quantity: number;
  locationId: string;
  locationName: string;
  performedBy: string;
  performedByName: string;
  timestamp: Date;
  notes?: string;
}

type TabType = 'products' | 'tools' | 'locations' | 'alerts' | 'history';

// Unit type interface
interface UnitType {
  id: string;
  name: string;
}

// ============= MOCK DATA =============
const INITIAL_LOCATIONS: Location[] = [
  { id: 'loc-1', name: 'Main Warehouse', type: 'Warehouse', address: '123 Industrial Blvd', color: '#3B82F6' },
  { id: 'loc-2', name: 'Van 1', type: 'Van', color: '#10B981' },
  { id: 'loc-3', name: 'Van 2', type: 'Van', color: '#F59E0B' },
  { id: 'loc-4', name: 'Office', type: 'Office', address: '456 Main St', color: '#8B5CF6' },
];

const INITIAL_LOCATION_TYPES: LocationType[] = [
  { id: 'lt-1', name: 'Warehouse' },
  { id: 'lt-2', name: 'Van' },
  { id: 'lt-3', name: 'Office' },
  { id: 'lt-4', name: 'Jobsite' },
];

const INITIAL_UNIT_TYPES: UnitType[] = [
  { id: 'ut-1', name: 'Pcs' },
  { id: 'ut-2', name: 'Box' },
  { id: 'ut-3', name: 'Ft' },
  { id: 'ut-4', name: 'Lbs' },
  { id: 'ut-5', name: 'Gal' },
  { id: 'ut-6', name: 'Bags' },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Electrical', color: '#EAB308', icon: 'flash' },
  { id: 'cat-2', name: 'Plumbing', color: '#3B82F6', icon: 'water' },
  { id: 'cat-3', name: 'Hardware', color: '#6B7280', icon: 'hardware-chip' },
  { id: 'cat-4', name: 'Safety', color: '#EF4444', icon: 'shield-checkmark' },
  { id: 'cat-5', name: 'Tools', color: '#10B981', icon: 'construct' },
  { id: 'cat-6', name: 'Lighting', color: '#F59E0B', icon: 'bulb' },
];

const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: 'item-1',
    barcode: '1000001',
    name: 'Decora Outlet (White)',
    description: '15A, 125V Decora outlet',
    category: 'Electrical',
    tags: ['outlet', 'decora', 'white'],
    totalQuantity: 245,
    lowStockThreshold: 50,
    unit: 'Pcs',
    locationQuantities: { 'loc-1': 200, 'loc-2': 25, 'loc-3': 20 },
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
    productUrl: 'https://www.homedepot.com/p/Leviton-Decora-15-Amp-Tamper-Resistant-Duplex-Outlet-White-10-Pack-M22-T5325-WMP/100684043',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-10'),
  },
  {
    id: 'item-2',
    barcode: '1000002',
    name: 'Decora Switch (White)',
    description: '15A Single-pole Decora switch',
    category: 'Electrical',
    tags: ['switch', 'decora', 'white'],
    totalQuantity: 180,
    lowStockThreshold: 40,
    unit: 'Pcs',
    locationQuantities: { 'loc-1': 150, 'loc-2': 15, 'loc-3': 15 },
    imageUrl: 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=200&h=200&fit=crop',
    productUrl: 'https://www.homedepot.com/p/Leviton-Decora-15-Amp-Single-Pole-Rocker-Light-Switch-White-10-Pack-M22-05601-2WM/100026393',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-08'),
  },
  {
    id: 'item-3',
    barcode: '1000003',
    name: '12/2 Romex Wire',
    description: '250ft roll, NM-B Cable',
    category: 'Electrical',
    tags: ['wire', 'romex', '12-2'],
    totalQuantity: 12,
    lowStockThreshold: 5,
    unit: 'Rolls',
    locationQuantities: { 'loc-1': 10, 'loc-2': 1, 'loc-3': 1 },
    imageUrl: 'https://images.unsplash.com/photo-1597739239353-50270a473397?w=200&h=200&fit=crop',
    productUrl: 'https://www.homedepot.com/p/Southwire-250-ft-12-2-Solid-Romex-SIMpull-CU-NM-B-W-G-Wire-28828255/100049997',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-12-12'),
  },
  {
    id: 'item-4',
    barcode: '1000004',
    name: 'LED Recessed Light 6"',
    description: '12W, 3000K, IC Rated',
    category: 'Lighting',
    tags: ['led', 'recessed', '6-inch'],
    totalQuantity: 85,
    lowStockThreshold: 20,
    unit: 'Pcs',
    locationQuantities: { 'loc-1': 75, 'loc-2': 5, 'loc-3': 5 },
    imageUrl: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=200&h=200&fit=crop',
    productUrl: 'https://www.homedepot.com/p/Commercial-Electric-6-in-Selectable-Integrated-LED-Recessed-Trim-Can-Light-4-Pack-53804101-4PK/312575610',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-12-01'),
  },
  {
    id: 'item-5',
    barcode: '1000005',
    name: 'PVC Conduit 1/2"',
    description: '10ft length, Schedule 40',
    category: 'Electrical',
    tags: ['conduit', 'pvc', '1/2-inch'],
    totalQuantity: 45,
    lowStockThreshold: 15,
    unit: 'Pcs',
    locationQuantities: { 'loc-1': 40, 'loc-2': 3, 'loc-3': 2 },
    imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=200&h=200&fit=crop',
    productUrl: 'https://www.homedepot.com/p/JM-eagle-1-2-in-x-10-ft-PVC-Sch-40-Plain-End-Pipe-67454/202280935',
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-11-28'),
  },
  {
    id: 'item-6',
    barcode: '1000006',
    name: 'Safety Glasses',
    description: 'ANSI Z87.1 rated',
    category: 'Safety',
    tags: ['safety', 'glasses', 'ppe'],
    totalQuantity: 8,
    lowStockThreshold: 10,
    unit: 'Pcs',
    locationQuantities: { 'loc-1': 5, 'loc-2': 2, 'loc-3': 1 },
    imageUrl: 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=200&h=200&fit=crop',
    productUrl: 'https://www.homedepot.com/p/3M-SecureFit-400-Series-Anti-Fog-Safety-Eyewear-with-Clear-Lens-SF400C-WV-6/206386459',
    createdAt: new Date('2024-05-12'),
    updatedAt: new Date('2024-12-10'),
  },
];

const INITIAL_TOOLS: Tool[] = [
  {
    id: 'tool-1',
    barcode: '2000001',
    name: 'Milwaukee Drill',
    description: 'M18 FUEL 1/2" Hammer Drill',
    category: 'Tools',
    tags: ['drill', 'milwaukee', 'cordless'],
    serialNumber: 'MIL-2024-001',
    currentLocationId: 'loc-2',
    status: 'checked-out',
    checkedOutBy: 'user-1',
    checkedOutDate: new Date('2024-12-10'),
    expectedReturnDate: new Date('2024-12-17'),
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop',
    createdAt: new Date('2024-01-10'),
  },
  {
    id: 'tool-2',
    barcode: '2000002',
    name: 'DeWalt Impact Driver',
    description: '20V MAX XR Impact Driver',
    category: 'Tools',
    tags: ['impact', 'dewalt', 'cordless'],
    serialNumber: 'DEW-2024-002',
    currentLocationId: 'loc-1',
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=400&fit=crop',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'tool-3',
    barcode: '2000003',
    name: 'Fluke Multimeter',
    description: 'Fluke 117 Electricians Multimeter',
    category: 'Tools',
    tags: ['multimeter', 'fluke', 'electrical'],
    serialNumber: 'FLK-2024-003',
    currentLocationId: 'loc-3',
    status: 'checked-out',
    checkedOutBy: 'user-2',
    checkedOutDate: new Date('2024-12-12'),
    expectedReturnDate: new Date('2024-12-14'),
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: 'tool-4',
    barcode: '2000004',
    name: 'Wire Fish Tape',
    description: '100ft Steel Fish Tape',
    category: 'Tools',
    tags: ['fish-tape', 'wire-pulling'],
    serialNumber: 'WFT-2024-004',
    currentLocationId: 'loc-1',
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=400&fit=crop',
    createdAt: new Date('2024-03-05'),
  },
  {
    id: 'tool-5',
    barcode: '2000005',
    name: 'Ladder 8ft',
    description: 'Werner Fiberglass A-Frame',
    category: 'Tools',
    tags: ['ladder', 'fiberglass', '8ft'],
    serialNumber: 'LAD-2024-005',
    currentLocationId: 'loc-1',
    status: 'maintenance',
    imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop',
    createdAt: new Date('2024-04-10'),
  },
];

const INITIAL_CHECKOUT_RECORDS: CheckoutRecord[] = [
  {
    id: 'checkout-1',
    toolId: 'tool-1',
    toolName: 'Milwaukee Drill',
    userId: 'user-1',
    userName: 'John Smith',
    checkoutDate: new Date('2024-12-15T10:00:00'),
    expectedReturnDate: new Date('2024-12-22'),
    status: 'active',
    notes: 'Needed for residential project',
  },
  {
    id: 'checkout-2',
    toolId: 'tool-3',
    toolName: 'Fluke Multimeter',
    userId: 'user-2',
    userName: 'Mike Johnson',
    checkoutDate: new Date('2024-12-14T15:30:00'),
    expectedReturnDate: new Date('2024-12-16'),
    status: 'active',
  },
  {
    id: 'checkout-3',
    toolId: 'tool-2',
    toolName: 'DeWalt Impact Driver',
    userId: 'user-3',
    userName: 'Sarah Davis',
    checkoutDate: new Date('2024-12-13T09:00:00'),
    expectedReturnDate: new Date('2024-12-15'),
    actualReturnDate: new Date('2024-12-14T16:00:00'),
    status: 'returned',
  },
];

const USERS = [
  { id: 'user-1', name: 'John Smith' },
  { id: 'user-2', name: 'Mike Johnson' },
  { id: 'user-3', name: 'Sarah Davis' },
  { id: 'user-4', name: 'Emily Brown' },
];

const INITIAL_INVENTORY_TRANSACTIONS: InventoryTransaction[] = [
  {
    id: 'trans-1',
    type: 'pickup',
    itemId: 'item-1',
    itemName: 'Decora Outlet (White)',
    itemImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
    itemCategory: 'Electrical',
    itemUnit: 'Pcs',
    quantity: 10,
    locationId: 'loc-1',
    locationName: 'Main Warehouse',
    performedBy: 'user-1',
    performedByName: 'John Smith',
    timestamp: new Date('2024-12-14T09:30:00'),
    notes: 'For residential project at Oak Street',
  },
  {
    id: 'trans-2',
    type: 'restock',
    itemId: 'item-2',
    itemName: 'Decora Switch (White)',
    itemImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop',
    itemCategory: 'Electrical',
    itemUnit: 'Pcs',
    quantity: 50,
    locationId: 'loc-1',
    locationName: 'Main Warehouse',
    performedBy: 'user-3',
    performedByName: 'Sarah Davis',
    timestamp: new Date('2024-12-14T08:15:00'),
    notes: 'Weekly restock from supplier',
  },
  {
    id: 'trans-3',
    type: 'pickup',
    itemId: 'item-3',
    itemName: 'Romex 12/2 Wire',
    itemImageUrl: 'https://images.unsplash.com/photo-1597673030062-0a0f1a801a31?w=200&h=200&fit=crop',
    itemCategory: 'Electrical',
    itemUnit: 'Ft',
    quantity: 250,
    locationId: 'loc-2',
    locationName: 'Van 1',
    performedBy: 'user-2',
    performedByName: 'Mike Johnson',
    timestamp: new Date('2024-12-13T14:45:00'),
    notes: 'Commercial rewiring job',
  },
  {
    id: 'trans-4',
    type: 'restock',
    itemId: 'item-4',
    itemName: 'PVC Conduit 1"',
    itemImageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=200&h=200&fit=crop',
    itemCategory: 'Plumbing',
    itemUnit: 'Ft',
    quantity: 100,
    locationId: 'loc-3',
    locationName: 'Van 2',
    performedBy: 'user-4',
    performedByName: 'Emily Brown',
    timestamp: new Date('2024-12-13T11:20:00'),
  },
  {
    id: 'trans-5',
    type: 'pickup',
    itemId: 'item-5',
    itemName: 'Wire Nuts (Yellow)',
    itemImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
    itemCategory: 'Electrical',
    itemUnit: 'Box',
    quantity: 2,
    locationId: 'loc-1',
    locationName: 'Main Warehouse',
    performedBy: 'user-1',
    performedByName: 'John Smith',
    timestamp: new Date('2024-12-12T16:00:00'),
    notes: 'Running low on van',
  },
  {
    id: 'trans-6',
    type: 'restock',
    itemId: 'item-1',
    itemName: 'Decora Outlet (White)',
    itemImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
    itemCategory: 'Electrical',
    itemUnit: 'Pcs',
    quantity: 100,
    locationId: 'loc-1',
    locationName: 'Main Warehouse',
    performedBy: 'user-3',
    performedByName: 'Sarah Davis',
    timestamp: new Date('2024-12-12T08:00:00'),
    notes: 'Monthly bulk order delivery',
  },
  {
    id: 'trans-7',
    type: 'pickup',
    itemId: 'item-6',
    itemName: 'LED Bulb 60W',
    itemImageUrl: 'https://images.unsplash.com/photo-1532007468695-c3bb5e0ada43?w=200&h=200&fit=crop',
    itemCategory: 'Lighting',
    itemUnit: 'Pcs',
    quantity: 12,
    locationId: 'loc-2',
    locationName: 'Van 1',
    performedBy: 'user-2',
    performedByName: 'Mike Johnson',
    timestamp: new Date('2024-12-11T10:30:00'),
    notes: 'Kitchen renovation project',
  },
  {
    id: 'trans-8',
    type: 'pickup',
    itemId: 'item-3',
    itemName: 'Romex 12/2 Wire',
    itemImageUrl: 'https://images.unsplash.com/photo-1597673030062-0a0f1a801a31?w=200&h=200&fit=crop',
    itemCategory: 'Electrical',
    itemUnit: 'Ft',
    quantity: 150,
    locationId: 'loc-1',
    locationName: 'Main Warehouse',
    performedBy: 'user-4',
    performedByName: 'Emily Brown',
    timestamp: new Date('2024-12-10T13:15:00'),
  },
];

// ============= BARCODE COMPONENT =============
const BarcodeDisplay: React.FC<{ value: string; width?: number; height?: number }> = ({ 
  value, 
  width = 200, 
  height = 80 
}) => {
  // Generate Code 128 pattern (simplified)
  const generateBars = () => {
    const bars: { x: number; width: number }[] = [];
    const barWidth = width / (value.length * 11 + 35);
    let x = 10;
    
    // Start pattern
    [2, 1, 1, 2, 3, 2].forEach(w => {
      bars.push({ x, width: barWidth * w });
      x += barWidth * (w + 1);
    });
    
    // Data characters
    for (let i = 0; i < value.length; i++) {
      const charCode = value.charCodeAt(i);
      const pattern = [
        (charCode % 4) + 1,
        ((charCode >> 2) % 3) + 1,
        ((charCode >> 4) % 2) + 1,
        ((charCode >> 6) % 3) + 1,
        2,
        1,
      ];
      pattern.forEach((w, idx) => {
        if (idx % 2 === 0) {
          bars.push({ x, width: barWidth * w });
        }
        x += barWidth * w;
      });
    }
    
    // Stop pattern
    [2, 3, 3, 1, 1, 1, 2].forEach((w, idx) => {
      if (idx % 2 === 0) {
        bars.push({ x, width: barWidth * w });
      }
      x += barWidth * w;
    });
    
    return bars;
  };
  
  const bars = generateBars();
  
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={height}>
        {bars.map((bar, index) => (
          <Rect
            key={index}
            x={bar.x}
            y={5}
            width={bar.width}
            height={height - 25}
            fill="#000000"
          />
        ))}
        <SvgText
          x={width / 2}
          y={height - 5}
          fontSize={14}
          fontWeight="bold"
          textAnchor="middle"
          fill="#000000"
        >
          {value}
        </SvgText>
      </Svg>
    </View>
  );
};

// ============= MAIN COMPONENT =============
export default function InventoryScreen() {
  const router = useRouter();
  const { logActivity } = useActivity();
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data State
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [locationTypes, setLocationTypes] = useState<LocationType[]>(INITIAL_LOCATION_TYPES);
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);
  const [tools, setTools] = useState<Tool[]>(INITIAL_TOOLS);
  const [checkoutRecords, setCheckoutRecords] = useState<CheckoutRecord[]>(INITIAL_CHECKOUT_RECORDS);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  
  // UI State
  const [showScanner, setShowScanner] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddTool, setShowAddTool] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const [showToolDetail, setShowToolDetail] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  
  // Unit Types State
  const [unitTypes, setUnitTypes] = useState<UnitType[]>(INITIAL_UNIT_TYPES);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  
  // Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemThreshold, setNewItemThreshold] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('Pcs');
  const [newItemTags, setNewItemTags] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationType, setNewLocationType] = useState('Warehouse');
  const [newLocationColor, setNewLocationColor] = useState('#3B82F6');
  const [newLocationIcon, setNewLocationIcon] = useState('business');
  
  // Location Type Management State
  const [showLocationTypeAction, setShowLocationTypeAction] = useState(false);
  const [showRenameLocationType, setShowRenameLocationType] = useState(false);
  const [showAddLocationType, setShowAddLocationType] = useState(false);
  const [selectedLocationTypeForAction, setSelectedLocationTypeForAction] = useState<LocationType | null>(null);
  const [renameLocationTypeName, setRenameLocationTypeName] = useState('');
  const [newLocationTypeName, setNewLocationTypeName] = useState('');
  
  const [checkoutUser, setCheckoutUser] = useState('');
  const [checkoutDays, setCheckoutDays] = useState('7');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  
  // Location Detail State
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  const [selectedLocationForDetail, setSelectedLocationForDetail] = useState<Location | null>(null);
  const [locationDetailTab, setLocationDetailTab] = useState<'items' | 'tools'>('items');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  
  // Category Management State
  const [showCategoryActionModal, setShowCategoryActionModal] = useState(false);
  const [showRenameCategoryModal, setShowRenameCategoryModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [selectedCategoryForAction, setSelectedCategoryForAction] = useState<Category | null>(null);
  const [renameCategoryName, setRenameCategoryName] = useState('');
  const [renameCategoryColor, setRenameCategoryColor] = useState('#3B82F6');
  const [renameCategoryIcon, setRenameCategoryIcon] = useState('cube');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [newCategoryIcon, setNewCategoryIcon] = useState('cube');
  
  // Camera
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  
  // Inventory Transactions (Pickup/Restock) State
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(INITIAL_INVENTORY_TRANSACTIONS);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [pickupLocationId, setPickupLocationId] = useState('');
  const [pickupQuantity, setPickupQuantity] = useState('');
  const [restockLocationId, setRestockLocationId] = useState('');
  const [restockQuantity, setRestockQuantity] = useState('');
  const [transactionNotes, setTransactionNotes] = useState('');
  const [currentUserName, setCurrentUserName] = useState('John Smith'); // Mock current user
  
  // Edit Transaction State
  const [showEditTransaction, setShowEditTransaction] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<InventoryTransaction | null>(null);
  const [editTransQuantity, setEditTransQuantity] = useState('');
  const [editTransNotes, setEditTransNotes] = useState('');
  const [editTransLocation, setEditTransLocation] = useState('');
  const [editTransType, setEditTransType] = useState<'pickup' | 'restock'>('pickup');
  
  // Edit Checkout Record State
  const [showEditCheckout, setShowEditCheckout] = useState(false);
  const [selectedCheckoutRecord, setSelectedCheckoutRecord] = useState<CheckoutRecord | null>(null);
  const [editCheckoutNotes, setEditCheckoutNotes] = useState('');
  const [editCheckoutStatus, setEditCheckoutStatus] = useState<'active' | 'returned' | 'overdue'>('active');
  const [editCheckoutDate, setEditCheckoutDate] = useState<Date>(new Date());
  const [editExpectedReturn, setEditExpectedReturn] = useState<Date>(new Date());
  const [editActualReturn, setEditActualReturn] = useState<Date | null>(null);
  
  // Calendar Modal State
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarDateField, setCalendarDateField] = useState<'checkout' | 'expected' | 'actual'>('checkout');
  
  // Edit Item State
  const [showEditItem, setShowEditItem] = useState(false);
  const [editItemName, setEditItemName] = useState('');
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editItemCategory, setEditItemCategory] = useState('');
  const [editItemTags, setEditItemTags] = useState('');
  const [editItemUnit, setEditItemUnit] = useState('');
  const [editItemUrl, setEditItemUrl] = useState('');
  const [editItemThreshold, setEditItemThreshold] = useState('');
  const [editItemImage, setEditItemImage] = useState<string | null>(null);
  const [editItemBarcode, setEditItemBarcode] = useState('');
  const [editLocationQuantities, setEditLocationQuantities] = useState<{ [key: string]: string }>({});
  const [showEditUnitDropdown, setShowEditUnitDropdown] = useState(false);
  
  // Edit Tool State
  const [showEditTool, setShowEditTool] = useState(false);
  const [editToolName, setEditToolName] = useState('');
  const [editToolDescription, setEditToolDescription] = useState('');
  const [editToolSerialNumber, setEditToolSerialNumber] = useState('');
  const [editToolTags, setEditToolTags] = useState('');
  const [editToolBarcode, setEditToolBarcode] = useState('');
  const [editToolImage, setEditToolImage] = useState<string | null>(null);
  const [editToolLocation, setEditToolLocation] = useState('');
  const [editToolStatus, setEditToolStatus] = useState<'available' | 'checked-out' | 'maintenance' | 'lost'>('available');
  const [showFullToolImage, setShowFullToolImage] = useState(false);
  
  // Generate low stock alerts
  useEffect(() => {
    const alerts: LowStockAlert[] = items
      .filter(item => item.totalQuantity <= item.lowStockThreshold)
      .map(item => ({
        id: `alert-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        currentQuantity: item.totalQuantity,
        threshold: item.lowStockThreshold,
        createdAt: new Date(),
        acknowledged: false,
      }));
    setLowStockAlerts(alerts);
  }, [items]);
  
  // Filter items based on search and category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.includes(searchQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Filter tools based on search
  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.barcode.includes(searchQuery) ||
      tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });
  
  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    setScannedBarcode(barcode);
    setShowScanner(false);
    
    // Check if barcode exists in items
    const existingItem = items.find(item => item.barcode === barcode);
    if (existingItem) {
      setSelectedItem(existingItem);
      setShowItemDetail(true);
      return;
    }
    
    // Check if barcode exists in tools
    const existingTool = tools.find(tool => tool.barcode === barcode);
    if (existingTool) {
      setSelectedTool(existingTool);
      setShowToolDetail(true);
      return;
    }
    
    // Not found - offer to create new
    Alert.alert(
      'Item Not Found',
      `Barcode "${barcode}" is not in the system. Would you like to add it?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Product', onPress: () => { setShowAddItem(true); } },
        { text: 'Add Tool', onPress: () => { setShowAddTool(true); } },
      ]
    );
  };
  
  // Generate unique barcode
  const generateBarcode = (type: 'item' | 'tool') => {
    const prefix = type === 'item' ? '1' : '2';
    const lastNum = type === 'item' 
      ? Math.max(...items.map(i => parseInt(i.barcode)), 1000000)
      : Math.max(...tools.map(t => parseInt(t.barcode)), 2000000);
    return String(lastNum + 1);
  };
  
  // Pick image for product
  const pickProductImage = async () => {
    try {
      // On web, we skip permission request as it's handled by the browser
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant camera roll permissions to add images');
          return;
        }
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Updated from deprecated MediaTypeOptions.Images
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: Platform.OS === 'web', // Use base64 on web for better compatibility
      });
      
      if (!result.canceled && result.assets[0]) {
        // On web, prefer base64 if available
        if (Platform.OS === 'web' && result.assets[0].base64) {
          setNewItemImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        } else {
          setNewItemImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  // Take photo for product
  const takeProductPhoto = async () => {
    try {
      // Camera is not supported on web - show alert
      if (Platform.OS === 'web') {
        Alert.alert('Not Available', 'Camera is not available on web. Please use "Choose from Library" instead.');
        return;
      }
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        setNewItemImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };
  
  // Add new unit type
  const handleAddUnit = () => {
    if (!newUnitName.trim()) {
      Alert.alert('Error', 'Please enter a unit name');
      return;
    }
    
    const newUnit: UnitType = {
      id: `ut-${Date.now()}`,
      name: newUnitName.trim(),
    };
    
    setUnitTypes(prev => [...prev, newUnit]);
    setNewItemUnit(newUnit.name);
    setNewUnitName('');
    setShowAddUnitModal(false);
    setShowUnitDropdown(false);
  };
  
  // Add new item
  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemCategory) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }
    
    const newItem: InventoryItem = {
      id: `item-${Date.now()}`,
      barcode: scannedBarcode || generateBarcode('item'),
      name: newItemName.trim(),
      description: newItemDescription.trim(),
      category: newItemCategory,
      tags: newItemTags.split(',').map(t => t.trim()).filter(t => t),
      totalQuantity: parseInt(newItemQuantity) || 0,
      lowStockThreshold: parseInt(newItemThreshold) || 10,
      unit: newItemUnit,
      locationQuantities: { 'loc-1': parseInt(newItemQuantity) || 0 },
      imageUrl: newItemImage || undefined,
      productUrl: newItemUrl.trim() || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setItems(prev => [...prev, newItem]);
    
    // Log activity
    logActivity({
      type: 'inventory',
      action: 'added',
      description: `added ${newItemQuantity || 0} ${newItemUnit} of "${newItemName.trim()}" to inventory`,
      userName: 'Yefry Soto',
      userInitials: 'YS',
      metadata: { itemName: newItemName.trim(), quantity: parseInt(newItemQuantity) || 0 }
    });
    
    resetItemForm();
    setShowAddItem(false);
    setScannedBarcode(null);
    Alert.alert('Success', 'Item added to inventory');
  };
  
  // Add new tool
  const handleAddTool = () => {
    if (!newItemName.trim() || !newItemCategory) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }
    
    const newTool: Tool = {
      id: `tool-${Date.now()}`,
      barcode: scannedBarcode || generateBarcode('tool'),
      name: newItemName.trim(),
      description: newItemDescription.trim(),
      category: newItemCategory,
      tags: newItemTags.split(',').map(t => t.trim()).filter(t => t),
      serialNumber: `SN-${Date.now()}`,
      currentLocationId: 'loc-1',
      status: 'available',
      createdAt: new Date(),
    };
    
    setTools(prev => [...prev, newTool]);
    
    // Log activity
    logActivity({
      type: 'tool',
      action: 'added',
      description: `added new tool "${newItemName.trim()}" to inventory`,
      userName: 'Yefry Soto',
      userInitials: 'YS',
      metadata: { toolName: newItemName.trim() }
    });
    
    resetItemForm();
    setShowAddTool(false);
    setScannedBarcode(null);
    Alert.alert('Success', 'Tool added to inventory');
  };
  
  // Add new location
  const handleAddLocation = () => {
    if (!newLocationName.trim()) {
      Alert.alert('Error', 'Please enter a location name');
      return;
    }
    
    const newLoc: Location = {
      id: `loc-${Date.now()}`,
      name: newLocationName.trim(),
      type: newLocationType,
      color: newLocationColor,
    };
    
    setLocations(prev => [...prev, newLoc]);
    setNewLocationName('');
    setNewLocationType('warehouse');
    setNewLocationColor('#3B82F6');
    setNewLocationIcon('business');
    setShowAddLocation(false);
    Alert.alert('Success', 'Location added');
  };
  
  // Category Management Functions
  const handleCategoryLongPress = (category: Category) => {
    setSelectedCategoryForAction(category);
    setRenameCategoryName(category.name);
    setRenameCategoryColor(category.color);
    setRenameCategoryIcon(category.icon);
    setShowCategoryActionModal(true);
  };
  
  const handleRenameCategory = () => {
    if (!selectedCategoryForAction || !renameCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    
    const oldName = selectedCategoryForAction.name;
    const newName = renameCategoryName.trim();
    
    // Update category with name, color, and icon
    setCategories(prev => prev.map(cat =>
      cat.id === selectedCategoryForAction.id
        ? { ...cat, name: newName, color: renameCategoryColor, icon: renameCategoryIcon }
        : cat
    ));
    
    // Update items with this category
    setItems(prev => prev.map(item =>
      item.category === oldName
        ? { ...item, category: newName }
        : item
    ));
    
    // Update tools with this category
    setTools(prev => prev.map(tool =>
      tool.category === oldName
        ? { ...tool, category: newName }
        : tool
    ));
    
    setShowRenameCategoryModal(false);
    setShowCategoryActionModal(false);
    setSelectedCategoryForAction(null);
    Alert.alert('Success', `Category updated successfully`);
  };
  
  const handleDeleteCategory = () => {
    if (!selectedCategoryForAction) return;
    
    const categoryName = selectedCategoryForAction.name;
    const itemsWithCategory = items.filter(item => item.category === categoryName).length;
    const toolsWithCategory = tools.filter(tool => tool.category === categoryName).length;
    
    if (itemsWithCategory > 0 || toolsWithCategory > 0) {
      Alert.alert(
        'Cannot Delete',
        `This category has ${itemsWithCategory} item(s) and ${toolsWithCategory} tool(s). Please reassign them first.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categoryName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCategories(prev => prev.filter(cat => cat.id !== selectedCategoryForAction.id));
            setShowCategoryActionModal(false);
            setSelectedCategoryForAction(null);
            if (selectedCategory === categoryName) {
              setSelectedCategory('all');
            }
            Alert.alert('Success', 'Category deleted');
          },
        },
      ]
    );
  };
  
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      color: newCategoryColor,
      icon: newCategoryIcon,
    };
    
    setCategories(prev => [...prev, newCat]);
    setNewCategoryName('');
    setNewCategoryColor('#3B82F6');
    setNewCategoryIcon('cube');
    setShowAddCategoryModal(false);
    Alert.alert('Success', 'Category added');
  };
  
  // Location Type Management Functions
  const handleLocationTypeLongPress = (locType: LocationType) => {
    setSelectedLocationTypeForAction(locType);
    setRenameLocationTypeName(locType.name);
    setShowLocationTypeAction(true);
  };
  
  const handleRenameLocationType = () => {
    if (!selectedLocationTypeForAction || !renameLocationTypeName.trim()) {
      Alert.alert('Error', 'Please enter a location type name');
      return;
    }
    
    const oldName = selectedLocationTypeForAction.name;
    const newName = renameLocationTypeName.trim();
    
    // Update location type
    setLocationTypes(prev => prev.map(lt =>
      lt.id === selectedLocationTypeForAction.id
        ? { ...lt, name: newName }
        : lt
    ));
    
    // Update locations using this type
    setLocations(prev => prev.map(loc =>
      loc.type === oldName
        ? { ...loc, type: newName }
        : loc
    ));
    
    // Update selected location type if it was selected
    if (newLocationType === oldName) {
      setNewLocationType(newName);
    }
    
    setShowRenameLocationType(false);
    setShowLocationTypeAction(false);
    setSelectedLocationTypeForAction(null);
    Alert.alert('Success', `Location type renamed to "${newName}"`);
  };
  
  const handleDeleteLocationType = () => {
    if (!selectedLocationTypeForAction) return;
    
    const typeName = selectedLocationTypeForAction.name;
    const locationsWithType = locations.filter(loc => loc.type === typeName).length;
    
    if (locationsWithType > 0) {
      Alert.alert(
        'Cannot Delete',
        `This location type is used by ${locationsWithType} location(s). Please change their type first.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Delete Location Type',
      `Are you sure you want to delete "${typeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setLocationTypes(prev => prev.filter(lt => lt.id !== selectedLocationTypeForAction.id));
            setShowLocationTypeAction(false);
            setSelectedLocationTypeForAction(null);
            if (newLocationType === typeName && locationTypes.length > 1) {
              setNewLocationType(locationTypes[0].name);
            }
            Alert.alert('Success', 'Location type deleted');
          },
        },
      ]
    );
  };
  
  const handleAddLocationType = () => {
    if (!newLocationTypeName.trim()) {
      Alert.alert('Error', 'Please enter a location type name');
      return;
    }
    
    const newLT: LocationType = {
      id: `lt-${Date.now()}`,
      name: newLocationTypeName.trim(),
    };
    
    setLocationTypes(prev => [...prev, newLT]);
    setNewLocationTypeName('');
    setShowAddLocationType(false);
    Alert.alert('Success', 'Location type added');
  };
  
  // Tool checkout
  const handleCheckout = () => {
    if (!selectedTool || !checkoutUser) {
      Alert.alert('Error', 'Please select a user');
      return;
    }
    
    const user = USERS.find(u => u.id === checkoutUser);
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + parseInt(checkoutDays));
    
    // Update tool
    setTools(prev => prev.map(tool =>
      tool.id === selectedTool.id
        ? {
            ...tool,
            status: 'checked-out',
            checkedOutBy: checkoutUser,
            checkedOutDate: new Date(),
            expectedReturnDate: returnDate,
          }
        : tool
    ));
    
    // Add checkout record
    const newRecord: CheckoutRecord = {
      id: `checkout-${Date.now()}`,
      toolId: selectedTool.id,
      toolName: selectedTool.name,
      userId: checkoutUser,
      userName: user?.name || 'Unknown',
      checkoutDate: new Date(),
      expectedReturnDate: returnDate,
      status: 'active',
      notes: checkoutNotes,
    };
    setCheckoutRecords(prev => [newRecord, ...prev]);
    
    // Log activity
    logActivity({
      type: 'tool',
      action: 'checkout',
      description: `checked out "${selectedTool.name}" to ${user?.name || 'Unknown'}`,
      userName: 'Yefry Soto',
      userInitials: 'YS',
      metadata: { toolName: selectedTool.name, checkedOutTo: user?.name }
    });
    
    setShowCheckout(false);
    setCheckoutUser('');
    setCheckoutDays('7');
    setCheckoutNotes('');
    Alert.alert('Success', `${selectedTool.name} checked out to ${user?.name}`);
  };
  
  // Tool checkin
  const handleCheckin = () => {
    if (!selectedTool) return;
    
    // Update tool
    setTools(prev => prev.map(tool =>
      tool.id === selectedTool.id
        ? {
            ...tool,
            status: 'available',
            checkedOutBy: undefined,
            checkedOutDate: undefined,
            expectedReturnDate: undefined,
            currentLocationId: 'loc-1',
          }
        : tool
    ));
    
    // Update checkout record
    setCheckoutRecords(prev => prev.map(record =>
      record.toolId === selectedTool.id && record.status === 'active'
        ? { ...record, status: 'returned', actualReturnDate: new Date() }
        : record
    ));
    
    // Log activity
    logActivity({
      type: 'tool',
      action: 'checkin',
      description: `returned "${selectedTool.name}" to inventory`,
      userName: 'Yefry Soto',
      userInitials: 'YS',
      metadata: { toolName: selectedTool.name }
    });
    
    setShowCheckin(false);
    setShowToolDetail(false);
    Alert.alert('Success', `${selectedTool.name} has been returned`);
  };
  
  // Update item quantity at location
  const updateItemQuantity = (itemId: string, locationId: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      
      const newLocQty = { ...item.locationQuantities };
      newLocQty[locationId] = Math.max(0, (newLocQty[locationId] || 0) + delta);
      
      const newTotal = Object.values(newLocQty).reduce((sum, qty) => sum + qty, 0);
      
      return {
        ...item,
        locationQuantities: newLocQty,
        totalQuantity: newTotal,
        updatedAt: new Date(),
      };
    }));
  };
  
  // Handle pickup action
  const handlePickup = () => {
    if (!selectedItem || !pickupLocationId || !pickupQuantity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    const qty = parseInt(pickupQuantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    
    const currentQty = selectedItem.locationQuantities[pickupLocationId] || 0;
    if (qty > currentQty) {
      Alert.alert('Error', `Not enough stock at this location. Available: ${currentQty} ${selectedItem.unit}`);
      return;
    }
    
    const location = locations.find(l => l.id === pickupLocationId);
    
    // Create transaction record
    const transaction: InventoryTransaction = {
      id: `trans-${Date.now()}`,
      type: 'pickup',
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemImageUrl: selectedItem.imageUrl,
      itemCategory: selectedItem.category,
      itemUnit: selectedItem.unit,
      quantity: qty,
      locationId: pickupLocationId,
      locationName: location?.name || 'Unknown',
      performedBy: 'user-1',
      performedByName: currentUserName,
      timestamp: new Date(),
      notes: transactionNotes || undefined,
    };
    
    // Update item quantity
    setItems(prev => prev.map(item => {
      if (item.id !== selectedItem.id) return item;
      
      const newLocQty = { ...item.locationQuantities };
      newLocQty[pickupLocationId] = Math.max(0, (newLocQty[pickupLocationId] || 0) - qty);
      const newTotal = Object.values(newLocQty).reduce((sum, q) => sum + q, 0);
      
      return {
        ...item,
        locationQuantities: newLocQty,
        totalQuantity: newTotal,
        updatedAt: new Date(),
      };
    }));
    
    // Add transaction to history
    setInventoryTransactions(prev => [transaction, ...prev]);
    
    // Update selectedItem to reflect changes
    setSelectedItem(prev => {
      if (!prev) return null;
      const newLocQty = { ...prev.locationQuantities };
      newLocQty[pickupLocationId] = Math.max(0, (newLocQty[pickupLocationId] || 0) - qty);
      const newTotal = Object.values(newLocQty).reduce((sum, q) => sum + q, 0);
      return { ...prev, locationQuantities: newLocQty, totalQuantity: newTotal };
    });
    
    // Reset and close modal
    setPickupLocationId('');
    setPickupQuantity('');
    setTransactionNotes('');
    setShowPickupModal(false);
    
    Alert.alert('Success', `Picked up ${qty} ${selectedItem.unit} of ${selectedItem.name}`);
  };
  
  // Handle restock action
  const handleRestock = () => {
    if (!selectedItem || !restockLocationId || !restockQuantity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    const qty = parseInt(restockQuantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    
    const location = locations.find(l => l.id === restockLocationId);
    
    // Create transaction record
    const transaction: InventoryTransaction = {
      id: `trans-${Date.now()}`,
      type: 'restock',
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemImageUrl: selectedItem.imageUrl,
      itemCategory: selectedItem.category,
      itemUnit: selectedItem.unit,
      quantity: qty,
      locationId: restockLocationId,
      locationName: location?.name || 'Unknown',
      performedBy: 'user-1',
      performedByName: currentUserName,
      timestamp: new Date(),
      notes: transactionNotes || undefined,
    };
    
    // Update item quantity
    setItems(prev => prev.map(item => {
      if (item.id !== selectedItem.id) return item;
      
      const newLocQty = { ...item.locationQuantities };
      newLocQty[restockLocationId] = (newLocQty[restockLocationId] || 0) + qty;
      const newTotal = Object.values(newLocQty).reduce((sum, q) => sum + q, 0);
      
      return {
        ...item,
        locationQuantities: newLocQty,
        totalQuantity: newTotal,
        updatedAt: new Date(),
      };
    }));
    
    // Add transaction to history
    setInventoryTransactions(prev => [transaction, ...prev]);
    
    // Update selectedItem to reflect changes
    setSelectedItem(prev => {
      if (!prev) return null;
      const newLocQty = { ...prev.locationQuantities };
      newLocQty[restockLocationId] = (newLocQty[restockLocationId] || 0) + qty;
      const newTotal = Object.values(newLocQty).reduce((sum, q) => sum + q, 0);
      return { ...prev, locationQuantities: newLocQty, totalQuantity: newTotal };
    });
    
    // Reset and close modal
    setRestockLocationId('');
    setRestockQuantity('');
    setTransactionNotes('');
    setShowRestockModal(false);
    
    Alert.alert('Success', `Restocked ${qty} ${selectedItem.unit} of ${selectedItem.name}`);
  };
  
  // Start editing item - populate form with current values
  const startEditItem = () => {
    if (!selectedItem) return;
    
    setEditItemName(selectedItem.name);
    setEditItemDescription(selectedItem.description || '');
    setEditItemCategory(selectedItem.category);
    setEditItemTags(selectedItem.tags.join(', '));
    setEditItemUnit(selectedItem.unit);
    setEditItemUrl(selectedItem.productUrl || '');
    setEditItemThreshold(String(selectedItem.lowStockThreshold));
    setEditItemImage(selectedItem.imageUrl || null);
    setEditItemBarcode(selectedItem.barcode);
    
    // Initialize location quantities
    const locQtys: { [key: string]: string } = {};
    locations.forEach(loc => {
      locQtys[loc.id] = String(selectedItem.locationQuantities[loc.id] || 0);
    });
    setEditLocationQuantities(locQtys);
    
    setShowEditItem(true);
  };
  
  // Pick image for edit
  const pickEditImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant camera roll permissions to add images');
          return;
        }
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: Platform.OS === 'web',
      });
      
      if (!result.canceled && result.assets[0]) {
        if (Platform.OS === 'web' && result.assets[0].base64) {
          setEditItemImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        } else {
          setEditItemImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  // Generate new barcode
  const generateNewBarcode = () => {
    const newBarcode = String(Math.floor(Math.random() * 9000000) + 1000000);
    setEditItemBarcode(newBarcode);
  };
  
  // Save edited item
  const handleSaveEdit = () => {
    if (!selectedItem || !editItemName.trim() || !editItemCategory) {
      Alert.alert('Error', 'Please fill in required fields (Name, Category)');
      return;
    }
    
    // Calculate new total from location quantities
    const newLocationQuantities: { [key: string]: number } = {};
    let newTotal = 0;
    locations.forEach(loc => {
      const qty = parseInt(editLocationQuantities[loc.id]) || 0;
      newLocationQuantities[loc.id] = qty;
      newTotal += qty;
    });
    
    const updatedItem: InventoryItem = {
      ...selectedItem,
      name: editItemName.trim(),
      description: editItemDescription.trim() || undefined,
      category: editItemCategory,
      tags: editItemTags.split(',').map(t => t.trim()).filter(t => t),
      unit: editItemUnit,
      productUrl: editItemUrl.trim() || undefined,
      lowStockThreshold: parseInt(editItemThreshold) || 10,
      imageUrl: editItemImage || undefined,
      barcode: editItemBarcode,
      locationQuantities: newLocationQuantities,
      totalQuantity: newTotal,
      updatedAt: new Date(),
    };
    
    setItems(prev => prev.map(item => 
      item.id === selectedItem.id ? updatedItem : item
    ));
    
    setSelectedItem(updatedItem);
    setShowEditItem(false);
    Alert.alert('Success', 'Product updated successfully');
  };
  
  // Reset edit form
  const resetEditForm = () => {
    setEditItemName('');
    setEditItemDescription('');
    setEditItemCategory('');
    setEditItemTags('');
    setEditItemUnit('Pcs');
    setEditItemUrl('');
    setEditItemThreshold('');
    setEditItemImage(null);
    setEditItemBarcode('');
    setEditLocationQuantities({});
    setShowEditUnitDropdown(false);
  };
  
  // Start editing tool - populate form with current values
  const startEditTool = () => {
    if (!selectedTool) return;
    
    setEditToolName(selectedTool.name);
    setEditToolDescription(selectedTool.description || '');
    setEditToolSerialNumber(selectedTool.serialNumber || '');
    setEditToolTags(selectedTool.tags.join(', '));
    setEditToolBarcode(selectedTool.barcode);
    setEditToolImage(selectedTool.imageUrl || null);
    setEditToolLocation(selectedTool.currentLocationId);
    setEditToolStatus(selectedTool.status);
    
    setShowEditTool(true);
  };
  
  // Pick image for edit tool
  const pickEditToolImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant camera roll permissions to add images');
          return;
        }
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: Platform.OS === 'web',
      });
      
      if (!result.canceled && result.assets[0]) {
        if (Platform.OS === 'web' && result.assets[0].base64) {
          setEditToolImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        } else {
          setEditToolImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  // Generate new tool barcode
  const generateNewToolBarcode = () => {
    const newBarcode = String(Math.floor(Math.random() * 9000000) + 2000000);
    setEditToolBarcode(newBarcode);
  };
  
  // Save edited tool
  const handleSaveToolEdit = () => {
    if (!selectedTool || !editToolName.trim()) {
      Alert.alert('Error', 'Please fill in required fields (Name)');
      return;
    }
    
    const updatedTool: Tool = {
      ...selectedTool,
      name: editToolName.trim(),
      description: editToolDescription.trim() || undefined,
      serialNumber: editToolSerialNumber.trim() || undefined,
      tags: editToolTags.split(',').map(t => t.trim()).filter(t => t),
      barcode: editToolBarcode,
      imageUrl: editToolImage || undefined,
      currentLocationId: editToolLocation,
      status: editToolStatus,
    };
    
    setTools(prev => prev.map(tool => 
      tool.id === selectedTool.id ? updatedTool : tool
    ));
    
    setSelectedTool(updatedTool);
    setShowEditTool(false);
    Alert.alert('Success', 'Tool updated successfully');
  };
  
  // Reset edit tool form
  const resetEditToolForm = () => {
    setEditToolName('');
    setEditToolDescription('');
    setEditToolSerialNumber('');
    setEditToolTags('');
    setEditToolBarcode('');
    setEditToolImage(null);
    setEditToolLocation('');
    setEditToolStatus('available');
  };
  
  // Start editing transaction (long press)
  const startEditTransaction = (transaction: InventoryTransaction) => {
    setSelectedTransaction(transaction);
    setEditTransQuantity(String(transaction.quantity));
    setEditTransNotes(transaction.notes || '');
    setEditTransLocation(transaction.locationId);
    setEditTransType(transaction.type);
    setShowEditTransaction(true);
  };
  
  // Save edited transaction
  const handleSaveTransactionEdit = () => {
    if (!selectedTransaction) return;
    
    const qty = parseInt(editTransQuantity);
    if (!qty || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    
    const location = locations.find(l => l.id === editTransLocation);
    
    const updatedTransaction: InventoryTransaction = {
      ...selectedTransaction,
      type: editTransType,
      quantity: qty,
      notes: editTransNotes.trim() || undefined,
      locationId: editTransLocation,
      locationName: location?.name || selectedTransaction.locationName,
    };
    
    setInventoryTransactions(prev => prev.map(t => 
      t.id === selectedTransaction.id ? updatedTransaction : t
    ));
    
    setShowEditTransaction(false);
    setSelectedTransaction(null);
    Alert.alert('Success', 'Transaction updated successfully');
  };
  
  // Delete transaction
  const handleDeleteTransaction = () => {
    if (!selectedTransaction) return;
    
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setInventoryTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));
            setShowEditTransaction(false);
            setSelectedTransaction(null);
          }
        },
      ]
    );
  };
  
  // Reset edit transaction form
  const resetEditTransactionForm = () => {
    setSelectedTransaction(null);
    setEditTransQuantity('');
    setEditTransNotes('');
    setEditTransLocation('');
    setEditTransType('pickup');
  };
  
  // Start editing checkout record (long press)
  const startEditCheckout = (record: CheckoutRecord) => {
    setSelectedCheckoutRecord(record);
    setEditCheckoutNotes(record.notes || '');
    setEditCheckoutStatus(record.status);
    setEditCheckoutDate(new Date(record.checkoutDate));
    setEditExpectedReturn(new Date(record.expectedReturnDate));
    setEditActualReturn(record.actualReturnDate ? new Date(record.actualReturnDate) : null);
    setShowEditCheckout(true);
  };
  
  // Open calendar for date selection
  const openCalendarForField = (field: 'checkout' | 'expected' | 'actual') => {
    setCalendarDateField(field);
    setShowCalendarModal(true);
  };
  
  // Handle date selection from calendar
  const handleDateSelect = (day: { dateString: string }) => {
    const selectedDate = new Date(day.dateString);
    
    switch (calendarDateField) {
      case 'checkout':
        setEditCheckoutDate(selectedDate);
        break;
      case 'expected':
        setEditExpectedReturn(selectedDate);
        break;
      case 'actual':
        setEditActualReturn(selectedDate);
        break;
    }
    
    setShowCalendarModal(false);
  };
  
  // Format date for calendar (YYYY-MM-DD)
  const formatDateForCalendar = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Save edited checkout record
  const handleSaveCheckoutEdit = () => {
    if (!selectedCheckoutRecord) return;
    
    const updatedRecord: CheckoutRecord = {
      ...selectedCheckoutRecord,
      notes: editCheckoutNotes.trim() || undefined,
      status: editCheckoutStatus,
      checkoutDate: editCheckoutDate,
      expectedReturnDate: editExpectedReturn,
      actualReturnDate: editCheckoutStatus === 'returned' 
        ? (editActualReturn || new Date()) 
        : editActualReturn,
    };
    
    setCheckoutRecords(prev => prev.map(r => 
      r.id === selectedCheckoutRecord.id ? updatedRecord : r
    ));
    
    // Also update the tool status if returning
    if (editCheckoutStatus === 'returned' && selectedCheckoutRecord.status !== 'returned') {
      setTools(prev => prev.map(t => 
        t.id === selectedCheckoutRecord.toolId 
          ? { ...t, status: 'available' as const, checkedOutBy: undefined, checkedOutDate: undefined, expectedReturnDate: undefined }
          : t
      ));
    }
    
    setShowEditCheckout(false);
    setSelectedCheckoutRecord(null);
    Alert.alert('Success', 'Checkout record updated successfully');
  };
  
  // Delete checkout record
  const handleDeleteCheckout = () => {
    if (!selectedCheckoutRecord) return;
    
    Alert.alert(
      'Delete Checkout Record',
      'Are you sure you want to delete this checkout record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setCheckoutRecords(prev => prev.filter(r => r.id !== selectedCheckoutRecord.id));
            setShowEditCheckout(false);
            setSelectedCheckoutRecord(null);
          }
        },
      ]
    );
  };
  
  // Reset edit checkout form
  const resetEditCheckoutForm = () => {
    setSelectedCheckoutRecord(null);
    setEditCheckoutNotes('');
    setEditCheckoutStatus('active');
    setEditCheckoutDate(new Date());
    setEditExpectedReturn(new Date());
    setEditActualReturn(null);
  };
  
  // Reset form
  const resetItemForm = () => {
    setNewItemName('');
    setNewItemDescription('');
    setNewItemCategory('');
    setNewItemQuantity('');
    setNewItemThreshold('');
    setNewItemUnit('Pcs');
    setNewItemTags('');
    setNewItemUrl('');
    setNewItemImage(null);
  };
  
  // Get location by ID
  const getLocation = (id: string) => locations.find(l => l.id === id);
  
  // Get user by ID
  const getUser = (id: string) => USERS.find(u => u.id === id);
  
  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ============= RENDER TABS =============
  
  // Products Tab
  const renderProductsTab = () => (
    <View style={styles.tabContent}>
      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.name && styles.categoryChipActive,
              { borderColor: cat.color }
            ]}
            onPress={() => setSelectedCategory(cat.name)}
            onLongPress={() => handleCategoryLongPress(cat)}
            delayLongPress={500}
          >
            <Ionicons name={cat.icon as any} size={14} color={selectedCategory === cat.name ? '#FFFFFF' : cat.color} />
            <Text style={[
              styles.categoryChipText,
              selectedCategory === cat.name && styles.categoryChipTextActive
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
        {/* Add Category Button */}
        <TouchableOpacity
          style={styles.addCategoryChip}
          onPress={() => setShowAddCategoryModal(true)}
        >
          <Ionicons name="add" size={16} color="#0EA5E9" />
          <Text style={styles.addCategoryChipText}>Add</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Items List */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => {
              setSelectedItem(item);
              setShowItemDetail(true);
            }}
          >
            {/* Product Image */}
            <View style={styles.productCardImage}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.productCardImg} resizeMode="cover" />
              ) : (
                <View style={[styles.productCardImgPlaceholder, { backgroundColor: categories.find(c => c.name === item.category)?.color + '15' }]}>
                  <Ionicons
                    name={categories.find(c => c.name === item.category)?.icon as any || 'cube'}
                    size={32}
                    color={categories.find(c => c.name === item.category)?.color || '#94A3B8'}
                  />
                </View>
              )}
            </View>
            
            {/* Product Info */}
            <View style={styles.productCardInfo}>
              <Text style={styles.productCardName} numberOfLines={2}>{item.name}</Text>
              
              <View style={styles.productCardFooter}>
                <View style={[styles.productCardCategory, { backgroundColor: categories.find(c => c.name === item.category)?.color + '15' }]}>
                  <Text style={[styles.productCardCategoryText, { color: categories.find(c => c.name === item.category)?.color }]}>
                    {item.category}
                  </Text>
                </View>
                <Text style={styles.productCardBarcode}>#{item.barcode}</Text>
              </View>
            </View>
            
            {/* Quantity Box */}
            <View style={[
              styles.productCardQtyBox,
              item.totalQuantity <= item.lowStockThreshold && styles.productCardQtyBoxLow
            ]}>
              {item.totalQuantity <= item.lowStockThreshold && (
                <Ionicons name="warning" size={14} color="#EF4444" style={styles.productCardQtyWarning} />
              )}
              <Text style={[
                styles.productCardQtyValue,
                item.totalQuantity <= item.lowStockThreshold && styles.productCardQtyValueLow
              ]}>
                {item.totalQuantity}
              </Text>
              <Text style={[
                styles.productCardQtyUnit,
                item.totalQuantity <= item.lowStockThreshold && styles.productCardQtyUnitLow
              ]}>
                {item.unit}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        }
      />
    </View>
  );
  
  // Tools Tab
  const renderToolsTab = () => (
    <View style={styles.tabContent}>
      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
        <TouchableOpacity
          style={[styles.categoryChip, selectedLocation === 'all' && styles.categoryChipActive]}
          onPress={() => setSelectedLocation('all')}
        >
          <Text style={[styles.categoryChipText, selectedLocation === 'all' && styles.categoryChipTextActive]}>
            All Tools
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryChip, selectedLocation === 'available' && styles.categoryChipActive]}
          onPress={() => setSelectedLocation('available')}
        >
          <Ionicons name="checkmark-circle" size={14} color={selectedLocation === 'available' ? '#FFFFFF' : '#10B981'} />
          <Text style={[styles.categoryChipText, selectedLocation === 'available' && styles.categoryChipTextActive]}>
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryChip, selectedLocation === 'checked-out' && styles.categoryChipActive]}
          onPress={() => setSelectedLocation('checked-out')}
        >
          <Ionicons name="person" size={14} color={selectedLocation === 'checked-out' ? '#FFFFFF' : '#F59E0B'} />
          <Text style={[styles.categoryChipText, selectedLocation === 'checked-out' && styles.categoryChipTextActive]}>
            Checked Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Tools List */}
      <FlatList
        data={filteredTools.filter(t => 
          selectedLocation === 'all' || t.status === selectedLocation
        )}
        keyExtractor={tool => tool.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item: tool }) => (
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => {
              setSelectedTool(tool);
              setShowToolDetail(true);
            }}
          >
            <View style={styles.toolCardWithImage}>
              {/* Tool Image */}
              {tool.imageUrl ? (
                <Image source={{ uri: tool.imageUrl }} style={styles.toolCardImage} />
              ) : (
                <View style={styles.toolCardImagePlaceholder}>
                  <Ionicons name="construct-outline" size={28} color="#94A3B8" />
                </View>
              )}
              
              <View style={styles.toolCardContent}>
                <View style={styles.toolCardHeader}>
                  <View style={[
                    styles.toolStatusIndicator,
                    tool.status === 'available' && { backgroundColor: '#10B981' },
                    tool.status === 'checked-out' && { backgroundColor: '#F59E0B' },
                    tool.status === 'maintenance' && { backgroundColor: '#EF4444' },
                  ]} />
                  <View style={styles.toolInfo}>
                    <Text style={styles.toolName}>{tool.name}</Text>
                    <Text style={styles.toolSerial}>S/N: {tool.serialNumber}</Text>
                  </View>
                  <View style={[
                    styles.toolStatusBadge,
                    tool.status === 'available' && { backgroundColor: '#D1FAE5' },
                    tool.status === 'checked-out' && { backgroundColor: '#FEF3C7' },
                    tool.status === 'maintenance' && { backgroundColor: '#FEE2E2' },
                  ]}>
                    <Text style={[
                      styles.toolStatusText,
                      tool.status === 'available' && { color: '#10B981' },
                      tool.status === 'checked-out' && { color: '#F59E0B' },
                      tool.status === 'maintenance' && { color: '#EF4444' },
                    ]}>
                      {tool.status === 'checked-out' ? 'In Use' : tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
                    </Text>
                  </View>
                </View>
            
                {tool.status === 'checked-out' && tool.checkedOutBy && (
                  <View style={styles.toolCheckoutInfo}>
                    <Ionicons name="person-outline" size={14} color="#64748B" />
                    <Text style={styles.toolCheckoutText}>
                      {getUser(tool.checkedOutBy)?.name} • Returns {tool.expectedReturnDate ? formatDate(tool.expectedReturnDate) : 'TBD'}
                    </Text>
                  </View>
                )}
                
                <View style={styles.toolLocation}>
                  <Ionicons name="location-outline" size={14} color="#64748B" />
                  <Text style={styles.toolLocationText}>
                    {getLocation(tool.currentLocationId)?.name || 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No tools found</Text>
          </View>
        }
      />
    </View>
  );
  
  // Locations Tab
  const renderLocationsTab = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={locations}
        keyExtractor={loc => loc.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item: loc }) => {
          // Count unique items that have stock at this location
          const itemCount = items.filter(item => (item.locationQuantities[loc.id] || 0) > 0).length;
          const toolCount = tools.filter(t => t.currentLocationId === loc.id).length;
          
          return (
            <TouchableOpacity
              style={styles.locationCard}
              onPress={() => {
                setSelectedLocationForDetail(loc);
                setLocationDetailTab('items');
                setLocationSearchQuery('');
                setShowLocationDetail(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.locationHeader}>
                <View style={[styles.locationIcon, { backgroundColor: loc.color + '20' }]}>
                  <Ionicons
                    name={loc.type === 'Warehouse' ? 'business' : loc.type === 'Van' ? 'car' : 'location'}
                    size={24}
                    color={loc.color}
                  />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{loc.name}</Text>
                  <Text style={styles.locationType}>{loc.type}</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
              </View>
              
              <View style={styles.locationStats}>
                <View style={styles.locationStat}>
                  <Ionicons name="cube-outline" size={18} color="#3B82F6" />
                  <Text style={styles.locationStatValue}>{itemCount}</Text>
                  <Text style={styles.locationStatLabel}>Items</Text>
                </View>
                <View style={styles.locationStat}>
                  <Ionicons name="construct-outline" size={18} color="#10B981" />
                  <Text style={styles.locationStatValue}>{toolCount}</Text>
                  <Text style={styles.locationStatLabel}>Tools</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.addLocationBtn}
            onPress={() => setShowAddLocation(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#0EA5E9" />
            <Text style={styles.addLocationText}>Add New Location</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
  
  // Alerts Tab
  const renderAlertsTab = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={lowStockAlerts}
        keyExtractor={alert => alert.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item: alert }) => (
          <View style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <Ionicons name="warning" size={24} color="#EF4444" />
            </View>
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>Low Stock Alert</Text>
              <Text style={styles.alertItem}>{alert.itemName}</Text>
              <Text style={styles.alertDetail}>
                Current: {alert.currentQuantity} • Threshold: {alert.threshold}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.alertActionBtn}
              onPress={() => {
                const item = items.find(i => i.id === alert.itemId);
                if (item) {
                  setSelectedItem(item);
                  setShowItemDetail(true);
                }
              }}
            >
              <Text style={styles.alertActionText}>View</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
            <Text style={styles.emptyText}>No alerts</Text>
            <Text style={styles.emptySubtext}>All inventory levels are healthy</Text>
          </View>
        }
      />
    </View>
  );
  
  // History Tab
  // Format timestamp for history
  const formatTimestamp = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHistoryTab = () => {
    // Combine inventory transactions and checkout records
    const allHistory = [
      ...inventoryTransactions.map(t => ({ ...t, historyType: 'transaction' as const })),
      ...checkoutRecords.map(r => ({ ...r, historyType: 'checkout' as const })),
    ].sort((a, b) => {
      const dateA = 'timestamp' in a ? new Date(a.timestamp) : new Date(a.checkoutDate);
      const dateB = 'timestamp' in b ? new Date(b.timestamp) : new Date(b.checkoutDate);
      return dateB.getTime() - dateA.getTime();
    });

    return (
      <View style={styles.tabContent}>
        <FlatList
          data={allHistory}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            if (item.historyType === 'transaction') {
              const trans = item as InventoryTransaction & { historyType: 'transaction' };
              return (
                <TouchableOpacity 
                  style={styles.transactionHistoryCard}
                  onLongPress={() => startEditTransaction(trans)}
                  delayLongPress={500}
                  activeOpacity={0.8}
                >
                  {/* Product Image */}
                  <View style={styles.transactionHistoryImageContainer}>
                    {trans.itemImageUrl ? (
                      <Image source={{ uri: trans.itemImageUrl }} style={styles.transactionHistoryImage} />
                    ) : (
                      <View style={[styles.transactionHistoryImage, styles.transactionHistoryImagePlaceholder]}>
                        <Ionicons name="cube-outline" size={20} color="#94A3B8" />
                      </View>
                    )}
                    <View style={[
                      styles.transactionTypeIndicator,
                      trans.type === 'pickup' ? { backgroundColor: '#F59E0B' } : { backgroundColor: '#10B981' }
                    ]}>
                      <Ionicons 
                        name={trans.type === 'pickup' ? 'arrow-up' : 'arrow-down'} 
                        size={12} 
                        color="#FFFFFF" 
                      />
                    </View>
                  </View>
                  
                  {/* Transaction Info */}
                  <View style={styles.transactionHistoryInfo}>
                    <View style={styles.transactionHistoryHeader}>
                      <Text style={styles.transactionHistoryItemName}>{trans.itemName}</Text>
                      <View style={[
                        styles.transactionTypeBadge,
                        trans.type === 'pickup' ? { backgroundColor: '#FEF3C7' } : { backgroundColor: '#D1FAE5' }
                      ]}>
                        <Text style={[
                          styles.transactionTypeBadgeText,
                          trans.type === 'pickup' ? { color: '#F59E0B' } : { color: '#10B981' }
                        ]}>
                          {trans.type === 'pickup' ? 'Picked Up' : 'Restocked'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.transactionHistoryDetails}>
                      <View style={styles.transactionHistoryDetailRow}>
                        <Ionicons name="layers-outline" size={14} color="#64748B" />
                        <Text style={styles.transactionHistoryDetailText}>
                          {trans.quantity} {trans.itemUnit}
                        </Text>
                      </View>
                      <View style={styles.transactionHistoryDetailRow}>
                        <Ionicons name="location-outline" size={14} color="#64748B" />
                        <Text style={styles.transactionHistoryDetailText}>
                          {trans.type === 'pickup' ? 'From: ' : 'To: '}{trans.locationName}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.transactionHistoryFooter}>
                      <View style={styles.transactionHistoryUser}>
                        <Ionicons name="person-circle-outline" size={16} color="#64748B" />
                        <Text style={styles.transactionHistoryUserText}>By: {trans.performedByName}</Text>
                      </View>
                      <Text style={styles.transactionHistoryTime}>{formatTimestamp(trans.timestamp)}</Text>
                    </View>
                    
                    {trans.notes && (
                      <View style={styles.transactionHistoryNotes}>
                        <Ionicons name="document-text-outline" size={12} color="#94A3B8" />
                        <Text style={styles.transactionHistoryNotesText}>{trans.notes}</Text>
                      </View>
                    )}
                    
                    {/* Long press hint */}
                    <Text style={styles.longPressHint}>Long press to edit</Text>
                  </View>
                </TouchableOpacity>
              );
            } else {
              const record = item as CheckoutRecord & { historyType: 'checkout' };
              const tool = tools.find(t => t.id === record.toolId);
              return (
                <TouchableOpacity 
                  style={styles.historyCard}
                  onLongPress={() => startEditCheckout(record)}
                  delayLongPress={500}
                  activeOpacity={0.8}
                >
                  {/* Tool Image */}
                  <View style={styles.historyToolImageContainer}>
                    {tool?.imageUrl ? (
                      <Image source={{ uri: tool.imageUrl }} style={styles.historyToolImage} />
                    ) : (
                      <View style={[styles.historyToolImage, styles.historyToolImagePlaceholder]}>
                        <Ionicons name="construct-outline" size={20} color="#94A3B8" />
                      </View>
                    )}
                    <View style={[
                      styles.historyToolStatusIndicator,
                      record.status === 'active' && { backgroundColor: '#F59E0B' },
                      record.status === 'returned' && { backgroundColor: '#10B981' },
                      record.status === 'overdue' && { backgroundColor: '#EF4444' },
                    ]}>
                      <Ionicons 
                        name={record.status === 'returned' ? 'checkmark' : 'time'} 
                        size={10} 
                        color="#FFFFFF" 
                      />
                    </View>
                  </View>
                  
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyToolName}>{record.toolName}</Text>
                    <Text style={styles.historyUser}>
                      <Ionicons name="person-outline" size={12} color="#64748B" /> {record.userName}
                    </Text>
                    <View style={styles.historyDates}>
                      <Text style={styles.historyDate}>
                        Out: {formatDate(record.checkoutDate)}
                      </Text>
                      <Text style={styles.historyDate}>
                        {record.actualReturnDate 
                          ? `Returned: ${formatDate(record.actualReturnDate)}`
                          : `Due: ${formatDate(record.expectedReturnDate)}`
                        }
                      </Text>
                    </View>
                    
                    {/* Long press hint */}
                    <Text style={styles.longPressHint}>Long press to edit</Text>
                  </View>
                  <View style={[
                    styles.historyStatusBadge,
                    record.status === 'active' && { backgroundColor: '#FEF3C7' },
                    record.status === 'returned' && { backgroundColor: '#D1FAE5' },
                    record.status === 'overdue' && { backgroundColor: '#FEE2E2' },
                  ]}>
                    <Text style={[
                      styles.historyStatusText,
                      record.status === 'active' && { color: '#F59E0B' },
                      record.status === 'returned' && { color: '#10B981' },
                      record.status === 'overdue' && { color: '#EF4444' },
                    ]}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No history yet</Text>
              <Text style={styles.emptySubText}>Pickup and restock activities will appear here</Text>
            </View>
          }
        />
      </View>
    );
  };

  // ============= MAIN RENDER =============
  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#F59E0B', '#F97316']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}
        >
          <Ionicons name="barcode-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items, tools, barcodes..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabBar}>
        {[
          { id: 'products', icon: 'cube', label: 'Products' },
          { id: 'tools', icon: 'construct', label: 'Tools' },
          { id: 'locations', icon: 'location', label: 'Locations' },
          { id: 'alerts', icon: 'warning', label: 'Alerts', badge: lowStockAlerts.length },
          { id: 'history', icon: 'time', label: 'History' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id as TabType)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? '#F59E0B' : '#64748B'}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {tab.badge && tab.badge > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tab.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Tab Content */}
      {activeTab === 'products' && renderProductsTab()}
      {activeTab === 'tools' && renderToolsTab()}
      {activeTab === 'locations' && renderLocationsTab()}
      {activeTab === 'alerts' && renderAlertsTab()}
      {activeTab === 'history' && renderHistoryTab()}
      
      {/* FAB - Only show on Products, Tools, Locations tabs */}
      {activeTab !== 'alerts' && activeTab !== 'history' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (activeTab === 'products') setShowAddItem(true);
            else if (activeTab === 'tools') setShowAddTool(true);
            else if (activeTab === 'locations') setShowAddLocation(true);
          }}
        >
          <LinearGradient
            colors={['#F59E0B', '#F97316']}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
      
      {/* Scanner Modal */}
      <Modal visible={showScanner} animationType="slide">
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setShowScanner(false)}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Barcode</Text>
            <View style={{ width: 28 }} />
          </View>
          
          {permission?.granted ? (
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
              }}
              onBarcodeScanned={(result) => {
                if (result.data) {
                  handleBarcodeScan(result.data);
                }
              }}
            >
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame}>
                  <View style={[styles.scanCorner, styles.scanCornerTL]} />
                  <View style={[styles.scanCorner, styles.scanCornerTR]} />
                  <View style={[styles.scanCorner, styles.scanCornerBL]} />
                  <View style={[styles.scanCorner, styles.scanCornerBR]} />
                </View>
                <Text style={styles.scanHint}>Position barcode within frame</Text>
              </View>
            </CameraView>
          ) : (
            <View style={styles.permissionContainer}>
              <Ionicons name="camera-outline" size={64} color="#64748B" />
              <Text style={styles.permissionText}>Camera permission required</Text>
              <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
      
      {/* Add Item Modal */}
      <Modal visible={showAddItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Product</Text>
              <TouchableOpacity onPress={() => { setShowAddItem(false); resetItemForm(); setScannedBarcode(null); }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Product Image */}
              <TouchableOpacity
                style={styles.productImagePicker}
                onPress={() => {
                  // On web, directly open file picker since camera is not available
                  if (Platform.OS === 'web') {
                    pickProductImage();
                  } else {
                    Alert.alert(
                      'Add Product Image',
                      'Choose an option',
                      [
                        { text: 'Take Photo', onPress: takeProductPhoto },
                        { text: 'Choose from Library', onPress: pickProductImage },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }
                }}
              >
                {newItemImage ? (
                  <Image source={{ uri: newItemImage }} style={styles.productImagePreview} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="camera-outline" size={40} color="#94A3B8" />
                    <Text style={styles.productImagePlaceholderText}>Add Image</Text>
                  </View>
                )}
                {newItemImage && (
                  <TouchableOpacity
                    style={styles.productImageRemove}
                    onPress={() => setNewItemImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter product name"
                value={newItemName}
                onChangeText={setNewItemName}
              />
              
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Product description"
                value={newItemDescription}
                onChangeText={setNewItemDescription}
                multiline
              />
              
              <Text style={styles.inputLabel}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelect}>
                {categories.filter(c => c.name !== 'Tools').map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      newItemCategory === cat.name && { backgroundColor: cat.color, borderColor: cat.color }
                    ]}
                    onPress={() => setNewItemCategory(cat.name)}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={16}
                      color={newItemCategory === cat.name ? '#FFFFFF' : cat.color}
                    />
                    <Text style={[
                      styles.categoryOptionText,
                      newItemCategory === cat.name && { color: '#FFFFFF' }
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Quantity and Unit */}
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={newItemQuantity}
                    onChangeText={setNewItemQuantity}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TouchableOpacity
                    style={styles.unitDropdownBtn}
                    onPress={() => setShowUnitDropdown(!showUnitDropdown)}
                  >
                    <Text style={styles.unitDropdownText}>{newItemUnit}</Text>
                    <Ionicons name={showUnitDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#64748B" />
                  </TouchableOpacity>
                  {showUnitDropdown && (
                    <View style={styles.unitDropdownList}>
                      {unitTypes.map(ut => (
                        <TouchableOpacity
                          key={ut.id}
                          style={[styles.unitDropdownItem, newItemUnit === ut.name && styles.unitDropdownItemActive]}
                          onPress={() => {
                            setNewItemUnit(ut.name);
                            setShowUnitDropdown(false);
                          }}
                        >
                          <Text style={[styles.unitDropdownItemText, newItemUnit === ut.name && styles.unitDropdownItemTextActive]}>
                            {ut.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={styles.unitDropdownAdd}
                        onPress={() => {
                          setShowUnitDropdown(false);
                          setShowAddUnitModal(true);
                        }}
                      >
                        <Ionicons name="add" size={18} color="#0EA5E9" />
                        <Text style={styles.unitDropdownAddText}>Add Unit</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
              
              <Text style={styles.inputLabel}>URL</Text>
              <TextInput
                style={styles.input}
                placeholder="Product URL (optional)"
                value={newItemUrl}
                onChangeText={setNewItemUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              
              <Text style={styles.inputLabel}>Low Stock Threshold</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                keyboardType="numeric"
                value={newItemThreshold}
                onChangeText={setNewItemThreshold}
              />
              
              <Text style={styles.inputLabel}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="tag1, tag2, tag3"
                value={newItemTags}
                onChangeText={setNewItemTags}
              />
              
              {/* Barcode Section */}
              {scannedBarcode && (
                <View style={styles.scannedBarcodeContainer}>
                  <BarcodeDisplay value={scannedBarcode} width={200} height={70} />
                </View>
              )}
              
              <TouchableOpacity style={styles.generateBarcodeBtn} onPress={() => {
                const barcode = generateBarcode('item');
                setScannedBarcode(barcode);
              }}>
                <Ionicons name="barcode-outline" size={20} color="#F59E0B" />
                <Text style={styles.generateBarcodeText}>Generate Barcode</Text>
              </TouchableOpacity>
            </ScrollView>
            
            <TouchableOpacity style={styles.saveButton} onPress={handleAddItem}>
              <Text style={styles.saveButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Add Tool Modal */}
      <Modal visible={showAddTool} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Tool</Text>
              <TouchableOpacity onPress={() => { setShowAddTool(false); resetItemForm(); setScannedBarcode(null); }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {scannedBarcode && (
                <View style={styles.scannedBarcodeContainer}>
                  <BarcodeDisplay value={scannedBarcode} width={200} height={70} />
                </View>
              )}
              
              <Text style={styles.inputLabel}>Tool Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Tool name"
                value={newItemName}
                onChangeText={setNewItemName}
              />
              
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                value={newItemDescription}
                onChangeText={setNewItemDescription}
                multiline
              />
              
              <Text style={styles.inputLabel}>Category *</Text>
              <TouchableOpacity
                style={[styles.categoryOption, { backgroundColor: '#10B981', borderColor: '#10B981' }]}
                onPress={() => setNewItemCategory('Tools')}
              >
                <Ionicons name="construct" size={16} color="#FFFFFF" />
                <Text style={[styles.categoryOptionText, { color: '#FFFFFF' }]}>Tools</Text>
              </TouchableOpacity>
              
              <Text style={styles.inputLabel}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="tag1, tag2, tag3"
                value={newItemTags}
                onChangeText={setNewItemTags}
              />
              
              <TouchableOpacity style={styles.generateBarcodeBtn} onPress={() => {
                const barcode = generateBarcode('tool');
                setScannedBarcode(barcode);
              }}>
                <Ionicons name="barcode-outline" size={20} color="#F59E0B" />
                <Text style={styles.generateBarcodeText}>Generate Barcode</Text>
              </TouchableOpacity>
            </ScrollView>
            
            <TouchableOpacity style={styles.saveButton} onPress={handleAddTool}>
              <Text style={styles.saveButtonText}>Add Tool</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Add Location Modal */}
      <Modal visible={showAddLocation} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Location</Text>
              <TouchableOpacity onPress={() => {
                setShowAddLocation(false);
                setNewLocationName('');
                setNewLocationColor('#3B82F6');
                setNewLocationIcon('business');
                setNewLocationType('warehouse');
              }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Location Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Van 3, Storage Room"
                value={newLocationName}
                onChangeText={setNewLocationName}
              />
              
              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorPicker}>
                {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280'].map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newLocationColor === color && styles.colorOptionActive
                    ]}
                    onPress={() => setNewLocationColor(color)}
                  >
                    {newLocationColor === color && (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.inputLabel}>Icon</Text>
              <View style={styles.iconPicker}>
                {['business', 'car', 'briefcase', 'construct', 'home', 'storefront', 'cube', 'location', 'archive', 'file-tray-full'].map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      newLocationIcon === icon && { backgroundColor: newLocationColor + '20', borderColor: newLocationColor }
                    ]}
                    onPress={() => setNewLocationIcon(icon)}
                  >
                    <Ionicons
                      name={icon as any}
                      size={24}
                      color={newLocationIcon === icon ? newLocationColor : '#64748B'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.inputLabel}>Location Type</Text>
              <View style={styles.locationTypeGrid}>
                {locationTypes.map(lt => (
                  <TouchableOpacity
                    key={lt.id}
                    style={[
                      styles.locationTypeOption,
                      newLocationType === lt.name && { borderColor: newLocationColor, backgroundColor: newLocationColor + '10' }
                    ]}
                    onPress={() => setNewLocationType(lt.name)}
                    onLongPress={() => handleLocationTypeLongPress(lt)}
                    delayLongPress={500}
                  >
                    <Text style={[
                      styles.locationTypeText,
                      newLocationType === lt.name && { color: newLocationColor, fontWeight: '600' }
                    ]}>
                      {lt.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {/* Add Location Type Button */}
                <TouchableOpacity
                  style={styles.addLocationTypeBtn}
                  onPress={() => setShowAddLocationType(true)}
                >
                  <Ionicons name="add" size={18} color="#0EA5E9" />
                  <Text style={styles.addLocationTypeText}>Add</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.locationTypeHint}>Long-press to rename or delete</Text>
              
              {/* Preview */}
              <Text style={styles.inputLabel}>Preview</Text>
              <View style={styles.locationPreview}>
                <View style={[styles.locationPreviewCard, { borderLeftColor: newLocationColor }]}>
                  <View style={[styles.locationPreviewIcon, { backgroundColor: newLocationColor + '20' }]}>
                    <Ionicons name={newLocationIcon as any} size={24} color={newLocationColor} />
                  </View>
                  <View style={styles.locationPreviewInfo}>
                    <Text style={styles.locationPreviewName}>{newLocationName || 'Location Name'}</Text>
                    <Text style={styles.locationPreviewType}>
                      {newLocationType}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
            
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: newLocationColor }]} onPress={handleAddLocation}>
              <Text style={styles.saveButtonText}>Save Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Item Detail Modal */}
      <Modal visible={showItemDetail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Item Details</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.editIconBtn} onPress={startEditItem}>
                  <Ionicons name="pencil" size={20} color="#F59E0B" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowItemDetail(false); setSelectedItem(null); }}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
            
            {selectedItem && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Product Image - Tap for full size */}
                {selectedItem.imageUrl && (
                  <TouchableOpacity 
                    style={styles.itemDetailImageContainer}
                    onPress={() => setShowFullImage(true)}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={{ uri: selectedItem.imageUrl }} 
                      style={styles.itemDetailImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageExpandHint}>
                      <Ionicons name="expand-outline" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                )}
                
                {/* Barcode */}
                <TouchableOpacity
                  style={styles.itemDetailBarcode}
                  onPress={() => setShowBarcode(true)}
                >
                  <BarcodeDisplay value={selectedItem.barcode} width={220} height={80} />
                  <Text style={styles.tapToPrint}>Tap to view full size</Text>
                </TouchableOpacity>
                
                <Text style={styles.itemDetailName}>{selectedItem.name}</Text>
                {selectedItem.description && (
                  <Text style={styles.itemDetailDescription}>{selectedItem.description}</Text>
                )}
                
                {/* Category & Tags */}
                <View style={styles.itemDetailMeta}>
                  <View style={[styles.itemDetailCategory, { backgroundColor: categories.find(c => c.name === selectedItem.category)?.color + '20' }]}>
                    <Ionicons
                      name={categories.find(c => c.name === selectedItem.category)?.icon as any}
                      size={14}
                      color={categories.find(c => c.name === selectedItem.category)?.color}
                    />
                    <Text style={[styles.itemDetailCategoryText, { color: categories.find(c => c.name === selectedItem.category)?.color }]}>
                      {selectedItem.category}
                    </Text>
                  </View>
                  {selectedItem.tags.map(tag => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
                
                {/* Pickup / Restock Action Buttons */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.pickupButton]}
                    onPress={() => setShowPickupModal(true)}
                  >
                    <Ionicons name="arrow-up-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Picking up</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.restockButton]}
                    onPress={() => setShowRestockModal(true)}
                  >
                    <Ionicons name="arrow-down-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Restock</Text>
                  </TouchableOpacity>
                </View>
                
                {/* View Product Button - Links to product URL */}
                {selectedItem.productUrl && (
                  <TouchableOpacity 
                    style={styles.viewProductButton}
                    onPress={() => {
                      if (selectedItem.productUrl) {
                        Linking.openURL(selectedItem.productUrl).catch(() => {
                          Alert.alert('Error', 'Unable to open product URL');
                        });
                      }
                    }}
                  >
                    <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.viewProductButtonText}>View Product</Text>
                    <Ionicons name="open-outline" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
                
                {/* Total Quantity */}
                <View style={styles.itemDetailTotal}>
                  <Text style={styles.itemDetailTotalLabel}>Total Quantity</Text>
                  <Text style={[
                    styles.itemDetailTotalValue,
                    selectedItem.totalQuantity <= selectedItem.lowStockThreshold && { color: '#EF4444' }
                  ]}>
                    {selectedItem.totalQuantity} {selectedItem.unit}
                  </Text>
                  {selectedItem.totalQuantity <= selectedItem.lowStockThreshold && (
                    <View style={styles.lowStockWarning}>
                      <Ionicons name="warning" size={16} color="#EF4444" />
                      <Text style={styles.lowStockWarningText}>Below threshold ({selectedItem.lowStockThreshold})</Text>
                    </View>
                  )}
                </View>
                
                {/* Location Breakdown */}
                <Text style={styles.itemDetailSectionTitle}>Quantity by Location</Text>
                {locations.map(loc => {
                  const qty = selectedItem.locationQuantities[loc.id] || 0;
                  return (
                    <View key={loc.id} style={styles.locationQuantityRow}>
                      <View style={styles.locationQuantityInfo}>
                        <View style={[styles.locationDot, { backgroundColor: loc.color }]} />
                        <Text style={styles.locationQuantityName}>{loc.name}</Text>
                      </View>
                      <Text style={styles.locationQuantityValue}>{qty}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Pickup Modal */}
      <Modal visible={showPickupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.smallModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Picking Up</Text>
              <TouchableOpacity onPress={() => { setShowPickupModal(false); setPickupLocationId(''); setPickupQuantity(''); setTransactionNotes(''); }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {selectedItem && (
              <View style={styles.modalBody}>
                {/* Item Preview */}
                <View style={styles.transactionItemPreview}>
                  {selectedItem.imageUrl ? (
                    <Image source={{ uri: selectedItem.imageUrl }} style={styles.transactionItemImage} />
                  ) : (
                    <View style={[styles.transactionItemImage, styles.transactionItemPlaceholder]}>
                      <Ionicons name="cube-outline" size={24} color="#94A3B8" />
                    </View>
                  )}
                  <View style={styles.transactionItemInfo}>
                    <Text style={styles.transactionItemName}>{selectedItem.name}</Text>
                    <Text style={styles.transactionItemStock}>Available: {selectedItem.totalQuantity} {selectedItem.unit}</Text>
                  </View>
                </View>
                
                <Text style={styles.inputLabel}>From Location *</Text>
                <View style={styles.locationDropdown}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {locations.map(loc => {
                      const availableQty = selectedItem.locationQuantities[loc.id] || 0;
                      return (
                        <TouchableOpacity
                          key={loc.id}
                          style={[
                            styles.locationDropdownItem,
                            pickupLocationId === loc.id && { backgroundColor: loc.color, borderColor: loc.color }
                          ]}
                          onPress={() => setPickupLocationId(loc.id)}
                          disabled={availableQty === 0}
                        >
                          <View style={[styles.locationDot, { backgroundColor: pickupLocationId === loc.id ? '#FFFFFF' : loc.color }]} />
                          <Text style={[
                            styles.locationDropdownText,
                            pickupLocationId === loc.id && { color: '#FFFFFF' },
                            availableQty === 0 && { color: '#CBD5E1' }
                          ]}>
                            {loc.name} ({availableQty})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
                
                <Text style={styles.inputLabel}>Quantity ({selectedItem.unit}) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter quantity in ${selectedItem.unit}`}
                  value={pickupQuantity}
                  onChangeText={setPickupQuantity}
                  keyboardType="numeric"
                />
                
                <Text style={styles.inputLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, { height: 60 }]}
                  placeholder="Add any notes..."
                  value={transactionNotes}
                  onChangeText={setTransactionNotes}
                  multiline
                />
                
                <TouchableOpacity style={styles.confirmPickupButton} onPress={handlePickup}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>Confirm Pickup</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Restock Modal */}
      <Modal visible={showRestockModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.smallModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Restock</Text>
              <TouchableOpacity onPress={() => { setShowRestockModal(false); setRestockLocationId(''); setRestockQuantity(''); setTransactionNotes(''); }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {selectedItem && (
              <View style={styles.modalBody}>
                {/* Item Preview */}
                <View style={styles.transactionItemPreview}>
                  {selectedItem.imageUrl ? (
                    <Image source={{ uri: selectedItem.imageUrl }} style={styles.transactionItemImage} />
                  ) : (
                    <View style={[styles.transactionItemImage, styles.transactionItemPlaceholder]}>
                      <Ionicons name="cube-outline" size={24} color="#94A3B8" />
                    </View>
                  )}
                  <View style={styles.transactionItemInfo}>
                    <Text style={styles.transactionItemName}>{selectedItem.name}</Text>
                    <Text style={styles.transactionItemStock}>Current Stock: {selectedItem.totalQuantity} {selectedItem.unit}</Text>
                  </View>
                </View>
                
                <Text style={styles.inputLabel}>To Location *</Text>
                <View style={styles.locationDropdown}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {locations.map(loc => (
                      <TouchableOpacity
                        key={loc.id}
                        style={[
                          styles.locationDropdownItem,
                          restockLocationId === loc.id && { backgroundColor: loc.color, borderColor: loc.color }
                        ]}
                        onPress={() => setRestockLocationId(loc.id)}
                      >
                        <View style={[styles.locationDot, { backgroundColor: restockLocationId === loc.id ? '#FFFFFF' : loc.color }]} />
                        <Text style={[
                          styles.locationDropdownText,
                          restockLocationId === loc.id && { color: '#FFFFFF' }
                        ]}>
                          {loc.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                <Text style={styles.inputLabel}>Quantity ({selectedItem.unit}) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter quantity in ${selectedItem.unit}`}
                  value={restockQuantity}
                  onChangeText={setRestockQuantity}
                  keyboardType="numeric"
                />
                
                <Text style={styles.inputLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, { height: 60 }]}
                  placeholder="Add any notes..."
                  value={transactionNotes}
                  onChangeText={setTransactionNotes}
                  multiline
                />
                
                <TouchableOpacity style={styles.confirmRestockButton} onPress={handleRestock}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>Confirm Restock</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Edit Item Modal */}
      <Modal visible={showEditItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Product</Text>
              <TouchableOpacity onPress={() => { setShowEditItem(false); resetEditForm(); }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Product Image */}
              <TouchableOpacity
                style={styles.productImagePicker}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    pickEditImage();
                  } else {
                    Alert.alert(
                      'Edit Product Image',
                      'Choose an option',
                      [
                        { text: 'Choose from Library', onPress: pickEditImage },
                        { text: 'Remove Image', onPress: () => setEditItemImage(null), style: 'destructive' },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }
                }}
              >
                {editItemImage ? (
                  <Image source={{ uri: editItemImage }} style={styles.productImagePreview} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="camera-outline" size={40} color="#94A3B8" />
                    <Text style={styles.productImagePlaceholderText}>Add Image</Text>
                  </View>
                )}
                {editItemImage && (
                  <TouchableOpacity
                    style={styles.productImageRemove}
                    onPress={() => setEditItemImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              
              {/* Product Name */}
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter product name"
                value={editItemName}
                onChangeText={setEditItemName}
              />
              
              {/* Description */}
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Product description"
                value={editItemDescription}
                onChangeText={setEditItemDescription}
                multiline
              />
              
              {/* Tags */}
              <Text style={styles.inputLabel}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., outlet, decora, white"
                value={editItemTags}
                onChangeText={setEditItemTags}
              />
              
              {/* Category */}
              <Text style={styles.inputLabel}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelect}>
                {categories.filter(c => c.name !== 'Tools').map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      editItemCategory === cat.name && { backgroundColor: cat.color, borderColor: cat.color }
                    ]}
                    onPress={() => setEditItemCategory(cat.name)}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={16}
                      color={editItemCategory === cat.name ? '#FFFFFF' : cat.color}
                    />
                    <Text style={[
                      styles.categoryOptionText,
                      editItemCategory === cat.name && { color: '#FFFFFF' }
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Unit */}
              <Text style={styles.inputLabel}>Unit</Text>
              <TouchableOpacity
                style={styles.unitDropdownBtn}
                onPress={() => setShowEditUnitDropdown(!showEditUnitDropdown)}
              >
                <Text style={styles.unitDropdownBtnText}>{editItemUnit}</Text>
                <Ionicons name={showEditUnitDropdown ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
              </TouchableOpacity>
              {showEditUnitDropdown && (
                <View style={styles.unitDropdownList}>
                  {unitTypes.map(unit => (
                    <TouchableOpacity
                      key={unit.id}
                      style={[styles.unitDropdownItem, editItemUnit === unit.name && styles.unitDropdownItemActive]}
                      onPress={() => {
                        setEditItemUnit(unit.name);
                        setShowEditUnitDropdown(false);
                      }}
                    >
                      <Text style={[styles.unitDropdownItemText, editItemUnit === unit.name && styles.unitDropdownItemTextActive]}>
                        {unit.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {/* URL */}
              <Text style={styles.inputLabel}>Product URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                value={editItemUrl}
                onChangeText={setEditItemUrl}
                keyboardType="url"
              />
              
              {/* Low Stock Threshold */}
              <Text style={styles.inputLabel}>Low Stock Threshold</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 10"
                value={editItemThreshold}
                onChangeText={setEditItemThreshold}
                keyboardType="numeric"
              />
              
              {/* Barcode */}
              <Text style={styles.inputLabel}>Barcode</Text>
              <View style={styles.barcodeEditRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Barcode number"
                  value={editItemBarcode}
                  onChangeText={setEditItemBarcode}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.barcodeActionBtn} onPress={generateNewBarcode}>
                  <Ionicons name="refresh" size={18} color="#FFFFFF" />
                  <Text style={styles.barcodeActionBtnText}>New</Text>
                </TouchableOpacity>
              </View>
              
              {/* Quantity by Location */}
              <Text style={[styles.inputLabel, { marginTop: 20 }]}>Quantity by Location</Text>
              {locations.map(loc => (
                <View key={loc.id} style={styles.editLocationRow}>
                  <View style={styles.editLocationInfo}>
                    <View style={[styles.locationDot, { backgroundColor: loc.color }]} />
                    <Text style={styles.editLocationName}>{loc.name}</Text>
                  </View>
                  <TextInput
                    style={styles.editLocationInput}
                    value={editLocationQuantities[loc.id] || '0'}
                    onChangeText={(val) => setEditLocationQuantities(prev => ({ ...prev, [loc.id]: val }))}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              ))}
              
              {/* Save Button */}
              <TouchableOpacity style={styles.saveEditButton} onPress={handleSaveEdit}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Save Changes</Text>
              </TouchableOpacity>
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Tool Detail Modal */}
      <Modal visible={showToolDetail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tool Details</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.editIconBtn} onPress={startEditTool}>
                  <Ionicons name="pencil" size={20} color="#F59E0B" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowToolDetail(false); setSelectedTool(null); }}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
            
            {selectedTool && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Tool Image - Tap for full size */}
                {selectedTool.imageUrl && (
                  <TouchableOpacity 
                    style={styles.itemDetailImageContainer}
                    onPress={() => setShowFullToolImage(true)}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={{ uri: selectedTool.imageUrl }} 
                      style={styles.itemDetailImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageExpandHint}>
                      <Ionicons name="expand-outline" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                )}
                
                {/* Barcode */}
                <TouchableOpacity
                  style={styles.itemDetailBarcode}
                  onPress={() => setShowBarcode(true)}
                >
                  <BarcodeDisplay value={selectedTool.barcode} width={220} height={80} />
                  <Text style={styles.tapToPrint}>Tap to view full size</Text>
                </TouchableOpacity>
                
                <Text style={styles.itemDetailName}>{selectedTool.name}</Text>
                {selectedTool.description && (
                  <Text style={styles.itemDetailDescription}>{selectedTool.description}</Text>
                )}
                
                {/* Serial Number */}
                <View style={styles.toolDetailSerial}>
                  <Text style={styles.toolDetailSerialLabel}>Serial Number</Text>
                  <Text style={styles.toolDetailSerialValue}>{selectedTool.serialNumber}</Text>
                </View>
                
                {/* Status */}
                <View style={styles.toolDetailStatus}>
                  <Text style={styles.toolDetailStatusLabel}>Status</Text>
                  <View style={[
                    styles.toolDetailStatusBadge,
                    selectedTool.status === 'available' && { backgroundColor: '#D1FAE5' },
                    selectedTool.status === 'checked-out' && { backgroundColor: '#FEF3C7' },
                    selectedTool.status === 'maintenance' && { backgroundColor: '#FEE2E2' },
                  ]}>
                    <Text style={[
                      styles.toolDetailStatusText,
                      selectedTool.status === 'available' && { color: '#10B981' },
                      selectedTool.status === 'checked-out' && { color: '#F59E0B' },
                      selectedTool.status === 'maintenance' && { color: '#EF4444' },
                    ]}>
                      {selectedTool.status === 'checked-out' ? 'Checked Out' : selectedTool.status.charAt(0).toUpperCase() + selectedTool.status.slice(1)}
                    </Text>
                  </View>
                </View>
                
                {/* Checkout Info */}
                {selectedTool.status === 'checked-out' && selectedTool.checkedOutBy && (
                  <View style={styles.toolCheckoutDetail}>
                    <Ionicons name="person-circle-outline" size={40} color="#F59E0B" />
                    <View style={styles.toolCheckoutDetailInfo}>
                      <Text style={styles.toolCheckoutDetailUser}>
                        {getUser(selectedTool.checkedOutBy)?.name}
                      </Text>
                      <Text style={styles.toolCheckoutDetailDate}>
                        Since {selectedTool.checkedOutDate ? formatDate(selectedTool.checkedOutDate) : 'Unknown'}
                      </Text>
                      <Text style={styles.toolCheckoutDetailReturn}>
                        Expected return: {selectedTool.expectedReturnDate ? formatDate(selectedTool.expectedReturnDate) : 'TBD'}
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* Action Buttons */}
                <View style={styles.toolDetailActions}>
                  {selectedTool.status === 'available' && (
                    <TouchableOpacity
                      style={styles.checkoutBtn}
                      onPress={() => setShowCheckout(true)}
                    >
                      <Ionicons name="exit-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.checkoutBtnText}>Check Out</Text>
                    </TouchableOpacity>
                  )}
                  
                  {selectedTool.status === 'checked-out' && (
                    <TouchableOpacity
                      style={styles.checkinBtn}
                      onPress={() => setShowCheckin(true)}
                    >
                      <Ionicons name="enter-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.checkinBtnText}>Check In / Return</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Checkout Modal */}
      <Modal visible={showCheckout} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Check Out Tool</Text>
              <TouchableOpacity onPress={() => setShowCheckout(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {selectedTool && (
                <View style={styles.checkoutToolInfo}>
                  <Ionicons name="construct" size={24} color="#F59E0B" />
                  <Text style={styles.checkoutToolName}>{selectedTool.name}</Text>
                </View>
              )}
              
              <Text style={styles.inputLabel}>Assign To *</Text>
              <View style={styles.userSelect}>
                {USERS.map(user => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.userOption,
                      checkoutUser === user.id && styles.userOptionActive
                    ]}
                    onPress={() => setCheckoutUser(user.id)}
                  >
                    <Ionicons
                      name="person-circle"
                      size={32}
                      color={checkoutUser === user.id ? '#F59E0B' : '#94A3B8'}
                    />
                    <Text style={[
                      styles.userOptionText,
                      checkoutUser === user.id && styles.userOptionTextActive
                    ]}>
                      {user.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.inputLabel}>Duration (days)</Text>
              <TextInput
                style={styles.input}
                placeholder="7"
                keyboardType="numeric"
                value={checkoutDays}
                onChangeText={setCheckoutDays}
              />
              
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Optional notes..."
                value={checkoutNotes}
                onChangeText={setCheckoutNotes}
                multiline
              />
            </View>
            
            <TouchableOpacity style={styles.saveButton} onPress={handleCheckout}>
              <Text style={styles.saveButtonText}>Confirm Checkout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Checkin Confirmation Modal */}
      <Modal visible={showCheckin} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            <Text style={styles.confirmTitle}>Return Tool?</Text>
            <Text style={styles.confirmText}>
              Confirm that "{selectedTool?.name}" has been returned and is in good condition.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setShowCheckin(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmOkBtn}
                onPress={handleCheckin}
              >
                <Text style={styles.confirmOkText}>Confirm Return</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Full Size Barcode Modal */}
      <Modal visible={showBarcode} transparent animationType="fade">
        <View style={styles.barcodeModalOverlay}>
          <View style={styles.barcodeModalContent}>
            <Text style={styles.barcodeModalTitle}>
              {selectedItem?.name || selectedTool?.name}
            </Text>
            <View style={styles.barcodeModalBarcode}>
              <BarcodeDisplay
                value={selectedItem?.barcode || selectedTool?.barcode || ''}
                width={300}
                height={120}
              />
            </View>
            <Text style={styles.barcodeModalHint}>
              Screenshot this to print
            </Text>
            <TouchableOpacity
              style={styles.barcodeModalClose}
              onPress={() => setShowBarcode(false)}
            >
              <Text style={styles.barcodeModalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Full Size Image Modal */}
      <Modal visible={showFullImage} transparent animationType="fade">
        <View style={styles.fullImageModalOverlay}>
          <TouchableOpacity 
            style={styles.fullImageCloseBtn}
            onPress={() => setShowFullImage(false)}
          >
            <Ionicons name="close-circle" size={36} color="#FFFFFF" />
          </TouchableOpacity>
          
          {selectedItem?.imageUrl && (
            <View style={styles.fullImageContainer}>
              <Image 
                source={{ uri: selectedItem.imageUrl }} 
                style={styles.fullImage}
                resizeMode="contain"
              />
              <Text style={styles.fullImageTitle}>{selectedItem.name}</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.fullImageDismiss}
            onPress={() => setShowFullImage(false)}
          >
            <Text style={styles.fullImageDismissText}>Tap anywhere to close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      
      {/* Full Tool Image Modal */}
      <Modal visible={showFullToolImage} transparent animationType="fade">
        <View style={styles.fullImageModalOverlay}>
          <TouchableOpacity 
            style={styles.fullImageCloseBtn}
            onPress={() => setShowFullToolImage(false)}
          >
            <Ionicons name="close-circle" size={36} color="#FFFFFF" />
          </TouchableOpacity>
          
          {selectedTool?.imageUrl && (
            <View style={styles.fullImageContainer}>
              <Image 
                source={{ uri: selectedTool.imageUrl }} 
                style={styles.fullImage}
                resizeMode="contain"
              />
              <Text style={styles.fullImageTitle}>{selectedTool.name}</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.fullImageDismiss}
            onPress={() => setShowFullToolImage(false)}
          >
            <Text style={styles.fullImageDismissText}>Tap anywhere to close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      
      {/* Edit Tool Modal */}
      <Modal visible={showEditTool} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Tool</Text>
              <TouchableOpacity onPress={() => { setShowEditTool(false); resetEditToolForm(); }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Tool Image */}
              <TouchableOpacity
                style={styles.productImagePicker}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    pickEditToolImage();
                  } else {
                    Alert.alert(
                      'Edit Tool Image',
                      'Choose an option',
                      [
                        { text: 'Choose from Library', onPress: pickEditToolImage },
                        { text: 'Remove Image', onPress: () => setEditToolImage(null), style: 'destructive' },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }
                }}
              >
                {editToolImage ? (
                  <Image source={{ uri: editToolImage }} style={styles.productImagePreview} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="camera-outline" size={40} color="#94A3B8" />
                    <Text style={styles.productImagePlaceholderText}>Add Image</Text>
                  </View>
                )}
                {editToolImage && (
                  <TouchableOpacity
                    style={styles.productImageRemove}
                    onPress={() => setEditToolImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              
              {/* Tool Name */}
              <Text style={styles.inputLabel}>Tool Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter tool name"
                value={editToolName}
                onChangeText={setEditToolName}
              />
              
              {/* Description */}
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tool description"
                value={editToolDescription}
                onChangeText={setEditToolDescription}
                multiline
              />
              
              {/* Serial Number */}
              <Text style={styles.inputLabel}>Serial Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., MIL-2024-001"
                value={editToolSerialNumber}
                onChangeText={setEditToolSerialNumber}
              />
              
              {/* Tags */}
              <Text style={styles.inputLabel}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., drill, cordless, milwaukee"
                value={editToolTags}
                onChangeText={setEditToolTags}
              />
              
              {/* Current Location */}
              <Text style={styles.inputLabel}>Current Location</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelect}>
                {locations.map(loc => (
                  <TouchableOpacity
                    key={loc.id}
                    style={[
                      styles.categoryOption,
                      editToolLocation === loc.id && { backgroundColor: loc.color, borderColor: loc.color }
                    ]}
                    onPress={() => setEditToolLocation(loc.id)}
                  >
                    <Ionicons
                      name={loc.type === 'Warehouse' ? 'business' : loc.type === 'Van' ? 'car' : 'location'}
                      size={16}
                      color={editToolLocation === loc.id ? '#FFFFFF' : loc.color}
                    />
                    <Text style={[
                      styles.categoryOptionText,
                      editToolLocation === loc.id && { color: '#FFFFFF' }
                    ]}>
                      {loc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Status */}
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusSelect}>
                {(['available', 'maintenance', 'lost'] as const).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      editToolStatus === status && styles.statusOptionActive,
                      editToolStatus === status && status === 'available' && { backgroundColor: '#10B981', borderColor: '#10B981' },
                      editToolStatus === status && status === 'maintenance' && { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
                      editToolStatus === status && status === 'lost' && { backgroundColor: '#EF4444', borderColor: '#EF4444' },
                    ]}
                    onPress={() => setEditToolStatus(status)}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      editToolStatus === status && { color: '#FFFFFF' }
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Barcode */}
              <Text style={styles.inputLabel}>Barcode</Text>
              <View style={styles.barcodeEditRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Barcode number"
                  value={editToolBarcode}
                  onChangeText={setEditToolBarcode}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.barcodeActionBtn} onPress={generateNewToolBarcode}>
                  <Ionicons name="refresh" size={18} color="#FFFFFF" />
                  <Text style={styles.barcodeActionBtnText}>New</Text>
                </TouchableOpacity>
              </View>
              
              {/* Save Button */}
              <TouchableOpacity style={styles.saveEditButton} onPress={handleSaveToolEdit}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Save Changes</Text>
              </TouchableOpacity>
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Edit Transaction Modal */}
      <Modal visible={showEditTransaction} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.smallModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Transaction</Text>
              <TouchableOpacity onPress={() => { setShowEditTransaction(false); resetEditTransactionForm(); }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {selectedTransaction && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Transaction Item Info */}
                <View style={styles.transactionItemPreview}>
                  {selectedTransaction.itemImageUrl ? (
                    <Image source={{ uri: selectedTransaction.itemImageUrl }} style={styles.transactionItemImage} />
                  ) : (
                    <View style={[styles.transactionItemImage, styles.transactionItemPlaceholder]}>
                      <Ionicons name="cube-outline" size={24} color="#94A3B8" />
                    </View>
                  )}
                  <View style={styles.transactionItemInfo}>
                    <Text style={styles.transactionItemName}>{selectedTransaction.itemName}</Text>
                    <Text style={styles.transactionItemStock}>{selectedTransaction.itemCategory}</Text>
                  </View>
                </View>
                
                {/* Transaction Type */}
                <Text style={styles.inputLabel}>Transaction Type</Text>
                <View style={styles.transactionTypeSelect}>
                  <TouchableOpacity
                    style={[
                      styles.transactionTypeOption,
                      editTransType === 'pickup' && styles.transactionTypeOptionActivePickup
                    ]}
                    onPress={() => setEditTransType('pickup')}
                  >
                    <Ionicons 
                      name="arrow-up-circle-outline" 
                      size={20} 
                      color={editTransType === 'pickup' ? '#FFFFFF' : '#F59E0B'} 
                    />
                    <Text style={[
                      styles.transactionTypeOptionText,
                      editTransType === 'pickup' && { color: '#FFFFFF' }
                    ]}>Picked Up</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.transactionTypeOption,
                      editTransType === 'restock' && styles.transactionTypeOptionActiveRestock
                    ]}
                    onPress={() => setEditTransType('restock')}
                  >
                    <Ionicons 
                      name="arrow-down-circle-outline" 
                      size={20} 
                      color={editTransType === 'restock' ? '#FFFFFF' : '#10B981'} 
                    />
                    <Text style={[
                      styles.transactionTypeOptionText,
                      editTransType === 'restock' && { color: '#FFFFFF' }
                    ]}>Restocked</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Quantity */}
                <Text style={styles.inputLabel}>Quantity ({selectedTransaction.itemUnit}) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter quantity"
                  value={editTransQuantity}
                  onChangeText={setEditTransQuantity}
                  keyboardType="numeric"
                />
                
                {/* Location */}
                <Text style={styles.inputLabel}>{editTransType === 'pickup' ? 'From Location' : 'To Location'}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelect}>
                  {locations.map(loc => (
                    <TouchableOpacity
                      key={loc.id}
                      style={[
                        styles.categoryOption,
                        editTransLocation === loc.id && { backgroundColor: loc.color, borderColor: loc.color }
                      ]}
                      onPress={() => setEditTransLocation(loc.id)}
                    >
                      <Ionicons
                        name={loc.type === 'Warehouse' ? 'business' : loc.type === 'Van' ? 'car' : 'location'}
                        size={16}
                        color={editTransLocation === loc.id ? '#FFFFFF' : loc.color}
                      />
                      <Text style={[
                        styles.categoryOptionText,
                        editTransLocation === loc.id && { color: '#FFFFFF' }
                      ]}>
                        {loc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                {/* Notes */}
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Transaction notes..."
                  value={editTransNotes}
                  onChangeText={setEditTransNotes}
                  multiline
                />
                
                {/* Transaction Meta */}
                <View style={styles.transactionMetaInfo}>
                  <Text style={styles.transactionMetaText}>
                    <Ionicons name="person-outline" size={12} color="#94A3B8" /> By: {selectedTransaction.performedByName}
                  </Text>
                  <Text style={styles.transactionMetaText}>
                    <Ionicons name="time-outline" size={12} color="#94A3B8" /> {formatTimestamp(selectedTransaction.timestamp)}
                  </Text>
                </View>
                
                {/* Action Buttons */}
                <TouchableOpacity style={styles.saveEditButton} onPress={handleSaveTransactionEdit}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>Save Changes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.deleteTransactionBtn} onPress={handleDeleteTransaction}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.deleteTransactionBtnText}>Delete Transaction</Text>
                </TouchableOpacity>
                
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Edit Checkout Record Modal */}
      <Modal visible={showEditCheckout} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.smallModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Checkout Record</Text>
              <TouchableOpacity onPress={() => { setShowEditCheckout(false); resetEditCheckoutForm(); }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {selectedCheckoutRecord && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Tool Info */}
                <View style={styles.checkoutToolPreview}>
                  {(() => {
                    const tool = tools.find(t => t.id === selectedCheckoutRecord.toolId);
                    return (
                      <>
                        {tool?.imageUrl ? (
                          <Image source={{ uri: tool.imageUrl }} style={styles.checkoutToolImage} />
                        ) : (
                          <View style={[styles.checkoutToolImage, styles.checkoutToolImagePlaceholder]}>
                            <Ionicons name="construct-outline" size={28} color="#94A3B8" />
                          </View>
                        )}
                        <View style={styles.checkoutToolInfo}>
                          <Text style={styles.checkoutToolName}>{selectedCheckoutRecord.toolName}</Text>
                          <Text style={styles.checkoutToolUser}>
                            <Ionicons name="person-outline" size={12} color="#64748B" /> {selectedCheckoutRecord.userName}
                          </Text>
                        </View>
                      </>
                    );
                  })()}
                </View>
                
                {/* Status */}
                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.checkoutStatusSelect}>
                  <TouchableOpacity
                    style={[
                      styles.checkoutStatusOption,
                      editCheckoutStatus === 'active' && styles.checkoutStatusActive
                    ]}
                    onPress={() => setEditCheckoutStatus('active')}
                  >
                    <Ionicons 
                      name="time-outline" 
                      size={18} 
                      color={editCheckoutStatus === 'active' ? '#FFFFFF' : '#F59E0B'} 
                    />
                    <Text style={[
                      styles.checkoutStatusText,
                      editCheckoutStatus === 'active' && { color: '#FFFFFF' }
                    ]}>Active</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.checkoutStatusOption,
                      editCheckoutStatus === 'returned' && styles.checkoutStatusReturned
                    ]}
                    onPress={() => setEditCheckoutStatus('returned')}
                  >
                    <Ionicons 
                      name="checkmark-circle-outline" 
                      size={18} 
                      color={editCheckoutStatus === 'returned' ? '#FFFFFF' : '#10B981'} 
                    />
                    <Text style={[
                      styles.checkoutStatusText,
                      editCheckoutStatus === 'returned' && { color: '#FFFFFF' }
                    ]}>Returned</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.checkoutStatusOption,
                      editCheckoutStatus === 'overdue' && styles.checkoutStatusOverdue
                    ]}
                    onPress={() => setEditCheckoutStatus('overdue')}
                  >
                    <Ionicons 
                      name="alert-circle-outline" 
                      size={18} 
                      color={editCheckoutStatus === 'overdue' ? '#FFFFFF' : '#EF4444'} 
                    />
                    <Text style={[
                      styles.checkoutStatusText,
                      editCheckoutStatus === 'overdue' && { color: '#FFFFFF' }
                    ]}>Overdue</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Checkout Dates - Editable */}
                <Text style={styles.inputLabel}>Checkout Date</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => openCalendarForField('checkout')}
                >
                  <Ionicons name="calendar-outline" size={20} color="#F59E0B" />
                  <Text style={styles.datePickerButtonText}>{formatDate(editCheckoutDate)}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>
                
                <Text style={styles.inputLabel}>Expected Return</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => openCalendarForField('expected')}
                >
                  <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                  <Text style={styles.datePickerButtonText}>{formatDate(editExpectedReturn)}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>
                
                <Text style={styles.inputLabel}>
                  Actual Return {editCheckoutStatus !== 'returned' && <Text style={{ color: '#94A3B8', fontWeight: '400' }}>(Optional)</Text>}
                </Text>
                <TouchableOpacity 
                  style={[
                    styles.datePickerButton,
                    editActualReturn && { borderColor: '#10B981' }
                  ]}
                  onPress={() => openCalendarForField('actual')}
                >
                  <Ionicons name="calendar-outline" size={20} color={editActualReturn ? '#10B981' : '#94A3B8'} />
                  <Text style={[
                    styles.datePickerButtonText,
                    !editActualReturn && { color: '#94A3B8' }
                  ]}>
                    {editActualReturn ? formatDate(editActualReturn) : 'Not returned yet'}
                  </Text>
                  <View style={styles.datePickerButtonActions}>
                    {editActualReturn && (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          setEditActualReturn(null);
                        }}
                        style={styles.clearDateBtn}
                      >
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
                
                {/* Notes */}
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Checkout notes..."
                  value={editCheckoutNotes}
                  onChangeText={setEditCheckoutNotes}
                  multiline
                />
                
                {/* Action Buttons */}
                <TouchableOpacity style={styles.saveEditButton} onPress={handleSaveCheckoutEdit}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>Save Changes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.deleteTransactionBtn} onPress={handleDeleteCheckout}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.deleteTransactionBtnText}>Delete Record</Text>
                </TouchableOpacity>
                
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Calendar Date Picker Modal */}
      <Modal visible={showCalendarModal} transparent animationType="fade">
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarModalHeader}>
              <Text style={styles.calendarModalTitle}>
                {calendarDateField === 'checkout' && 'Select Checkout Date'}
                {calendarDateField === 'expected' && 'Select Expected Return'}
                {calendarDateField === 'actual' && 'Select Actual Return'}
              </Text>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <Calendar
              current={
                calendarDateField === 'checkout' ? formatDateForCalendar(editCheckoutDate) :
                calendarDateField === 'expected' ? formatDateForCalendar(editExpectedReturn) :
                editActualReturn ? formatDateForCalendar(editActualReturn) : formatDateForCalendar(new Date())
              }
              onDayPress={handleDateSelect}
              markedDates={{
                [calendarDateField === 'checkout' ? formatDateForCalendar(editCheckoutDate) :
                 calendarDateField === 'expected' ? formatDateForCalendar(editExpectedReturn) :
                 editActualReturn ? formatDateForCalendar(editActualReturn) : '']: {
                  selected: true,
                  selectedColor: calendarDateField === 'checkout' ? '#F59E0B' : 
                                 calendarDateField === 'expected' ? '#3B82F6' : '#10B981',
                }
              }}
              theme={{
                backgroundColor: '#FFFFFF',
                calendarBackground: '#FFFFFF',
                textSectionTitleColor: '#64748B',
                selectedDayBackgroundColor: '#F59E0B',
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: '#F59E0B',
                dayTextColor: '#1E293B',
                textDisabledColor: '#CBD5E1',
                dotColor: '#F59E0B',
                selectedDotColor: '#FFFFFF',
                arrowColor: '#F59E0B',
                monthTextColor: '#1E293B',
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 15,
                textMonthFontSize: 17,
                textDayHeaderFontSize: 13,
              }}
              style={styles.calendar}
            />
            
            <View style={styles.calendarModalFooter}>
              <TouchableOpacity 
                style={styles.calendarTodayBtn}
                onPress={() => {
                  const today = { dateString: formatDateForCalendar(new Date()) };
                  handleDateSelect(today);
                }}
              >
                <Ionicons name="today-outline" size={18} color="#F59E0B" />
                <Text style={styles.calendarTodayBtnText}>Today</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.calendarCancelBtn}
                onPress={() => setShowCalendarModal(false)}
              >
                <Text style={styles.calendarCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Action Modal (Rename/Delete/Cancel) */}
      <Modal visible={showCategoryActionModal} transparent animationType="fade">
        <View style={styles.categoryActionOverlay}>
          <View style={styles.categoryActionModal}>
            {selectedCategoryForAction && (
              <>
                <View style={styles.categoryActionHeader}>
                  <View style={[styles.categoryActionIcon, { backgroundColor: selectedCategoryForAction.color + '20' }]}>
                    <Ionicons name={selectedCategoryForAction.icon as any} size={24} color={selectedCategoryForAction.color} />
                  </View>
                  <Text style={styles.categoryActionTitle}>{selectedCategoryForAction.name}</Text>
                </View>

                <TouchableOpacity
                  style={styles.categoryActionBtn}
                  onPress={() => {
                    setShowCategoryActionModal(false);
                    setTimeout(() => setShowRenameCategoryModal(true), 200);
                  }}
                >
                  <Ionicons name="pencil-outline" size={22} color="#3B82F6" />
                  <Text style={styles.categoryActionBtnText}>Rename</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.categoryActionBtn}
                  onPress={handleDeleteCategory}
                >
                  <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  <Text style={[styles.categoryActionBtnText, { color: '#EF4444' }]}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.categoryActionBtn, styles.categoryActionCancelBtn]}
                  onPress={() => {
                    setShowCategoryActionModal(false);
                    setSelectedCategoryForAction(null);
                  }}
                >
                  <Text style={styles.categoryActionCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Rename Category Modal */}
      <Modal visible={showRenameCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Category</Text>
              <TouchableOpacity onPress={() => {
                setShowRenameCategoryModal(false);
                setSelectedCategoryForAction(null);
              }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Category Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter category name"
                value={renameCategoryName}
                onChangeText={setRenameCategoryName}
              />
              
              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorPicker}>
                {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280'].map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      renameCategoryColor === color && styles.colorOptionActive
                    ]}
                    onPress={() => setRenameCategoryColor(color)}
                  >
                    {renameCategoryColor === color && (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.inputLabel}>Icon</Text>
              <View style={styles.iconPicker}>
                {['cube', 'flash', 'water', 'hardware-chip', 'shield-checkmark', 'construct', 'bulb', 'car', 'home', 'settings'].map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      renameCategoryIcon === icon && { backgroundColor: renameCategoryColor + '20', borderColor: renameCategoryColor }
                    ]}
                    onPress={() => setRenameCategoryIcon(icon)}
                  >
                    <Ionicons
                      name={icon as any}
                      size={24}
                      color={renameCategoryIcon === icon ? renameCategoryColor : '#64748B'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Preview */}
              <Text style={styles.inputLabel}>Preview</Text>
              <View style={styles.categoryPreview}>
                <View style={[styles.categoryChip, { borderColor: renameCategoryColor, backgroundColor: renameCategoryColor }]}>
                  <Ionicons name={renameCategoryIcon as any} size={14} color="#FFFFFF" />
                  <Text style={[styles.categoryChipText, { color: '#FFFFFF' }]}>
                    {renameCategoryName || 'Category Name'}
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <TouchableOpacity style={styles.saveButton} onPress={handleRenameCategory}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal visible={showAddCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Category</Text>
              <TouchableOpacity onPress={() => {
                setShowAddCategoryModal(false);
                setNewCategoryName('');
              }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Category Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter category name"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />
              
              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorPicker}>
                {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280'].map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newCategoryColor === color && styles.colorOptionActive
                    ]}
                    onPress={() => setNewCategoryColor(color)}
                  >
                    {newCategoryColor === color && (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.inputLabel}>Icon</Text>
              <View style={styles.iconPicker}>
                {['cube', 'flash', 'water', 'hardware-chip', 'shield-checkmark', 'construct', 'bulb', 'car', 'home', 'settings'].map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      newCategoryIcon === icon && { backgroundColor: newCategoryColor + '20', borderColor: newCategoryColor }
                    ]}
                    onPress={() => setNewCategoryIcon(icon)}
                  >
                    <Ionicons
                      name={icon as any}
                      size={24}
                      color={newCategoryIcon === icon ? newCategoryColor : '#64748B'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Preview */}
              <Text style={styles.inputLabel}>Preview</Text>
              <View style={styles.categoryPreview}>
                <View style={[styles.categoryChip, { borderColor: newCategoryColor, backgroundColor: newCategoryColor }]}>
                  <Ionicons name={newCategoryIcon as any} size={14} color="#FFFFFF" />
                  <Text style={[styles.categoryChipText, { color: '#FFFFFF' }]}>
                    {newCategoryName || 'Category Name'}
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <TouchableOpacity style={styles.saveButton} onPress={handleAddCategory}>
              <Text style={styles.saveButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Location Detail Modal */}
      <Modal visible={showLocationDetail} animationType="slide">
        <View style={styles.locationDetailContainer}>
          {/* Header */}
          <View style={[styles.locationDetailHeader, { backgroundColor: selectedLocationForDetail?.color || '#3B82F6' }]}>
            <TouchableOpacity
              style={styles.locationDetailBackBtn}
              onPress={() => {
                setShowLocationDetail(false);
                setSelectedLocationForDetail(null);
                setLocationSearchQuery('');
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.locationDetailHeaderInfo}>
              <Text style={styles.locationDetailTitle}>{selectedLocationForDetail?.name}</Text>
              <Text style={styles.locationDetailSubtitle}>
                {selectedLocationForDetail?.type.charAt(0).toUpperCase() + selectedLocationForDetail?.type.slice(1)}
              </Text>
            </View>
            <View style={styles.locationDetailHeaderIcon}>
              <Ionicons
                name={selectedLocationForDetail?.type === 'warehouse' ? 'business' : selectedLocationForDetail?.type === 'van' ? 'car' : 'location'}
                size={28}
                color="#FFFFFF"
              />
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.locationDetailSearch}>
            <View style={styles.locationDetailSearchBar}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput
                style={styles.locationDetailSearchInput}
                placeholder="Quick search..."
                placeholderTextColor="#94A3B8"
                value={locationSearchQuery}
                onChangeText={setLocationSearchQuery}
              />
              {locationSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setLocationSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.locationDetailTabs}>
            <TouchableOpacity
              style={[styles.locationDetailTab, locationDetailTab === 'items' && styles.locationDetailTabActive]}
              onPress={() => setLocationDetailTab('items')}
            >
              <Ionicons
                name="cube"
                size={18}
                color={locationDetailTab === 'items' ? '#3B82F6' : '#64748B'}
              />
              <Text style={[styles.locationDetailTabText, locationDetailTab === 'items' && styles.locationDetailTabTextActive]}>
                Items ({selectedLocationForDetail ? items.filter(i => (i.locationQuantities[selectedLocationForDetail.id] || 0) > 0).length : 0})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.locationDetailTab, locationDetailTab === 'tools' && styles.locationDetailTabActive]}
              onPress={() => setLocationDetailTab('tools')}
            >
              <Ionicons
                name="construct"
                size={18}
                color={locationDetailTab === 'tools' ? '#10B981' : '#64748B'}
              />
              <Text style={[styles.locationDetailTabText, locationDetailTab === 'tools' && styles.locationDetailTabTextActive]}>
                Tools ({selectedLocationForDetail ? tools.filter(t => t.currentLocationId === selectedLocationForDetail.id).length : 0})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {selectedLocationForDetail && locationDetailTab === 'items' && (
            <FlatList
              data={items.filter(item => {
                const hasStock = (item.locationQuantities[selectedLocationForDetail.id] || 0) > 0;
                if (!hasStock) return false;
                if (!locationSearchQuery) return true;
                const query = locationSearchQuery.toLowerCase();
                return item.name.toLowerCase().includes(query) ||
                  item.barcode.includes(query) ||
                  item.tags.some(tag => tag.toLowerCase().includes(query));
              })}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.locationDetailList}
              renderItem={({ item }) => {
                const qty = item.locationQuantities[selectedLocationForDetail.id] || 0;
                const isLowStock = qty <= item.lowStockThreshold;
                return (
                  <TouchableOpacity
                    style={styles.productCard}
                    onPress={() => {
                      setSelectedItem(item);
                      setShowLocationDetail(false);
                      setShowItemDetail(true);
                    }}
                  >
                    {/* Product Image */}
                    <View style={styles.productCardImage}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.productCardImg} resizeMode="cover" />
                      ) : (
                        <View style={[styles.productCardImgPlaceholder, { backgroundColor: categories.find(c => c.name === item.category)?.color + '15' }]}>
                          <Ionicons
                            name={categories.find(c => c.name === item.category)?.icon as any || 'cube'}
                            size={32}
                            color={categories.find(c => c.name === item.category)?.color || '#94A3B8'}
                          />
                        </View>
                      )}
                    </View>
                    
                    {/* Product Info */}
                    <View style={styles.productCardInfo}>
                      <Text style={styles.productCardName} numberOfLines={2}>{item.name}</Text>
                      
                      <View style={styles.productCardFooter}>
                        <View style={[styles.productCardCategory, { backgroundColor: categories.find(c => c.name === item.category)?.color + '15' }]}>
                          <Text style={[styles.productCardCategoryText, { color: categories.find(c => c.name === item.category)?.color }]}>
                            {item.category}
                          </Text>
                        </View>
                        <Text style={styles.productCardBarcode}>#{item.barcode}</Text>
                      </View>
                    </View>
                    
                    {/* Quantity Box - shows quantity at this location */}
                    <View style={[
                      styles.productCardQtyBox,
                      isLowStock && styles.productCardQtyBoxLow
                    ]}>
                      {isLowStock && (
                        <Ionicons name="warning" size={14} color="#EF4444" style={styles.productCardQtyWarning} />
                      )}
                      <Text style={[
                        styles.productCardQtyValue,
                        isLowStock && styles.productCardQtyValueLow
                      ]}>
                        {qty}
                      </Text>
                      <Text style={[
                        styles.productCardQtyUnit,
                        isLowStock && styles.productCardQtyUnitLow
                      ]}>
                        {item.unit}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.locationDetailEmpty}>
                  <Ionicons name="cube-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.locationDetailEmptyText}>
                    {locationSearchQuery ? 'No items match your search' : 'No items at this location'}
                  </Text>
                </View>
              }
            />
          )}

          {selectedLocationForDetail && locationDetailTab === 'tools' && (
            <FlatList
              data={tools.filter(tool => {
                const isHere = tool.currentLocationId === selectedLocationForDetail.id;
                if (!isHere) return false;
                if (!locationSearchQuery) return true;
                const query = locationSearchQuery.toLowerCase();
                return tool.name.toLowerCase().includes(query) ||
                  tool.barcode.includes(query) ||
                  tool.tags.some(tag => tag.toLowerCase().includes(query));
              })}
              keyExtractor={tool => tool.id}
              contentContainerStyle={styles.locationDetailList}
              renderItem={({ item: tool }) => (
                <TouchableOpacity
                  style={styles.locationDetailItem}
                  onPress={() => {
                    setSelectedTool(tool);
                    setShowLocationDetail(false);
                    setShowToolDetail(true);
                  }}
                >
                  <View style={[
                    styles.locationDetailToolStatus,
                    tool.status === 'available' && { backgroundColor: '#D1FAE5' },
                    tool.status === 'checked-out' && { backgroundColor: '#FEF3C7' },
                    tool.status === 'maintenance' && { backgroundColor: '#FEE2E2' },
                  ]}>
                    <Ionicons
                      name={tool.status === 'available' ? 'checkmark-circle' : tool.status === 'checked-out' ? 'person' : 'build'}
                      size={20}
                      color={tool.status === 'available' ? '#10B981' : tool.status === 'checked-out' ? '#F59E0B' : '#EF4444'}
                    />
                  </View>
                  <View style={styles.locationDetailItemInfo}>
                    <Text style={styles.locationDetailItemName}>{tool.name}</Text>
                    <Text style={styles.locationDetailItemBarcode}>S/N: {tool.serialNumber}</Text>
                    {tool.status === 'checked-out' && tool.checkedOutBy && (
                      <Text style={styles.locationDetailToolCheckedOut}>
                        <Ionicons name="person-outline" size={12} color="#F59E0B" /> {getUser(tool.checkedOutBy)?.name}
                      </Text>
                    )}
                  </View>
                  <View style={[
                    styles.locationDetailToolBadge,
                    tool.status === 'available' && { backgroundColor: '#D1FAE5' },
                    tool.status === 'checked-out' && { backgroundColor: '#FEF3C7' },
                    tool.status === 'maintenance' && { backgroundColor: '#FEE2E2' },
                  ]}>
                    <Text style={[
                      styles.locationDetailToolBadgeText,
                      tool.status === 'available' && { color: '#10B981' },
                      tool.status === 'checked-out' && { color: '#F59E0B' },
                      tool.status === 'maintenance' && { color: '#EF4444' },
                    ]}>
                      {tool.status === 'checked-out' ? 'In Use' : tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.locationDetailEmpty}>
                  <Ionicons name="construct-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.locationDetailEmptyText}>
                    {locationSearchQuery ? 'No tools match your search' : 'No tools at this location'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>

      {/* Location Type Action Modal */}
      <Modal visible={showLocationTypeAction} transparent animationType="fade">
        <View style={styles.categoryActionOverlay}>
          <View style={styles.categoryActionModal}>
            {selectedLocationTypeForAction && (
              <>
                <View style={styles.categoryActionHeader}>
                  <View style={[styles.categoryActionIcon, { backgroundColor: '#F59E0B20' }]}>
                    <Ionicons name="pricetag" size={24} color="#F59E0B" />
                  </View>
                  <Text style={styles.categoryActionTitle}>{selectedLocationTypeForAction.name}</Text>
                </View>

                <TouchableOpacity
                  style={styles.categoryActionBtn}
                  onPress={() => {
                    setShowLocationTypeAction(false);
                    setTimeout(() => setShowRenameLocationType(true), 200);
                  }}
                >
                  <Ionicons name="pencil-outline" size={22} color="#3B82F6" />
                  <Text style={styles.categoryActionBtnText}>Rename</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.categoryActionBtn}
                  onPress={handleDeleteLocationType}
                >
                  <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  <Text style={[styles.categoryActionBtnText, { color: '#EF4444' }]}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.categoryActionBtn, styles.categoryActionCancelBtn]}
                  onPress={() => {
                    setShowLocationTypeAction(false);
                    setSelectedLocationTypeForAction(null);
                  }}
                >
                  <Text style={styles.categoryActionCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Rename Location Type Modal */}
      <Modal visible={showRenameLocationType} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rename Location Type</Text>
              <TouchableOpacity onPress={() => {
                setShowRenameLocationType(false);
                setSelectedLocationTypeForAction(null);
              }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Location Type Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter location type name"
                value={renameLocationTypeName}
                onChangeText={setRenameLocationTypeName}
                autoFocus
              />
            </View>
            
            <TouchableOpacity style={styles.saveButton} onPress={handleRenameLocationType}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Location Type Modal */}
      <Modal visible={showAddLocationType} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Location Type</Text>
              <TouchableOpacity onPress={() => {
                setShowAddLocationType(false);
                setNewLocationTypeName('');
              }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Location Type Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Storage Room, Client Site"
                value={newLocationTypeName}
                onChangeText={setNewLocationTypeName}
                autoFocus
              />
            </View>
            
            <TouchableOpacity style={styles.saveButton} onPress={handleAddLocationType}>
              <Text style={styles.saveButtonText}>Add Location Type</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Unit Modal */}
      <Modal visible={showAddUnitModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Unit</Text>
              <TouchableOpacity onPress={() => {
                setShowAddUnitModal(false);
                setNewUnitName('');
              }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Unit Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Rolls, Sheets, Meters"
                value={newUnitName}
                onChangeText={setNewUnitName}
                autoFocus
              />
            </View>
            
            <TouchableOpacity style={styles.saveButton} onPress={handleAddUnit}>
              <Text style={styles.saveButtonText}>Add Unit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============= STYLES =============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
    minHeight: 56,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#F59E0B',
    marginBottom: -1,
  },
  tabLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  tabBadge: {
    position: 'absolute',
    top: 6,
    right: 12,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
  },
  categoryFilter: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 60,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    height: 36,
  },
  categoryChipActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  itemBarcode: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  itemTags: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#64748B',
  },
  itemCardRight: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemQuantityLow: {
    color: '#EF4444',
  },
  itemUnit: {
    fontSize: 12,
    color: '#94A3B8',
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lowStockText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  toolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toolCardWithImage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  toolCardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  toolCardImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolCardContent: {
    flex: 1,
  },
  toolCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  toolSerial: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  toolStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  toolStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toolCheckoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  toolCheckoutText: {
    fontSize: 13,
    color: '#64748B',
  },
  toolLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  toolLocationText: {
    fontSize: 12,
    color: '#64748B',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  locationType: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  locationStats: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  locationStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  locationStatLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  addLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#0EA5E9',
  },
  addLocationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  alertIcon: {
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    textTransform: 'uppercase',
  },
  alertItem: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 4,
  },
  alertDetail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  alertActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  alertActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  historyStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  historyInfo: {
    flex: 1,
  },
  historyToolName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  historyUser: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  historyDates: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  historyDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  historyStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyToolImageContainer: {
    position: 'relative',
  },
  historyToolImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  historyToolImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyToolStatusIndicator: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  // Transaction History Styles
  transactionHistoryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionHistoryImageContainer: {
    position: 'relative',
  },
  transactionHistoryImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  transactionHistoryImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionTypeIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  transactionHistoryInfo: {
    flex: 1,
  },
  transactionHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  transactionHistoryItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  transactionTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  transactionTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  transactionHistoryDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  transactionHistoryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionHistoryDetailText: {
    fontSize: 13,
    color: '#64748B',
  },
  transactionHistoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionHistoryUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionHistoryUserText: {
    fontSize: 12,
    color: '#64748B',
  },
  transactionHistoryTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  transactionHistoryNotes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  transactionHistoryNotesText: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
  },
  longPressHint: {
    fontSize: 10,
    color: '#CBD5E1',
    textAlign: 'right',
    marginTop: 4,
    fontStyle: 'italic',
  },
  transactionTypeSelect: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  transactionTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  transactionTypeOptionActivePickup: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  transactionTypeOptionActiveRestock: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  transactionTypeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  transactionMetaInfo: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  transactionMetaText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  deleteTransactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    marginTop: 8,
  },
  deleteTransactionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  // Checkout Edit Modal Styles
  checkoutToolPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  checkoutToolImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  checkoutToolImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutToolInfo: {
    flex: 1,
  },
  checkoutToolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  checkoutToolUser: {
    fontSize: 13,
    color: '#64748B',
  },
  checkoutStatusSelect: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  checkoutStatusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  checkoutStatusActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  checkoutStatusReturned: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkoutStatusOverdue: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  checkoutStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  checkoutDetailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  checkoutDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  checkoutDetailLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  checkoutDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  // Date Picker Button Styles
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
    marginBottom: 12,
    gap: 10,
  },
  datePickerButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  datePickerButtonActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearDateBtn: {
    padding: 2,
  },
  // Calendar Modal Styles
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  calendarModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
  },
  calendar: {
    borderRadius: 0,
  },
  calendarModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  calendarTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  calendarTodayBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  calendarCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  calendarCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  emptySubText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Scanner Styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: 280,
    height: 180,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  scanCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#F59E0B',
  },
  scanCornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  scanCornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  scanCornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  scanCornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanHint: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  permissionText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 16,
  },
  permissionButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  categorySelect: {
    marginTop: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  statusSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  statusOptionActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  generateBarcodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#F59E0B',
    borderRadius: 12,
  },
  generateBarcodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F59E0B',
  },
  scannedBarcodeContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#F59E0B',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  locationTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  locationTypeOption: {
    width: (SCREEN_WIDTH - 64) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 8,
  },
  locationTypeOptionActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  locationTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  locationTypeTextActive: {
    color: '#F59E0B',
  },
  // Item Detail Styles
  itemDetailBarcode: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 16,
  },
  tapToPrint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  itemDetailName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  itemDetailDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  itemDetailMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  itemDetailCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  itemDetailCategoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemDetailTotal: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginTop: 24,
  },
  itemDetailTotalLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  itemDetailTotalValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  lowStockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  lowStockWarningText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  itemDetailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 24,
    marginBottom: 12,
  },
  locationQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  locationQuantityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationQuantityName: {
    fontSize: 15,
    color: '#1E293B',
  },
  locationQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationQuantityValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    minWidth: 40,
    textAlign: 'center',
  },
  // Item Detail Image & Action Buttons
  itemDetailImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  itemDetailImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  pickupButton: {
    backgroundColor: '#F59E0B',
  },
  restockButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  viewProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  viewProductButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  // Pickup/Restock Modal Styles
  smallModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '85%',
    position: 'absolute',
    bottom: 0,
  },
  transactionItemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  transactionItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  transactionItemPlaceholder: {
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionItemInfo: {
    flex: 1,
  },
  transactionItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  transactionItemStock: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  locationDropdown: {
    marginBottom: 16,
  },
  locationDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    gap: 6,
  },
  locationDropdownText: {
    fontSize: 13,
    color: '#1E293B',
  },
  confirmPickupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  confirmRestockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Edit Item Modal Styles
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editIconBtn: {
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  barcodeEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barcodeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  barcodeActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  editLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  editLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  editLocationName: {
    fontSize: 14,
    color: '#1E293B',
  },
  editLocationInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
  },
  saveEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
  },
  // Tool Detail Styles
  toolDetailSerial: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  toolDetailSerialLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  toolDetailSerialValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  toolDetailStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  toolDetailStatusLabel: {
    fontSize: 15,
    color: '#64748B',
  },
  toolDetailStatusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  toolDetailStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toolCheckoutDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    marginTop: 16,
  },
  toolCheckoutDetailInfo: {
    flex: 1,
  },
  toolCheckoutDetailUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  toolCheckoutDetailDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  toolCheckoutDetailReturn: {
    fontSize: 13,
    color: '#F59E0B',
    marginTop: 2,
  },
  toolDetailActions: {
    marginTop: 24,
    gap: 12,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: 12,
  },
  checkoutBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
  },
  checkinBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Checkout Modal Styles
  checkoutToolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
  },
  checkoutToolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  userSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  userOption: {
    width: (SCREEN_WIDTH - 64) / 2,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 8,
  },
  userOptionActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  userOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  userOptionTextActive: {
    color: '#F59E0B',
  },
  // Confirm Modal Styles
  confirmModal: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
  },
  confirmText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmOkBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  confirmOkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Barcode Modal Styles
  barcodeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeModalContent: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    margin: 24,
  },
  barcodeModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 24,
    textAlign: 'center',
  },
  barcodeModalBarcode: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  barcodeModalHint: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 16,
  },
  barcodeModalClose: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  barcodeModalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  // Full Image Modal Styles
  fullImageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullImageContainer: {
    width: '90%',
    maxHeight: '80%',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
  },
  fullImageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  fullImageDismiss: {
    position: 'absolute',
    bottom: 50,
  },
  fullImageDismissText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  imageExpandHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 6,
    padding: 4,
  },
  // Add Category Chip Style
  addCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#0EA5E9',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    height: 36,
  },
  addCategoryChipText: {
    fontSize: 13,
    color: '#0EA5E9',
    fontWeight: '600',
  },
  // Category Action Modal Styles
  categoryActionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryActionModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: SCREEN_WIDTH - 48,
    maxWidth: 340,
  },
  categoryActionHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryActionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  categoryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryActionBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  categoryActionCancelBtn: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    marginTop: 8,
  },
  categoryActionCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  // Color Picker Styles
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionActive: {
    borderWidth: 3,
    borderColor: '#1E293B',
  },
  // Icon Picker Styles
  iconPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  // Category Preview
  categoryPreview: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginTop: 8,
  },
  // Location Detail Modal Styles
  locationDetailContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  locationDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  locationDetailBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationDetailHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationDetailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  locationDetailSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  locationDetailHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationDetailSearch: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  locationDetailSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  locationDetailSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  locationDetailTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  locationDetailTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  locationDetailTabActive: {
    backgroundColor: '#EFF6FF',
  },
  locationDetailTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  locationDetailTabTextActive: {
    color: '#3B82F6',
  },
  locationDetailList: {
    padding: 16,
    paddingBottom: 40,
  },
  locationDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  locationDetailItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationDetailItemInfo: {
    flex: 1,
  },
  locationDetailItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  locationDetailItemBarcode: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  locationDetailItemQty: {
    alignItems: 'flex-end',
  },
  locationDetailItemQtyValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  locationDetailItemQtyUnit: {
    fontSize: 11,
    color: '#94A3B8',
  },
  locationDetailToolStatus: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationDetailToolCheckedOut: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  locationDetailToolBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationDetailToolBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationDetailEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  locationDetailEmptyText: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 12,
    textAlign: 'center',
  },
  // Location Preview Styles
  locationPreview: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginTop: 8,
  },
  locationPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    gap: 12,
  },
  locationPreviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationPreviewInfo: {
    flex: 1,
  },
  locationPreviewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  locationPreviewType: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  // Add Location Type Styles
  addLocationTypeBtn: {
    width: (SCREEN_WIDTH - 64) / 2,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  addLocationTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  locationTypeHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Product Image Picker Styles
  productImagePicker: {
    alignItems: 'center',
    marginBottom: 20,
  },
  productImagePreview: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  productImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  productImagePlaceholderText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  productImageRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  // Unit Dropdown Styles
  unitDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  unitDropdownText: {
    fontSize: 16,
    color: '#1E293B',
  },
  unitDropdownList: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  unitDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  unitDropdownItemActive: {
    backgroundColor: '#FFF7ED',
  },
  unitDropdownItemText: {
    fontSize: 15,
    color: '#1E293B',
  },
  unitDropdownItemTextActive: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  unitDropdownAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0F9FF',
  },
  unitDropdownAddText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  // Product Card Styles
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  productCardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  productCardImg: {
    width: '100%',
    height: '100%',
  },
  productCardImgPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCardLowStock: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
  },
  productCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  productCardQuantity: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  productCardQuantityLow: {
    color: '#EF4444',
  },
  productCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  productCardCategory: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  productCardCategoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  productCardBarcode: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  // Quantity Box Styles
  productCardQtyBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  productCardQtyBoxLow: {
    backgroundColor: '#FEF2F2',
  },
  productCardQtyWarning: {
    marginBottom: 2,
  },
  productCardQtyValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  productCardQtyValueLow: {
    color: '#EF4444',
  },
  productCardQtyUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  productCardQtyUnitLow: {
    color: '#EF4444',
  },
});
