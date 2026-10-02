<p align="center">
  <img src="brand/logo.png" alt="Smart Central Climate Card Logo" width="480">
</p>

# Smart Central Climate Card 🎛️

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/default)
[![GitHub Release](https://img.shields.io/github/v/release/Tinkergnome621/smart-central-climate-card)](https://github.com/Tinkergnome621/smart-central-climate-card/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A dedicated, high-performance companion Lovelace card for the **[Smart Central Climate](https://github.com/Tinkergnome621/smart_central_climate)** Home Assistant integration.

---

## ✨ Features (v1.5.1 Redesign)

![Smart Central Climate Card](https://raw.githubusercontent.com/Tinkergnome621/smart_central_climate/main/assets/circular_dual_thermostat_card_v5.jpg)

* **Dual-Knob Circular Arc Dial**: Interactive circular arc gauge with dual draggable knobs for **Heat (orange)** and **Cool (sky blue)** setpoints with an **emerald deadband buffer**.
* **Icon-Only Status Indicator**: Centered above the temperature inside the dial:
  * 🟢 **Green thermometer**: System Idle in deadband
  * ❄️ **Blue snowflake**: Active cooling
  * 🔥 **Red flame**: Active heating
  * ⚡ **Gray standby**: System Off
* **Vertical Duct Plenum Stack (Left Column)**:
  * 📥 **Return Air Intake (Input)**: Real-time duct return probe temperature and relative humidity (`68.2°F / 49% RH`).
  * ⚡ **Delta-T Split Diagnostics**: Live temperature split across evaporator coils (`15.8°F Drop`) with dynamic `(Optimal)` badge.
  * 📤 **Supply Air Output**: Live plenum duct probe monitoring (`52.4°F / 65% RH`).
* **Minimalist Blower Fan Toggle**:
  * Clean circular fan icon with `FAN ON` / `FAN OFF` label underneath.
  * Rotating fan blades and sky blue glow when active. Tap to toggle directly on the card!
* **Centered Target Range & Sensor Breakdown**:
  * Positioned justified center below dial and stack.
  * Shows target range (`64°F (Heat) — 74°F (Cool)`), Average House reading (`68.4°F / 48% RH`), and physical wall thermostat reading (`69.0°F / 45% RH`).
* **One-Touch System Modes & Presets**:
  * Modes: `Heat/Cool`, `Cool`, `Heat`, `Off`.
  * Presets: `Eco`, `Comfort`, `Sleep`, `Away`, `Vacation`, and `Hold` (Manual).

---

## 🚀 Installation

### Option 1: HACS (Recommended)

1. Ensure **[HACS](https://hacs.xyz/)** is installed.
2. In Home Assistant, open **HACS** → **Frontend** (or **Dashboards**).
3. Click the three dots in the top-right corner and select **Custom repositories**.
4. Enter the repository URL:
   ```text
   https://github.com/Tinkergnome621/smart-central-climate-card
   ```
5. Select Type: **Lovelace** (or **Dashboard**).
6. Click **Add**, then find **Smart Central Climate Card** and click **Download**.
7. Reload your browser window when prompted.

### Option 2: Manual Installation

1. Download [`smart-central-climate-card.js`](https://github.com/Tinkergnome621/smart-central-climate-card/releases/latest/download/smart-central-climate-card.js).
2. Copy the file into your Home Assistant directory under:
   ```text
   /config/www/smart-central-climate-card.js
   ```
3. Go to **Settings** → **Dashboards** → **Three dots (top right)** → **Resources**.
4. Click **Add Resource**:
   * URL: `/local/smart-central-climate-card.js`
   * Resource type: `JavaScript Module`
5. Refresh your dashboard.

---

## ⚙️ Configuration

### Basic Example (YAML)

```yaml
type: custom:smart-central-climate-card
entity: climate.smart_central_a_c
```

### Full Configuration Example

```yaml
type: custom:smart-central-climate-card
entity: climate.smart_central_a_c
name: "Central A/C & Heat Pump"
plenum_temp_sensor: sensor.ac_plenum_temperature
plenum_humidity_sensor: sensor.ac_plenum_humidity
house_temp_sensor: sensor.average_house_temperature
fan_entity: fan.hallway_thermostat
vacation_entity: switch.smart_central_a_c_vacation_mode
min_temp: 60
max_temp: 85
```

### Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `entity` | `string` | **Required** | The Smart Central Climate entity (e.g. `climate.smart_central_a_c`). |
| `name` | `string` | `Central A/C` | Title shown on the card header. |
| `plenum_temp_sensor` | `string` | `sensor.ac_plenum_temperature` | Supply air plenum temperature sensor. |
| `plenum_humidity_sensor` | `string` | `sensor.ac_plenum_humidity` | Supply air plenum relative humidity sensor. |
| `house_temp_sensor` | `string` | `sensor.average_house_temperature` | House average / reference room temperature sensor. |
| `fan_entity` | `string` | `fan.hallway_thermostat` | Blower fan entity for the hallway fan toggle. |
| `vacation_entity` | `string` | `switch.smart_central_a_c_vacation_mode` | Vacation switch entity. |
| `min_temp` | `number` | `60` | Minimum temperature on the half-circle arc. |
| `max_temp` | `number` | `85` | Maximum temperature on the half-circle arc. |

---

## 📄 License

MIT © [Tinkergnome621](https://github.com/Tinkergnome621)
