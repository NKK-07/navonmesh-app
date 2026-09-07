// NAVONMESH Hardware Data Service API & Demo Scenario Controller
// Simulated hardware values for SIH 2026 Problem Statement 26005
// Structured with clean abstraction layer for future MQTT/WebSocket integration

import { CROPS_DATA, getCropById } from './crops.js';

class HardwareService {
  constructor() {
    this.listeners = new Set();

    // Default Hardware State
    this.state = {
      isOnline: true,
      connectivityMode: 'lora', // 'lora', 'sms', 'wifi', 'offline'
      signalStrength: 'Strong',
      activeScenario: 'normal',

      // Primary Storage Metrics
      temperature: 8.2, // °C
      targetTemperature: 8.0, // °C
      humidity: 91, // % RH
      targetHumidity: 90, // % RH
      ethyleneLevel: 'Normal', // Normal, Moderate, High
      
      // Weight & Load Cell
      produceWeightKg: 186, // kg
      maxCapacityKg: 200, // kg
      activeCropId: 'cabbage',

      // Power & Solar System
      solarPowerKw: 2.4, // kW
      batterySoc: 78, // %
      currentLoadKw: 1.1, // kW
      compressorWatts: 420, // W
      compressorSpeedPct: 42, // %

      // PCM Thermal Backup System
      pcmStatus: 'AVAILABLE', // AVAILABLE, ACTIVE, EXHAUSTED
      pcmTemperature: -0.8, // °C
      pcmChargePct: 82, // %
      pcmEstimatedHours: 8.6, // Hours

      // System Physical State
      doorOpen: false,
      doorOpenTimeMinutes: 0,
      airCirculation: 'ACTIVE',
      lastMaintenanceDate: '12 Aug 2026',
      nextCheckDate: '12 Nov 2026',

      // Sensor Diagnostics (SHT31, ESP32, Load Cell, Ethylene, LoRa)
      sensors: {
        esp32: { status: 'healthy', name: 'ESP32 Dual Core MCU', temp: '41°C' },
        sht31Temp: { status: 'healthy', name: 'SHT31 Temp Sensor', accuracy: '±0.3°C', calibrated: true },
        sht31Humid: { status: 'healthy', name: 'SHT31 Humidity Sensor', accuracy: '±2% RH', calibrated: true },
        batteryBms: { status: 'healthy', name: '48V LiFePO4 BMS', healthPct: 98 },
        compressor: { status: 'healthy', name: 'BLDC Variable Speed Compressor', runtimeHours: '5h 24m' },
        doorSensor: { status: 'healthy', name: 'Magnetic Reed Door Switch' },
        loadCell: { status: 'healthy', name: '4-Point Strain Gauge Load Cell', accuracy: '±0.1 kg' },
        ethyleneSensor: { status: 'healthy', name: 'Electrochemical Ethylene Sensor' },
        loraTransceiver: { status: 'healthy', name: 'SX1276 LoRa 868MHz' }
      },

      // Saved Produce Batches (FIFO Inventory)
      batches: [
        { id: 'BATCH-001', cropId: 'tomato', owner: 'Ramesh Das', weightKg: 42, storedDate: '2026-09-01', estDaysLeft: 12, urgency: 'SAFE' },
        { id: 'BATCH-002', cropId: 'cabbage', owner: 'Lalsangzuala', weightKg: 65, storedDate: '2026-08-31', estDaysLeft: 24, urgency: 'SAFE' },
        { id: 'BATCH-003', cropId: 'king_chilli', owner: 'Marthang', weightKg: 35, storedDate: '2026-08-29', estDaysLeft: 7, urgency: 'SELL_FIRST' },
        { id: 'BATCH-004', cropId: 'khasi_mandarin', owner: 'Bikash Chettri', weightKg: 44, storedDate: '2026-08-28', estDaysLeft: 18, urgency: 'SAFE' }
      ],

      // Active Alerts Queue
      alerts: [
        { id: 'ALT-101', type: 'info', title: 'System Operating Normally', message: 'Solar power is charging battery. Temperature and humidity are within optimal range.', timestamp: '10 mins ago', action: 'None required' }
      ]
    };

    // Load cached state if available (for offline PWA support)
    this.loadFromStorage();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.saveToStorage();
    this.listeners.forEach(fn => fn(this.getState()));
  }

  getState() {
    // Derived Operating Mode based on SOC
    const soc = this.state.batterySoc;
    let modeKey = 'MODE_A';
    let modeTitle = 'MODE A — FULL SOLAR';
    let modeDesc = 'Solar power is available. Battery is charging.';

    if (soc > 80 && this.state.solarPowerKw > 1.0) {
      modeKey = 'MODE_A';
      modeTitle = 'MODE A — FULL SOLAR';
      modeDesc = 'Solar energy directly powers cooling and charges LiFePO4 battery.';
    } else if (soc >= 50) {
      modeKey = 'MODE_B';
      modeTitle = 'MODE B — SOLAR + BATTERY';
      modeDesc = 'Combined solar generation and battery power supporting cooling load.';
    } else if (soc >= 30) {
      modeKey = 'MODE_C';
      modeTitle = 'MODE C — BATTERY ONLY';
      modeDesc = 'Solar unavailable. Operating on battery reserve.';
    } else if (soc >= 15 || this.state.pcmStatus === 'ACTIVE') {
      modeKey = 'MODE_D';
      modeTitle = 'MODE D — PCM ONLY';
      modeDesc = 'Battery low. Cooling maintained via thermal Phase Change Material backup.';
    } else {
      modeKey = 'MODE_E';
      modeTitle = 'MODE E — EMERGENCY';
      modeDesc = 'Critical low power! Alarm activated and LoRa/SMS alert dispatched.';
    }

    // Calculate Storage Condition Score (0-100)
    const score = this.calculateConditionScore();

    // Calculate Remaining Shelf Life
    const shelfLife = this.calculateShelfLife();

    return {
      ...this.state,
      operatingMode: { modeKey, modeTitle, modeDesc },
      conditionScore: score,
      shelfLifeDays: shelfLife.days,
      shelfLifeQuality: shelfLife.quality,
      shelfLifeFactors: shelfLife.factors,
      activeCrop: getCropById(this.state.activeCropId)
    };
  }

  calculateConditionScore() {
    let score = 100;
    const tempDiff = Math.abs(this.state.temperature - this.state.targetTemperature);
    const humidDiff = Math.abs(this.state.humidity - this.state.targetHumidity);

    // Temperature penalty
    if (tempDiff > 5) score -= 30;
    else if (tempDiff > 2) score -= 15;
    else if (tempDiff > 1) score -= 5;

    // Humidity penalty
    if (humidDiff > 10) score -= 20;
    else if (humidDiff > 5) score -= 10;

    // Door penalty
    if (this.state.doorOpen) score -= 25;

    // Battery SOC penalty
    if (this.state.batterySoc < 20) score -= 20;
    else if (this.state.batterySoc < 40) score -= 10;

    // Ethylene penalty
    if (this.state.ethyleneLevel === 'High') score -= 20;

    return Math.max(10, Math.min(100, score));
  }

  calculateShelfLife() {
    const crop = getCropById(this.state.activeCropId);
    const baseLife = crop.shelfLifeDays;
    
    // Q10 temperature-quality model: Rate of degradation doubles for every 10°C rise
    const refTemp = crop.tempTarget;
    const currentTemp = this.state.temperature;
    const deltaT = currentTemp - refTemp;
    
    const q10Factor = Math.pow(2, deltaT / 10.0);
    let remainingDays = Math.round(baseLife / Math.max(0.5, q10Factor));

    let quality = 'GOOD';
    if (remainingDays < 5 || currentTemp > 14) quality = 'CRITICAL';
    else if (remainingDays < 10 || currentTemp > 10) quality = 'SELL SOON';

    return {
      days: Math.max(1, remainingDays),
      quality,
      factors: {
        tempExposure: deltaT > 3 ? 'HIGH' : deltaT > 1 ? 'SLIGHT' : 'NORMAL',
        humidityStatus: Math.abs(this.state.humidity - crop.humidityTarget) < 5 ? 'OPTIMAL' : 'SUB-OPTIMAL',
        qualityGrade: quality
      }
    };
  }

  // --- DEMO SCENARIO SWITCHER (SIH JUDGES CONTROL) ---
  triggerScenario(scenario) {
    this.state.activeScenario = scenario;

    if (scenario === 'normal') {
      this.state.temperature = 8.2;
      this.state.targetTemperature = 8.0;
      this.state.humidity = 91;
      this.state.batterySoc = 78;
      this.state.solarPowerKw = 2.4;
      this.state.doorOpen = false;
      this.state.pcmStatus = 'AVAILABLE';
      this.state.pcmTemperature = -0.8;
      this.state.ethyleneLevel = 'Normal';
      this.state.alerts = [
        { id: 'ALT-NORMAL', type: 'success', title: 'System Normal', message: 'Cold storage functioning within target tolerances.', timestamp: 'Just now', action: 'None' }
      ];
    } else if (scenario === 'high_temp') {
      this.state.temperature = 12.8;
      this.state.humidity = 76;
      this.state.batterySoc = 65;
      this.state.doorOpen = false;
      this.state.pcmStatus = 'AVAILABLE';
      this.state.alerts = [
        { id: 'ALT-HOT', type: 'critical', title: 'HIGH TEMPERATURE WARNING', message: 'Chamber temperature is 12.8°C (Target: 8.0°C). Compressor speed increased.', timestamp: '1 min ago', action: 'Keep door sealed and check airflow.' }
      ];
    } else if (scenario === 'low_battery') {
      this.state.batterySoc = 24;
      this.state.solarPowerKw = 0.3;
      this.state.pcmStatus = 'ACTIVE';
      this.state.pcmTemperature = -0.4;
      this.state.alerts = [
        { id: 'ALT-BAT', type: 'warning', title: 'LOW BATTERY - PCM ENGAGED', message: 'Battery SOC at 24%. Thermal PCM backup activated to maintain cooling.', timestamp: '2 mins ago', action: 'Prepare solar panel cleaning or load shedding.' }
      ];
    } else if (scenario === 'door_open') {
      this.state.doorOpen = true;
      this.state.doorOpenTimeMinutes = 4;
      this.state.temperature = 11.4;
      this.state.humidity = 79;
      this.state.alerts = [
        { id: 'ALT-DOOR', type: 'warning', title: 'DOOR OPEN ALERT', message: 'Cold chamber door open for over 4 minutes.', timestamp: '4 mins ago', action: 'Please close cold-room door immediately.' }
      ];
    } else if (scenario === 'cloudy') {
      this.state.solarPowerKw = 0.4;
      this.state.batterySoc = 52;
      this.state.alerts = [
        { id: 'ALT-CLOUD', type: 'info', title: 'LOW SOLAR GENERATION', message: 'Monsoon cloud cover detected in NER region. System on Battery Mode B.', timestamp: '15 mins ago', action: 'Monitor battery state.' }
      ];
    } else if (scenario === 'emergency') {
      this.state.batterySoc = 12;
      this.state.solarPowerKw = 0.0;
      this.state.temperature = 14.5;
      this.state.pcmStatus = 'ACTIVE';
      this.state.pcmTemperature = 1.2;
      this.state.alerts = [
        { id: 'ALT-EMG', type: 'critical', title: 'EMERGENCY: SYSTEM COOLING FAULT', message: 'Critical power depletion. PCM thermal backup engaged under emergency dispatch.', timestamp: 'Just now', action: 'Call FPO operator immediately.' }
      ];
    }

    this.notify();
  }

  // Set Active Crop Profile
  setCropProfile(cropId) {
    const crop = getCropById(cropId);
    this.state.activeCropId = cropId;
    this.state.targetTemperature = crop.mixedStorageTempTarget || crop.tempTarget;
    this.state.targetHumidity = crop.humidityTarget;
    this.notify();
  }

  // Toggle Offline Connection Mode
  setOfflineMode(isOffline) {
    this.state.isOnline = !isOffline;
    this.state.connectivityMode = isOffline ? 'offline' : 'lora';
    this.notify();
  }

  // Add Produce Item
  addProduceBatch(batch) {
    this.state.batches.unshift({
      id: `BATCH-00${this.state.batches.length + 1}`,
      cropId: batch.cropId,
      owner: batch.owner || 'Farmer Collection',
      weightKg: parseFloat(batch.weightKg) || 10,
      storedDate: new Date().toISOString().split('T')[0],
      estDaysLeft: getCropById(batch.cropId).shelfLifeDays,
      urgency: 'SAFE'
    });
    this.state.produceWeightKg = Math.min(200, this.state.produceWeightKg + (parseFloat(batch.weightKg) || 10));
    this.notify();
  }

  // Update Specific Sensor Reading manually
  updateField(field, value) {
    if (field in this.state) {
      this.state[field] = value;
      this.notify();
    }
  }

  // Local Storage Caching
  saveToStorage() {
    try {
      localStorage.setItem('navonmesh_hw_state', JSON.stringify(this.state));
    } catch (e) {
      // Storage unavailable
    }
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('navonmesh_hw_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) {
      // Ignore
    }
  }
}

export const hardwareService = new HardwareService();
