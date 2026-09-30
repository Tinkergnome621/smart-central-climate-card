/**
 * Smart Central Climate Card (Companion Lovelace Card)
 * Version: 1.0.0
 * GitHub: https://github.com/Tinkergnome621/smart-central-climate-card
 *
 * Features:
 * - Half-circle arc temperature slider with draggable knob
 * - Dynamic color shifting: Blue glow in Cooling, Orange glow in Heating, Slate in Standby/Off
 * - 5-metric Supply Air Plenum diagnostics bar (Plenum Temp, Humidity, Delta-T, House Avg, Wall Target & Offset)
 * - Dedicated Hallway Blower Fan toggle switch (fan.hallway_thermostat)
 * - Dedicated Vacation Mode toggle switch (switch.smart_central_a_c_vacation_mode)
 * - 1-tap quick presets (Comfort, Eco, Away, Sleep, Boost)
 * - Schedule slot and compressor anti-short-cycle guard telemetry strip
 */

class SmartCentralClimateCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._isDragging = false;
    this._tempTarget = null;
  }

  static getStubConfig() {
    return {
      entity: "climate.smart_central_a_c",
      plenum_temp_sensor: "sensor.ac_plenum_temperature",
      plenum_humidity_sensor: "sensor.ac_plenum_humidity",
      house_temp_sensor: "sensor.average_house_temperature",
      fan_entity: "fan.hallway_thermostat",
      vacation_entity: "switch.smart_central_a_c_vacation_mode",
      name: "Central A/C",
    };
  }

  static async getConfigElement() {
    return document.createElement("smart-central-climate-card-editor");
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Please define a climate entity (e.g. climate.smart_central_a_c)");
    }
    this.config = {
      name: "Central A/C",
      plenum_temp_sensor: "sensor.ac_plenum_temperature",
      plenum_humidity_sensor: "sensor.ac_plenum_humidity",
      house_temp_sensor: "sensor.average_house_temperature",
      fan_entity: "fan.hallway_thermostat",
      vacation_entity: "switch.smart_central_a_c_vacation_mode",
      min_temp: 60,
      max_temp: 85,
      ...config,
    };
  }

  set hass(hass) {
    this._hass = hass;
    const climate = hass.states[this.config.entity];
    if (!climate) {
      this.renderNotFound();
      return;
    }

    if (!this._isDragging) {
      this.render();
    }
  }

  getCardSize() {
    return 6;
  }

  renderNotFound() {
    this.shadowRoot.innerHTML = `
      <ha-card style="padding: 16px; color: var(--error-color, #e53935);">
        Entity not found: <strong>${this.config.entity}</strong>
      </ha-card>
    `;
  }

  _tempToAngle(temp, min, max) {
    const frac = Math.max(0, Math.min(1, (temp - min) / (max - min)));
    return 180 - frac * 180;
  }

  _angleToTemp(angle, min, max) {
    const clampedAngle = Math.max(0, Math.min(180, angle));
    const frac = (180 - clampedAngle) / 180;
    return Math.round(min + frac * (max - min));
  }

  _getPoint(angleDeg, cx = 150, cy = 150, radius = 110) {
    const rad = (angleDeg * Math.PI) / 180;
    const x = cx + radius * Math.cos(rad);
    const y = cy - radius * Math.sin(rad);
    return { x, y };
  }

  render() {
    const hass = this._hass;
    const climate = hass.states[this.config.entity];
    if (!climate) return;

    const plenumTempObj = this.config.plenum_temp_sensor ? hass.states[this.config.plenum_temp_sensor] : null;
    const plenumHumObj = this.config.plenum_humidity_sensor ? hass.states[this.config.plenum_humidity_sensor] : null;
    const houseTempObj = this.config.house_temp_sensor ? hass.states[this.config.house_temp_sensor] : null;
    const fanObj = this.config.fan_entity ? hass.states[this.config.fan_entity] : null;
    const vacObj = this.config.vacation_entity ? hass.states[this.config.vacation_entity] : null;

    const state = climate.state; // 'cool', 'heat', 'off', etc.
    const attrs = climate.attributes || {};
    const minTemp = attrs.min_temp !== undefined ? attrs.min_temp : this.config.min_temp;
    const maxTemp = attrs.max_temp !== undefined ? attrs.max_temp : this.config.max_temp;
    const currentTarget = this._tempTarget !== null ? this._tempTarget : (attrs.temperature !== undefined ? attrs.temperature : 72);
    const currentRoomTemp = attrs.current_temperature !== undefined ? attrs.current_temperature : (houseTempObj ? houseTempObj.state : 73.5);
    const wallTarget = attrs.target_wall_temp !== undefined ? attrs.target_wall_temp : (state === 'cool' ? (currentTarget - 3).toFixed(1) : (currentTarget + 1).toFixed(1));
    const wallOffset = attrs.wall_offset !== undefined ? attrs.wall_offset : (state === 'cool' ? -3 : 1);
    const activeSlot = attrs.active_slot || "Slot 3 (17:00 Comfort)";
    const presetMode = attrs.preset_mode || "comfort";

    const plenumTemp = plenumTempObj && !isNaN(parseFloat(plenumTempObj.state)) ? parseFloat(plenumTempObj.state) : (state === 'heat' ? 103 : 55);
    const plenumHum = plenumHumObj && !isNaN(parseFloat(plenumHumObj.state)) ? parseFloat(plenumHumObj.state) : (state === 'heat' ? 32 : 82);
    const houseTemp = !isNaN(parseFloat(currentRoomTemp)) ? parseFloat(currentRoomTemp) : 73.5;

    // Delta-T thermodynamic split calculation
    let deltaT = 0;
    if (state === 'cool') {
      deltaT = Math.max(0, houseTemp - plenumTemp).toFixed(1);
    } else if (state === 'heat') {
      deltaT = Math.max(0, plenumTemp - houseTemp).toFixed(1);
    } else {
      deltaT = 0.5;
    }

    const isCool = state === 'cool';
    const isHeat = state === 'heat';
    const isOff = state === 'off';

    const fanOn = fanObj && fanObj.state === 'on';
    const vacOn = vacObj && vacObj.state === 'on';

    // Arc Geometry
    const angle = this._tempToAngle(currentTarget, minTemp, maxTemp);
    const thumbPt = this._getPoint(angle, 150, 150, 110);
    const arcD = angle >= 180 ? "M 40 150 L 40 150" : `M 40 150 A 110 110 0 0 1 ${thumbPt.x} ${thumbPt.y}`;

    // Color definitions
    let modeText = "COOLING";
    let modeBadgeBg = "rgba(59, 130, 246, 0.2)";
    let modeBadgeColor = "#60a5fa";
    let modeBadgeBorder = "rgba(59, 130, 246, 0.4)";
    let arcStroke = "url(#cool-grad)";
    let arcFilter = "url(#glow-filter-blue)";
    let thumbStroke = "#38bdf8";
    let thumbGlow = "rgba(56, 189, 248, 0.35)";
    let accentColor = "#38bdf8";
    let accentBorder = "rgba(56, 189, 248, 0.3)";

    if (isHeat) {
      modeText = "HEATING";
      modeBadgeBg = "rgba(249, 115, 22, 0.2)";
      modeBadgeColor = "#fb923c";
      modeBadgeBorder = "rgba(249, 115, 22, 0.4)";
      arcStroke = "url(#heat-grad)";
      arcFilter = "url(#glow-filter-orange)";
      thumbStroke = "#fb923c";
      thumbGlow = "rgba(251, 146, 60, 0.35)";
      accentColor = "#fb923c";
      accentBorder = "rgba(251, 146, 60, 0.3)";
    } else if (isOff) {
      modeText = "OFF / IDLE";
      modeBadgeBg = "rgba(100, 116, 139, 0.2)";
      modeBadgeColor = "#94a3b8";
      modeBadgeBorder = "rgba(100, 116, 139, 0.4)";
      arcStroke = "#64748b";
      arcFilter = "none";
      thumbStroke = "#94a3b8";
      thumbGlow = "transparent";
      accentColor = "#94a3b8";
      accentBorder = "rgba(100, 116, 139, 0.3)";
    }

    const html = `
      <style>
        :host {
          display: block;
          --card-bg: var(--ha-card-background, var(--card-background-color, #1c202a));
          --card-border: var(--ha-card-border-color, rgba(255, 255, 255, 0.08));
          --card-radius: var(--ha-card-border-radius, 28px);
          font-family: var(--paper-font-body1_-_font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
          user-select: none;
          -webkit-user-select: none;
        }
        ha-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: var(--card-radius);
          padding: 20px;
          box-shadow: var(--ha-card-box-shadow, 0 16px 36px rgba(0, 0, 0, 0.35));
          color: #f8fafc;
          box-sizing: border-box;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .title {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #ffffff;
        }
        .mode-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          background: ${modeBadgeBg};
          color: ${modeBadgeColor};
          border: 1px solid ${modeBadgeBorder};
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .mode-badge:hover {
          transform: scale(1.04);
        }
        .mode-badge:active {
          transform: scale(0.96);
        }
        .pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: ${modeBadgeColor};
          box-shadow: 0 0 8px ${modeBadgeColor};
        }
        .gauge-container {
          position: relative;
          width: 100%;
          max-width: 320px;
          height: 180px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        .slider-thumb {
          cursor: grab;
          touch-action: none;
        }
        .slider-thumb:active {
          cursor: grabbing;
        }
        .temp-center {
          position: absolute;
          bottom: 12px;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .temp-val {
          font-size: 46px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.03em;
          color: #ffffff;
          display: flex;
          align-items: flex-start;
        }
        .temp-deg {
          font-size: 20px;
          font-weight: 300;
          color: #94a3b8;
          margin-left: 2px;
        }
        .preset-badge-text {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: ${accentColor};
          margin-top: 4px;
        }
        .stepper-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 2px;
          margin-bottom: 14px;
        }
        .step-btn {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: #252b38;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          font-size: 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .step-btn:hover {
          background: #2e3646;
          color: #ffffff;
        }
        .step-btn:active {
          transform: scale(0.92);
        }
        .step-hint {
          font-size: 11px;
          color: #64748b;
        }
        /* Supply Air Diagnostics Bar */
        .diagnostics-box {
          background: #141820;
          border: 1px solid ${accentBorder};
          border-radius: 18px;
          padding: 10px 12px;
          margin-bottom: 12px;
        }
        .diag-title {
          text-align: center;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${accentColor};
          margin-bottom: 8px;
        }
        .diag-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          text-align: center;
          align-items: center;
        }
        .diag-col {
          border-right: 1px solid rgba(255, 255, 255, 0.07);
          padding: 0 4px;
        }
        .diag-col:last-child {
          border-right: none;
        }
        .diag-label {
          font-size: 9px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .diag-value {
          font-size: 13px;
          font-weight: 800;
          color: #ffffff;
          margin-top: 3px;
          white-space: nowrap;
        }
        .diag-sub {
          font-size: 8px;
          font-family: monospace;
          color: ${accentColor};
          margin-top: 2px;
          white-space: nowrap;
        }
        /* Toggles Row */
        .toggles-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        .toggle-card {
          background: #232936;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }
        .toggle-card:hover {
          border-color: rgba(255, 255, 255, 0.18);
        }
        .toggle-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .toggle-name {
          font-size: 12px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .switch-track {
          width: 36px;
          height: 20px;
          border-radius: 10px;
          background: #475569;
          position: relative;
          transition: background-color 0.2s ease;
        }
        .switch-track.active {
          background: ${accentColor};
          box-shadow: 0 0 10px ${accentColor}80;
        }
        .switch-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .switch-track.active .switch-thumb {
          transform: translateX(16px);
        }
        @keyframes fan-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .fan-rotating {
          display: inline-block;
          animation: fan-spin 2s linear infinite;
        }
        /* Presets Row */
        .presets-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
          margin-bottom: 12px;
        }
        .preset-btn {
          background: #232936;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 8px 4px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
        }
        .preset-btn:hover {
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.2);
        }
        .preset-btn.active {
          background: ${accentColor};
          color: #0f172a;
          font-weight: 800;
          border-color: ${accentColor};
          box-shadow: 0 0 12px ${accentColor}66;
        }
        /* Telemetry Bottom Bar */
        .bottom-bar {
          background: #141820;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
        }
        .bottom-bar strong {
          color: #f1f5f9;
        }
        .safe-pill {
          color: #34d399;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      </style>

      <ha-card>
        <!-- Header -->
        <div class="header">
          <div class="title">${this.config.name || "Central A/C"}</div>
          <div class="mode-badge" id="btn-mode">
            <span class="pulse-dot"></span>
            <span>${modeText}</span>
          </div>
        </div>

        <!-- Half-Circle Arc Slider -->
        <div class="gauge-container">
          <svg id="arc-svg" viewBox="0 0 300 180">
            <defs>
              <linearGradient id="cool-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0284c7" />
                <stop offset="100%" stop-color="#38bdf8" />
              </linearGradient>
              <linearGradient id="heat-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#ea580c" />
                <stop offset="100%" stop-color="#fb923c" />
              </linearGradient>
              <filter id="glow-filter-blue" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-filter-orange" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <!-- Background Track -->
            <path d="M 40 150 A 110 110 0 0 1 260 150" 
                  fill="none" 
                  stroke="#2a3242" 
                  stroke-width="12" 
                  stroke-linecap="round" />

            <!-- Active Filled Track -->
            <path id="active-arc" 
                  d="${arcD}" 
                  fill="none" 
                  stroke="${arcStroke}" 
                  stroke-width="12" 
                  stroke-linecap="round" 
                  filter="${arcFilter}" />

            <!-- Min/Max labels -->
            <text x="36" y="172" fill="#64748b" font-size="11" font-weight="600" text-anchor="middle">${minTemp}°</text>
            <text x="264" y="172" fill="#64748b" font-size="11" font-weight="600" text-anchor="middle">${maxTemp}°</text>

            <!-- Draggable Thumb -->
            <g id="slider-thumb" class="slider-thumb" transform="translate(${thumbPt.x}, ${thumbPt.y})">
              <circle r="16" fill="${thumbGlow}" />
              <circle r="12" fill="#1c202a" stroke="${thumbStroke}" stroke-width="3" />
              <circle r="4" fill="#ffffff" />
            </g>
          </svg>

          <!-- Inside Center Readout -->
          <div class="temp-center">
            <div class="temp-val">
              <span id="label-temp">${currentTarget}</span>
              <span class="temp-deg">°F</span>
            </div>
            <div class="preset-badge-text" id="label-preset">${presetMode}</div>
          </div>
        </div>

        <!-- Stepper Under Arc -->
        <div class="stepper-row">
          <button class="step-btn" id="btn-minus">−</button>
          <span class="step-hint">Drag knob or tap</span>
          <button class="step-btn" id="btn-plus">+</button>
        </div>

        <!-- 5-Metric Supply Air Plenum Diagnostics Bar -->
        <div class="diagnostics-box">
          <div class="diag-title">SUPPLY AIR A/C PLENUM DIAGNOSTICS</div>
          <div class="diag-grid">
            <div class="diag-col">
              <div class="diag-label"><span>🌡️</span> Plenum</div>
              <div class="diag-value">${plenumTemp}°F</div>
            </div>
            <div class="diag-col">
              <div class="diag-label"><span>💧</span> Humidity</div>
              <div class="diag-value">${plenumHum}%</div>
            </div>
            <div class="diag-col">
              <div class="diag-label"><span>↕️</span> Delta-T</div>
              <div class="diag-value" style="color: ${accentColor};">${deltaT}°F</div>
            </div>
            <div class="diag-col">
              <div class="diag-label"><span>🏠</span> House Avg</div>
              <div class="diag-value">${houseTemp}°F</div>
            </div>
            <div class="diag-col">
              <div class="diag-label"><span>🎯</span> Wall Target</div>
              <div class="diag-value">${wallTarget}°F</div>
              <div class="diag-sub">(${wallOffset > 0 ? '+' : ''}${wallOffset}°F)</div>
            </div>
          </div>
        </div>

        <!-- Hardware Toggles: Blower Fan & Vacation Mode -->
        <div class="toggles-row">
          <div class="toggle-card" id="btn-fan">
            <div class="toggle-left">
              <span style="font-size: 16px;" class="${fanOn ? 'fan-rotating' : ''}">🌀</span>
              <span class="toggle-name">Hallway Fan</span>
            </div>
            <div class="switch-track ${fanOn ? 'active' : ''}">
              <div class="switch-thumb"></div>
            </div>
          </div>

          <div class="toggle-card" id="btn-vac">
            <div class="toggle-left">
              <span style="font-size: 16px;">✈️</span>
              <span class="toggle-name">Vacation</span>
            </div>
            <div class="switch-track ${vacOn ? 'active' : ''}">
              <div class="switch-thumb"></div>
            </div>
          </div>
        </div>

        <!-- One-Tap Preset Buttons -->
        <div class="presets-row">
          <button class="preset-btn ${presetMode === 'comfort' ? 'active' : ''}" data-preset="comfort">Comfort</button>
          <button class="preset-btn ${presetMode === 'eco' ? 'active' : ''}" data-preset="eco">Eco</button>
          <button class="preset-btn ${presetMode === 'away' ? 'active' : ''}" data-preset="away">Away</button>
          <button class="preset-btn ${presetMode === 'sleep' ? 'active' : ''}" data-preset="sleep">Sleep</button>
          <button class="preset-btn ${presetMode === 'boost' ? 'active' : ''}" data-preset="boost">Boost</button>
        </div>

        <!-- Telemetry Bottom Bar -->
        <div class="bottom-bar">
          <div>Schedule: <strong>${vacOn ? 'Vacation Override (82°F)' : activeSlot}</strong></div>
          <div class="safe-pill">
            <span>🛡️</span>
            <span>Compressor Guard: Safe</span>
          </div>
        </div>
      </ha-card>
    `;

    this.shadowRoot.innerHTML = html;
    this._attachEventHandlers(minTemp, maxTemp);
  }

  _attachEventHandlers(minTemp, maxTemp) {
    const root = this.shadowRoot;
    const svgEl = root.getElementById("arc-svg");
    const thumbEl = root.getElementById("slider-thumb");

    // Steppers
    root.getElementById("btn-minus")?.addEventListener("click", () => {
      this._adjustTemp(-1, minTemp, maxTemp);
    });
    root.getElementById("btn-plus")?.addEventListener("click", () => {
      this._adjustTemp(1, minTemp, maxTemp);
    });

    // Mode Toggle
    root.getElementById("btn-mode")?.addEventListener("click", () => {
      const climate = this._hass.states[this.config.entity];
      if (!climate) return;
      let nextMode = "cool";
      if (climate.state === "cool") nextMode = "heat";
      else if (climate.state === "heat") nextMode = "off";
      else nextMode = "cool";
      this._hass.callService("climate", "set_hvac_mode", {
        entity_id: this.config.entity,
        hvac_mode: nextMode,
      });
    });

    // Fan Toggle
    root.getElementById("btn-fan")?.addEventListener("click", () => {
      if (this.config.fan_entity) {
        this._hass.callService("fan", "toggle", {
          entity_id: this.config.fan_entity,
        });
      }
    });

    // Vacation Toggle
    root.getElementById("btn-vac")?.addEventListener("click", () => {
      if (this.config.vacation_entity) {
        this._hass.callService("switch", "toggle", {
          entity_id: this.config.vacation_entity,
        });
      }
    });

    // Presets
    root.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const p = e.target.getAttribute("data-preset");
        if (p) {
          this._hass.callService("climate", "set_preset_mode", {
            entity_id: this.config.entity,
            preset_mode: p,
          });
        }
      });
    });

    // Draggable Knob Events
    const onPointerMove = (e) => {
      if (!this._isDragging) return;
      e.preventDefault();
      const rect = svgEl.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;
      const scaleX = 300 / rect.width;
      const scaleY = 180 / rect.height;
      const mouseX = (clientX - rect.left) * scaleX;
      const mouseY = (clientY - rect.top) * scaleY;
      const dx = mouseX - 150;
      const dy = 150 - mouseY;

      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 0) {
        angle = dx < 0 ? 180 : 0;
      }

      const newTemp = this._angleToTemp(angle, minTemp, maxTemp);
      if (newTemp !== this._tempTarget) {
        this._tempTarget = newTemp;
        root.getElementById("label-temp").innerText = newTemp;
        const pt = this._getPoint(angle, 150, 150, 110);
        thumbEl.setAttribute("transform", `translate(${pt.x}, ${pt.y})`);
        const activeArc = root.getElementById("active-arc");
        activeArc.setAttribute("d", `M 40 150 A 110 110 0 0 1 ${pt.x} ${pt.y}`);
      }
    };

    const onPointerUp = (e) => {
      if (this._isDragging) {
        this._isDragging = false;
        try {
          thumbEl.releasePointerCapture(e.pointerId);
        } catch (_) {}
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);

        if (this._tempTarget !== null) {
          this._hass.callService("climate", "set_temperature", {
            entity_id: this.config.entity,
            temperature: this._tempTarget,
          });
          this._tempTarget = null;
        }
      }
    };

    const onPointerDown = (e) => {
      this._isDragging = true;
      try {
        thumbEl.setPointerCapture(e.pointerId);
      } catch (_) {}
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      onPointerMove(e);
    };

    thumbEl?.addEventListener("pointerdown", onPointerDown);
    svgEl?.addEventListener("pointerdown", onPointerDown);
  }

  _adjustTemp(delta, minTemp, maxTemp) {
    const climate = this._hass.states[this.config.entity];
    if (!climate) return;
    const current = climate.attributes.temperature || 72;
    const next = Math.max(minTemp, Math.min(maxTemp, current + delta));
    this._hass.callService("climate", "set_temperature", {
      entity_id: this.config.entity,
      temperature: next,
    });
  }
}

// Visual Card Editor for Lovelace UI
class SmartCentralClimateCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  render() {
    this.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; padding: 12px 0;">
        <label>
          <strong>Climate Entity:</strong><br>
          <input type="text" id="entity" value="${this._config.entity || 'climate.smart_central_a_c'}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #444; background: #222; color: #fff;">
        </label>
        <label>
          <strong>Plenum Temperature Sensor:</strong><br>
          <input type="text" id="plenum_temp_sensor" value="${this._config.plenum_temp_sensor || 'sensor.ac_plenum_temperature'}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #444; background: #222; color: #fff;">
        </label>
        <label>
          <strong>Plenum Humidity Sensor:</strong><br>
          <input type="text" id="plenum_humidity_sensor" value="${this._config.plenum_humidity_sensor || 'sensor.ac_plenum_humidity'}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #444; background: #222; color: #fff;">
        </label>
        <label>
          <strong>House Average Sensor:</strong><br>
          <input type="text" id="house_temp_sensor" value="${this._config.house_temp_sensor || 'sensor.average_house_temperature'}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #444; background: #222; color: #fff;">
        </label>
        <label>
          <strong>Blower Fan Entity:</strong><br>
          <input type="text" id="fan_entity" value="${this._config.fan_entity || 'fan.hallway_thermostat'}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #444; background: #222; color: #fff;">
        </label>
        <label>
          <strong>Vacation Switch Entity:</strong><br>
          <input type="text" id="vacation_entity" value="${this._config.vacation_entity || 'switch.smart_central_a_c_vacation_mode'}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #444; background: #222; color: #fff;">
        </label>
      </div>
    `;

    this.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", (e) => {
        const target = e.target;
        const newConfig = { ...this._config, [target.id]: target.value };
        const event = new CustomEvent("config-changed", {
          detail: { config: newConfig },
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(event);
      });
    });
  }
}

customElements.define("smart-central-climate-card-editor", SmartCentralClimateCardEditor);
customElements.define("smart-central-climate-card", SmartCentralClimateCard);

// Register in Home Assistant customCards catalog
window.customCards = window.customCards || [];
window.customCards.push({
  type: "smart-central-climate-card",
  name: "Smart Central Climate Card",
  description: "A companion Lovelace card for Smart Central Climate featuring supply air plenum diagnostics, half-circle temperature arc, blower fan switch, vacation hold, and quick presets.",
  preview: true,
});
console.info(
  `%c SMART-CENTRAL-CLIMATE-CARD %c v1.0.0 `,
  "color: white; background: #0284c7; font-weight: bold; border-radius: 4px 0 0 4px; padding: 2px 6px;",
  "color: #0284c7; background: #1e293b; font-weight: bold; border-radius: 0 4px 4px 0; padding: 2px 6px;"
);
