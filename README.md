# M-Hike: React Native App

Cross-platform hiking management app with complete feature parity to the native Android version.

## Summary

- **Framework**: Expo SDK 54 (managed workflow)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based)
- **Database**: expo-sqlite (SQLite)
- **Platforms**: iOS + Android
- **Node**: 18+ required

# M-Hike Presentation Cheat Sheet
## Quick Answers for Common Questions (React Native version)

---
## FEATURE A: Enter Details of Hikes
**"Which file contains the hike data model?"**
→ `types/index.ts` — `Hike` and `HikeDraft` definitions (required + optional fields)
**"Where is the form to enter hike details?"**
→ `app/hike/add.tsx` — feature A screen with inputs, validation, location/map buttons
**"How do you validate required fields?"**
→ `validateHike()` in `lib/validation.ts`; button enable check via `isHikeFormComplete()`
**"What UI controls did you use?"**
→ `FormField` (text), `DateInput` (date picker), `Switch` (parking), `DifficultySelector` (segmented), `Slider` + `TextInput` (elevation), `StarRating` (rating)
**"What are your 2+ creative fields?"**
→ `elevationGainM`, `rating`, `photoUri`, `latitude/longitude`, `addedToCalendar`
**"Where do you confirm before saving?"**
→ `app/hike/confirm.tsx` — review card + calendar prompt

---
## FEATURE B: Store, View, Delete, Reset (SQLite)
**"Where is the database?"**
→ `lib/database.ts` — SQLite schema + CRUD using `expo-sqlite`
**"Which file has the database queries?"**
→ Same `lib/database.ts` — `insertHike`, `updateHike`, `deleteHike`, `deleteAllHikes`, indexes
**"How do you display all hikes?"**
→ `app/index.tsx` — list screen using `HikeCard` with data from `DataContext`
**"How do you delete a single hike?"**
→ `handleDelete` in `app/index.tsx` → calls `deleteHike()` in `lib/database.ts`
**"How do you reset the database?"**
→ Menu option in `app/index.tsx` → `deleteAllHikes()` in `lib/database.ts`
**"Where do you edit hikes?"**
→ `app/hike/edit.tsx` — loads via `getHikeById`, saves via `updateHike`

---
## FEATURE C: Add Observations
**"Where is the observation data model?"**
→ `types/index.ts` — `Observation` and `ObservationDraft`
**"How do observations link to hikes?"**
→ `observations.hikeId` FK with `ON DELETE CASCADE` in `lib/database.ts`
**"Where do you add observations?"**
→ `app/observation/add.tsx` (form) → `app/observation/confirm.tsx` (save)
**"How do you display/edit/delete observations?"**
→ `app/hike/[id].tsx` lists; edit via `app/observation/edit.tsx`; delete via `deleteObservation()` in `lib/database.ts`
**"Can you add multiple observations?"**
→ Yes, `getObservationsByHikeId()` returns all for a hike
**"What’s required?"**
→ `observation` text; `timestamp` defaults to `Date.now()` in add screen

---
## FEATURE D: Search
**"How does simple search work?"**
→ `searchHikes(query)` in `lib/database.ts` using SQL `LIKE`; invoked from search bar in `app/index.tsx`
**"Where is advanced search?"**
→ `advancedSearchHikes()` in `lib/database.ts`; triggered from `AdvancedFilterDialog` via `app/index.tsx`
**"Which criteria are supported?"**
→ name, location, min/max length, date, difficulty, parking; sorts handled in list

---
## FEATURE E: Cross-Platform Prototype (React Native)
**"Which screens implement entering hikes on RN?"**
→ `app/hike/add.tsx` + `app/hike/confirm.tsx` with shared components in `components/`
**"How is navigation handled?"**
→ Expo Router (file-based routes under `app/`)

---
## FEATURE F: Persistence on React Native
**"How is data persisted?"**
→ SQLite via `lib/database.ts` (singleton connection + schema ensure)
**"How do screens get live data?"**
→ `contexts/DataContext.tsx` exposes `hikes`, `refreshHikes`, `notifyHikeChanged`

---
## FEATURE G: Additional Features
**"Photos?"**
→ `PhotoPicker` component used in hike confirm/edit and observation confirm/edit
**"GPS & Map picker?"**
→ `hooks/useLocation.ts` (Expo Location) + `app/map-picker.tsx` (react-native-maps)
**"Calendar integration?"**
→ `lib/calendar.ts` used in `app/hike/confirm.tsx` and `app/hike/[id].tsx`
**"JSON import/export?"**
→ `lib/storage.ts` used in `app/index.tsx` and `app/hike/[id].tsx`
**"Other UI helpers?"**
→ `AdvancedFilterDialog`, `ImportJsonDialog`, `OptionsMenuDialog`, `HikeCard`, `ObservationCard`

---
## ARCHITECTURE (React Native)
- **Navigation**: Expo Router (file-based). Screens live under `app/`.
- **State/data**: `DataContext` provides live lists; SQLite in `lib/database.ts`.
- **Hooks**: `useLocation`, `useFormState`, `useBackHandler` in `hooks/`.
- **Events**: `lib/events.ts` small typed event bus (e.g., map selection).
- **Types**: `types/index.ts` central models for forms, DB, and export.

---
## DATABASE TABLES (expo-sqlite)
**hikes**: `id`, `name`, `location`, `date`, `parkingAvailable`, `lengthKm`, `difficulty`, `description`, `elevationGainM`, `rating`, `photoUri`, `latitude`, `longitude`, `addedToCalendar`

**observations**: `id`, `hikeId` (FK CASCADE), `observation`, `timestamp`, `comments`, `photoUri`

---
## SAMPLE ANSWERS (React Native)
**"Walk me through creating a hike"**
→ `app/hike/add.tsx` (form) → `app/hike/confirm.tsx` (review) → `insertHike()` in `lib/database.ts` → list updates via `DataContext`

**"Show me cascade delete for observations"**
→ `lib/database.ts` schema: `FOREIGN KEY (hikeId) REFERENCES hikes(id) ON DELETE CASCADE`

**"How do you get current location?"**
→ `hooks/useLocation.ts` uses `Location.requestForegroundPermissionsAsync()` + `getCurrentPositionAsync()`; map selection via `app/map-picker.tsx`


## Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go app** on your phone (optional, for testing)

## Installation & Running (make sure you are in the root folder)

```bash
# Install dependencies
npm install

# Start Expo dev server (Check if you are in the root dir or not)
npx expo start

# Then scan QR code with Expo Go app
# Or press 'a' for Android emulator
# Or press 'i' for iOS simulator (macOS only)
```

## Building for Production

```bash
# Android APK
eas build --platform android --profile preview

# iOS (macOS only, requires Apple Developer account)
eas build --platform ios --profile preview
```

Requires Expo Application Services (EAS). First time: `npm install -g eas-cli && eas login`


## Key Dependencies

```json
{
   "@react-native-community/datetimepicker": "8.4.4",
    "@react-native-community/slider": "5.0.1",
    "@react-native-picker/picker": "2.11.1",
    "expo": "~54.0.22",
    "expo-calendar": "~15.0.7",
    "expo-camera": "~17.0.9",
    "expo-clipboard": "~8.0.7",
    "expo-document-picker": "~14.0.7",
    "expo-file-system": "~19.0.17",
    "expo-image-picker": "~17.0.8",
    "expo-location": "~19.0.7",
    "expo-router": "~6.0.14",
    "expo-sharing": "~14.0.7",
    "expo-sqlite": "~16.0.9",
    "expo-status-bar": "~3.0.8",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-maps": "1.20.1",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0"
}
```

## Troubleshooting

```bash
# Clear cache
npx expo start -c

# Reset dependencies
rm -rf node_modules && npm install

# Check Expo diagnostics
npx expo-doctor

# TypeScript check
npx tsc --noEmit
```

## JSON Import/Export

Both apps use the same JSON format for data sharing:

```json
{
  "name": "Snowdon",
  "location": "Llanberis, UK",
  "date": "2025-07-10",
  "parkingAvailable": true,
  "lengthKm": 14.5,
  "difficulty": "Hard",
  "description": "Challenging mountain hike",
  "elevationGainM": 980,
  "rating": 4.5,
  "observations": [
    {
      "observation": "Beautiful views at summit",
      "timestamp": 1752135600000,
      "comments": "Weather was perfect"
    }
  ]
}
```

Export from one app and import to the other seamlessly.

---

**Note**: This app is part of university coursework demonstrating cross-platform development skills alongside the native Android version.
