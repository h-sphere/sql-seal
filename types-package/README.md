# SQLSeal Types Package
This package helps you type your external plugin that uses SQLSeal internally.

## Installation
```bash
npm install --save-dev @hypersphere/sqlseal
```

## Usage
Example usage from SQLSeal Charts library.

```typescript
import { Plugin } from 'obsidian';
import { ChartRenderer } from './chartRenderer';
import { pluginApi } from '@vanakat/plugin-api';
import type { SQLSealRegisterApi } from '@hypersphere/sqlseal'

export default class SQLSealCharts extends Plugin {

  async onload() {
    this.registerWithSQLSeal();
  }

  private registerWithSQLSeal() {
    const api = pluginApi('sqlseal') as SQLSealRegisterApi
    const registar = api.registerForPlugin(this)
    registar.registerView('sqlseal-charts', new ChartRenderer(this.app))
  }
}
```

Unregistering will be automatically done by SQLSeal when you unload your plugin so no need to implement custom `onunload()` logic.

## Checking SQLSeal Version
You can check current SQLSeal version by calling:
```typescript
const api = pluginApi('sqlseal') as SQLSealRegisterApi
console.log(api.sqlSealVersion) // i.e. '0.20.0'
```

## Checking SQLSeal Version
You can check current SQLSeal version by calling:
```typescript
const api = pluginApi('sqlseal') as SQLSealRegisterApi
if (api.apiVersion >= 2) {
    // Targetting API 2+
} else {
    console.log("Plugin is incompatible with SQLSeal installed. Please update SQLSeal to the latest version and try again")
}
```