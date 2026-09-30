# Smart Central Climate Card 🎛️

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/default)
[![GitHub Release](https://img.shields.io/github/v/release/Tinkergnome621/smart-central-climate-card)](https://github.com/Tinkergnome621/smart-central-climate-card/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A dedicated, high-performance companion Lovelace card for the **[Smart Central Climate](https://github.com/Tinkergnome621/smart_central_climate)** Home Assistant integration.

---

## ✨ Features

* **Half-Circle Arc Gauge**: Smooth, tactile $180^\circ$ semi-circle arc slider with a draggable knob for effortless setpoint adjustments.
* **Dynamic Mode Shift**:
  * ❄️ **Cooling Mode**: Vibrant electric blue arc, glow, and diagnostics accents.
  * 🔥 **Heating Mode**: Rich warm orange arc, glow, and heat pump telemetry.
  * ⏸️ **Standby/Off**: Dim slate styling.
* **Supply Air A/C Plenum Diagnostics Bar (5 Columns)**:
  * 🌡️ **Plenum Temperature**: Real-time coil discharge temperature.
  * 💧 **Plenum Humidity**: Evaporator coil condensation and dehumidification monitoring.
  * ↕️ **$\Delta T$ (Thermal Split)**: Automatically calculated thermodynamic delta ($\text{House Temp} - \text{Plenum Temp}$) verifying optimal heat exchange.
  * 🏠 **House Average**: Active reference room temperature.
  * 🎯 **Wall Target & Offset**: Live wall thermostat setpoint with $-3^\circ\text{F}$ (Cool) / $+1^\circ\text{F}$ (Heat) calibration offsets.
* **Hardware Quick Toggles**:
  * 🌀 **Hallway Blower Fan** (`fan.hallway_thermostat`): Toggle between continuous whole-home filtration and automatic system calls, complete with animated spinning fan icon.
  * ✈️ **Vacation Mode** (`switch.smart_central_a_c_vacation_mode`): One-tap deep setback ($82^\circ\text{F}$) with automatic schedule suspension.
* **One-Tap Presets**: Direct buttons for **Comfort** ($72^\circ$), **Eco** ($76^\circ$), **Away** ($78^\circ$), **Sleep** ($69^\circ$), and **Boost** ($68^\circ$).
* **System Telemetry**: Bottom status strip displaying active schedule slots and compressor anti-short-cycle delay.
* **Graphical Card Editor**: Full visual configuration support inside Home Assistant's dashboard editor.

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
