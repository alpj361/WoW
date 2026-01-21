# Changelog

All notable changes to the WoW Frontend will be documented in this file.

## [Unreleased]

### Added
- `api.ts` service for backend communication
- Supabase connection via backend API

### Changed
- `eventStore.ts` now uses real API calls instead of mock data
- Events are fetched from backend on load
- `createEvent` saves to Supabase via backend

### Removed
- Mock data (`SAMPLE_EVENTS`) from eventStore

## [1.0.0] - 2026-01-19

### Added
- Initial app structure with Expo Router
- Event browsing by category
- Event creation form (manual)
- Profile screen with DigitalCard
- Pin system foundation
