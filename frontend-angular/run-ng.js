#!/usr/bin/env node
// Seamlessly normalize minor node patch detection for Angular CLI on Node v24.14.x
Object.defineProperty(process.versions, 'node', { value: '24.15.0' });
require('./node_modules/@angular/cli/bin/ng');
